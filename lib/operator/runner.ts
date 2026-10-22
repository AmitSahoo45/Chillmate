import type { LanguageModel } from "ai";
import { and, asc, eq, getTableColumns, gte, inArray, isNotNull, isNull, lt, sql } from "drizzle-orm";

import { db, type ChillmateDb } from "@/lib/db";
import { AiGuardError, assertAiAccess, createGuardedHaikuModel, reserveAiRequest } from "@/lib/ai-guard";
import { createNote } from "@/lib/db/queries/notes";
import { createSubject } from "@/lib/db/queries/subjects";
import { notes, operatorRuns, subjects, tasks, users } from "@/lib/db/schema";
import { processNightDumps } from "@/lib/operator/night";
import { createExecutionBudget, createMorningPlan, istDayWindow } from "@/lib/operator/policy";
import { PIN_LIMIT } from "@/lib/pins";

export type OperatorKind = "night" | "morning";
type OperatorDatabase = Pick<ChillmateDb, "select" | "transaction">;
type OperatorResult = { status: "completed" | "already_completed" | "busy"; noteId?: string | null };

function markdownLabel(value: string) {
  return value.replace(/\s+/g, " ").replace(/[\\[\]]/g, "\\$&");
}

/** Composes with a parent transaction (a savepoint) for isolated verification. */
export async function runOperatorForUser({
  database = db,
  userId,
  kind,
  now = new Date(),
  budget = createExecutionBudget(),
  signal = AbortSignal.timeout(230_000),
  model,
}: {
  database?: OperatorDatabase;
  userId: string;
  kind: OperatorKind;
  now?: Date;
  budget?: ReturnType<typeof createExecutionBudget>;
  signal?: AbortSignal;
  model?: LanguageModel;
}): Promise<OperatorResult> {
  const window = istDayWindow(now);
  return database.transaction(async (tx) => {
    signal.throwIfAborted();
    // A failed or terminated transaction releases this lock automatically.
    const locks = await tx.execute<{ locked: boolean }>(sql`
      select pg_try_advisory_xact_lock(hashtextextended(${`chillmate-operator:${userId}`}, 0)) as locked
    `);
    if (!locks[0]?.locked) return { status: "busy" };
    const [completed] = await tx.select({ noteId: operatorRuns.noteId }).from(operatorRuns).where(and(
      eq(operatorRuns.userId, userId), eq(operatorRuns.kind, kind), eq(operatorRuns.day, window.day),
    )).limit(1);
    if (completed) return { status: "already_completed", noteId: completed.noteId };

    // These are deliberately complete snapshots; UI query limits must not truncate a run.
    const openTasks = await tx.select().from(tasks).where(and(
      eq(tasks.userId, userId), eq(tasks.completed, false),
    ));
    const ownedSubjects = await tx.select().from(subjects).where(eq(subjects.userId, userId)).orderBy(asc(subjects.createdAt), asc(subjects.id));
    let outputNoteId: string;

    if (kind === "night") {
      const dumps = await tx.select({
        ...getTableColumns(notes),
        sourceUpdatedAt: sql<string>`${notes.updatedAt}::text`,
      }).from(notes).where(and(
        eq(notes.userId, userId), eq(notes.isDump, true), isNull(notes.archivedAt),
        gte(notes.createdAt, window.start), lt(notes.createdAt, window.end),
      )).orderBy(asc(notes.createdAt), asc(notes.id));
      // Only a new night run with work consumes a request allowance. Its spending
      // reservations use an independent connection and survive business rollback.
      let nightModel = model;
      if (dumps.length && !nightModel) {
        await reserveAiRequest({ userId, kind: "operator" });
        nightModel = createGuardedHaikuModel({ userId, kind: "operator" });
      }
      const processed = await processNightDumps({
        database: tx, userId, day: window.day, dumps, openTasks, ownedSubjects, budget, signal, model: nightModel,
      });
      signal.throwIfAborted();

      // A user can edit a dump during generation. Never archive a changed source.
      for (const dump of dumps) {
        const [archived] = await tx.update(notes).set({ archivedAt: now }).where(and(
          eq(notes.id, dump.id), eq(notes.userId, userId), eq(notes.isDump, true),
          isNull(notes.archivedAt), sql`${notes.updatedAt} = ${dump.sourceUpdatedAt}::timestamp`,
          eq(notes.bodyMarkdown, dump.bodyMarkdown),
        )).returning({ id: notes.id });
        if (!archived) throw new Error("A source dump changed during the run; all outputs were rolled back");
      }
      const dailyId = [...processed.subjectNames.entries()]
        .find(([, name]) => name.trim().toLowerCase() === "daily")?.[0] ??
        (await createSubject(userId, { name: "Daily", description: "", tags: [] }, tx)).id;
      const sourceById = new Map(dumps.map((dump) => [dump.id, dump]));
      const log = processed.outputs.flatMap(([dumpId, outputs]) => {
        const source = sourceById.get(dumpId)!;
        return [
          `- [${markdownLabel(source.title)}](/app/notes/${source.subjectId}/${source.id}) (archived)`,
          ...outputs.map((output) => output.kind === "task"
            ? `  - Task: [${markdownLabel(output.label)}](/app/focus?task=${output.id})`
            : `  - Note: [${markdownLabel(output.label)}](/app/notes/${output.subjectId}/${output.id}) → ${markdownLabel(processed.subjectNames.get(output.subjectId!) ?? "Subject")}`),
        ];
      }).join("\n");
      const output = await createNote(userId, {
        subjectId: dailyId, title: "Night log", description: window.day,
        bodyMarkdown: log || `No dumps to process for ${window.day}.`, tags: [],
      }, tx);
      if (!output) throw new Error("Night log could not be created");
      outputNoteId = output.id;
    } else {
      const daily = ownedSubjects.find((subject) => subject.name.trim().toLowerCase() === "daily") ??
        await createSubject(userId, { name: "Daily", description: "", tags: [] }, tx);
      const plan = createMorningPlan(openTasks);
      const title = `Today — ${window.day}`;
      // The run ledger provides idempotence; titles never prove operator ownership.
      const output = await createNote(userId, {
        subjectId: daily.id, title, description: "", bodyMarkdown: plan.bodyMarkdown, tags: [],
      }, tx);
      if (!output) throw new Error("Today note could not be created");
      outputNoteId = output.id;
      const [yesterdayRun] = await tx.select({ noteId: operatorRuns.noteId }).from(operatorRuns).where(and(
        eq(operatorRuns.userId, userId), eq(operatorRuns.kind, "morning"), eq(operatorRuns.day, window.yesterday),
      )).limit(1);
      if (yesterdayRun?.noteId) {
        await tx.update(notes).set({ pinnedAt: null }).where(and(
          eq(notes.userId, userId), eq(notes.id, yesterdayRun.noteId),
        ));
      }
      await tx.update(notes).set({ pinnedAt: now }).where(and(
        eq(notes.id, outputNoteId), eq(notes.userId, userId),
      ));
      const pinned = await tx.select({ id: notes.id }).from(notes).where(and(
        eq(notes.userId, userId), isNotNull(notes.pinnedAt),
      )).orderBy(asc(notes.pinnedAt), asc(notes.id));
      const excess = pinned.filter((note) => note.id !== outputNoteId).slice(0, Math.max(0, pinned.length - PIN_LIMIT));
      if (excess.length) {
        await tx.update(notes).set({ pinnedAt: null }).where(and(
          eq(notes.userId, userId), inArray(notes.id, excess.map((note) => note.id)),
        ));
      }
    }
    signal.throwIfAborted();
    budget.assertHealthy();
    await tx.insert(operatorRuns).values({ userId, kind, day: window.day, noteId: outputNoteId });
    return { status: "completed", noteId: outputNoteId };
  });
}

export async function runOperator(kind: OperatorKind, { signal: requestSignal }: { signal?: AbortSignal } = {}) {
  const now = new Date();
  const timeoutSignal = AbortSignal.timeout(230_000);
  const signal = requestSignal ? AbortSignal.any([requestSignal, timeoutSignal]) : timeoutSignal;
  const budget = createExecutionBudget();
  const ownerId = process.env.AI_OWNER_USER_ID?.trim() ?? "";
  assertAiAccess(ownerId, "operator");
  const [owner] = await db.select({ id: users.id }).from(users).where(eq(users.id, ownerId)).limit(1);
  if (!owner) throw new AiGuardError("unavailable", 503, "Operator owner is not configured.");
  const summary = { day: istDayWindow(now).day, run: kind, completed: 0, alreadyCompleted: 0, busy: 0, failed: 0, toolCalls: 0 };
  try {
    const result = await runOperatorForUser({ userId: owner.id, kind, now, budget, signal });
    if (result.status === "completed") summary.completed = 1;
    else if (result.status === "already_completed") summary.alreadyCompleted = 1;
    else summary.busy = 1;
  } catch (error) {
    if (error instanceof AiGuardError) throw error;
    // IDs/content/provider payloads stay out of response bodies and application logs.
    console.error("Operator run failed", { kind, errorType: error instanceof Error ? error.name : "Error" });
    summary.failed = 1;
  }
  summary.toolCalls = budget.used;
  return summary;
}
