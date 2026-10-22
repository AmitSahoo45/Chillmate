import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";

import { auth } from "@/auth";
import { AiGuardError, assertAiAccess, createGuardedHaikuModel, reserveAiRequest } from "@/lib/ai-guard";
import { ChatRequestError, extractUserText, hasExpectedOrigin, readBoundedJson } from "@/lib/chat/request";
import { createCopilotTools } from "@/lib/copilot/tools";
import {
  appendMessages, countRecentUserChats, listModelContext,
} from "@/lib/db/queries/copilot";
import type { CopilotMessage } from "@/lib/db/schema";
import { isAnthropicConfigured } from "@/lib/env";
import {
  CHAT_BODY_MAX, CHAT_MAX_OUTPUT_TOKENS, CHAT_MESSAGES_MAX, CHAT_RATE_PER_MIN, CHAT_USER_TEXT_MAX,
} from "@/lib/limits";
import { allowRequest } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function rowsToUi(rows: CopilotMessage[]): UIMessage[] {
  return rows.map((row) => ({
    id: row.id,
    role: row.role === "user" ? "user" : row.role === "system" ? "system" : "assistant",
    parts: [{ type: "text" as const, text: row.content }],
  }));
}

export const TOOL_TRACE_PREFIX = "[tool-activity]";

/** Compact one-line summary of tool outcomes, persisted so reloads keep the record. */
function summarizeToolResults(results: unknown) {
  if (!Array.isArray(results) || results.length === 0) return "";
  const bits: string[] = [];
  for (const item of results.slice(0, 20)) {
    if (typeof item !== "object" || item === null) continue;
    const entry = item as { toolName?: unknown; output?: unknown };
    const name =
      typeof entry.toolName === "string" ? entry.toolName : "tool";
    bits.push(`${name} → ${summarizeOutput(entry.output)}`);
  }
  return bits.join("; ").slice(0, 1000);
}

function summarizeOutput(output: unknown): string {
  if (output === null || output === undefined) return "no output";
  if (Array.isArray(output)) {
    return `${output.length} row${output.length === 1 ? "" : "s"}`;
  }
  if (typeof output === "object") {
    const record = output as Record<string, unknown>;
    if (typeof record.error === "string") return `error: ${record.error}`;
    if (typeof record.id === "string") return `id ${record.id}`;
    return "ok";
  }
  return "ok";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!hasExpectedOrigin(req)) {
    return new Response("Invalid request origin", { status: 403 });
  }
  if (!isAnthropicConfigured()) {
    return new Response("Anthropic is not configured", { status: 503 });
  }

  const userId = session.user.id;
  try {
    assertAiAccess(userId, "chat");
    const parsed = await readBoundedJson(req, CHAT_BODY_MAX);
    const userText = extractUserText(parsed, CHAT_USER_TEXT_MAX, CHAT_MESSAGES_MAX);
    // Never forward client-supplied roles, tool results, media, IDs or provider options.
    const lastUser: UIMessage = { id: crypto.randomUUID(), role: "user", parts: [{ type: "text", text: userText }] };
    if (!allowRequest(`chat:${userId}`, CHAT_RATE_PER_MIN, 60_000)) {
      return new Response("Too many requests", { status: 429 });
    }
    const recent = await countRecentUserChats(userId);
    if (recent >= CHAT_RATE_PER_MIN) {
      return new Response("Too many requests", { status: 429 });
    }
    await reserveAiRequest({ userId, kind: "chat" });

    const history = await listModelContext(userId);
    const messages = [...rowsToUi(history), lastUser];

    const result = streamText({
      model: createGuardedHaikuModel({ userId, kind: "chat" }),
      maxRetries: 0,
      abortSignal: AbortSignal.any([req.signal, AbortSignal.timeout(60_000)]),
      timeout: { totalMs: 60_000 },
      onError: () => { /* Provider payloads and workspace content must not enter logs. */ },
      maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS,
      system:
        "You are Chillmate copilot inside a private study/job workspace. Use tools to read and write the user's notes, interview sheets, jobs, and tasks. Never delete anything yourself — call proposeDelete and wait for UI confirmation. Never move notes yourself — call proposeMove and wait for UI confirmation. If the user asks to triage Inbox, list Inbox notes and proposeMove each to a fitting subject. If they ask to quiz on interview mistakes, listErrorSheets and quiz on uncorrected high-priority items one at a time. If they ask what to do for 15 minutes, use listTasks and uncorrected error sheets and pick one small action. You may call playAmbient or setPomodoroMinutes for Focus controls.",
      messages: await convertToModelMessages(messages),
      stopWhen: isStepCount(5),
      tools: createCopilotTools(userId),
      async onFinish({ text, toolResults }) {
        const trace = summarizeToolResults(toolResults);
        const items = [
          { role: "user", content: userText },
          { role: "assistant", content: text },
          ...(trace ? [{ role: "assistant", content: `${TOOL_TRACE_PREFIX} ${trace}` }] : []),
        ].filter((item) => item.content.trim() !== "");
        if (items.length === 0) return;
        await appendMessages(userId, items);
      },
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        onError: (error) => error instanceof AiGuardError ? error.message : "Copilot could not finish. Please try again later.",
      }),
    });
  } catch (error) {
    if (error instanceof AiGuardError || error instanceof ChatRequestError) {
      return new Response(error.message, { status: error.status, headers: error.status === 429 ? { "Retry-After": "60" } : undefined });
    }
    return new Response("Copilot is temporarily unavailable.", { status: 503 });
  }
}
