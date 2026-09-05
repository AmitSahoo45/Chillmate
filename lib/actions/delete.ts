"use server";

import { revalidatePath } from "next/cache";

import { deleteErrorSheet } from "@/lib/db/queries/error-sheets";
import { deleteJob } from "@/lib/db/queries/jobs";
import { deleteNote } from "@/lib/db/queries/notes";
import { deleteSubject } from "@/lib/db/queries/subjects";
import { deleteTask } from "@/lib/db/queries/tasks";
import { requireUserId } from "@/lib/session";
import { isUuid } from "@/lib/uuid";

export type DeletableType =
  | "subject"
  | "note"
  | "error_sheet"
  | "job"
  | "task";

export async function confirmDeleteAction(type: DeletableType, id: string) {
  const userId = await requireUserId();
  if (!isUuid(id)) return;
  if (type === "subject") {
    await deleteSubject(userId, id);
    revalidatePath("/app/notes");
  } else if (type === "note") {
    await deleteNote(userId, id);
    revalidatePath("/app/notes");
  } else if (type === "error_sheet") {
    await deleteErrorSheet(userId, id);
    revalidatePath("/app/interview");
  } else if (type === "job") {
    await deleteJob(userId, id);
    revalidatePath("/app/jobs");
  } else if (type === "task") {
    await deleteTask(userId, id);
    revalidatePath("/app/focus");
  }
  revalidatePath("/app");
}
