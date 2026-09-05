import Link from "next/link";

import { ConfirmDelete } from "@/components/confirm-delete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createErrorSheetAction,
  deleteErrorSheetAction,
} from "@/lib/actions/error-sheets";
import {
  listErrorSheets,
  type BeforeInterviewFilter,
} from "@/lib/db/queries/error-sheets";
import { withDb } from "@/lib/db/safe";
import { requireUserId } from "@/lib/session";

const LOOKUPS: Array<{ value: BeforeInterviewFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "maybe", label: "Maybe" },
];

export default async function InterviewPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; lookup?: string }>;
}) {
  const userId = await requireUserId();
  const { q = "", lookup = "all" } = await searchParams;
  const filter = LOOKUPS.some((item) => item.value === lookup)
    ? (lookup as BeforeInterviewFilter)
    : "all";
  const sheets = await withDb([], () =>
    listErrorSheets(userId, { query: q, lookup: filter }),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Interview</h1>
        <p className="mt-1 text-muted-foreground">Error sheets for revision.</p>
      </div>
      <form className="flex flex-wrap gap-2">
        <Input name="q" placeholder="Search name or tags" defaultValue={q} className="max-w-xs" />
        <select
          name="lookup"
          defaultValue={filter}
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
        >
          {LOOKUPS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sheets.map((sheet) => (
          <Card key={sheet.id}>
            <CardHeader>
              <CardTitle>
                <Link href={`/app/interview/${sheet.id}`} className="hover:underline">
                  {sheet.probName}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary">{sheet.revisionPriority}</Badge>
                <Badge variant="outline">{sheet.beforeInterviewLookup}</Badge>
              </div>
              <ConfirmDelete
                label={sheet.probName}
                action={deleteErrorSheetAction.bind(null, sheet.id)}
              />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>New sheet</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createErrorSheetAction} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="probName">Problem</Label>
              <Input id="probName" name="probName" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="probLink">Link</Label>
              <Input id="probLink" name="probLink" type="url" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mistake">Mistake</Label>
              <Textarea id="mistake" name="mistake" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="improvement">Improvement</Label>
              <Textarea id="improvement" name="improvement" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="revisionPriority">Priority</Label>
                <select
                  id="revisionPriority"
                  name="revisionPriority"
                  defaultValue="high"
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
                  defaultValue="yes"
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
              <Input id="tags" name="tags" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isMistakeCorrected" />
              Corrected
            </label>
            <Button type="submit">Create</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
