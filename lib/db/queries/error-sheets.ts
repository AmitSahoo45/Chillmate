import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { errorSheets } from "@/lib/db/schema";
import { matchesQuery } from "@/lib/tags";

export type BeforeInterviewFilter = "all" | "yes" | "no" | "maybe";
export type PriorityFilter = "all" | "high" | "medium" | "low";

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const;

export async function listErrorSheets(
  userId: string,
  opts: {
    query?: string;
    lookup?: BeforeInterviewFilter;
    priority?: PriorityFilter;
  } = {},
) {
  const rows = await db
    .select()
    .from(errorSheets)
    .where(eq(errorSheets.userId, userId))
    .orderBy(desc(errorSheets.updatedAt));

  const lookup = opts.lookup ?? "all";
  const priority = opts.priority ?? "all";
  const query = opts.query ?? "";

  return rows
    .filter((row) => {
      if (lookup !== "all" && row.beforeInterviewLookup !== lookup) {
        return false;
      }
      if (priority !== "all" && row.revisionPriority !== priority) {
        return false;
      }
      return matchesQuery(query, [
        row.probName,
        row.mistake,
        row.improvement,
        row.tags,
      ]);
    })
    .sort((a, b) => {
      if (a.isMistakeCorrected !== b.isMistakeCorrected) {
        return a.isMistakeCorrected ? 1 : -1;
      }
      const rank =
        PRIORITY_RANK[a.revisionPriority] - PRIORITY_RANK[b.revisionPriority];
      if (rank !== 0) return rank;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
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
