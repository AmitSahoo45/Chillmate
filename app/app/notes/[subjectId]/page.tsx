import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfirmDelete } from "@/components/confirm-delete";
import { BulkMove } from "@/components/notes/bulk-move";
import { MoveNoteForm } from "@/components/notes/move-note-form";
import { PendingSubmit } from "@/components/notes/pending-submit";
import { PinForm } from "@/components/pin-form";
import { QuickDump } from "@/components/notes/quick-dump";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  archiveNoteAction,
  createNoteAction,
  deleteNoteAction,
  pinNoteAction,
} from "@/lib/actions/notes";
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
  searchParams: Promise<{ q?: string; archived?: string }>;
}) {
  const userId = await requireUserId();
  const { subjectId } = await params;
  const { q = "", archived: archivedParam } = await searchParams;
  const archived = archivedParam === "1";
  if (!isUuid(subjectId)) notFound();
  const [subject, notes, subjects] = await Promise.all([
    withDb<Subject | null>(null, () => getSubject(userId, subjectId)),
    withDb<Note[]>([], () => listNotes(userId, subjectId, q, archived)),
    withDb<Subject[]>([], () => listSubjects(userId)),
  ]);
  if (!subject) notFound();
  const showBulk =
    isInboxName(subject.name) &&
    !archived &&
    notes.length >= 2 &&
    subjects.length >= 2;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/app/notes" className="text-sm underline">
          All subjects
        </Link>
        <div className="mt-2">
          <PageHeader
            title={subject.name}
            description={
              isInboxName(subject.name)
                ? "Unsorted dumps. Move them when you feel like it."
                : subject.description || "No description yet."
            }
          />
        </div>
      </div>
      {archived ? null : (
        <QuickDump subjectId={subjectId} autoFocus={!q && notes.length === 0} />
      )}
      <div className="flex flex-wrap items-center gap-3">
        <form className="max-w-sm">
          <Input name="q" placeholder="Search notes" defaultValue={q} />
          {archived ? <input type="hidden" name="archived" value="1" /> : null}
        </form>
        <Link
          href={archived ? `/app/notes/${subjectId}` : `/app/notes/${subjectId}?archived=1`}
          className="text-sm text-muted-foreground underline"
        >
          {archived ? "Active notes" : "Archived"}
        </Link>
      </div>
      {showBulk ? (
        <BulkMove notes={notes} subjects={subjects} currentSubjectId={subjectId} />
      ) : null}
      {notes.length === 0 ? (
        <p className="text-muted-foreground">
          {q.trim()
            ? "No notes match."
            : archived
              ? "Nothing archived."
              : "Nothing here yet. Dump above."}
        </p>
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
                  {showBulk || archived ? null : (
                    <MoveNoteForm
                      noteId={note.id}
                      currentSubjectId={subjectId}
                      subjects={subjects}
                      compact
                    />
                  )}
                  <div className="flex flex-wrap gap-2">
                    <PinForm
                      pinned={Boolean(note.pinnedAt)}
                      action={pinNoteAction.bind(null, note.id)}
                    />
                    <form action={archiveNoteAction.bind(null, note.id)}>
                      <PendingSubmit
                        label={archived ? "Unarchive" : "Done"}
                        pendingLabel="Saving…"
                        variant="outline"
                        size="xs"
                      />
                    </form>
                    <ConfirmDelete
                      label={note.title}
                      action={deleteNoteAction.bind(null, note.id)}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <details className="max-w-lg rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer text-sm font-medium">New note</summary>
        <form action={createNoteAction.bind(null, subjectId)} className="mt-4 space-y-3">
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
      </details>
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
