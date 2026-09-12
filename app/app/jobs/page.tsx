import { ConfirmDelete } from "@/components/confirm-delete";
import { PendingSubmit } from "@/components/notes/pending-submit";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PinForm } from "@/components/pin-form";
import {
  createJobAction,
  deleteJobAction,
  nudgeJobAction,
  pinJobAction,
  updateJobAction,
} from "@/lib/actions/jobs";
import { formatDateOnly } from "@/lib/date";
import { listJobs, type JobStatusFilter } from "@/lib/db/queries/jobs";
import { withDb } from "@/lib/db/safe";
import { requireUserId } from "@/lib/session";
import { SELECT_CLASS } from "@/lib/utils";

const STATUSES: Array<{ value: JobStatusFilter; label: string }> = [
  { value: "open", label: "Open" },
  { value: "all", label: "All" },
  { value: "wishlist", label: "Wishlist" },
  { value: "applied", label: "Applied" },
  { value: "review", label: "Under Review" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

function dateInput(value: Date) {
  return formatDateOnly(value);
}

function AddApplicationForm() {
  return (
    <form action={createJobAction} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="company">Company</Label>
        <Input id="company" name="company" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="position">Position</Label>
        <Input id="position" name="position" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="dateApplied">Date applied</Label>
        <Input id="dateApplied" name="dateApplied" type="date" required />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select
          name="status"
          defaultValue="applied"
          className={SELECT_CLASS}
        >
          {STATUSES.filter(
            (item) => item.value !== "all" && item.value !== "open",
          ).map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          name="campus"
          defaultValue="oncampus"
          className={SELECT_CLASS}
        >
          <option value="oncampus">On campus</option>
          <option value="offcampus">Off campus</option>
        </select>
      </div>
      <PendingSubmit label="Add" pendingLabel="Adding…" />
    </form>
  );
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const userId = await requireUserId();
  const { q = "", status = "open" } = await searchParams;
  const filter = STATUSES.some((item) => item.value === status)
    ? (status as JobStatusFilter)
    : "open";
  const jobs = await withDb([], () =>
    listJobs(userId, { query: q, status: filter }),
  );
  const filtered =
    Boolean(q.trim()) || (filter !== "open" && filter !== "all");
  const emptyUnfiltered = jobs.length === 0 && !filtered;

  return (
    <div className="space-y-8">
      <PageHeader title="Jobs" description="Application tracker." />
      <form className="flex flex-wrap gap-2">
        <Input
          name="q"
          placeholder="Company or position"
          defaultValue={q}
          className="max-w-xs"
        />
        <select
          name="status"
          defaultValue={filter}
          className={SELECT_CLASS}
        >
          {STATUSES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>
      {jobs.length === 0 ? (
        <p className="text-muted-foreground">
          {filtered
            ? "No applications match."
            : filter === "open"
              ? "No open applications. Add one below."
              : "No applications yet. Add one below."}
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardHeader>
                <CardTitle>
                  {job.company} — {job.position}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-1">
                  <Badge>{job.status}</Badge>
                  <Badge variant="secondary">{job.campus}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={nudgeJobAction.bind(null, job.id)}>
                    <PendingSubmit
                      label="Nudge"
                      pendingLabel="Saving…"
                      size="sm"
                    />
                  </form>
                  <PinForm
                    pinned={Boolean(job.pinnedAt)}
                    action={pinJobAction.bind(null, job.id)}
                  />
                </div>
                <details className="rounded-lg border border-border p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    Edit
                  </summary>
                  <form
                    action={updateJobAction.bind(null, job.id)}
                    className="mt-3 grid gap-2 sm:grid-cols-2"
                  >
                    <Input name="company" defaultValue={job.company} required />
                    <Input name="position" defaultValue={job.position} required />
                    <Input
                      name="dateApplied"
                      type="date"
                      defaultValue={dateInput(job.dateApplied)}
                      required
                    />
                    <select
                      name="status"
                      defaultValue={job.status}
                      className={SELECT_CLASS}
                    >
                      {STATUSES.filter(
                        (item) => item.value !== "all" && item.value !== "open",
                      ).map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <select
                      name="campus"
                      defaultValue={job.campus}
                      className={SELECT_CLASS}
                    >
                      <option value="oncampus">On campus</option>
                      <option value="offcampus">Off campus</option>
                    </select>
                    <PendingSubmit label="Save" size="sm" />
                  </form>
                  <div className="mt-3">
                    <ConfirmDelete
                      label={`${job.company} ${job.position}`}
                      action={deleteJobAction.bind(null, job.id)}
                    />
                  </div>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {emptyUnfiltered ? (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Add application</CardTitle>
          </CardHeader>
          <CardContent>
            <AddApplicationForm />
          </CardContent>
        </Card>
      ) : (
        <details className="max-w-lg rounded-xl border border-border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium">
            Add application
          </summary>
          <div className="mt-4">
            <AddApplicationForm />
          </div>
        </details>
      )}
    </div>
  );
}
