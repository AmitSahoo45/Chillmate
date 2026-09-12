"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function PendingSubmit({
  label,
  pendingLabel = "Saving…",
  variant = "accent",
  size = "default",
  formAction,
}: {
  label: string;
  pendingLabel?: string;
  variant?: "default" | "accent" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "xs";
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      disabled={pending}
      formAction={formAction}
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}
