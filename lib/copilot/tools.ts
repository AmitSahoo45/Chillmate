import { tool } from "ai";
import { z } from "zod";

import type { CopilotDatabase } from "@/lib/db";
import { createErrorSheet, listErrorSheets } from "@/lib/db/queries/error-sheets";
import {
  createJob, listJobs, updateJobStatus, type JobStatus,
} from "@/lib/db/queries/jobs";
import {
  createNote, getNote, listAllNotes, listNotes, updateNote,
} from "@/lib/db/queries/notes";
import {
  createSubject, getSubject, listSubjects,
} from "@/lib/db/queries/subjects";
import { createTask, listTasks, toggleTask } from "@/lib/db/queries/tasks";
import { tryParseDateOnly } from "@/lib/date";
import { AMBIENT_TRACK_IDS } from "@/lib/focus/tracks";
import { FIELD, POMODORO_MAX, POMODORO_MIN, clip } from "@/lib/limits";
import { notePreview, noteTitle } from "@/lib/notes/title";
import { parseTags } from "@/lib/tags";
import { parseHttpUrl } from "@/lib/validation";

/** User-scoped chat tools. Only the three create tools accept an operator transaction. */
export function createCopilotTools(
  userId: string,
  { database }: { database?: CopilotDatabase } = {},
) {
  return {
    listSubjects: tool({
      description: "List the user's note subjects",
      inputSchema: z.object({ query: z.string().max(FIELD.query).optional() }),
      execute: async ({ query }) => {
        const rows = await listSubjects(userId, query ?? "");
        return rows.map((row) => ({
          id: row.id,
          name: row.name,
          preview: notePreview(row.description, 120),
        }));
      },
    }),
    createSubject: tool({
      description: "Create a subject",
      inputSchema: z.object({
        name: z.string().max(FIELD.name),
        description: z.string().max(FIELD.description).optional(),
        tags: z.string().max(400).optional(),
      }),
      execute: async ({ name, description, tags }) =>
        createSubject(userId, {
          name: clip(name, FIELD.name),
          description: clip(description ?? "", FIELD.description),
          tags: parseTags(tags ?? ""),
        }, database),
    }),
    listNotes: tool({
      description: "List notes, optionally in one subject",
      inputSchema: z.object({
        subjectId: z.string().uuid().optional(),
        query: z.string().max(FIELD.query).optional(),
      }),
      execute: async ({ subjectId, query }) => {
        const rows = subjectId
          ? await listNotes(userId, subjectId, query ?? "")
          : await listAllNotes(userId, query ?? "");
        return rows.map((row) => ({
          id: row.id,
          subjectId: row.subjectId,
          title: row.title,
          preview: notePreview(row.bodyMarkdown, 180),
        }));
      },
    }),
    createNote: tool({
      description: "Create a note in a subject",
      inputSchema: z.object({
        subjectId: z.string().uuid(),
        title: z.string().max(FIELD.title).optional(),
        description: z.string().max(FIELD.description).optional(),
        bodyMarkdown: z.string().max(FIELD.body).optional(),
        tags: z.string().max(400).optional(),
      }),
      execute: async (input) => {
        const bodyMarkdown = clip(input.bodyMarkdown ?? "", FIELD.body);
        const row = await createNote(userId, {
          subjectId: input.subjectId,
          title: clip(noteTitle(input.title ?? "", bodyMarkdown), FIELD.title),
          description: clip(input.description ?? "", FIELD.description),
          bodyMarkdown,
          tags: parseTags(input.tags ?? ""),
        }, database);
        return row ?? { error: "Subject not found" };
      },
    }),
    updateNote: tool({
      description: "Update a note",
      inputSchema: z.object({
        id: z.string().uuid(),
        title: z.string().max(FIELD.title).optional(),
        description: z.string().max(FIELD.description).optional(),
        bodyMarkdown: z.string().max(FIELD.body).optional(),
        tags: z.string().max(400).optional(),
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
      inputSchema: z.object({ query: z.string().max(FIELD.query).optional() }),
      execute: async ({ query }) => {
        const rows = await listErrorSheets(userId, { query });
        return rows.map((row) => ({
          id: row.id,
          probName: row.probName,
          priority: row.revisionPriority,
          corrected: row.isMistakeCorrected,
          preview: notePreview(row.mistake, 180),
        }));
      },
    }),
    createErrorSheet: tool({
      description: "Create an interview error sheet",
      inputSchema: z.object({
        probName: z.string().max(FIELD.name),
        probLink: z.string().max(FIELD.url).optional(),
        mistake: z.string().max(FIELD.mistake),
        improvement: z.string().max(FIELD.improvement).optional(),
        tags: z.string().max(400).optional(),
      }),
      execute: async (input) => {
        let probLink = "";
        try {
          probLink = parseHttpUrl(input.probLink ?? "");
        } catch {
          return { error: "probLink must be an http or https URL." };
        }
        return createErrorSheet(userId, {
          probName: clip(input.probName, FIELD.name),
          probLink,
          mistake: clip(input.mistake, FIELD.mistake),
          improvement: clip(input.improvement ?? "", FIELD.improvement),
          tags: parseTags(input.tags ?? ""),
        });
      },
    }),
    listJobs: tool({
      description: "List job applications",
      inputSchema: z.object({ query: z.string().max(FIELD.query).optional() }),
      execute: async ({ query }) => {
        const rows = await listJobs(userId, { query, status: "all" });
        return rows.map((row) => ({
          id: row.id,
          company: row.company,
          position: row.position,
          status: row.status,
        }));
      },
    }),
    createJob: tool({
      description: "Create a job application",
      inputSchema: z.object({
        company: z.string().max(FIELD.company),
        position: z.string().max(FIELD.position),
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
          company: clip(input.company, FIELD.company),
          position: clip(input.position, FIELD.position),
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
      execute: async () => {
        const rows = await listTasks(userId);
        return rows.map((row) => ({
          id: row.id,
          text: row.text,
          completed: row.completed,
        }));
      },
    }),
    createTask: tool({
      description: "Create a focus task",
      inputSchema: z.object({ text: z.string().max(FIELD.task) }),
      execute: async ({ text }) => createTask(userId, clip(text, FIELD.task), database),
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
        label: z.string().max(FIELD.title),
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
        trackId: z.enum(AMBIENT_TRACK_IDS),
        play: z.boolean(),
      }),
      execute: async (input) => input,
    }),
    setPomodoroMinutes: tool({
      description: "Set the pomodoro focus duration in minutes",
      inputSchema: z.object({
        minutes: z.number().min(POMODORO_MIN).max(POMODORO_MAX),
      }),
      execute: async (input) => input,
    }),
  };
}
