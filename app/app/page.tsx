import Link from "next/link";

import { QuickDump } from "@/components/notes/quick-dump";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listFollowUpJobs } from "@/lib/db/queries/jobs";
import { listRecentNotes } from "@/lib/db/queries/notes";
import { listOpenTasks } from "@/lib/db/queries/tasks";
import { withDb } from "@/lib/db/safe";
import { requireUserId } from "@/lib/session";

export default async function HomePage() {
  const userId = await requireUserId();
  const [tasks, notes, jobs] = await Promise.all([
    withDb([], () => listOpenTasks(userId)),
    withDb([], () => listRecentNotes(userId)),
    withDb([], () => listFollowUpJobs(userId)),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-theme-ferrari-red uppercase">
          Home
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Workspace</h1>
      </div>
      <QuickDump compact />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Open tasks</CardTitle>
            <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/app/focus" />}>
              Focus
            </Button>
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
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent notes</CardTitle>
            <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/app/notes" />}>
              Notes
            </Button>
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
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Job follow-ups</CardTitle>
            <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/app/jobs" />}>
              Jobs
            </Button>
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
