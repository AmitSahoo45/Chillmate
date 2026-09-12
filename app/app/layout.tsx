import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { WorkspaceStateProvider } from "@/components/workspace/workspace-state";
import { listThreadMessages } from "@/lib/db/queries/copilot";
import { listSubjects } from "@/lib/db/queries/subjects";
import { withDb } from "@/lib/db/safe";
import { isGeminiConfigured } from "@/lib/env";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const [thread, dumpSubjects] = await Promise.all([
    withDb(
      { messages: [] as Awaited<ReturnType<typeof listThreadMessages>>["messages"] },
      async () => {
        const result = await listThreadMessages(session.user.id);
        return { messages: result.messages };
      },
    ),
    withDb([], () => listSubjects(session.user.id)),
  ]);

  return (
    <WorkspaceStateProvider>
      <WorkspaceShell
        user={session.user}
        geminiReady={isGeminiConfigured()}
        initialMessages={thread.messages}
        dumpSubjects={dumpSubjects}
      >
        {children}
      </WorkspaceShell>
    </WorkspaceStateProvider>
  );
}
