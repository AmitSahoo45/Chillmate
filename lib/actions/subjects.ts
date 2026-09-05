"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createSubject,
  deleteSubject,
  updateSubject,
} from "@/lib/db/queries/subjects";
import { requireUserId } from "@/lib/session";
import { parseTags } from "@/lib/tags";
import { isUuid } from "@/lib/uuid";

function readSubjectForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const tags = parseTags(String(formData.get("tags") ?? ""));
  if (!name) {
    throw new Error("Name is required.");
  }
  return { name, description, tags };
}

export async function createSubjectAction(formData: FormData) {
  const userId = await requireUserId();
  const data = readSubjectForm(formData);
  const row = await createSubject(userId, data);
  revalidatePath("/app/notes");
  redirect(`/app/notes/${row.id}`);
}

export async function updateSubjectAction(id: string, formData: FormData) {
  const userId = await requireUserId();
  if (!isUuid(id)) redirect("/app/notes");
  const data = readSubjectForm(formData);
  await updateSubject(userId, id, data);
  revalidatePath("/app/notes");
  revalidatePath(`/app/notes/${id}`);
}

export async function deleteSubjectAction(id: string) {
  const userId = await requireUserId();
  if (!isUuid(id)) redirect("/app/notes");
  await deleteSubject(userId, id);
  revalidatePath("/app/notes");
  redirect("/app/notes");
}
