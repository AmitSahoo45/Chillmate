"use client";

import { useState } from "react";

import { PendingSubmit } from "@/components/notes/pending-submit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { splitTaskAction } from "@/lib/actions/tasks";

export function TooBig({ id, text }: { id: string; text: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button type="button" size="xs" variant="ghost" onClick={() => setOpen(true)}>
        Too big
      </Button>
    );
  }
  return (
    <form
      action={splitTaskAction.bind(null, id)}
      className="flex w-full min-w-0 basis-full flex-col gap-1"
    >
      <Input name="first" defaultValue={`${text} — 1`} required />
      <Input name="second" defaultValue={`${text} — 2`} required />
      <div className="flex gap-1">
        <PendingSubmit label="Split" pendingLabel="Splitting…" size="xs" />
        <Button type="button" size="xs" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
