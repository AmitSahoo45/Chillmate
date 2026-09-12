import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
}) {
  return (
    <div>
      {eyebrow ? (
        <p className="text-xs font-semibold tracking-[0.2em] text-theme-ferrari-red uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1
        className={
          eyebrow
            ? "mt-2 text-3xl font-semibold tracking-tight"
            : "text-3xl font-semibold tracking-tight"
        }
      >
        {title}
      </h1>
      {description ? (
        <div className="mt-1 text-sm text-muted-foreground">{description}</div>
      ) : null}
    </div>
  );
}
