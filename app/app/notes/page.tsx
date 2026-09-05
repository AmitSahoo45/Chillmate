import Link from "next/link";

import { ConfirmDelete } from "@/components/confirm-delete";
import { QuickDump } from "@/components/notes/quick-dump";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSubjectAction, deleteSubjectAction } from "@/lib/actions/subjects";
import { listAllNotes, listRecentNotes } from "@/lib/db/queries/notes";
import { listSubjects } from "@/lib/db/queries/subjects";
import { withDb } from "@/lib/db/safe";
import { isInboxName, notePreview } from "@/lib/notes/title";
import { requireUserId } from "@/lib/session";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const userId = await requireUserId();
  const { q = "" } = await searchParams;
  const [subjects, recent, hits, allSubjects] = await Promise.all([
    withDb([], () => listSubjects(userId, q)),
    withDb([], () => listRecentNotes(userId, 1)),
    q.trim() ? withDb([], () => listAllNotes(userId, q)) : Promise.resolve([]),
    q.trim() ? withDb([], () => listSubjects(userId)) : Promise.resolve([]),
  ]);
  const subjectName = new Map(allSubjects.map((subject) => [subject.id, subject.name]));
  const last = recent[0];
  const ordered = [
    ...subjects.filter((subject) => isInboxName(subject.name)),
    ...subjects.filter((subject) => !isInboxName(subject.name)),
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Notes</h1>
        <p className="mt-1 text-muted-foreground">
          Dump first. File it later.
        </p>
      </div>
      <QuickDump autoFocus={!q} />
      {last ? (
        <p className="text-sm">
          <Link
            href={`/app/notes/${last.subjectId}/${last.id}`}
            className="underline"
          >
            Continue {last.title}
          </Link>
        </p>
      ) : null}
      <form className="max-w-sm">
        <Input name="q" placeholder="Find a note or subject" defaultValue={q} />
      </form>
      {hits.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Matching notes</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {hits.map((note) => (
              <Card key={note.id}>
                <CardHeader>
                  <CardTitle>
                    <Link
                      href={`/app/notes/${note.subjectId}/${note.id}`}
                      className="hover:underline"
                    >
                      {note.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>{subjectName.get(note.subjectId) ?? "Subject"}</p>
                  {notePreview(note.bodyMarkdown) ? (
                    <p>{notePreview(note.bodyMarkdown)}</p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
      {ordered.length === 0 ? (
        <p className="text-muted-foreground">
          Subjects show up after you dump, or add one below.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {ordered.map((subject) => (
            <Card key={subject.id}>
              <CardHeader>
                <CardTitle>
                  <Link href={`/app/notes/${subject.id}`} className="hover:underline">
                    {subject.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {isInboxName(subject.name) ? (
                  <p className="text-muted-foreground">Unsorted dumps land here.</p>
                ) : subject.description ? (
                  <p>{subject.description}</p>
                ) : (
                  <p className="text-muted-foreground italic">No description</p>
                )}
                {subject.tags.length > 0 ? (
                  <p className="text-muted-foreground">{subject.tags.join(", ")}</p>
                ) : null}
                <ConfirmDelete
                  label={subject.name}
                  description="All notes in this subject will be deleted."
                  action={deleteSubjectAction.bind(null, subject.id)}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <details className="max-w-lg rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer text-sm font-medium">
          New subject
        </summary>
        <form action={createSubjectAction} className="mt-4 space-y-3">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required placeholder="OS, interviews…" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea id="description" name="description" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tags">
              Tags <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input id="tags" name="tags" placeholder="dsa, os" />
          </div>
          <Button type="submit">Create</Button>
        </form>
      </details>
    </div>
  );
}
