import { ConfirmDelete } from "@/components/confirm-delete";
import { PendingSubmit } from "@/components/notes/pending-submit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createJobAction,
  deleteJobAction,
  updateJobAction,
} from "@/lib/actions/jobs";
import { formatDateOnly } from "@/lib/date";
import { listJobs, type JobStatus } from "@/lib/db/queries/jobs";
import { withDb } from "@/lib/db/safe";
import { requireUserId } from "@/lib/session";

const STATUSES: Array<{ value: JobStatus | "all"; label: string }> = [
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

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const userId = await requireUserId();
  const { q = "", status = "all" } = await searchParams;
  const filter = STATUSES.some((item) => item.value === status)
    ? (status as JobStatus | "all")
    : "all";
  const jobs = await withDb([], () =>
    listJobs(userId, { query: q, status: filter }),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Jobs</h1>
        <p className="mt-1 text-muted-foreground">Application tracker.</p>
      </div>
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
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
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
              <form action={updateJobAction.bind(null, job.id)} className="grid gap-2 sm:grid-cols-2">
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
                  className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
                >
                  {STATUSES.filter((item) => item.value !== "all").map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <select
                  name="campus"
                  defaultValue={job.campus}
                  className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
                >
                  <option value="oncampus">On campus</option>
                  <option value="offcampus">Off campus</option>
                </select>
                <PendingSubmit label="Save" size="sm" />
              </form>
              <ConfirmDelete
                label={`${job.company} ${job.position}`}
                action={deleteJobAction.bind(null, job.id)}
              />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Add application</CardTitle>
        </CardHeader>
        <CardContent>
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
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
              >
                {STATUSES.filter((item) => item.value !== "all").map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <select
                name="campus"
                defaultValue="oncampus"
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
              >
                <option value="oncampus">On campus</option>
                <option value="offcampus">Off campus</option>
              </select>
            </div>
            <PendingSubmit label="Add" pendingLabel="Adding…" />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
