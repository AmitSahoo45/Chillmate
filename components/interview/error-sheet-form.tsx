import { PendingSubmit } from "@/components/notes/pending-submit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatTags } from "@/lib/tags";
import { cn, SELECT_CLASS } from "@/lib/utils";

type SheetDefaults = {
  probName: string;
  probLink: string;
  mistake: string;
  improvement: string;
  revisionPriority: "high" | "medium" | "low";
  beforeInterviewLookup: "yes" | "no" | "maybe";
  tags: string[];
  isMistakeCorrected: boolean;
};

function ExtraFields({ defaults }: { defaults?: SheetDefaults }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="improvement">Improvement</Label>
        <Textarea
          id="improvement"
          name="improvement"
          defaultValue={defaults?.improvement ?? ""}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="revisionPriority">Priority</Label>
          <select
            id="revisionPriority"
            name="revisionPriority"
            defaultValue={defaults?.revisionPriority ?? "high"}
            className={cn(SELECT_CLASS, "w-full")}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="beforeInterviewLookup">Before interview</Label>
          <select
            id="beforeInterviewLookup"
            name="beforeInterviewLookup"
            defaultValue={defaults?.beforeInterviewLookup ?? "yes"}
            className={cn(SELECT_CLASS, "w-full")}
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
            <option value="maybe">Maybe</option>
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          name="tags"
          defaultValue={defaults ? formatTags(defaults.tags) : ""}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isMistakeCorrected"
          defaultChecked={defaults?.isMistakeCorrected ?? false}
        />
        Corrected
      </label>
    </div>
  );
}

export function ErrorSheetForm({
  action,
  defaults,
  submitLabel,
  collapseExtras = false,
}: {
  action: (formData: FormData) => Promise<void>;
  defaults?: SheetDefaults;
  submitLabel: string;
  collapseExtras?: boolean;
}) {
  return (
    <form action={action} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="probName">Problem</Label>
        <Input
          id="probName"
          name="probName"
          required
          defaultValue={defaults?.probName ?? ""}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="probLink">
          Link <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="probLink"
          name="probLink"
          type="url"
          defaultValue={defaults?.probLink ?? ""}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="mistake">Mistake</Label>
        <Textarea
          id="mistake"
          name="mistake"
          required
          defaultValue={defaults?.mistake ?? ""}
        />
      </div>
      {collapseExtras ? (
        <details className="rounded-lg border border-border p-3">
          <summary className="cursor-pointer text-sm font-medium">More</summary>
          <div className="mt-3">
            <ExtraFields defaults={defaults} />
          </div>
        </details>
      ) : (
        <ExtraFields defaults={defaults} />
      )}
      <PendingSubmit label={submitLabel} />
    </form>
  );
}
