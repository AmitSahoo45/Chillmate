import { and, asc, desc, eq, ilike, isNotNull, isNull, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { notes, subjects } from "@/lib/db/schema";
import { LIST_LIMIT, searchPattern } from "@/lib/limits";
import { isInboxName } from "@/lib/notes/title";
import { PIN_LIMIT } from "@/lib/pins";

function archiveWhere(archived: boolean) {
  return archived ? isNotNull(notes.archivedAt) : isNull(notes.archivedAt);
}

function noteSearch(query: string) {
  const pattern = searchPattern(query);
  if (!pattern) return undefined;
  return or(
    ilike(notes.title, pattern),
    ilike(notes.description, pattern),
    ilike(notes.bodyMarkdown, pattern),
    sql`${notes.tags}::text ilike ${pattern}`,
  );
}

export async function listNotes(
  userId: string,
  subjectId: string,
  query = "",
  archived = false,
) {
  return db
    .select()
    .from(notes)
    .where(
      and(
        eq(notes.userId, userId),
        eq(notes.subjectId, subjectId),
        archiveWhere(archived),
        noteSearch(query),
      ),
    )
    .orderBy(desc(notes.updatedAt))
    .limit(LIST_LIMIT);
}

export async function listRecentNotes(userId: string, limit = 5) {
  return db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, userId), isNull(notes.archivedAt)))
    .orderBy(desc(notes.updatedAt))
    .limit(limit);
}

export async function listAllNotes(userId: string, query = "", archived = false) {
  return db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, userId), archiveWhere(archived), noteSearch(query)))
    .orderBy(desc(notes.updatedAt))
    .limit(LIST_LIMIT);
}

export async function listPinnedNotes(userId: string) {
  return db
    .select()
    .from(notes)
    .where(
      and(
        eq(notes.userId, userId),
        isNotNull(notes.pinnedAt),
        isNull(notes.archivedAt),
      ),
    )
    .orderBy(desc(notes.pinnedAt))
    .limit(PIN_LIMIT);
}

export async function inboxSummary(userId: string) {
  const rows = await db
    .select()
    .from(subjects)
    .where(eq(subjects.userId, userId));
  const inbox = rows.find((row) => isInboxName(row.name));
  if (!inbox) {
    return { subjectId: null as string | null, total: 0, weekCount: 0 };
  }
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [stats] = await db
    .select({
      total: sql<number>`cast(count(*) as int)`,
      weekCount: sql<number>`cast(count(*) filter (where ${notes.updatedAt} > ${weekAgo}) as int)`,
    })
    .from(notes)
    .where(
      and(
        eq(notes.userId, userId),
        eq(notes.subjectId, inbox.id),
        isNull(notes.archivedAt),
      ),
    );
  return {
    subjectId: inbox.id,
    total: stats?.total ?? 0,
    weekCount: stats?.weekCount ?? 0,
  };
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
    subjectId?: string;
  },
) {
  if (data.subjectId !== undefined) {
    const [subject] = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(and(eq(subjects.id, data.subjectId), eq(subjects.userId, userId)))
      .limit(1);
    if (!subject) return null;
  }
  const [row] = await db
    .update(notes)
    .set(data)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning();
  return row ?? null;
}

export async function setNoteArchived(
  userId: string,
  id: string,
  archived: boolean,
) {
  const [row] = await db
    .update(notes)
    .set({ archivedAt: archived ? new Date() : null })
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning();
  return row ?? null;
}

export async function setNotePinned(userId: string, id: string, pinned: boolean) {
  const existing = await getNote(userId, id);
  if (!existing) return null;
  if (!pinned) {
    const [row] = await db
      .update(notes)
      .set({ pinnedAt: null })
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .returning();
    return row ?? null;
  }
  if (existing.pinnedAt) return existing;
  const pinnedRows = await db
    .select({ id: notes.id })
    .from(notes)
    .where(and(eq(notes.userId, userId), isNotNull(notes.pinnedAt)))
    .orderBy(asc(notes.pinnedAt));
  if (pinnedRows.length >= PIN_LIMIT) {
    await db
      .update(notes)
      .set({ pinnedAt: null })
      .where(
        and(eq(notes.id, pinnedRows[0].id), eq(notes.userId, userId)),
      );
  }
  const [row] = await db
    .update(notes)
    .set({ pinnedAt: new Date() })
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
