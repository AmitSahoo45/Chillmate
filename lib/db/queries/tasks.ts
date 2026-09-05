import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";

export async function listTasks(userId: string) {
  return db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(desc(tasks.createdAt));
}

export async function listOpenTasks(userId: string, limit = 8) {
  const rows = await listTasks(userId);
  return rows.filter((row) => !row.completed).slice(0, limit);
}

export async function createTask(userId: string, text: string) {
  const [row] = await db
    .insert(tasks)
    .values({ userId, text })
    .returning();
  return row;
}

export async function toggleTask(userId: string, id: string) {
  const [existing] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .limit(1);
  if (!existing) return null;
  const [row] = await db
    .update(tasks)
    .set({ completed: !existing.completed })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning();
  return row ?? null;
}

export async function deleteTask(userId: string, id: string) {
  const [row] = await db
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning({ id: tasks.id });
  return row ?? null;
}
