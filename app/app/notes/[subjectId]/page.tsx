import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfirmDelete } from "@/components/confirm-delete";
import { MoveNoteForm } from "@/components/notes/move-note-form";
import { PendingSubmit } from "@/components/notes/pending-submit";
import { QuickDump } from "@/components/notes/quick-dump";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createNoteAction, deleteNoteAction } from "@/lib/actions/notes";
import { updateSubjectAction } from "@/lib/actions/subjects";
import { listNotes } from "@/lib/db/queries/notes";
import { getSubject, listSubjects } from "@/lib/db/queries/subjects";
import type { Note, Subject } from "@/lib/db/schema";
import { withDb } from "@/lib/db/safe";
import { isInboxName, notePreview } from "@/lib/notes/title";
import { requireUserId } from "@/lib/session";
import { formatTags } from "@/lib/tags";
import { isUuid } from "@/lib/uuid";

export default async function SubjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectId: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const userId = await requireUserId();
  const { subjectId } = await params;
  const { q = "" } = await searchParams;
  if (!isUuid(subjectId)) notFound();
  const [subject, notes, subjects] = await Promise.all([
    withDb<Subject | null>(null, () => getSubject(userId, subjectId)),
    withDb<Note[]>([], () => listNotes(userId, subjectId, q)),
    withDb<Subject[]>([], () => listSubjects(userId)),
  ]);
  if (!subject) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link href="/app/notes" className="text-sm underline">
          All subjects
        </Link>
        <h1 className="mt-2 text-3xl font-semibold">{subject.name}</h1>
        <p className="text-muted-foreground">
          {isInboxName(subject.name)
            ? "Unsorted dumps. Move them when you feel like it."
            : subject.description || "No description yet."}
        </p>
      </div>
      <QuickDump subjectId={subjectId} autoFocus={!q && notes.length === 0} />
      <form className="max-w-sm">
        <Input name="q" placeholder="Search notes" defaultValue={q} />
      </form>
      {notes.length === 0 ? (
        <p className="text-muted-foreground">Nothing here yet. Dump above.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {notes.map((note) => {
            const preview = notePreview(note.bodyMarkdown);
            return (
              <Card key={note.id}>
                <CardHeader>
                  <CardTitle>
                    <Link
                      href={`/app/notes/${subjectId}/${note.id}`}
                      className="hover:underline"
                    >
                      {note.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {note.description ? (
                    <p>{note.description}</p>
                  ) : preview ? (
                    <p className="text-muted-foreground">{preview}</p>
                  ) : (
                    <p className="text-muted-foreground italic">Empty</p>
                  )}
                  <MoveNoteForm
                    noteId={note.id}
                    currentSubjectId={subjectId}
                    subjects={subjects}
                    compact
                  />
                  <ConfirmDelete
                    label={note.title}
                    action={deleteNoteAction.bind(null, note.id)}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>New note</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createNoteAction.bind(null, subjectId)} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="title">
                Title <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input id="title" name="title" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">
                Description{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input id="description" name="description" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tags">
                Tags <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input id="tags" name="tags" />
            </div>
            <PendingSubmit label="Create" pendingLabel="Creating…" />
          </form>
        </CardContent>
      </Card>
      <details className="max-w-lg rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Edit subject
        </summary>
        <form action={updateSubjectAction.bind(null, subjectId)} className="mt-4 space-y-3">
          <div className="space-y-1">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" name="name" required defaultValue={subject.name} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-description">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="edit-description"
              name="description"
              defaultValue={subject.description}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-tags">
              Tags <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="edit-tags"
              name="tags"
              defaultValue={formatTags(subject.tags)}
            />
          </div>
          <PendingSubmit label="Save subject" />
        </form>
      </details>
    </div>
  );
}
