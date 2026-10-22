import { and, eq, isNotNull, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { notes, operatorRuns, subjects } from "@/lib/db/schema";
import { istDay } from "@/lib/operator/policy";

export async function getPinnedTodayNote(userId: string) {
  const day = istDay();
  const [row] = await db
    .select({ note: notes })
    .from(operatorRuns)
    .innerJoin(notes, eq(operatorRuns.noteId, notes.id))
    .innerJoin(subjects, eq(notes.subjectId, subjects.id))
    .where(
      and(
        eq(operatorRuns.userId, userId),
        eq(operatorRuns.kind, "morning"),
        eq(operatorRuns.day, day),
        eq(notes.userId, userId),
        eq(subjects.userId, userId),
        eq(notes.title, `Today — ${day}`),
        isNotNull(notes.pinnedAt),
        isNull(notes.archivedAt),
      ),
    )
    .limit(1);
  return row?.note ?? null;
}
