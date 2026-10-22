import "./register-test-imports.mjs";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { MockLanguageModelV4 } from "ai/test";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const schema = await import("../db/schema.ts");
const { runOperatorForUser } = await import("./runner.ts");
const { istDayWindow } = await import("./policy.ts");
const client = process.env.DATABASE_URL ? postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 15 }) : null;
const database = client ? drizzle(client, { schema }) : null;
after(async () => { await client?.end(); });
const dbTest = (name, fn) => test(name, { skip: !database && "Set existing DATABASE_URL to run rollback-only database tests" }, fn);

async function fixture(check) {
  const rollback = new Error("EXPECTED_OUTER_TEST_ROLLBACK");
  const userId = `operator-test-${randomUUID()}`;
  try {
    await database.transaction(async (tx) => {
      const now = new Date();
      const window = istDayWindow(now);
      await tx.insert(schema.users).values({ id: userId });
      const [inbox] = await tx.insert(schema.subjects).values({ userId, name: "Inbox", description: "" }).returning();
      const [dump] = await tx.insert(schema.notes).values({
        userId, subjectId: inbox.id, title: "Source dump", description: "",
        bodyMarkdown: "Call tomorrow; reference note", isDump: true, createdAt: now,
      }).returning();
      await check({ tx, userId, now, window, inbox, dump });
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
  const survivors = await database.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, userId));
  assert.deepEqual(survivors, [], "all fixture data must roll back");
}

function modelResult(toolName, input) {
  return {
    content: toolName
      ? [{ type: "tool-call", toolCallId: randomUUID(), toolName, input: JSON.stringify(input) }]
      : [{ type: "text", text: "Done" }],
    finishReason: { unified: toolName ? "tool-calls" : "stop", raw: toolName ? "tool_use" : "end_turn" },
    usage: {
      inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
      outputTokens: { total: 1, text: 1, reasoning: 0 },
    },
    warnings: [],
  };
}

dbTest("morning preserves authored Today notes and only unpins yesterday's operator note", async () => {
  await fixture(async ({ tx, userId, now, window }) => {
    const [daily] = await tx.insert(schema.subjects).values({ userId, name: "Daily", description: "" }).returning();
    const [authoredToday, authoredYesterday, operatorYesterday] = await tx.insert(schema.notes).values([
      { userId, subjectId: daily.id, title: `Today — ${window.day}`, description: "", bodyMarkdown: "Keep my draft", archivedAt: now },
      { userId, subjectId: daily.id, title: `Today — ${window.yesterday}`, description: "", bodyMarkdown: "My personal note", pinnedAt: now },
      { userId, subjectId: daily.id, title: `Today — ${window.yesterday}`, description: "", bodyMarkdown: "Scheduled note", pinnedAt: now },
    ]).returning();
    await tx.insert(schema.operatorRuns).values({ userId, kind: "morning", day: window.yesterday, noteId: operatorYesterday.id });
    await tx.insert(schema.tasks).values({ userId, text: "One real task" });
    const result = await runOperatorForUser({ database: tx, userId, kind: "morning", now });
    assert.notEqual(result.noteId, authoredToday.id);
    const rows = await tx.select().from(schema.notes).where(eq(schema.notes.userId, userId));
    assert.equal(rows.find((row) => row.id === authoredToday.id).bodyMarkdown, "Keep my draft");
    assert.ok(rows.find((row) => row.id === authoredToday.id).archivedAt);
    assert.ok(rows.find((row) => row.id === authoredYesterday.id).pinnedAt);
    assert.equal(rows.find((row) => row.id === operatorYesterday.id).pinnedAt, null);
    assert.equal(rows.find((row) => row.id === result.noteId).bodyMarkdown, "One real task\nCarried over: 0");
    const retry = await runOperatorForUser({ database: tx, userId, kind: "morning", now });
    assert.equal(retry.status, "already_completed");
    assert.equal(retry.noteId, result.noteId);
  });
});

dbTest("night loads uncapped isolated context, archives exactly its marked dumps and is idempotent", async () => {
  await fixture(async ({ tx, userId, now, window, inbox, dump }) => {
    const otherUserId = `operator-other-${randomUUID()}`;
    await tx.insert(schema.users).values({ id: otherUserId });
    const [otherSubject] = await tx.insert(schema.subjects).values({ userId: otherUserId, name: "Private", description: "" }).returning();
    await tx.insert(schema.subjects).values(Array.from({ length: 51 }, (_, i) => ({ userId, name: `Topic ${i}`, description: "" })));
    await tx.insert(schema.tasks).values([
      ...Array.from({ length: 52 }, (_, i) => ({ userId, text: `Existing ${i}`, createdAt: new Date(now.getTime() - (i + 1) * 1000) })),
      { userId: otherUserId, text: "Other user's secret task" },
    ]);
    const excluded = await tx.insert(schema.notes).values([
      { userId, subjectId: inbox.id, title: "Normal note", description: "", bodyMarkdown: "Do not process", createdAt: now },
      { userId, subjectId: inbox.id, title: "Yesterday dump", description: "", isDump: true, createdAt: new Date(window.start.getTime() - 1) },
      { userId, subjectId: inbox.id, title: "Archived dump", description: "", isDump: true, createdAt: now, archivedAt: now },
      { userId: otherUserId, subjectId: otherSubject.id, title: "Private dump", description: "", isDump: true, createdAt: now },
    ]).returning();
    let step = 0;
    const model = new MockLanguageModelV4({ doGenerate: async ({ prompt }) => {
      const payload = JSON.parse(prompt.find((message) => message.role === "user").content[0].text);
      assert.equal(payload.subjects.length, 52);
      assert.equal(payload.openTasks.length, 52);
      assert.deepEqual(payload.dumps.map((row) => row.id), [dump.id]);
      step += 1;
      if (step === 1) return modelResult("createSubject", { name: "Daily" });
      if (step === 2) return modelResult("createTask", { sourceDumpId: dump.id, text: "Call", dueDate: window.day });
      if (step === 3) {
        const output = prompt.flatMap((message) => Array.isArray(message.content) ? message.content : [])
          .find((part) => part.type === "tool-result" && part.toolName === "createSubject").output.value;
        return modelResult("createNote", { sourceDumpId: dump.id, subjectId: output.id, title: "Reference", bodyMarkdown: "Neon reading reference" });
      }
      if (step === 4) return modelResult("finishDump", { sourceDumpId: dump.id });
      return modelResult();
    } });
    const result = await runOperatorForUser({ database: tx, userId, kind: "night", now, model });
    assert.equal(result.status, "completed");
    const rows = await tx.select().from(schema.notes).where(eq(schema.notes.userId, userId));
    assert.ok(rows.find((row) => row.id === dump.id).archivedAt, "default microsecond updated_at must match exactly");
    assert.equal(rows.find((row) => row.id === excluded[0].id).archivedAt, null);
    assert.equal(rows.find((row) => row.id === excluded[1].id).archivedAt, null);
    assert.equal(rows.filter((row) => row.title === "Night log").length, 1);
    assert.equal(rows.filter((row) => row.title === "Reference").length, 1);
    const daily = await tx.select().from(schema.subjects).where(and(eq(schema.subjects.userId, userId), eq(schema.subjects.name, "Daily")));
    assert.equal(daily.length, 1, "log must reuse a model-created Daily subject");
    const open = await tx.select().from(schema.tasks).where(eq(schema.tasks.userId, userId));
    assert.equal(open.length, 53);
    assert.equal(open.find((task) => task.text === "Call").dueDate, window.day);
    const retry = await runOperatorForUser({ database: tx, userId, kind: "night", now, model });
    assert.equal(retry.status, "already_completed");
    assert.equal(retry.noteId, result.noteId);
    assert.equal((await tx.select().from(schema.tasks).where(eq(schema.tasks.userId, userId))).length, 53);
  });
});

dbTest("a night that creates an item but leaves a dump unfinished rolls back every write", async () => {
  await fixture(async ({ tx, userId, now, dump }) => {
    let step = 0;
    const model = new MockLanguageModelV4({ doGenerate: async () => {
      step += 1;
      return step === 1 ? modelResult("createTask", { sourceDumpId: dump.id, text: "Must roll back" }) : modelResult();
    } });
    await assert.rejects(runOperatorForUser({ database: tx, userId, kind: "night", now, model }), /Unfinished dumps/);
    assert.deepEqual(await tx.select().from(schema.tasks).where(eq(schema.tasks.userId, userId)), []);
    assert.deepEqual(await tx.select().from(schema.operatorRuns).where(eq(schema.operatorRuns.userId, userId)), []);
    const rows = await tx.select().from(schema.notes).where(eq(schema.notes.userId, userId));
    assert.equal(rows.length, 1);
    assert.equal(rows[0].archivedAt, null);
  });
});

dbTest("a night without an injected model enforces the owner guard before a paid request", async () => {
  const previousOwner = process.env.AI_OWNER_USER_ID;
  const previousFetch = globalThis.fetch;
  let attemptedProviderRequests = 0;
  try {
    process.env.AI_OWNER_USER_ID = `different-owner-${randomUUID()}`;
    globalThis.fetch = async () => {
      attemptedProviderRequests += 1;
      throw new Error("A test must never make a paid provider request");
    };
    await fixture(async ({ tx, userId, now }) => {
      await assert.rejects(
        runOperatorForUser({ database: tx, userId, kind: "night", now }),
        (error) => error.name === "AiGuardError" && error.status === 403,
      );
      assert.deepEqual(await tx.select().from(schema.tasks).where(eq(schema.tasks.userId, userId)), []);
      assert.deepEqual(await tx.select().from(schema.operatorRuns).where(eq(schema.operatorRuns.userId, userId)), []);
      const [dump] = await tx.select().from(schema.notes).where(eq(schema.notes.userId, userId));
      assert.equal(dump.archivedAt, null);
    });
    assert.equal(attemptedProviderRequests, 0);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousOwner === undefined) delete process.env.AI_OWNER_USER_ID;
    else process.env.AI_OWNER_USER_ID = previousOwner;
  }
});
