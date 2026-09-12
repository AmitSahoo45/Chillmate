import { PendingSubmit } from "@/components/notes/pending-submit";
import { Label } from "@/components/ui/label";
import { moveNoteAction } from "@/lib/actions/notes";
import { isInboxName } from "@/lib/notes/title";
import { cn, SELECT_CLASS } from "@/lib/utils";

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
        className={cn(SELECT_CLASS, "flex-1")}
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
        variant="outline"
        size={compact ? "xs" : "sm"}
      />
    </form>
  );
}
