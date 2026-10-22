import { and, eq, gte, inArray, sql } from "drizzle-orm";

import { aiGuardRequests, aiGuardReservations, aiGuardWindows } from "@/lib/db/schema";
import type { GuardDatabase } from "./database";
import { AiGuardError, allowanceWindows, guardPeriod, reservationMicros, type AiAccess } from "./policy";

export type Reservation = { inputBytes: number; maxOutputTokens: number; reservedMicros: number };

/** Namespace exists only for isolated integration tests, never HTTP input. */
export function createQuotaStore(database: GuardDatabase, namespace = "production") {
  if (namespace !== "production" && !/^test-[a-f0-9-]{36}$/.test(namespace)) {
    throw new Error("Invalid guard namespace");
  }
  async function locked<T>(work: (transaction: Parameters<Parameters<GuardDatabase["transaction"]>[0]>[0], now: Date) => Promise<T>) {
    try {
      return await database.transaction(async (transaction) => {
        await transaction.execute(sql`select pg_advisory_xact_lock(hashtext('chillmate-ai-guard'), hashtext(${namespace}))`);
        const rows = await transaction.execute<{ now: Date }>(sql`select clock_timestamp() as now`);
        const now = new Date(rows[0].now);
        return work(transaction, now);
      });
    } catch (error) {
      if (error instanceof AiGuardError) throw error;
      // Driver errors may contain connection credentials. Never forward or log them.
      throw new AiGuardError("unavailable", 503, "AI limits are temporarily unavailable.");
    }
  }

  return {
    async reserveRequest(access: AiAccess) {
      return locked(async (transaction, now) => {
        const minuteStart = new Date(now.getTime() - 60_000);
        const { dayStart } = guardPeriod(now);
        const [usage] = await transaction.select({
          globalMinute: sql<number>`count(*) filter (where ${aiGuardRequests.createdAt} >= ${minuteStart.toISOString()})::int`,
          userMinute: sql<number>`count(*) filter (where ${aiGuardRequests.createdAt} >= ${minuteStart.toISOString()} and ${aiGuardRequests.userId} = ${access.userId})::int`,
          userDay: sql<number>`count(*) filter (where ${aiGuardRequests.createdAt} >= ${dayStart.toISOString()} and ${aiGuardRequests.userId} = ${access.userId} and ${aiGuardRequests.kind} = ${access.kind})::int`,
        }).from(aiGuardRequests).where(and(
          eq(aiGuardRequests.namespace, namespace),
          gte(aiGuardRequests.createdAt, new Date(Math.min(dayStart.getTime(), minuteStart.getTime()))),
        ));
        const perMinute = access.group === "owner" ? 3 : 1;
        const perDay = access.kind === "operator" ? 3 : access.group === "owner" ? 100 : 10;
        if (usage.globalMinute >= 10 || usage.userMinute >= perMinute || usage.userDay >= perDay) {
          throw new AiGuardError("rate_limited", 429, "AI request limit reached. Try again later.");
        }
        await transaction.insert(aiGuardRequests).values({ namespace, userId: access.userId, kind: access.kind, createdAt: now });
      });
    },
    async reserveModelCall(access: AiAccess, reservation: Reservation) {
      if (reservation.reservedMicros !== reservationMicros(reservation.inputBytes, reservation.maxOutputTokens)) {
        throw new AiGuardError("invalid_request", 400, "Invalid AI allowance.");
      }
      return locked(async (transaction, now) => {
        const windows = allowanceWindows(access, now).map((window) => ({ ...window, key: `${namespace}:${window.key}` }));
        const existing = await transaction.select().from(aiGuardWindows).where(inArray(aiGuardWindows.key, windows.map((window) => window.key)));
        const used = new Map(existing.map((window) => [window.key, window.reservedMicros]));
        for (const window of windows) {
          if ((used.get(window.key) ?? 0) + reservation.reservedMicros > window.capMicros) {
            throw new AiGuardError("budget_exhausted", 429, "AI allowance reached. Try again after the allowance resets.");
          }
        }
        for (const window of windows) {
          await transaction.insert(aiGuardWindows).values({ key: window.key, reservedMicros: reservation.reservedMicros })
            .onConflictDoUpdate({ target: aiGuardWindows.key, set: { reservedMicros: sql`${aiGuardWindows.reservedMicros} + ${reservation.reservedMicros}` } });
        }
        await transaction.insert(aiGuardReservations).values({ namespace, userId: access.userId, kind: access.kind,
          inputBytes: reservation.inputBytes, maxOutputTokens: reservation.maxOutputTokens,
          reservedMicros: reservation.reservedMicros, createdAt: now });
      });
    },
  };
}
