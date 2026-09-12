import Link from "next/link";
import { notFound } from "next/navigation";

import { MoveNoteForm } from "@/components/notes/move-note-form";
import { NoteEditor } from "@/components/notes/note-editor";
import { updateNoteAction } from "@/lib/actions/notes";
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
        <MoveNoteForm
          noteId={note.id}
          currentSubjectId={subjectId}
          subjects={subjects}
        />
      </div>
      <h1 className="text-3xl font-semibold">{note.title}</h1>
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
