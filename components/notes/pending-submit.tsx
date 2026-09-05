"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function PendingSubmit({
  label,
  pendingLabel = "Saving…",
}: {
  label: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
