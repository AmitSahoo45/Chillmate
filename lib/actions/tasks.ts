"use server";

import { revalidatePath } from "next/cache";

import { createTask, deleteTask, toggleTask } from "@/lib/db/queries/tasks";
import { requireUserId } from "@/lib/session";

function refreshTaskPaths() {
  revalidatePath("/app/focus");
  revalidatePath("/app");
}

export async function createTaskAction(formData: FormData) {
  const userId = await requireUserId();
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;
  await createTask(userId, text);
  refreshTaskPaths();
}

export async function toggleTaskAction(id: string) {
  const userId = await requireUserId();
  await toggleTask(userId, id);
  refreshTaskPaths();
}

export async function deleteTaskAction(id: string) {
  const userId = await requireUserId();
  await deleteTask(userId, id);
  refreshTaskPaths();
}
