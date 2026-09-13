import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { notes, subjects } from "@/lib/db/schema";
import { LIST_LIMIT, searchPattern } from "@/lib/limits";
import { INBOX_NAME, isInboxName } from "@/lib/notes/title";

export async function listSubjects(userId: string, query = "") {
  const pattern = searchPattern(query);
  return db
    .select()
    .from(subjects)
    .where(
      and(
        eq(subjects.userId, userId),
        pattern
          ? or(
              ilike(subjects.name, pattern),
              ilike(subjects.description, pattern),
              sql`${subjects.tags}::text ilike ${pattern}`,
            )
          : undefined,
      ),
    )
    .orderBy(desc(subjects.updatedAt))
    .limit(LIST_LIMIT);
}

export async function getSubject(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(subjects)
    .where(and(eq(subjects.id, id), eq(subjects.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function getOrCreateInbox(userId: string) {
  const rows = await db
    .select()
    .from(subjects)
    .where(eq(subjects.userId, userId));
  const existing = rows.find((row) => isInboxName(row.name));
  if (existing) return existing;
  return createSubject(userId, {
    name: INBOX_NAME,
    description: "",
    tags: ["inbox"],
  });
}

export async function createSubject(
  userId: string,
  data: { name: string; description: string; tags: string[] },
) {
  const [row] = await db
    .insert(subjects)
    .values({
      userId,
      name: data.name,
      description: data.description,
      tags: data.tags,
    })
    .returning();
  return row;
}

export async function updateSubject(
  userId: string,
  id: string,
  data: { name: string; description: string; tags: string[] },
) {
  const [row] = await db
    .update(subjects)
    .set({
      name: data.name,
      description: data.description,
      tags: data.tags,
    })
    .where(and(eq(subjects.id, id), eq(subjects.userId, userId)))
    .returning();
  return row ?? null;
}

export async function deleteSubject(userId: string, id: string) {
  const [row] = await db
    .delete(subjects)
    .where(and(eq(subjects.id, id), eq(subjects.userId, userId)))
    .returning({ id: subjects.id });
  return row ?? null;
}

export async function countNotesForSubject(userId: string, subjectId: string) {
  const rows = await db
    .select({ id: notes.id })
    .from(notes)
    .where(and(eq(notes.userId, userId), eq(notes.subjectId, subjectId)));
  return rows.length;
}
