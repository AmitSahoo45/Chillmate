"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useMemo, useState } from "react";
import type { UIMessage } from "ai";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useWorkspaceState } from "@/components/workspace/workspace-state";
import { confirmDeleteAction, type DeletableType } from "@/lib/actions/delete";
import type { CopilotMessage } from "@/lib/db/schema";
import type { AmbientTrackId } from "@/lib/focus/tracks";

function toUiMessages(rows: CopilotMessage[]): UIMessage[] {
  return rows.map((row) => ({
    id: row.id,
    role: row.role === "user" ? "user" : row.role === "system" ? "system" : "assistant",
    parts: [{ type: "text", text: row.content }],
  }));
}

export function CopilotPanel({
  open,
  onOpenChange,
  geminiReady,
  initialMessages,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  geminiReady: boolean;
  initialMessages: CopilotMessage[];
}) {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const sync = () => setDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const chat = (
    <CopilotChat geminiReady={geminiReady} initialMessages={initialMessages} />
  );

  return (
    <>
      {open && desktop ? (
        <aside className="hidden w-[22rem] shrink-0 flex-col border-l border-border bg-card md:flex">
          {chat}
        </aside>
      ) : null}
      <Sheet open={open && !desktop} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-sm">
          {chat}
        </SheetContent>
      </Sheet>
    </>
  );
}

function CopilotChat({
  geminiReady,
  initialMessages,
}: {
  geminiReady: boolean;
  initialMessages: CopilotMessage[];
}) {
  const [input, setInput] = useState("");
  const [dismissedDeleteId, setDismissedDeleteId] = useState<string | null>(null);
  const { setPomodoroMinutes, toggleTrack, tracks } = useWorkspaceState();
  const seed = useMemo(() => toUiMessages(initialMessages), [initialMessages]);
  const { messages, sendMessage, status } = useChat({
    messages: seed,
    onToolCall: ({ toolCall }) => {
      if (toolCall.toolName === "setPomodoroMinutes") {
        const minutes = Number(
          (toolCall.input as { minutes?: number }).minutes ?? 25,
        );
        setPomodoroMinutes(minutes);
      }
      if (toolCall.toolName === "playAmbient") {
        const payload = toolCall.input as {
          trackId: AmbientTrackId;
          play: boolean;
        };
        const current = tracks[payload.trackId];
        if (current && current.playing !== payload.play) {
          toggleTrack(payload.trackId);
        }
      }
    },
  });

  const proposal = useMemo(() => {
    for (const message of messages) {
      for (const part of message.parts) {
        if (part.type === "tool-proposeDelete" && "output" in part && part.output) {
          const output = part.output as {
            type: DeletableType;
            id: string;
            label: string;
          };
          if (output.id !== dismissedDeleteId) return output;
        }
      }
    }
    return null;
  }, [messages, dismissedDeleteId]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold">Copilot</p>
        <p className="text-xs text-muted-foreground">⌘K / Ctrl+K</p>
      </div>
      {!geminiReady ? (
        <p className="m-4 rounded-lg bg-theme-orange/20 px-3 py-2 text-sm">
          Add GOOGLE_GENERATIVE_AI_API_KEY to enable chat. The rest of the app
          still works.
        </p>
      ) : null}
      <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4 text-sm">
        {messages.length === 0 ? (
          <p className="text-muted-foreground">
            Ask for notes, jobs, tasks, or interview sheets.
          </p>
        ) : null}
        {messages.map((message) => (
          <div key={message.id}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {message.role}
            </p>
            {message.parts.map((part, index) => {
              if (part.type === "text") {
                if (part.text.startsWith("[tool-activity]")) {
                  return (
                    <p
                      key={index}
                      className="text-[11px] text-muted-foreground"
                    >
                      {part.text}
                    </p>
                  );
                }
                return (
                  <p key={index} className="whitespace-pre-wrap">
                    {part.text}
                  </p>
                );
              }
              if (part.type.startsWith("tool-")) {
                return (
                  <p key={index} className="text-xs text-muted-foreground">
                    {part.type.replace("tool-", "tool: ")}
                  </p>
                );
              }
              return null;
            })}
          </div>
        ))}
      </div>
      <form
        className="border-t border-border p-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!input.trim() || !geminiReady) return;
          void sendMessage({ text: input });
          setInput("");
        }}
      >
        <Input
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
          placeholder={geminiReady ? "Ask Chillmate…" : "Gemini key missing"}
          disabled={!geminiReady || status === "streaming"}
        />
      </form>
      <AlertDialog
        open={!!proposal}
        onOpenChange={(next) => {
          if (!next && proposal) setDismissedDeleteId(proposal.id);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {proposal?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              Copilot cannot delete on its own. Confirm to remove this from your
              workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!proposal) return;
                await confirmDeleteAction(proposal.type, proposal.id);
                setDismissedDeleteId(proposal.id);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
