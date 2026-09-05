import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateErrorSheetAction } from "@/lib/actions/error-sheets";
import { getErrorSheet } from "@/lib/db/queries/error-sheets";
import type { ErrorSheet } from "@/lib/db/schema";
import { withDb } from "@/lib/db/safe";
import { requireUserId } from "@/lib/session";
import { formatTags } from "@/lib/tags";
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
      <Link href="/app/interview" className="text-sm underline">
        All sheets
      </Link>
      <h1 className="text-3xl font-semibold">Edit sheet</h1>
      <form action={updateErrorSheetAction.bind(null, sheet.id)} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="probName">Problem</Label>
          <Input id="probName" name="probName" required defaultValue={sheet.probName} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="probLink">Link</Label>
          <Input
            id="probLink"
            name="probLink"
            type="url"
            required
            defaultValue={sheet.probLink}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="mistake">Mistake</Label>
          <Textarea id="mistake" name="mistake" required defaultValue={sheet.mistake} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="improvement">Improvement</Label>
          <Textarea
            id="improvement"
            name="improvement"
            defaultValue={sheet.improvement}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="revisionPriority">Priority</Label>
            <select
              id="revisionPriority"
              name="revisionPriority"
              defaultValue={sheet.revisionPriority}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
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
              defaultValue={sheet.beforeInterviewLookup}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="maybe">Maybe</option>
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="tags">Tags</Label>
          <Input id="tags" name="tags" defaultValue={formatTags(sheet.tags)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isMistakeCorrected"
            defaultChecked={sheet.isMistakeCorrected}
          />
          Corrected
        </label>
        <Button type="submit">Save</Button>
      </form>
    </div>
  );
}
