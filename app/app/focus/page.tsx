import { FocusBoard } from "@/components/focus/focus-board";
import { PageHeader } from "@/components/page-header";
import { listTasks } from "@/lib/db/queries/tasks";
import { withDb } from "@/lib/db/safe";
import { requireUserId } from "@/lib/session";

export default async function FocusPage() {
  const userId = await requireUserId();
  const tasks = await withDb([], () => listTasks(userId));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Focus"
        description="Pomodoro, tasks, and nature mixers."
      />
      <FocusBoard tasks={tasks} />
    </div>
  );
}
