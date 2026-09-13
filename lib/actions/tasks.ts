"use server";

import { revalidatePath } from "next/cache";

import {
  createTask,
  deleteTask,
  splitTask,
  toggleTask,
} from "@/lib/db/queries/tasks";
import { FIELD, clip } from "@/lib/limits";
import { requireUserId } from "@/lib/session";
import { isUuid } from "@/lib/uuid";

function refreshTaskPaths() {
  revalidatePath("/app/focus");
  revalidatePath("/app");
}

export async function createTaskAction(formData: FormData) {
  const userId = await requireUserId();
  const text = clip(String(formData.get("text") ?? "").trim(), FIELD.task);
  if (!text) return;
  await createTask(userId, text);
  refreshTaskPaths();
}

export async function toggleTaskAction(id: string) {
  const userId = await requireUserId();
  if (!isUuid(id)) return;
  await toggleTask(userId, id);
  refreshTaskPaths();
}

export async function deleteTaskAction(id: string) {
  const userId = await requireUserId();
  if (!isUuid(id)) return;
  await deleteTask(userId, id);
  refreshTaskPaths();
}

export async function splitTaskAction(id: string, formData: FormData) {
  const userId = await requireUserId();
  if (!isUuid(id)) return;
  const first = clip(String(formData.get("first") ?? "").trim(), FIELD.task);
  const second = clip(String(formData.get("second") ?? "").trim(), FIELD.task);
  if (!first || !second) return;
  await splitTask(userId, id, [first, second]);
  refreshTaskPaths();
}
