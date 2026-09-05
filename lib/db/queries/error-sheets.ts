import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { errorSheets } from "@/lib/db/schema";
import { matchesQuery } from "@/lib/tags";

export type BeforeInterviewFilter = "all" | "yes" | "no" | "maybe";

export async function listErrorSheets(
  userId: string,
  opts: { query?: string; lookup?: BeforeInterviewFilter } = {},
) {
  const rows = await db
    .select()
    .from(errorSheets)
    .where(eq(errorSheets.userId, userId))
    .orderBy(desc(errorSheets.updatedAt));

  const lookup = opts.lookup ?? "all";
  const query = opts.query ?? "";

  return rows.filter((row) => {
    if (lookup !== "all" && row.beforeInterviewLookup !== lookup) {
      return false;
    }
    return matchesQuery(query, [row.probName, row.tags]);
  });
}

export async function getErrorSheet(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(errorSheets)
    .where(and(eq(errorSheets.id, id), eq(errorSheets.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function createErrorSheet(
  userId: string,
  data: {
    probName: string;
    probLink: string;
    mistake: string;
    improvement?: string;
    isMistakeCorrected?: boolean;
    revisionPriority?: "high" | "medium" | "low";
    beforeInterviewLookup?: "yes" | "no" | "maybe";
    tags: string[];
  },
) {
  const [row] = await db
    .insert(errorSheets)
    .values({
      userId,
      probName: data.probName,
      probLink: data.probLink,
      mistake: data.mistake,
      improvement: data.improvement ?? "",
      isMistakeCorrected: data.isMistakeCorrected ?? false,
      // App-level canonical defaults (UI creates High/Yes). The DB-level
      // low/no defaults in schema.ts are only a safety net for raw inserts.
      revisionPriority: data.revisionPriority ?? "high",
      beforeInterviewLookup: data.beforeInterviewLookup ?? "yes",
      tags: data.tags,
    })
    .returning();
  return row;
}

export async function updateErrorSheet(
  userId: string,
  id: string,
  data: {
    probName?: string;
    probLink?: string;
    mistake?: string;
    improvement?: string;
    isMistakeCorrected?: boolean;
    revisionPriority?: "high" | "medium" | "low";
    beforeInterviewLookup?: "yes" | "no" | "maybe";
    tags?: string[];
  },
) {
  const [row] = await db
    .update(errorSheets)
    .set(data)
    .where(and(eq(errorSheets.id, id), eq(errorSheets.userId, userId)))
    .returning();
  return row ?? null;
}

export async function deleteErrorSheet(userId: string, id: string) {
  const [row] = await db
    .delete(errorSheets)
    .where(and(eq(errorSheets.id, id), eq(errorSheets.userId, userId)))
    .returning({ id: errorSheets.id });
  return row ?? null;
}
