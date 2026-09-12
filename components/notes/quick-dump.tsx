"use client";

import { useState } from "react";

import { PendingSubmit } from "@/components/notes/pending-submit";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { dumpNoteAction, dumpTaskAction } from "@/lib/actions/notes";
import { isInboxName } from "@/lib/notes/title";
import { cn, SELECT_CLASS } from "@/lib/utils";

const DUMP_TEMPLATES: Array<{ label: string; body: string }> = [
  { label: "Brain dump", body: "- \n- \n- \n" },
  {
    label: "Interview",
    body: "**Role:** \n**Went well:** \n**Went wrong:** \n**Fix next time:** \n",
  },
  {
    label: "Job follow-up",
    body: "**Company:** \n**Last touch:** \n**Next:** \n",
  },
  { label: "On my mind", body: "- \n" },
];

export function QuickDump({
  subjectId,
  subjects = [],
  autoFocus = false,
  compact = false,
  hero = false,
  templates = true,
}: {
  subjectId?: string;
  subjects?: Array<{ id: string; name: string }>;
  autoFocus?: boolean;
  compact?: boolean;
  hero?: boolean;
  templates?: boolean;
}) {
  const [body, setBody] = useState("");
  const inbox = subjects.find((subject) => isInboxName(subject.name));
  const ordered = [
    ...subjects.filter((subject) => isInboxName(subject.name)),
    ...subjects.filter((subject) => !isInboxName(subject.name)),
  ];

  return (
    <form
      action={dumpNoteAction}
      className={cn(
        "space-y-3 rounded-xl border border-border bg-card p-4",
        hero && "border-l-4 border-l-theme-orange",
      )}
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
            className={cn(SELECT_CLASS, "w-full max-w-sm")}
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
      {templates ? (
        <div className="flex flex-wrap gap-1">
          {DUMP_TEMPLATES.map((template) => (
            <Button
              key={template.label}
              type="button"
              size="xs"
              variant="outline"
              onClick={() =>
                setBody((prev) =>
                  prev.trim() ? `${prev.trimEnd()}\n\n${template.body}` : template.body,
                )
              }
            >
              {template.label}
            </Button>
          ))}
        </div>
      ) : null}
      <Textarea
        name="bodyMarkdown"
        value={body}
        onChange={(event) => setBody(event.currentTarget.value)}
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder="Don't organize yet. Dump the thought."
        className={
          compact ? "min-h-[5rem] text-base" : "min-h-[8rem] text-base leading-relaxed"
        }
      />
      <div className="flex flex-wrap gap-2">
        <PendingSubmit label="Get it out" />
        <PendingSubmit
          label="Make a task"
          pendingLabel="Adding…"
          variant="outline"
          formAction={dumpTaskAction}
        />
      </div>
    </form>
  );
}
