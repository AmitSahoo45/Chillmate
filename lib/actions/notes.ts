"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createTask } from "@/lib/db/queries/tasks";
import {
  createNote,
  deleteNote,
  getNote,
  setNoteArchived,
  setNotePinned,
  updateNote,
} from "@/lib/db/queries/notes";
import { getOrCreateInbox, getSubject } from "@/lib/db/queries/subjects";
import { FIELD, clip } from "@/lib/limits";
import { noteTitle } from "@/lib/notes/title";
import { requireUserId } from "@/lib/session";
import { parseTags } from "@/lib/tags";
import { isUuid } from "@/lib/uuid";

function readNoteForm(formData: FormData) {
  const bodyMarkdown = clip(String(formData.get("bodyMarkdown") ?? ""), FIELD.body);
  const title = clip(
    noteTitle(String(formData.get("title") ?? ""), bodyMarkdown),
    FIELD.title,
  );
  const description = clip(
    String(formData.get("description") ?? "").trim(),
    FIELD.description,
  );
  const tags = parseTags(String(formData.get("tags") ?? ""));
  return { title, description, bodyMarkdown, tags };
}

export async function dumpNoteAction(formData: FormData) {
  const userId = await requireUserId();
  const rawSubjectId = String(formData.get("subjectId") ?? "").trim();
  const bodyMarkdown = clip(String(formData.get("bodyMarkdown") ?? ""), FIELD.body);
  const subjectHint = rawSubjectId && isUuid(rawSubjectId) ? rawSubjectId : "";

  if (!bodyMarkdown.trim()) {
    redirect(subjectHint ? `/app/notes/${subjectHint}` : "/app/notes");
  }

  let subject = subjectHint ? await getSubject(userId, subjectHint) : null;
  if (!subject) {
    subject = await getOrCreateInbox(userId);
  }
  if (!subject) redirect("/app/notes");

  const title = clip(noteTitle("", bodyMarkdown), FIELD.title);
  const row = await createNote(userId, {
    subjectId: subject.id,
    title,
    description: "",
    bodyMarkdown,
    tags: [],
  });
  if (!row) redirect("/app/notes");
  revalidatePath("/app");
  revalidatePath("/app/notes");
  revalidatePath(`/app/notes/${subject.id}`);
  redirect(`/app/notes/${subject.id}/${row.id}`);
}

export async function dumpTaskAction(formData: FormData) {
  const userId = await requireUserId();
  const bodyMarkdown = clip(String(formData.get("bodyMarkdown") ?? ""), FIELD.body);
  const text = clip(noteTitle("", bodyMarkdown), FIELD.task);
  if (!bodyMarkdown.trim()) redirect("/app");
  await createTask(userId, text);
  revalidatePath("/app");
  revalidatePath("/app/focus");
  redirect("/app/focus");
}

export async function createNoteAction(subjectId: string, formData: FormData) {
  const userId = await requireUserId();
  if (!isUuid(subjectId)) redirect("/app/notes");
  const subject = await getSubject(userId, subjectId);
  if (!subject) redirect("/app/notes");
  const rawTitle = clip(String(formData.get("title") ?? "").trim(), FIELD.title);
  const bodyMarkdown = clip(String(formData.get("bodyMarkdown") ?? ""), FIELD.body);
  if (!rawTitle && !bodyMarkdown.trim()) {
    redirect(`/app/notes/${subjectId}`);
  }
  const data = readNoteForm(formData);
  const row = await createNote(userId, { subjectId, ...data });
  if (!row) redirect("/app/notes");
  revalidatePath("/app");
  revalidatePath(`/app/notes/${subjectId}`);
  redirect(`/app/notes/${subjectId}/${row.id}`);
}

export async function updateNoteAction(id: string, formData: FormData) {
  const userId = await requireUserId();
  if (!isUuid(id)) redirect("/app/notes");
  const existing = await getNote(userId, id);
  if (!existing) redirect("/app/notes");
  const data = readNoteForm(formData);
  await updateNote(userId, id, data);
  revalidatePath("/app");
  revalidatePath(`/app/notes/${existing.subjectId}`);
  revalidatePath(`/app/notes/${existing.subjectId}/${id}`);
}

function refreshMovePaths(from: string, to: string, noteId: string) {
  revalidatePath("/app");
  revalidatePath("/app/notes");
  revalidatePath(`/app/notes/${from}`);
  revalidatePath(`/app/notes/${to}`);
  revalidatePath(`/app/notes/${to}/${noteId}`);
}

async function moveOwnedNote(userId: string, noteId: string, subjectId: string) {
  if (!isUuid(noteId) || !isUuid(subjectId)) return null;
  const existing = await getNote(userId, noteId);
  if (!existing) return null;
  if (subjectId === existing.subjectId) {
    return { from: existing.subjectId, to: subjectId, noteId, skipped: true };
  }
  const target = await getSubject(userId, subjectId);
  if (!target) return null;
  const row = await updateNote(userId, noteId, { subjectId });
  if (!row) return null;
  refreshMovePaths(existing.subjectId, subjectId, noteId);
  return { from: existing.subjectId, to: subjectId, noteId, skipped: false };
}

export async function moveNoteAction(noteId: string, formData: FormData) {
  const userId = await requireUserId();
  const subjectId = String(formData.get("subjectId") ?? "").trim();
  if (!isUuid(noteId) || !isUuid(subjectId)) redirect("/app/notes");
  const existing = await getNote(userId, noteId);
  if (!existing) redirect("/app/notes");
  const currentUrl = `/app/notes/${existing.subjectId}/${noteId}`;
  const moved = await moveOwnedNote(userId, noteId, subjectId);
  if (!moved) redirect(currentUrl);
  redirect(`/app/notes/${moved.to}/${noteId}`);
}

export async function confirmMoveAction(noteId: string, subjectId: string) {
  const userId = await requireUserId();
  await moveOwnedNote(userId, noteId, subjectId);
}

export async function moveNotesAction(formData: FormData) {
  const userId = await requireUserId();
  const subjectId = String(formData.get("subjectId") ?? "").trim();
  const ids = formData
    .getAll("noteId")
    .map((value) => String(value))
    .filter((id) => isUuid(id))
    .slice(0, 10);
  if (!isUuid(subjectId) || ids.length === 0) redirect("/app/notes");
  let lastFrom = "";
  for (const noteId of ids) {
    const moved = await moveOwnedNote(userId, noteId, subjectId);
    if (moved) lastFrom = moved.from;
  }
  redirect(lastFrom ? `/app/notes/${subjectId}` : "/app/notes");
}

export async function archiveNoteAction(id: string) {
  const userId = await requireUserId();
  if (!isUuid(id)) redirect("/app/notes");
  const existing = await getNote(userId, id);
  if (!existing) redirect("/app/notes");
  await setNoteArchived(userId, id, !existing.archivedAt);
  revalidatePath("/app");
  revalidatePath("/app/notes");
  revalidatePath(`/app/notes/${existing.subjectId}`);
  revalidatePath(`/app/notes/${existing.subjectId}/${id}`);
}

export async function pinNoteAction(id: string) {
  const userId = await requireUserId();
  if (!isUuid(id)) redirect("/app/notes");
  const existing = await getNote(userId, id);
  if (!existing) redirect("/app/notes");
  await setNotePinned(userId, id, !existing.pinnedAt);
  revalidatePath("/app");
  revalidatePath(`/app/notes/${existing.subjectId}`);
}

export async function deleteNoteAction(id: string) {
  const userId = await requireUserId();
  if (!isUuid(id)) redirect("/app/notes");
  const existing = await getNote(userId, id);
  if (!existing) redirect("/app/notes");
  await deleteNote(userId, id);
  revalidatePath("/app");
  revalidatePath(`/app/notes/${existing.subjectId}`);
  redirect(`/app/notes/${existing.subjectId}`);
}
