import { PendingSubmit } from "@/components/notes/pending-submit";
import { moveNotesAction } from "@/lib/actions/notes";
import { isInboxName } from "@/lib/notes/title";
import { cn, SELECT_CLASS } from "@/lib/utils";

export function BulkMove({
  notes,
  subjects,
  currentSubjectId,
}: {
  notes: Array<{ id: string; title: string }>;
  subjects: Array<{ id: string; name: string }>;
  currentSubjectId: string;
}) {
  if (notes.length < 2 || subjects.length < 2) return null;
  const ordered = [
    ...subjects.filter((subject) => isInboxName(subject.name)),
    ...subjects.filter((subject) => !isInboxName(subject.name)),
  ];
  const other = ordered.find((subject) => subject.id !== currentSubjectId);

  return (
    <form action={moveNotesAction} className="space-y-2 rounded-xl border border-border p-3">
      <p className="text-sm font-medium">File a few (max 10)</p>
      <div className="grid gap-1 text-sm">
        {notes.slice(0, 10).map((note) => (
          <label key={note.id} className="flex items-center gap-2">
            <input type="checkbox" name="noteId" value={note.id} />
            <span className="truncate">{note.title}</span>
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          name="subjectId"
          defaultValue={other?.id ?? currentSubjectId}
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
          size="sm"
        />
      </div>
    </form>
  );
}
