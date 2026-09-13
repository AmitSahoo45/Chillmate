import Link from "next/link";

import { ConfirmDelete } from "@/components/confirm-delete";
import { HttpLink } from "@/components/http-link";
import { ErrorSheetForm } from "@/components/interview/error-sheet-form";
import { PageHeader } from "@/components/page-header";
import { PinForm } from "@/components/pin-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createErrorSheetAction,
  deleteErrorSheetAction,
  pinErrorSheetAction,
} from "@/lib/actions/error-sheets";
import {
  listErrorSheets,
  type BeforeInterviewFilter,
  type PriorityFilter,
} from "@/lib/db/queries/error-sheets";
import { withDb } from "@/lib/db/safe";
import { requireUserId } from "@/lib/session";
import { SELECT_CLASS } from "@/lib/utils";

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

function NewSheetForm() {
  return (
    <ErrorSheetForm
      action={createErrorSheetAction}
      submitLabel="Create"
      collapseExtras
    />
  );
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
  const emptyUnfiltered = sheets.length === 0 && !filtered;

  return (
    <div className="space-y-8">
      <PageHeader title="Interview" description="Error sheets for revision." />
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
                  {mistakePreview ? (
                    <CardDescription>{mistakePreview}</CardDescription>
                  ) : null}
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
                  <div className="flex flex-wrap gap-1">
                    <Badge
                      variant="secondary"
                      className={`h-4 px-1.5 text-[10px] ${priorityClass(sheet.revisionPriority)}`}
                    >
                      {sheet.revisionPriority}
                    </Badge>
                    <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                      {sheet.beforeInterviewLookup}
                    </Badge>
                    {sheet.isMistakeCorrected ? (
                      <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                        Corrected
                      </Badge>
                    ) : null}
                  </div>
                  {sheet.tags.length > 0 ? (
                    <p className="text-muted-foreground">{sheet.tags.join(", ")}</p>
                  ) : null}
                  {sheet.probLink ? (
                    <HttpLink
                      href={sheet.probLink}
                      className="inline-block underline"
                    >
                      Open problem
                    </HttpLink>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {!sheet.isMistakeCorrected ? (
                      <Link
                        href={`/app/interview/${sheet.id}`}
                        className="text-sm underline"
                      >
                        Try again
                      </Link>
                    ) : null}
                    <PinForm
                      pinned={Boolean(sheet.pinnedAt)}
                      action={pinErrorSheetAction.bind(null, sheet.id)}
                    />
                    <ConfirmDelete
                      label={sheet.probName}
                      action={deleteErrorSheetAction.bind(null, sheet.id)}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {emptyUnfiltered ? (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>New sheet</CardTitle>
          </CardHeader>
          <CardContent>
            <NewSheetForm />
          </CardContent>
        </Card>
      ) : (
        <details className="max-w-lg rounded-xl border border-border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium">New sheet</summary>
          <div className="mt-4">
            <NewSheetForm />
          </div>
        </details>
      )}
    </div>
  );
}
