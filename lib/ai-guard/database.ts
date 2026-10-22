import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/lib/db/schema";
import { AiGuardError } from "./policy";

function createGuardDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new AiGuardError("unavailable", 503, "AI limits are temporarily unavailable.");
  // Independent connection: an operator holds its business transaction while AI
  // reservations must commit permanently, including when that transaction fails.
  try {
    const client = postgres(url, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      connection: { statement_timeout: 5_000, lock_timeout: 3_000 },
    });
    return drizzle(client, { schema });
  } catch {
    throw new AiGuardError("unavailable", 503, "AI limits are temporarily unavailable.");
  }
}

export type GuardDatabase = ReturnType<typeof createGuardDatabase>;
let guardDatabase: GuardDatabase | undefined;
export function getGuardDatabase() {
  guardDatabase ??= createGuardDatabase();
  return guardDatabase;
}
