import { PendingSubmit } from "@/components/notes/pending-submit";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { dumpNoteAction } from "@/lib/actions/notes";
import { isInboxName } from "@/lib/notes/title";

export function QuickDump({
  subjectId,
  subjects = [],
  autoFocus = false,
  compact = false,
}: {
  subjectId?: string;
  subjects?: Array<{ id: string; name: string }>;
  autoFocus?: boolean;
  compact?: boolean;
}) {
  const inbox = subjects.find((subject) => isInboxName(subject.name));
  const ordered = [
    ...subjects.filter((subject) => isInboxName(subject.name)),
    ...subjects.filter((subject) => !isInboxName(subject.name)),
  ];

  return (
    <form
      action={dumpNoteAction}
      className="space-y-3 rounded-xl border border-border bg-card p-4"
    >
      {subjectId ? (
        <input type="hidden" name="subjectId" value={subjectId} />
      ) : ordered.length > 0 ? (
        <div className="space-y-1">
          <Label htmlFor="dump-subject">Subject</Label>
          <select
            id="dump-subject"
            name="subjectId"
            defaultValue={inbox?.id ?? ""}
            className="h-8 w-full max-w-sm rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {inbox ? null : <option value="">Inbox</option>}
            {ordered.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <Textarea
        name="bodyMarkdown"
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder="Don't organize yet. Dump the thought."
        className={
          compact ? "min-h-[5rem] text-base" : "min-h-[8rem] text-base leading-relaxed"
        }
      />
      <PendingSubmit label="Get it out" />
    </form>
  );
}
