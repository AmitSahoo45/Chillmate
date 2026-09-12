import Link from "next/link";
import { notFound } from "next/navigation";

import { ErrorSheetForm } from "@/components/interview/error-sheet-form";
import { updateErrorSheetAction } from "@/lib/actions/error-sheets";
import { getErrorSheet } from "@/lib/db/queries/error-sheets";
import type { ErrorSheet } from "@/lib/db/schema";
import { withDb } from "@/lib/db/safe";
import { requireUserId } from "@/lib/session";
import { isUuid } from "@/lib/uuid";

export default async function SheetPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const userId = await requireUserId();
  const { sheetId } = await params;
  if (!isUuid(sheetId)) notFound();
  const sheet = await withDb<ErrorSheet | null>(null, () =>
    getErrorSheet(userId, sheetId),
  );
  if (!sheet) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href="/app/interview" className="underline">
          All sheets
        </Link>
        {sheet.probLink ? (
          <a
            href={sheet.probLink}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Open problem
          </a>
        ) : null}
      </div>
      <h1 className="text-3xl font-semibold">{sheet.probName}</h1>
      <ErrorSheetForm
        action={updateErrorSheetAction.bind(null, sheet.id)}
        defaults={sheet}
        submitLabel="Save"
      />
    </div>
  );
}
