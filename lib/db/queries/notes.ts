import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { notes, subjects } from "@/lib/db/schema";
import { matchesQuery } from "@/lib/tags";

export async function listNotes(
  userId: string,
  subjectId: string,
  query = "",
) {
  const rows = await db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, userId), eq(notes.subjectId, subjectId)))
    .orderBy(desc(notes.updatedAt));

  return rows.filter((row) =>
    matchesQuery(query, [row.title, row.description, row.bodyMarkdown, row.tags]),
  );
}

export async function listRecentNotes(userId: string, limit = 5) {
  return db
    .select()
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.updatedAt))
    .limit(limit);
}

export async function listAllNotes(userId: string, query = "") {
  const rows = await db
    .select()
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.updatedAt));
  return rows.filter((row) =>
    matchesQuery(query, [row.title, row.description, row.bodyMarkdown, row.tags]),
  );
}

export async function getNote(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function createNote(
  userId: string,
  data: {
    subjectId: string;
    title: string;
    description: string;
    bodyMarkdown?: string;
    tags: string[];
  },
) {
  const [subject] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(and(eq(subjects.id, data.subjectId), eq(subjects.userId, userId)))
    .limit(1);
  if (!subject) return null;
  const [row] = await db
    .insert(notes)
    .values({
      userId,
      subjectId: data.subjectId,
      title: data.title,
      description: data.description,
      bodyMarkdown: data.bodyMarkdown ?? "",
      tags: data.tags,
    })
    .returning();
  return row;
}

export async function updateNote(
  userId: string,
  id: string,
  data: {
    title?: string;
    description?: string;
    bodyMarkdown?: string;
    tags?: string[];
  },
) {
  const [row] = await db
    .update(notes)
    .set(data)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning();
  return row ?? null;
}

export async function deleteNote(userId: string, id: string) {
  const [row] = await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning({ id: notes.id });
  return row ?? null;
}
