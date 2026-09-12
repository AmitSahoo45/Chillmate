import Link from "next/link";
import { notFound } from "next/navigation";

import { MoveNoteForm } from "@/components/notes/move-note-form";
import { NoteEditor } from "@/components/notes/note-editor";
import { PendingSubmit } from "@/components/notes/pending-submit";
import { PinForm } from "@/components/pin-form";
import {
  archiveNoteAction,
  pinNoteAction,
  updateNoteAction,
} from "@/lib/actions/notes";
import { getNote } from "@/lib/db/queries/notes";
import { getSubject, listSubjects } from "@/lib/db/queries/subjects";
import type { Note, Subject } from "@/lib/db/schema";
import { withDb } from "@/lib/db/safe";
import { requireUserId } from "@/lib/session";
import { isUuid } from "@/lib/uuid";

export default async function NotePage({
  params,
}: {
  params: Promise<{ subjectId: string; noteId: string }>;
}) {
  const userId = await requireUserId();
  const { subjectId, noteId } = await params;
  if (!isUuid(subjectId) || !isUuid(noteId)) notFound();
  const [subject, note, subjects] = await Promise.all([
    withDb<Subject | null>(null, () => getSubject(userId, subjectId)),
    withDb<Note | null>(null, () => getNote(userId, noteId)),
    withDb<Subject[]>([], () => listSubjects(userId)),
  ]);
  if (!subject || !note || note.subjectId !== subjectId) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/app/notes/${subjectId}`} className="text-sm underline">
          Back to {subject.name}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <MoveNoteForm
            noteId={note.id}
            currentSubjectId={subjectId}
            subjects={subjects}
          />
          <PinForm
            pinned={Boolean(note.pinnedAt)}
            action={pinNoteAction.bind(null, note.id)}
          />
          <form action={archiveNoteAction.bind(null, note.id)}>
            <PendingSubmit
              label={note.archivedAt ? "Unarchive" : "Done"}
              pendingLabel="Saving…"
              variant="outline"
              size="xs"
            />
          </form>
        </div>
      </div>
      <NoteEditor
        action={updateNoteAction.bind(null, note.id)}
        defaults={note}
        submitLabel="Save"
        ownerKey={userId}
        draftKey={note.id}
        savedKey={note.updatedAt.toISOString()}
      />
    </div>
  );
}
