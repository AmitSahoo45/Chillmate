import type { LanguageModelV4CallOptions } from "@ai-sdk/provider";

export type AiKind = "chat" | "operator";
export type AiGroup = "owner" | "guest";
export type AiContext = { userId: string; kind: AiKind };
export type AiAccess = AiContext & { group: AiGroup };

export const AI_MODEL_ID = "claude-haiku-5-5";
export const AI_INPUT_BYTES_MAX = 64 * 1024;
export const AI_OUTPUT_TOKENS_MAX = 2048;
export const AI_INPUT_OVERHEAD_TOKENS = 8192;
export const AI_MODEL_CALL_LIMIT = { chat: 5, operator: 40 } as const;

export class AiGuardError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.name = "AiGuardError";
    this.code = code;
    this.status = status;
  }
}

export function resolveAiAccess(
  context: AiContext,
  env: { AI_OWNER_USER_ID?: string; AI_GUEST_ACCESS_ENABLED?: string },
): AiAccess {
  const owner = env.AI_OWNER_USER_ID?.trim();
  if (!owner) throw new AiGuardError("unavailable", 503, "AI access is not configured.");
  if (!context.userId || context.userId.length > 256 || !["chat", "operator"].includes(context.kind)) {
    throw new AiGuardError("forbidden", 403, "AI access is unavailable for this account.");
  }
  const group = context.userId === owner ? "owner" : "guest";
  if (group === "guest" && (context.kind === "operator" || env.AI_GUEST_ACCESS_ENABLED !== "true")) {
    throw new AiGuardError("forbidden", 403, "AI access is unavailable for this account.");
  }
  return { ...context, group };
}

export function guardPeriod(now: Date) {
  const day = new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
  return {
    day,
    month: day.slice(0, 7),
    dayStart: new Date(`${day}T00:00:00+05:30`),
  };
}

export function allowanceWindows(access: AiAccess, now: Date) {
  const { day, month } = guardPeriod(now);
  const windows = [
    { key: `global:day:${day}`, capMicros: 6_000_000 },
    { key: `global:month:${month}`, capMicros: 100_000_000 },
    { key: `${access.group}:day:${day}`, capMicros: access.group === "owner" ? 5_000_000 : 1_000_000 },
    { key: `${access.group}:month:${month}`, capMicros: access.group === "owner" ? 75_000_000 : 25_000_000 },
  ];
  if (access.group === "guest") {
    const userKey = encodeURIComponent(access.userId);
    windows.push(
      { key: `guest-user:${userKey}:day:${day}`, capMicros: 100_000 },
      { key: `guest-user:${userKey}:month:${month}`, capMicros: 1_000_000 },
    );
  }
  return windows;
}

/** Highest published Haiku 5.5 tier; USD micros, not floating-point dollars.
 * https://platform.claude.com/docs/en/models/haiku-5-5/overview
 * Input $0.50/MTok, output $2.50/MTok. Every failed call retains its allowance.
 * These application caps do not cover calls made outside this guarded app.
 */
export function reservationMicros(inputBytes: number, maxOutputTokens: number) {
  if (!Number.isSafeInteger(inputBytes) || inputBytes < 0 || inputBytes > AI_INPUT_BYTES_MAX ||
      !Number.isSafeInteger(maxOutputTokens) || maxOutputTokens < 1 || maxOutputTokens > AI_OUTPUT_TOKENS_MAX) {
    throw new AiGuardError("invalid_request", 400, "AI request exceeds its allowed size.");
  }
  return Math.ceil(((inputBytes + AI_INPUT_OVERHEAD_TOKENS) + 5 * maxOutputTokens) / 2);
}

export function prepareBoundedModelParams(params: LanguageModelV4CallOptions) {
  if (params.maxOutputTokens !== undefined &&
      (!Number.isSafeInteger(params.maxOutputTokens) || params.maxOutputTokens < 1)) {
    throw new AiGuardError("invalid_request", 400, "AI output limit is invalid.");
  }
  // Remote media, provider tools and caching can add charges absent from text size.
  for (const message of params.prompt) {
    if (message.providerOptions && Object.keys(message.providerOptions).length) {
      throw new AiGuardError("invalid_request", 400, "Unsupported model metadata.");
    }
    if (typeof message.content === "string") continue;
    for (const part of message.content) {
      if (!["text", "reasoning", "tool-call", "tool-result"].includes(part.type)) {
        throw new AiGuardError("invalid_request", 400, "Only text and workspace tools are supported.");
      }
      if (part.type === "tool-result" && !["text", "json", "error-text", "error-json", "execution-denied"].includes(part.output.type)) {
        throw new AiGuardError("invalid_request", 400, "Only text tool results are supported.");
      }
      if (part.type === "tool-result" && "providerOptions" in part.output &&
          part.output.providerOptions && Object.keys(part.output.providerOptions).length) {
        throw new AiGuardError("invalid_request", 400, "Unsupported tool result metadata.");
      }
      if (part.type === "tool-call" && part.providerExecuted) {
        throw new AiGuardError("invalid_request", 400, "Only workspace tools are supported.");
      }
      if (part.providerOptions && Object.keys(part.providerOptions).some((key) => key !== "anthropic")) {
        throw new AiGuardError("invalid_request", 400, "Unsupported model metadata.");
      }
      const options = part.providerOptions?.anthropic;
      const caller = options?.caller;
      const directCaller = ["tool-call", "tool-result"].includes(part.type) && typeof caller === "object" && caller !== null &&
        !Array.isArray(caller) && caller.type === "direct" &&
        Object.keys(caller).every((key) => key === "type" || (key === "toolId" && caller.toolId === undefined));
      if (options && Object.keys(options).some((key) =>
        !(part.type === "reasoning" && ["signature", "redactedData"].includes(key)) &&
        !(key === "caller" && directCaller))) {
        throw new AiGuardError("invalid_request", 400, "Unsupported model metadata.");
      }
    }
  }
  if (params.tools?.some((item) => item.type !== "function" ||
      (item.providerOptions && Object.keys(item.providerOptions).length))) {
    throw new AiGuardError("invalid_request", 400, "Only workspace tools are supported.");
  }
  const bounded = {
    ...params,
    maxOutputTokens: Math.min(params.maxOutputTokens ?? AI_OUTPUT_TOKENS_MAX, AI_OUTPUT_TOKENS_MAX),
    // Disallow paid server tools, cache writes, service-tier overrides or headers.
    providerOptions: params.providerOptions?.anthropic?.disableParallelToolUse === true
      ? { anthropic: { disableParallelToolUse: true } }
      : undefined,
    headers: undefined,
    temperature: undefined,
    topP: undefined,
    topK: undefined,
    reasoning: undefined,
  };
  let serialized: string;
  try { serialized = JSON.stringify(bounded); } catch {
    throw new AiGuardError("invalid_request", 400, "AI request could not be validated.");
  }
  const inputBytes = new TextEncoder().encode(serialized).length;
  if (inputBytes > AI_INPUT_BYTES_MAX) {
    throw new AiGuardError("payload_too_large", 413, "AI context is too large; start with a smaller request.");
  }
  return { params: bounded, inputBytes, maxOutputTokens: bounded.maxOutputTokens,
    reservedMicros: reservationMicros(inputBytes, bounded.maxOutputTokens) };
}
