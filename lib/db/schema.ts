import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ],
);

export const revisionPriorityEnum = pgEnum("revision_priority", [
  "high",
  "medium",
  "low",
]);

export const beforeInterviewLookupEnum = pgEnum("before_interview_lookup", [
  "yes",
  "no",
  "maybe",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "wishlist",
  "applied",
  "review",
  "interview",
  "offer",
  "rejected",
]);

export const campusEnum = pgEnum("campus", ["oncampus", "offcampus"]);

const timestamps = {
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const subjects = pgTable(
  "subjects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'`),
    ...timestamps,
  },
  (t) => [index("subjects_user_id_idx").on(t.userId)],
);

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    bodyMarkdown: text("body_markdown").notNull().default(""),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'`),
    ...timestamps,
  },
  (t) => [
    index("notes_user_id_idx").on(t.userId),
    index("notes_subject_id_idx").on(t.subjectId),
  ],
);

export const errorSheets = pgTable(
  "error_sheets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    probName: text("prob_name").notNull(),
    probLink: text("prob_link").notNull(),
    mistake: text("mistake").notNull(),
    improvement: text("improvement").notNull().default(""),
    isMistakeCorrected: boolean("is_mistake_corrected").notNull().default(false),
    revisionPriority: revisionPriorityEnum("revision_priority")
      .notNull()
      .default("low"),
    beforeInterviewLookup: beforeInterviewLookupEnum("before_interview_lookup")
      .notNull()
      .default("no"),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'`),
    ...timestamps,
  },
  (t) => [index("error_sheets_user_id_idx").on(t.userId)],
);

export const jobApplications = pgTable(
  "job_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    company: text("company").notNull(),
    position: text("position").notNull(),
    dateApplied: timestamp("date_applied", { mode: "date" }).notNull(),
    status: jobStatusEnum("status").notNull(),
    campus: campusEnum("campus").notNull().default("oncampus"),
    ...timestamps,
  },
  (t) => [index("job_applications_user_id_idx").on(t.userId)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    completed: boolean("completed").notNull().default(false),
    ...timestamps,
  },
  (t) => [index("tasks_user_id_idx").on(t.userId)],
);

export const copilotThreads = pgTable(
  "copilot_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [
    unique("copilot_threads_user_id_unique").on(t.userId),
    index("copilot_threads_user_id_idx").on(t.userId),
  ],
);

export const copilotMessages = pgTable(
  "copilot_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => copilotThreads.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("copilot_messages_thread_id_idx").on(t.threadId)],
);

export type Subject = typeof subjects.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type ErrorSheet = typeof errorSheets.$inferSelect;
export type JobApplication = typeof jobApplications.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type CopilotMessage = typeof copilotMessages.$inferSelect;
