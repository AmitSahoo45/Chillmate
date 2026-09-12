"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createErrorSheet,
  deleteErrorSheet,
  getErrorSheet,
  setErrorSheetPinned,
  updateErrorSheet,
} from "@/lib/db/queries/error-sheets";
import { requireUserId } from "@/lib/session";
import { parseTags } from "@/lib/tags";
import { isUuid } from "@/lib/uuid";

function asPriority(value: string): "high" | "medium" | "low" {
  if (value === "high" || value === "medium" || value === "low") return value;
  throw new Error(`Invalid revision priority: ${value}`);
}

function asLookup(value: string): "yes" | "no" | "maybe" {
  if (value === "yes" || value === "no" || value === "maybe") return value;
  throw new Error(`Invalid interview lookup value: ${value}`);
}

function readSheetForm(formData: FormData) {
  const probName = String(formData.get("probName") ?? "").trim();
  const probLink = String(formData.get("probLink") ?? "").trim();
  const mistake = String(formData.get("mistake") ?? "").trim();
  const improvement = String(formData.get("improvement") ?? "").trim();
  const isMistakeCorrected = formData.get("isMistakeCorrected") === "on";
  const revisionPriority = asPriority(
    String(formData.get("revisionPriority") ?? "high"),
  );
  const beforeInterviewLookup = asLookup(
    String(formData.get("beforeInterviewLookup") ?? "yes"),
  );
  const tags = parseTags(String(formData.get("tags") ?? ""));
  if (!probName || !mistake) {
    throw new Error("Problem name and mistake are required.");
  }
  return {
    probName,
    probLink,
    mistake,
    improvement,
    isMistakeCorrected,
    revisionPriority,
    beforeInterviewLookup,
    tags,
  };
}

export async function createErrorSheetAction(formData: FormData) {
  const userId = await requireUserId();
  const data = readSheetForm(formData);
  const row = await createErrorSheet(userId, data);
  revalidatePath("/app/interview");
  redirect(`/app/interview/${row.id}`);
}

export async function updateErrorSheetAction(id: string, formData: FormData) {
  const userId = await requireUserId();
  if (!isUuid(id)) redirect("/app/interview");
  const existing = await getErrorSheet(userId, id);
  if (!existing) redirect("/app/interview");
  const data = readSheetForm(formData);
  await updateErrorSheet(userId, id, data);
  revalidatePath("/app/interview");
  revalidatePath(`/app/interview/${id}`);
}

export async function pinErrorSheetAction(id: string) {
  const userId = await requireUserId();
  if (!isUuid(id)) redirect("/app/interview");
  const existing = await getErrorSheet(userId, id);
  if (!existing) redirect("/app/interview");
  await setErrorSheetPinned(userId, id, !existing.pinnedAt);
  revalidatePath("/app");
  revalidatePath("/app/interview");
}

export async function deleteErrorSheetAction(id: string) {
  const userId = await requireUserId();
  if (!isUuid(id)) redirect("/app/interview");
  await deleteErrorSheet(userId, id);
  revalidatePath("/app/interview");
  redirect("/app/interview");
}
