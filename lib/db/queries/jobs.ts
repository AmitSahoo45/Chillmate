import { and, asc, desc, eq, ilike, isNotNull, ne, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { jobApplications } from "@/lib/db/schema";
import { LIST_LIMIT, searchPattern } from "@/lib/limits";
import { PIN_LIMIT } from "@/lib/pins";

export type JobStatus =
  | "wishlist"
  | "applied"
  | "review"
  | "interview"
  | "offer"
  | "rejected";

export type Campus = "oncampus" | "offcampus";

export type JobStatusFilter = JobStatus | "all" | "open";

export async function listJobs(
  userId: string,
  opts: { query?: string; status?: JobStatusFilter } = {},
) {
  const status = opts.status ?? "open";
  const pattern = searchPattern(opts.query ?? "");

  return db
    .select()
    .from(jobApplications)
    .where(
      and(
        eq(jobApplications.userId, userId),
        status === "open"
          ? ne(jobApplications.status, "rejected")
          : status !== "all"
            ? eq(jobApplications.status, status)
            : undefined,
        pattern
          ? or(
              ilike(jobApplications.company, pattern),
              ilike(jobApplications.position, pattern),
            )
          : undefined,
      ),
    )
    .orderBy(desc(jobApplications.updatedAt))
    .limit(LIST_LIMIT);
}

export async function listPinnedJobs(userId: string) {
  return db
    .select()
    .from(jobApplications)
    .where(
      and(eq(jobApplications.userId, userId), isNotNull(jobApplications.pinnedAt)),
    )
    .orderBy(desc(jobApplications.pinnedAt))
    .limit(PIN_LIMIT);
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
    pinnedAt?: Date | null;
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

export async function nudgeJob(userId: string, id: string) {
  const existing = await getJob(userId, id);
  if (!existing) return null;
  const status: JobStatus =
    existing.status === "wishlist" ? "applied" : existing.status;
  return updateJob(userId, id, { dateApplied: new Date(), status });
}

export async function setJobPinned(userId: string, id: string, pinned: boolean) {
  const existing = await getJob(userId, id);
  if (!existing) return null;
  if (!pinned) {
    return updateJob(userId, id, { pinnedAt: null });
  }
  if (existing.pinnedAt) return existing;
  const pinnedRows = await db
    .select({ id: jobApplications.id })
    .from(jobApplications)
    .where(
      and(eq(jobApplications.userId, userId), isNotNull(jobApplications.pinnedAt)),
    )
    .orderBy(asc(jobApplications.pinnedAt));
  if (pinnedRows.length >= PIN_LIMIT) {
    await db
      .update(jobApplications)
      .set({ pinnedAt: null })
      .where(
        and(eq(jobApplications.id, pinnedRows[0].id), eq(jobApplications.userId, userId)),
      );
  }
  const [row] = await db
    .update(jobApplications)
    .set({ pinnedAt: new Date() })
    .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, userId)))
    .returning();
  return row ?? null;
}

export async function deleteJob(userId: string, id: string) {
  const [row] = await db
    .delete(jobApplications)
    .where(and(eq(jobApplications.id, id), eq(jobApplications.userId, userId)))
    .returning({ id: jobApplications.id });
  return row ?? null;
}
