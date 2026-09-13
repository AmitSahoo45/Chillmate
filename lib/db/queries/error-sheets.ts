import { and, asc, desc, eq, ilike, isNotNull, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { errorSheets } from "@/lib/db/schema";
import { LIST_LIMIT, searchPattern } from "@/lib/limits";
import { PIN_LIMIT } from "@/lib/pins";
import { parseHttpUrl } from "@/lib/validation";

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
  const lookup = opts.lookup ?? "all";
  const priority = opts.priority ?? "all";
  const pattern = searchPattern(opts.query ?? "");

  const rows = await db
    .select()
    .from(errorSheets)
    .where(
      and(
        eq(errorSheets.userId, userId),
        lookup !== "all"
          ? eq(errorSheets.beforeInterviewLookup, lookup)
          : undefined,
        priority !== "all"
          ? eq(errorSheets.revisionPriority, priority)
          : undefined,
        pattern
          ? or(
              ilike(errorSheets.probName, pattern),
              ilike(errorSheets.mistake, pattern),
              ilike(errorSheets.improvement, pattern),
              sql`${errorSheets.tags}::text ilike ${pattern}`,
            )
          : undefined,
      ),
    )
    .orderBy(desc(errorSheets.updatedAt))
    .limit(LIST_LIMIT);

  return rows.sort((a, b) => {
      if (a.isMistakeCorrected !== b.isMistakeCorrected) {
        return a.isMistakeCorrected ? 1 : -1;
      }
      const rank =
        PRIORITY_RANK[a.revisionPriority] - PRIORITY_RANK[b.revisionPriority];
      if (rank !== 0) return rank;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
}

export async function listPinnedErrorSheets(userId: string) {
  return db
    .select()
    .from(errorSheets)
    .where(and(eq(errorSheets.userId, userId), isNotNull(errorSheets.pinnedAt)))
    .orderBy(desc(errorSheets.pinnedAt))
    .limit(PIN_LIMIT);
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
      probLink: parseHttpUrl(data.probLink),
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
  const patch = {
    ...data,
    probLink:
      data.probLink === undefined ? undefined : parseHttpUrl(data.probLink),
  };
  const [row] = await db
    .update(errorSheets)
    .set(patch)
    .where(and(eq(errorSheets.id, id), eq(errorSheets.userId, userId)))
    .returning();
  return row ?? null;
}

export async function setErrorSheetPinned(
  userId: string,
  id: string,
  pinned: boolean,
) {
  const existing = await getErrorSheet(userId, id);
  if (!existing) return null;
  if (!pinned) {
    const [row] = await db
      .update(errorSheets)
      .set({ pinnedAt: null })
      .where(and(eq(errorSheets.id, id), eq(errorSheets.userId, userId)))
      .returning();
    return row ?? null;
  }
  if (existing.pinnedAt) return existing;
  const pinnedRows = await db
    .select({ id: errorSheets.id })
    .from(errorSheets)
    .where(and(eq(errorSheets.userId, userId), isNotNull(errorSheets.pinnedAt)))
    .orderBy(asc(errorSheets.pinnedAt));
  if (pinnedRows.length >= PIN_LIMIT) {
    await db
      .update(errorSheets)
      .set({ pinnedAt: null })
      .where(
        and(eq(errorSheets.id, pinnedRows[0].id), eq(errorSheets.userId, userId)),
      );
  }
  const [row] = await db
    .update(errorSheets)
    .set({ pinnedAt: new Date() })
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
