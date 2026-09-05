"use server";

import { revalidatePath } from "next/cache";

import {
  createJob,
  deleteJob,
  updateJob,
  type Campus,
  type JobStatus,
} from "@/lib/db/queries/jobs";
import { parseDateOnly } from "@/lib/date";
import { requireUserId } from "@/lib/session";

function asStatus(value: string): JobStatus {
  const allowed: JobStatus[] = [
    "wishlist",
    "applied",
    "review",
    "interview",
    "offer",
    "rejected",
  ];
  if (allowed.includes(value as JobStatus)) return value as JobStatus;
  return "applied";
}

function asCampus(value: string): Campus {
  return value === "offcampus" ? "offcampus" : "oncampus";
}

function parseDate(value: string) {
  return parseDateOnly(value);
}

function readJobForm(formData: FormData) {
  const company = String(formData.get("company") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  const dateApplied = parseDate(String(formData.get("dateApplied") ?? ""));
  const status = asStatus(String(formData.get("status") ?? "applied"));
  const campus = asCampus(String(formData.get("campus") ?? "oncampus"));
  if (!company || !position) {
    throw new Error("Company and position are required.");
  }
  return { company, position, dateApplied, status, campus };
}

export async function createJobAction(formData: FormData) {
  const userId = await requireUserId();
  await createJob(userId, readJobForm(formData));
  revalidatePath("/app/jobs");
  revalidatePath("/app");
}

export async function updateJobAction(id: string, formData: FormData) {
  const userId = await requireUserId();
  await updateJob(userId, id, readJobForm(formData));
  revalidatePath("/app/jobs");
  revalidatePath("/app");
}

export async function deleteJobAction(id: string) {
  const userId = await requireUserId();
  await deleteJob(userId, id);
  revalidatePath("/app/jobs");
  revalidatePath("/app");
}
