import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { jobApplications } from "@/lib/db/schema";
import { matchesQuery } from "@/lib/tags";

export type JobStatus =
  | "wishlist"
  | "applied"
  | "review"
  | "interview"
  | "offer"
  | "rejected";

export type Campus = "oncampus" | "offcampus";

export async function listJobs(
  userId: string,
  opts: { query?: string; status?: JobStatus | "all" } = {},
) {
  const rows = await db
    .select()
    .from(jobApplications)
    .where(eq(jobApplications.userId, userId))
    .orderBy(desc(jobApplications.updatedAt));

  const status = opts.status ?? "all";
  const query = opts.query ?? "";

  return rows.filter((row) => {
    if (status !== "all" && row.status !== status) return false;
    return matchesQuery(query, [row.company, row.position]);
  });
}

export async function listFollowUpJobs(userId: string, limit = 5) {
  const rows = await listJobs(userId);
  return rows
    .filter((row) =>
      row.status === "applied" ||
      row.status === "review" ||
      row.status === "interview",
    )
    .slice(0, limit);
}

export async function getJob(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(jobApplications)
    .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function createJob(
  userId: string,
  data: {
    company: string;
    position: string;
    dateApplied: Date;
    status: JobStatus;
    campus?: Campus;
  },
) {
  const [row] = await db
    .insert(jobApplications)
    .values({
      userId,
      company: data.company,
      position: data.position,
      dateApplied: data.dateApplied,
      status: data.status,
      campus: data.campus ?? "oncampus",
    })
    .returning();
  return row;
}

export async function updateJob(
  userId: string,
  id: string,
  data: {
    company?: string;
    position?: string;
    dateApplied?: Date;
    status?: JobStatus;
    campus?: Campus;
  },
) {
  const [row] = await db
    .update(jobApplications)
    .set(data)
    .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, userId)))
    .returning();
  return row ?? null;
}

export async function updateJobStatus(
  userId: string,
  id: string,
  status: JobStatus,
) {
  return updateJob(userId, id, { status });
}

export async function deleteJob(userId: string, id: string) {
  const [row] = await db
    .delete(jobApplications)
    .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, userId)))
    .returning({ id: jobApplications.id });
  return row ?? null;
}
