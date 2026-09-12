import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  tool,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { z } from "zod";

import { auth } from "@/auth";
import { appendMessages } from "@/lib/db/queries/copilot";
import {
  createErrorSheet,
  listErrorSheets,
} from "@/lib/db/queries/error-sheets";
import {
  createJob,
  listJobs,
  updateJobStatus,
  type JobStatus,
} from "@/lib/db/queries/jobs";
import {
  createNote,
  getNote,
  listAllNotes,
  listNotes,
  updateNote,
} from "@/lib/db/queries/notes";
import {
  createSubject,
  getSubject,
  listSubjects,
} from "@/lib/db/queries/subjects";
import { createTask, listTasks, toggleTask } from "@/lib/db/queries/tasks";
import { tryParseDateOnly } from "@/lib/date";
import { isGeminiConfigured } from "@/lib/env";
import { noteTitle } from "@/lib/notes/title";
import { parseTags } from "@/lib/tags";

export const dynamic = "force-dynamic";

function textFrom(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => ("text" in part ? part.text : ""))
    .join("\n");
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
  if (!isGeminiConfigured()) {
    return new Response("Gemini is not configured", { status: 503 });
  }

  const userId = session.user.id;
  const { messages }: { messages: UIMessage[] } = await req.json();
  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  const userText = lastUser ? textFrom(lastUser) : "";

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system:
      "You are Chillmate copilot inside a private study/job workspace. Use tools to read and write the user's notes, interview sheets, jobs, and tasks. Never delete anything yourself — call proposeDelete and wait for UI confirmation. Never move notes yourself — call proposeMove and wait for UI confirmation. If the user asks to triage Inbox, list Inbox notes and proposeMove each to a fitting subject. If they ask to quiz on interview mistakes, listErrorSheets and quiz on uncorrected high-priority items one at a time. If they ask what to do for 15 minutes, use listTasks and uncorrected error sheets and pick one small action. You may call playAmbient or setPomodoroMinutes for Focus controls.",
    messages: await convertToModelMessages(messages),
    stopWhen: isStepCount(5),
    tools: {
      listSubjects: tool({
        description: "List the user's note subjects",
        inputSchema: z.object({ query: z.string().optional() }),
        execute: async ({ query }) => listSubjects(userId, query ?? ""),
      }),
      createSubject: tool({
        description: "Create a subject",
        inputSchema: z.object({
          name: z.string(),
          description: z.string().optional(),
          tags: z.string().optional(),
        }),
        execute: async ({ name, description, tags }) =>
          createSubject(userId, {
            name,
            description: description ?? "",
            tags: parseTags(tags ?? ""),
          }),
      }),
      listNotes: tool({
        description: "List notes, optionally in one subject",
        inputSchema: z.object({
          subjectId: z.string().uuid().optional(),
          query: z.string().optional(),
        }),
        execute: async ({ subjectId, query }) => {
          if (subjectId) return listNotes(userId, subjectId, query ?? "");
          return listAllNotes(userId, query ?? "");
        },
      }),
      createNote: tool({
        description: "Create a note in a subject",
        inputSchema: z.object({
          subjectId: z.string().uuid(),
          title: z.string().optional(),
          description: z.string().optional(),
          bodyMarkdown: z.string().optional(),
          tags: z.string().optional(),
        }),
        execute: async (input) => {
          const bodyMarkdown = input.bodyMarkdown ?? "";
          const row = await createNote(userId, {
            subjectId: input.subjectId,
            title: noteTitle(input.title ?? "", bodyMarkdown),
            description: input.description ?? "",
            bodyMarkdown,
            tags: parseTags(input.tags ?? ""),
          });
          return row ?? { error: "Subject not found" };
        },
      }),
      updateNote: tool({
        description: "Update a note",
        inputSchema: z.object({
          id: z.string().uuid(),
          title: z.string().optional(),
          description: z.string().optional(),
          bodyMarkdown: z.string().optional(),
          tags: z.string().optional(),
        }),
        execute: async ({ id, tags, ...rest }) => {
          const parsedTags = tags === undefined ? undefined : parseTags(tags);
          if (
            rest.title === undefined &&
            rest.description === undefined &&
            rest.bodyMarkdown === undefined &&
            parsedTags === undefined
          ) {
            return { error: "Nothing to update: provide a field to change." };
          }
          return updateNote(userId, id, { ...rest, tags: parsedTags });
        },
      }),
      listErrorSheets: tool({
        description: "List interview error sheets",
        inputSchema: z.object({ query: z.string().optional() }),
        execute: async ({ query }) => listErrorSheets(userId, { query }),
      }),
      createErrorSheet: tool({
        description: "Create an interview error sheet",
        inputSchema: z.object({
          probName: z.string(),
          probLink: z.string().optional(),
          mistake: z.string(),
          improvement: z.string().optional(),
          tags: z.string().optional(),
        }),
        execute: async (input) =>
          createErrorSheet(userId, {
            probName: input.probName,
            probLink: input.probLink ?? "",
            mistake: input.mistake,
            improvement: input.improvement,
            tags: parseTags(input.tags ?? ""),
          }),
      }),
      listJobs: tool({
        description: "List job applications",
        inputSchema: z.object({ query: z.string().optional() }),
        execute: async ({ query }) => listJobs(userId, { query, status: "all" }),
      }),
      createJob: tool({
        description: "Create a job application",
        inputSchema: z.object({
          company: z.string(),
          position: z.string(),
          dateApplied: z
            .string()
            .describe("Applied date in YYYY-MM-DD format, e.g. 2026-09-04"),
          status: z.enum([
            "wishlist",
            "applied",
            "review",
            "interview",
            "offer",
            "rejected",
          ]),
          campus: z.enum(["oncampus", "offcampus"]).optional(),
        }),
        execute: async (input) => {
          const dateApplied = tryParseDateOnly(input.dateApplied);
          if (!dateApplied) {
            return {
              error:
                "dateApplied must be a valid date in YYYY-MM-DD format, e.g. 2026-09-04.",
            };
          }
          return createJob(userId, {
            company: input.company,
            position: input.position,
            dateApplied,
            status: input.status as JobStatus,
            campus: input.campus,
          });
        },
      }),
      updateJobStatus: tool({
        description: "Update a job application status",
        inputSchema: z.object({
          id: z.string().uuid(),
          status: z.enum([
            "wishlist",
            "applied",
            "review",
            "interview",
            "offer",
            "rejected",
          ]),
        }),
        execute: async ({ id, status }) =>
          updateJobStatus(userId, id, status as JobStatus),
      }),
      listTasks: tool({
        description: "List focus tasks",
        inputSchema: z.object({}),
        execute: async () => listTasks(userId),
      }),
      createTask: tool({
        description: "Create a focus task",
        inputSchema: z.object({ text: z.string() }),
        execute: async ({ text }) => createTask(userId, text),
      }),
      toggleTask: tool({
        description: "Toggle a task completed state",
        inputSchema: z.object({ id: z.string().uuid() }),
        execute: async ({ id }) => toggleTask(userId, id),
      }),
      proposeDelete: tool({
        description:
          "Propose deleting a record. Does not delete. The UI will ask the user to confirm.",
        inputSchema: z.object({
          type: z.enum(["subject", "note", "error_sheet", "job", "task"]),
          id: z.string().uuid(),
          label: z.string(),
        }),
        execute: async (input) => input,
      }),
      proposeMove: tool({
        description:
          "Propose moving a note to another subject. Does not move. The UI will ask the user to confirm.",
        inputSchema: z.object({
          noteId: z.string().uuid(),
          subjectId: z.string().uuid(),
        }),
        execute: async ({ noteId, subjectId }) => {
          const note = await getNote(userId, noteId);
          const subject = await getSubject(userId, subjectId);
          if (!note || !subject) {
            return { error: "Note or subject not found" };
          }
          return {
            noteId,
            subjectId,
            noteLabel: note.title,
            subjectName: subject.name,
          };
        },
      }),
      playAmbient: tool({
        description: "Play or pause an ambient sound on the Focus mixer",
        inputSchema: z.object({
          trackId: z.enum([
            "rain",
            "camp_fire",
            "birds",
            "city_road",
            "children_audience",
            "thunder",
            "water_waves",
            "wind",
          ]),
          play: z.boolean(),
        }),
      }),
      setPomodoroMinutes: tool({
        description: "Set the pomodoro focus duration in minutes",
        inputSchema: z.object({ minutes: z.number() }),
      }),
    },
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
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
