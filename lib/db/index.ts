import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export type ChillmateDb = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  postgres: ReturnType<typeof postgres> | undefined;
  drizzleDb: ChillmateDb | undefined;
};

function createDb(): ChillmateDb {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const client =
    globalForDb.postgres ??
    postgres(url, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.postgres = client;
  }

  return drizzle(client, { schema });
}

export function getDb(): ChillmateDb {
  globalForDb.drizzleDb ??= createDb();
  return globalForDb.drizzleDb;
}

/**
 * Lazy database handle. Safe to import without DATABASE_URL (pages use
 * `withDb()` to degrade gracefully); throws only on first actual use.
 */
export const db: ChillmateDb = new Proxy({} as ChillmateDb, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop);
  },
});
