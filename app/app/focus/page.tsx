import { FocusBoard } from "@/components/focus/focus-board";
import { listTasks } from "@/lib/db/queries/tasks";
import { withDb } from "@/lib/db/safe";
import { requireUserId } from "@/lib/session";

export default async function FocusPage() {
  const userId = await requireUserId();
  const tasks = await withDb([], () => listTasks(userId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Focus</h1>
        <p className="mt-1 text-muted-foreground">
          Pomodoro, tasks, and nature mixers.
        </p>
      </div>
      <FocusBoard tasks={tasks} />
    </div>
  );
}
