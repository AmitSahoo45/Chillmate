import Link from "next/link";

import { ConfirmDelete } from "@/components/confirm-delete";
import { ErrorSheetForm } from "@/components/interview/error-sheet-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createErrorSheetAction, deleteErrorSheetAction } from "@/lib/actions/error-sheets";
import {
  listErrorSheets,
  type BeforeInterviewFilter,
  type PriorityFilter,
} from "@/lib/db/queries/error-sheets";
import { withDb } from "@/lib/db/safe";
import { requireUserId } from "@/lib/session";

const LOOKUPS: Array<{ value: BeforeInterviewFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "maybe", label: "Maybe" },
];

const PRIORITIES: Array<{ value: PriorityFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const SELECT_CLASS =
  "h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function preview(text: string, max = 120) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) return "";
  return trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed;
}

function priorityClass(priority: "high" | "medium" | "low") {
  if (priority === "high") return "border-transparent bg-theme-ferrari-red/15 text-theme-ferrari-red";
  if (priority === "medium") return "border-transparent bg-theme-orange/20 text-theme-orange";
  return "";
}

export default async function InterviewPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; lookup?: string; priority?: string }>;
}) {
  const userId = await requireUserId();
  const { q = "", lookup = "all", priority = "all" } = await searchParams;
  const lookupFilter = LOOKUPS.some((item) => item.value === lookup)
    ? (lookup as BeforeInterviewFilter)
    : "all";
  const priorityFilter = PRIORITIES.some((item) => item.value === priority)
    ? (priority as PriorityFilter)
    : "all";
  const sheets = await withDb([], () =>
    listErrorSheets(userId, {
      query: q,
      lookup: lookupFilter,
      priority: priorityFilter,
    }),
  );
  const filtered =
    Boolean(q.trim()) || lookupFilter !== "all" || priorityFilter !== "all";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Interview</h1>
        <p className="mt-1 text-muted-foreground">Error sheets for revision.</p>
      </div>
      <form className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="q">Search</Label>
          <Input
            id="q"
            name="q"
            placeholder="Name, mistake, tags"
            defaultValue={q}
            className="max-w-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lookup">Before interview</Label>
          <select
            id="lookup"
            name="lookup"
            defaultValue={lookupFilter}
            className={SELECT_CLASS}
          >
            {LOOKUPS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            name="priority"
            defaultValue={priorityFilter}
            className={SELECT_CLASS}
          >
            {PRIORITIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>
      {sheets.length === 0 ? (
        <p className="text-muted-foreground">
          {filtered
            ? "No sheets match these filters."
            : "No error sheets yet. Log a problem below."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sheets.map((sheet) => {
            const mistakePreview = preview(sheet.mistake);
            return (
              <Card key={sheet.id}>
                <CardHeader>
                  <CardTitle>
                    <Link
                      href={`/app/interview/${sheet.id}`}
                      className="hover:underline"
                    >
                      {sheet.probName}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {mistakePreview ? (
                    <p className="text-muted-foreground">{mistakePreview}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-1">
                    <Badge
                      variant="secondary"
                      className={priorityClass(sheet.revisionPriority)}
                    >
                      {sheet.revisionPriority}
                    </Badge>
                    <Badge variant="outline">{sheet.beforeInterviewLookup}</Badge>
                    {sheet.isMistakeCorrected ? (
                      <Badge variant="outline">Corrected</Badge>
                    ) : null}
                  </div>
                  {sheet.tags.length > 0 ? (
                    <p className="text-muted-foreground">{sheet.tags.join(", ")}</p>
                  ) : null}
                  {sheet.probLink ? (
                    <a
                      href={sheet.probLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block underline"
                    >
                      Open problem
                    </a>
                  ) : null}
                  <ConfirmDelete
                    label={sheet.probName}
                    action={deleteErrorSheetAction.bind(null, sheet.id)}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>New sheet</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorSheetForm
            action={createErrorSheetAction}
            submitLabel="Create"
            collapseExtras
          />
        </CardContent>
      </Card>
    </div>
  );
}
