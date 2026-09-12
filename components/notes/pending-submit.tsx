"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function PendingSubmit({
  label,
  pendingLabel = "Saving…",
  variant = "accent",
  size = "default",
}: {
  label: string;
  pendingLabel?: string;
  variant?: "default" | "accent" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "xs";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
