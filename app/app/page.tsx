import Link from "next/link";

import { QuickDump } from "@/components/notes/quick-dump";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listPinnedErrorSheets } from "@/lib/db/queries/error-sheets";
import { listFollowUpJobs, listPinnedJobs } from "@/lib/db/queries/jobs";
import {
  inboxSummary,
  listPinnedNotes,
  listRecentNotes,
} from "@/lib/db/queries/notes";
import { listSubjects } from "@/lib/db/queries/subjects";
import { listOpenTasks } from "@/lib/db/queries/tasks";
import { withDb } from "@/lib/db/safe";
import { requireUserId } from "@/lib/session";

export default async function HomePage() {
  const userId = await requireUserId();
  const [tasks, notes, jobs, subjects, inbox, pinnedNotes, pinnedSheets, pinnedJobs] =
    await Promise.all([
      withDb([], () => listOpenTasks(userId)),
      withDb([], () => listRecentNotes(userId)),
      withDb([], () => listFollowUpJobs(userId)),
      withDb([], () => listSubjects(userId)),
      withDb({ subjectId: null as string | null, total: 0, weekCount: 0 }, () =>
        inboxSummary(userId),
      ),
      withDb([], () => listPinnedNotes(userId)),
      withDb([], () => listPinnedErrorSheets(userId)),
      withDb([], () => listPinnedJobs(userId)),
    ]);
  const last = notes[0];
  const nextTask = tasks[0];
  const nextJob = jobs[0];

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Home" title="Workspace" />
      <QuickDump hero templates={false} subjects={subjects} />
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {last ? (
          <Link
            href={`/app/notes/${last.subjectId}/${last.id}`}
            className="underline"
          >
            Continue {last.title}
          </Link>
        ) : null}
        {nextTask ? (
          <Link href="/app/focus" className="underline">
            Next: {nextTask.text}
          </Link>
        ) : (
          <span className="text-muted-foreground">No open task</span>
        )}
        {nextJob ? (
          <Link href="/app/jobs" className="underline">
            Follow-up: {nextJob.company} ({nextJob.status})
          </Link>
        ) : (
          <span className="text-muted-foreground">No job follow-up</span>
        )}
        {inbox.subjectId ? (
          <Link href={`/app/notes/${inbox.subjectId}`} className="underline">
            Inbox {inbox.total}
            {inbox.weekCount > 0 ? ` · ${inbox.weekCount} this week` : ""}
          </Link>
        ) : (
          <span className="text-muted-foreground">Inbox 0</span>
        )}
      </div>
      {pinnedNotes.length + pinnedSheets.length + pinnedJobs.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Pinned</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Notes</p>
              {pinnedNotes.map((note) => (
                <Link
                  key={note.id}
                  href={`/app/notes/${note.subjectId}/${note.id}`}
                  className="block hover:underline"
                >
                  {note.title}
                </Link>
              ))}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Interview</p>
              {pinnedSheets.map((sheet) => (
                <Link
                  key={sheet.id}
                  href={`/app/interview/${sheet.id}`}
                  className="block hover:underline"
                >
                  {sheet.probName}
                </Link>
              ))}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Jobs</p>
              {pinnedJobs.map((job) => (
                <p key={job.id}>
                  {job.company} — {job.position}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Open tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {tasks.length === 0 ? (
              <p className="text-muted-foreground">No open tasks.</p>
            ) : (
              tasks.map((task) => <p key={task.id}>{task.text}</p>)
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {notes.length === 0 ? (
              <p className="text-muted-foreground">No notes yet.</p>
            ) : (
              notes.map((note) => (
                <Link
                  key={note.id}
                  href={`/app/notes/${note.subjectId}/${note.id}`}
                  className="block hover:underline"
                >
                  {note.title}
                </Link>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Job follow-ups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {jobs.length === 0 ? (
              <p className="text-muted-foreground">Nothing in applied / review / interview.</p>
            ) : (
              jobs.map((job) => (
                <p key={job.id}>
                  {job.company} — {job.position} ({job.status})
                </p>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
