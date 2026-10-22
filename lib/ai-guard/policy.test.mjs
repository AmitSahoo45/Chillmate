import assert from "node:assert/strict";
import test from "node:test";
import { wrapLanguageModel } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { loadTs } from "./test-loader.mjs";

const policy = loadTs("lib/ai-guard/policy.ts");
const { createGuardMiddleware } = loadTs("lib/ai-guard/middleware.ts");
const owner = { userId: "owner", kind: "chat", group: "owner" };
const prompt = { prompt: [{ role: "user", content: [{ type: "text", text: "Hello" }] }] };

test("access fails closed and guests can never run the operator", () => {
  assert.throws(() => policy.resolveAiAccess(owner, {}), /not configured/);
  for (const enabled of [undefined, "false", "TRUE", "1"]) {
    assert.throws(() => policy.resolveAiAccess({ userId: "guest", kind: "chat" }, { AI_OWNER_USER_ID: "owner", AI_GUEST_ACCESS_ENABLED: enabled }), /unavailable/);
  }
  assert.equal(policy.resolveAiAccess(owner, { AI_OWNER_USER_ID: "owner" }).group, "owner");
  assert.equal(policy.resolveAiAccess({ userId: "guest", kind: "chat" }, { AI_OWNER_USER_ID: "owner", AI_GUEST_ACCESS_ENABLED: "true" }).group, "guest");
  assert.throws(() => policy.resolveAiAccess({ userId: "guest", kind: "operator" }, { AI_OWNER_USER_ID: "owner", AI_GUEST_ACCESS_ENABLED: "true" }), /unavailable/);
});

test("allowances split75/25 under100 global with per-guest daily/monthly caps and IST resets", () => {
  const before = policy.guardPeriod(new Date("2026-12-31T18:29:59.999Z"));
  const after = policy.guardPeriod(new Date("2026-12-31T18:30:00.000Z"));
  assert.equal(before.month, "2026-12");
  assert.equal(after.day, "2027-01-01");
  assert.equal(after.dayStart.toISOString(), "2026-12-31T18:30:00.000Z");
  const now = new Date("2026-10-23T00:00:00Z");
  assert.deepEqual(policy.allowanceWindows(owner, now).map((w) => w.capMicros), [6e6, 100e6, 5e6, 75e6]);
  const guest = policy.allowanceWindows({ userId: "guest:owner", kind: "chat", group: "guest" }, now);
  assert.deepEqual(guest.map((w) => w.capMicros), [6e6, 100e6, 1e6, 25e6, 100_000, 1e6]);
  assert.ok(guest[4].key.includes("guest%3Aowner"));
});

test("worst-case reservation uses byte bound plus overhead and conservative high-tier pricing", () => {
  assert.equal(policy.reservationMicros(65536, 2048), 41984);
  assert.equal(policy.reservationMicros(1, 1), 4099);
  for (const bytes of [-1, 65537, NaN, 1.1]) assert.throws(() => policy.reservationMicros(bytes, 2048));
  for (const output of [0, 2049, Infinity, 1.1]) assert.throws(() => policy.reservationMicros(20, output));
});

test("input guard counts UTF8 and tool schemas, clamps output and strips paid options", () => {
  const bounded = policy.prepareBoundedModelParams({ ...prompt, maxOutputTokens: 9000, providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } }, headers: { "x-api-key": "ignored" } });
  assert.equal(bounded.maxOutputTokens, 2048);
  assert.equal(bounded.params.headers, undefined);
  assert.equal(bounded.params.providerOptions, undefined);
  const unicode = policy.prepareBoundedModelParams({ prompt: [{ role: "system", content: "\u{1f600}" }] });
  assert.ok(unicode.inputBytes > JSON.stringify(unicode.params).length);
  assert.throws(() => policy.prepareBoundedModelParams({ ...prompt, tools: [{ type: "function", name: "large", inputSchema: { description: "x".repeat(65536) } }] }), /too large/);
  assert.throws(() => policy.prepareBoundedModelParams({ ...prompt, maxOutputTokens: 0 }), /invalid/);
});

test("remote media, provider tools, nested caching and rich tool outputs cannot evade text pricing", () => {
  const cases = [
    { prompt: [{ role: "user", content: [{ type: "file", data: new URL("https://example.com/big.pdf"), mediaType: "application/pdf" }] }] },
    { ...prompt, tools: [{ type: "provider", id: "anthropic.web_search", name: "search", args: {} }] },
    { prompt: [{ role: "system", content: "hello", providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } } }] },
    { ...prompt, tools: [{ type: "function", name: "cached", inputSchema: {}, providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } } }] },
    { prompt: [{ role: "tool", content: [{ type: "tool-result", toolCallId: "1", toolName: "x", output: { type: "content", value: [] } }] }] },
    { prompt: [{ role: "tool", content: [{ type: "tool-result", toolCallId: "1", toolName: "x", output: { type: "json", value: {}, providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } } } }] }] },
    { prompt: [{ role: "assistant", content: [{ type: "tool-call", toolCallId: "1", toolName: "x", input: {}, providerExecuted: true }] }] },
  ];
  for (const params of cases) assert.throws(() => policy.prepareBoundedModelParams(params), policy.AiGuardError);
  assert.doesNotThrow(() => policy.prepareBoundedModelParams({ prompt: [{ role: "assistant", content: [{ type: "reasoning", text: "thinking", providerOptions: { anthropic: { signature: "signed" } } }] }] }));
});

test("operator sequential tool execution survives while every paid provider option is removed", () => {
  const bounded = policy.prepareBoundedModelParams({ ...prompt, providerOptions: {
    anthropic: { disableParallelToolUse: true, cacheControl: { type: "ephemeral" }, serviceTier: "priority" },
    other: { arbitrary: true },
  } });
  assert.deepEqual(bounded.params.providerOptions, { anthropic: { disableParallelToolUse: true } });
  assert.equal(policy.prepareBoundedModelParams({ ...prompt, providerOptions: { anthropic: { disableParallelToolUse: false } } }).params.providerOptions, undefined);
});

test("provider direct-tool caller metadata is safe while code-execution callers are denied", () => {
  const callerParams = (caller) => ({ prompt: [{ role: "assistant", content: [{
    type: "tool-call", toolCallId: "tool_1", toolName: "createTask", input: { text: "Call" },
    providerOptions: { anthropic: { caller } },
  }] }] });
  assert.doesNotThrow(() => policy.prepareBoundedModelParams(callerParams({ type: "direct", toolId: undefined })));
  assert.throws(() => policy.prepareBoundedModelParams(callerParams({ type: "code_execution_20260120", toolId: "server_tool" })), /metadata/);
  assert.throws(() => policy.prepareBoundedModelParams(callerParams({ type: "direct", cacheControl: {} })), /metadata/);
  const resultParams = { prompt: [{ role: "tool", content: [{
    type: "tool-result", toolCallId: "tool_1", toolName: "createTask", output: { type: "json", value: { id: "task_1" } },
    providerOptions: { anthropic: { caller: { type: "direct" } } },
  }] }] };
  assert.doesNotThrow(() => policy.prepareBoundedModelParams(resultParams));
  resultParams.prompt[0].content[0].providerOptions.anthropic.caller.type = "code_execution_20260120";
  assert.throws(() => policy.prepareBoundedModelParams(resultParams), /metadata/);
});

function wrapped(reserve, access = owner, provider = async () => ({ ok: true })) {
  return wrapLanguageModel({
    model: { specificationVersion: "v4", provider: "test", modelId: policy.AI_MODEL_ID, supportedUrls: {}, doGenerate: provider, doStream: provider },
    middleware: createGuardMiddleware(access, () => access, reserve),
  });
}

test("both generation and stream await committed reservation before invoking provider", async () => {
  const events = [];
  const model = wrapped(async () => { await Promise.resolve(); events.push("reserved"); }, owner, async (params) => {
    events.push("provider"); assert.equal(params.maxOutputTokens, 2048); return {};
  });
  await model.doGenerate(prompt);
  await model.doStream(prompt);
  assert.deepEqual(events, ["reserved", "provider", "reserved", "provider"]);
});

test("budget/storage failures and oversized inputs never invoke the paid provider", async () => {
  let invoked = 0;
  const model = wrapped(async () => { throw new policy.AiGuardError("unavailable", 503, "unavailable"); }, owner, async () => { invoked++; });
  await assert.rejects(model.doStream(prompt), /unavailable/);
  await assert.rejects(model.doGenerate({ prompt: [{ role: "system", content: "x".repeat(65536) }] }), /too large/);
  assert.equal(invoked, 0);
});

test("concurrent calls cannot exceed5chat or40operator and failed providers retain reservations", async () => {
  for (const [kind, limit] of [["chat", 5], ["operator", 40]]) {
    let paid = 0;
    let reserved = 0;
    const model = wrapped(async () => { reserved++; }, { ...owner, kind }, async () => { paid++; throw new Error("provider failed"); });
    const results = await Promise.allSettled(Array.from({ length: limit + 5 }, () => model.doGenerate(prompt)));
    assert.equal(reserved, limit);
    assert.equal(paid, limit);
    assert.equal(results.filter((r) => r.reason?.code === "call_limit").length, 5);
  }
});

test("cancellation after reservation keeps allowance while suppressing provider call", async () => {
  const controller = new AbortController();
  let reservations = 0;
  let paid = false;
  const model = wrapped(async () => { reservations++; controller.abort(); }, owner, async () => { paid = true; });
  await assert.rejects(model.doGenerate({ ...prompt, abortSignal: controller.signal }), /cancelled/);
  assert.equal(reservations, 1);
  assert.equal(paid, false);
});

test("installed Anthropic provider sends fixed Haiku and2048 total tokens with no paid overrides", async () => {
  let reserved = false;
  let calls = 0;
  const anthropic = createAnthropic({ apiKey: "test-only-no-network", fetch: async (_url, init) => {
    calls++;
    assert.equal(reserved, true);
    const body = JSON.parse(init.body);
    assert.equal(body.model, "claude-haiku-5-5");
    assert.equal(body.max_tokens, 2048);
    assert.equal(body.tool_choice.disable_parallel_tool_use, true);
    assert.equal(body.thinking, undefined);
    assert.equal(body.service_tier, undefined);
    assert.ok(!init.body.includes("cache_control"));
    throw new Error("intercepted transport: no network request");
  } });
  const model = wrapLanguageModel({ model: anthropic(policy.AI_MODEL_ID), middleware: createGuardMiddleware(owner, () => owner, async () => { reserved = true; }) });
  await assert.rejects(model.doGenerate({ ...prompt, maxOutputTokens: 100_000, reasoning: "high",
    tools: [{ type: "function", name: "test", inputSchema: { type: "object", properties: {} } }],
    providerOptions: { anthropic: { disableParallelToolUse: true, thinking: { type: "enabled", budgetTokens: 100_000 }, serviceTier: "priority" } },
  }), /intercepted transport/);
  assert.equal(calls, 1);
});
