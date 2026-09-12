import { PendingSubmit } from "@/components/notes/pending-submit";
import { Label } from "@/components/ui/label";
import { moveNoteAction } from "@/lib/actions/notes";
import { isInboxName } from "@/lib/notes/title";

export function MoveNoteForm({
  noteId,
  currentSubjectId,
  subjects,
  compact = false,
}: {
  noteId: string;
  currentSubjectId: string;
  subjects: Array<{ id: string; name: string }>;
  compact?: boolean;
}) {
  if (subjects.length < 2) return null;
  const ordered = [
    ...subjects.filter((subject) => isInboxName(subject.name)),
    ...subjects.filter((subject) => !isInboxName(subject.name)),
  ];
  const selectId = `move-note-${noteId}`;

  return (
    <form
      action={moveNoteAction.bind(null, noteId)}
      className="flex min-w-0 flex-wrap items-center gap-2"
    >
      {compact ? null : (
        <Label htmlFor={selectId} className="text-sm">
          File in
        </Label>
      )}
      <select
        id={selectId}
        name="subjectId"
        defaultValue={currentSubjectId}
        aria-label="Move to subject"
        className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {ordered.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name}
          </option>
        ))}
      </select>
      <PendingSubmit
        label="Move"
        pendingLabel="Moving…"
        size={compact ? "xs" : "default"}
      />
    </form>
  );
}
