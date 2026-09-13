import { and, asc, eq, gte, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { copilotMessages, copilotThreads } from "@/lib/db/schema";
import { CHAT_RATE_PER_MIN } from "@/lib/limits";

const COMPACT_AFTER = 40;
const KEEP_RECENT = 20;
const SUMMARY_PREFIX = "Conversation summary of earlier messages:\n";

async function getOrCreateThread(userId: string) {
  const [existing] = await db
    .select()
    .from(copilotThreads)
    .where(eq(copilotThreads.userId, userId))
    .limit(1);
  if (existing) return existing;
  // Concurrent first messages can both miss; the unique constraint on
  // user_id makes one insert a no-op, then we re-select the winner.
  const [created] = await db
    .insert(copilotThreads)
    .values({ userId })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  const [winner] = await db
    .select()
    .from(copilotThreads)
    .where(eq(copilotThreads.userId, userId))
    .limit(1);
  if (!winner) throw new Error("Could not get copilot thread.");
  return winner;
}

function isSummaryRow(message: { role: string; content: string }) {
  return message.role === "system" && message.content.startsWith(SUMMARY_PREFIX);
}

export async function countRecentUserChats(userId: string, windowMs = 60_000) {
  const thread = await getOrCreateThread(userId);
  const since = new Date(Date.now() - windowMs);
  const rows = await db
    .select({ id: copilotMessages.id })
    .from(copilotMessages)
    .where(
      and(
        eq(copilotMessages.threadId, thread.id),
        eq(copilotMessages.role, "user"),
        gte(copilotMessages.createdAt, since),
      ),
    )
    .limit(CHAT_RATE_PER_MIN);
  return rows.length;
}

export async function listThreadMessages(userId: string) {
  const thread = await getOrCreateThread(userId);
  const messages = await db
    .select()
    .from(copilotMessages)
    .where(eq(copilotMessages.threadId, thread.id))
    .orderBy(asc(copilotMessages.createdAt), asc(copilotMessages.id));
  return { thread, messages };
}

export async function appendMessages(
  userId: string,
  items: Array<{ role: string; content: string }>,
) {
  const thread = await getOrCreateThread(userId);
  if (items.length === 0) return;
  await db.insert(copilotMessages).values(
    items.map((item) => ({
      threadId: thread.id,
      role: item.role,
      content: item.content,
    })),
  );
  await compactThread(thread.id);
}

async function compactThread(threadId: string) {
  const messages = await db
    .select()
    .from(copilotMessages)
    .where(eq(copilotMessages.threadId, threadId))
    .orderBy(asc(copilotMessages.createdAt), asc(copilotMessages.id));

  // Keep at most one leading summary row: merge a prior summary into the new
  // one instead of nesting summary-of-summary.
  const [first, ...rest] = messages;
  const priorSummary = first && isSummaryRow(first) ? first : null;
  const compactable = priorSummary ? rest : messages;

  if (compactable.length <= COMPACT_AFTER) return;

  const older = compactable.slice(0, compactable.length - KEEP_RECENT);
  const ids = older.map((message) => message.id);
  if (priorSummary) ids.push(priorSummary.id);
  if (ids.length === 0) return;

  const base = priorSummary
    ? `${priorSummary.content.slice(SUMMARY_PREFIX.length)}\n`
    : "";
  const summary = (
    base + older.map((message) => `${message.role}: ${message.content}`).join("\n")
  ).slice(-4000);

  await db.transaction(async (tx) => {
    await tx
      .delete(copilotMessages)
      .where(
        and(
          eq(copilotMessages.threadId, threadId),
          inArray(copilotMessages.id, ids),
        ),
      );

    await tx.insert(copilotMessages).values({
      threadId,
      role: "system",
      content: `${SUMMARY_PREFIX}${summary}`,
      createdAt: older[0]?.createdAt ?? new Date(),
    });
  });
}
