import { PendingSubmit } from "@/components/notes/pending-submit";
import { Textarea } from "@/components/ui/textarea";
import { dumpNoteAction } from "@/lib/actions/notes";

export function QuickDump({
  subjectId,
  autoFocus = false,
  compact = false,
}: {
  subjectId?: string;
  autoFocus?: boolean;
  compact?: boolean;
}) {
  return (
    <form
      action={dumpNoteAction}
      className="space-y-3 rounded-xl border border-border bg-card p-4"
    >
      {subjectId ? (
        <input type="hidden" name="subjectId" value={subjectId} />
      ) : null}
      <Textarea
        name="bodyMarkdown"
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder="Don't organize yet. Dump the thought."
        className={compact ? "min-h-[5rem] text-base" : "min-h-[8rem] text-base leading-relaxed"}
      />
      <PendingSubmit label="Get it out" />
    </form>
  );
}
