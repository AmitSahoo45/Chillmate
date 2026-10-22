import assert from "node:assert/strict";
import test from "node:test";

const policy = await import("./policy.ts");

test("IST day switches at 18:30 UTC, including year rollover", () => {
  assert.equal(typeof policy.istDayWindow, "function");
  const before = policy.istDayWindow(new Date("2026-12-31T18:29:59.999Z"));
  assert.equal(before.day, "2026-12-31");
  assert.equal(before.start.toISOString(), "2026-12-30T18:30:00.000Z");
  assert.equal(before.end.toISOString(), "2026-12-31T18:30:00.000Z");
  const after = policy.istDayWindow(new Date("2026-12-31T18:30:00.000Z"));
  assert.equal(after.day, "2027-01-01");
  assert.equal(after.yesterday, "2026-12-31");
});

test("due dates reject calendar overflow and retain valid leap dates", () => {
  assert.equal(typeof policy.isDateOnly, "function");
  for (const date of ["2026-02-31", "2026-02-29", "2026-13-01", "tomorrow", "2026-1-2"]) {
    assert.equal(policy.isDateOnly(date), false, date);
  }
  assert.equal(policy.isDateOnly("2028-02-29"), true);
  assert.equal(policy.isDateOnly("2026-10-23"), true);
});

test("morning chooses due dates before age and produces exactly one line per task", () => {
  assert.equal(typeof policy.createMorningPlan, "function");
  const rows = [
    { id: "e", text: "No date", dueDate: null, createdAt: new Date("2020-01-01") },
    { id: "d", text: "Tomorrow", dueDate: "2026-10-24", createdAt: new Date("2026-01-01") },
    { id: "c", text: "Today newest", dueDate: "2026-10-23", createdAt: new Date("2026-10-23") },
    { id: "b", text: "Today\nolder", dueDate: "2026-10-23", createdAt: new Date("2026-10-22") },
    { id: "a", text: "Overdue\tcall", dueDate: "2026-10-22", createdAt: new Date("2026-10-23") },
  ];
  const result = policy.createMorningPlan(rows);
  assert.deepEqual(result.selected.map((task) => task.id), ["a", "b", "c"]);
  assert.equal(result.bodyMarkdown, "Overdue call\nToday older\nToday newest\nCarried over: 2");
  assert.equal(rows[0].id, "e", "sorting must not mutate the database snapshot");
});

test("morning uses age then ID for undated ties and never invents missing tasks", () => {
  assert.equal(typeof policy.createMorningPlan, "function");
  const result = policy.createMorningPlan([
    { id: "b", text: "Second", dueDate: null, createdAt: new Date("2026-10-22") },
    { id: "a", text: "First", dueDate: null, createdAt: new Date("2026-10-22") },
  ]);
  assert.equal(result.bodyMarkdown, "First\nSecond\nCarried over: 0");
  assert.equal(policy.createMorningPlan([]).bodyMarkdown, "Carried over: 0");
});

test("shared tool budget executes no more than forty concurrent operations", async () => {
  assert.equal(typeof policy.createExecutionBudget, "function");
  const budget = policy.createExecutionBudget();
  let executed = 0;
  const results = await Promise.allSettled(Array.from({ length: 45 }, () =>
    budget.execute(async () => { executed += 1; return executed; }),
  ));
  assert.equal(executed, 40);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 40);
  assert.equal(budget.used, 40);
  assert.throws(() => budget.assertHealthy(), /tool call limit/i);
});

test("a tool failure remains fatal even when the AI SDK consumes its rejection", async () => {
  assert.equal(typeof policy.createExecutionBudget, "function");
  const budget = policy.createExecutionBudget();
  await assert.rejects(budget.execute(async () => { throw new Error("write failed"); }), /write failed/);
  assert.throws(() => budget.assertHealthy(), /write failed/);
  let executed = false;
  await assert.rejects(budget.execute(async () => { executed = true; }), /write failed/);
  assert.equal(executed, false);
});

test("dumps cannot complete without real outputs or without every source being finished", () => {
  assert.equal(typeof policy.createDumpTracker, "function");
  const tracker = policy.createDumpTracker(["dump-a", "dump-b"]);
  assert.throws(() => tracker.finish("dump-a"), /output/i);
  assert.throws(() => tracker.recordOutput("other-user", { id: "task-a", kind: "task", label: "Call" }), /eligible/i);
  tracker.recordOutput("dump-a", { id: "task-a", kind: "task", label: "Call" });
  tracker.finish("dump-a");
  assert.throws(() => tracker.assertComplete(), /dump-b/);
  tracker.recordOutput("dump-b", { id: "note-b", kind: "note", label: "Reference", subjectId: "subject-b" });
  tracker.finish("dump-b");
  assert.doesNotThrow(() => tracker.assertComplete());
  assert.deepEqual(tracker.entries().map(([id, outputs]) => [id, outputs.map((output) => output.id)]), [
    ["dump-a", ["task-a"]], ["dump-b", ["note-b"]],
  ]);
});

test("one created item cannot falsely complete two different dumps", () => {
  assert.equal(typeof policy.createDumpTracker, "function");
  const tracker = policy.createDumpTracker(["dump-a", "dump-b"]);
  tracker.recordOutput("dump-a", { id: "task-a", kind: "task", label: "Call" });
  assert.throws(() => tracker.recordOutput("dump-b", { id: "task-a", kind: "task", label: "Call" }), /already/i);
});

test("operator authentication rejects missing, empty, and incorrect secrets", () => {
  assert.equal(typeof policy.isOperatorAuthorized, "function");
  assert.equal(policy.isOperatorAuthorized(null, undefined), false);
  assert.equal(policy.isOperatorAuthorized("", ""), false);
  assert.equal(policy.isOperatorAuthorized("wrong", "correct"), false);
  assert.equal(policy.isOperatorAuthorized("correct", "correct"), true);
});
