"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createNote,
  deleteNote,
  getNote,
  updateNote,
} from "@/lib/db/queries/notes";
import { getOrCreateInbox, getSubject } from "@/lib/db/queries/subjects";
import { noteTitle } from "@/lib/notes/title";
import { requireUserId } from "@/lib/session";
import { parseTags } from "@/lib/tags";
import { isUuid } from "@/lib/uuid";

function readNoteForm(formData: FormData) {
  const bodyMarkdown = String(formData.get("bodyMarkdown") ?? "");
  const title = noteTitle(String(formData.get("title") ?? ""), bodyMarkdown);
  const description = String(formData.get("description") ?? "").trim();
  const tags = parseTags(String(formData.get("tags") ?? ""));
  return { title, description, bodyMarkdown, tags };
}

export async function dumpNoteAction(formData: FormData) {
  const userId = await requireUserId();
  const rawSubjectId = String(formData.get("subjectId") ?? "").trim();
  const bodyMarkdown = String(formData.get("bodyMarkdown") ?? "");
  const subjectHint = rawSubjectId && isUuid(rawSubjectId) ? rawSubjectId : "";

  if (!bodyMarkdown.trim()) {
    redirect(subjectHint ? `/app/notes/${subjectHint}` : "/app/notes");
  }

  let subject = subjectHint ? await getSubject(userId, subjectHint) : null;
  if (!subject) {
    subject = await getOrCreateInbox(userId);
  }
  if (!subject) redirect("/app/notes");

  const title = noteTitle("", bodyMarkdown);
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

export async function createNoteAction(subjectId: string, formData: FormData) {
  const userId = await requireUserId();
  if (!isUuid(subjectId)) redirect("/app/notes");
  const subject = await getSubject(userId, subjectId);
  if (!subject) redirect("/app/notes");
  const rawTitle = String(formData.get("title") ?? "").trim();
  const bodyMarkdown = String(formData.get("bodyMarkdown") ?? "");
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

export async function moveNoteAction(noteId: string, formData: FormData) {
  const userId = await requireUserId();
  const subjectId = String(formData.get("subjectId") ?? "").trim();
  if (!isUuid(noteId) || !isUuid(subjectId)) redirect("/app/notes");
  const existing = await getNote(userId, noteId);
  if (!existing) redirect("/app/notes");
  const currentUrl = `/app/notes/${existing.subjectId}/${noteId}`;
  const target = await getSubject(userId, subjectId);
  if (!target) redirect(currentUrl);
  if (subjectId === existing.subjectId) redirect(currentUrl);
  await updateNote(userId, noteId, { subjectId });
  revalidatePath("/app");
  revalidatePath("/app/notes");
  revalidatePath(`/app/notes/${existing.subjectId}`);
  revalidatePath(`/app/notes/${subjectId}`);
  revalidatePath(`/app/notes/${subjectId}/${noteId}`);
  redirect(`/app/notes/${subjectId}/${noteId}`);
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
