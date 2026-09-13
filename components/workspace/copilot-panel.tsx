"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useMemo, useState } from "react";
import { DefaultChatTransport, type UIMessage } from "ai";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useWorkspaceState } from "@/components/workspace/workspace-state";
import { confirmDeleteAction, type DeletableType } from "@/lib/actions/delete";
import { confirmMoveAction } from "@/lib/actions/notes";
import type { CopilotMessage } from "@/lib/db/schema";
import type { AmbientTrackId } from "@/lib/focus/tracks";
import { CHAT_USER_TEXT_MAX, POMODORO_MAX, POMODORO_MIN } from "@/lib/limits";

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
    <CopilotChat
      geminiReady={geminiReady}
      initialMessages={initialMessages}
      onClose={() => onOpenChange(false)}
    />
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
  onClose,
}: {
  geminiReady: boolean;
  initialMessages: CopilotMessage[];
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [dismissedDeleteId, setDismissedDeleteId] = useState<string | null>(null);
  const [dismissedMoveKey, setDismissedMoveKey] = useState<string | null>(null);
  const [timerProposal, setTimerProposal] = useState<number | null>(null);
  const { setPomodoroMinutes, toggleTrack, tracks } = useWorkspaceState();
  const seed = useMemo(() => toUiMessages(initialMessages), [initialMessages]);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages: pending }) => ({
          body: {
            message: pending[pending.length - 1],
          },
        }),
      }),
    [],
  );
  const { messages, sendMessage, status } = useChat({
    messages: seed,
    transport,
    onToolCall: ({ toolCall }) => {
      if (toolCall.toolName === "setPomodoroMinutes") {
        const minutes = Number(
          (toolCall.input as { minutes?: number }).minutes ?? 25,
        );
        if (!Number.isFinite(minutes)) return;
        setTimerProposal(
          Math.max(POMODORO_MIN, Math.min(POMODORO_MAX, Math.round(minutes))),
        );
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

  const moveProposal = useMemo(() => {
    for (const message of messages) {
      for (const part of message.parts) {
        if (part.type === "tool-proposeMove" && "output" in part && part.output) {
          const output = part.output as {
            noteId?: string;
            subjectId?: string;
            noteLabel?: string;
            subjectName?: string;
            error?: string;
          };
          if (!output.noteId || !output.subjectId || output.error) continue;
          const key = `${output.noteId}:${output.subjectId}`;
          if (key !== dismissedMoveKey) {
            return { ...output, key } as {
              noteId: string;
              subjectId: string;
              noteLabel: string;
              subjectName: string;
              key: string;
            };
          }
        }
      }
    }
    return null;
  }, [messages, dismissedMoveKey]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Copilot</p>
          <p className="text-xs text-muted-foreground">⌘K / Ctrl+K</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
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
            Ask to dump, triage Inbox, quiz a mistake, or pick 15 minutes.
            Copilot sends your notes, tasks, and jobs to Gemini to answer.
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
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(event) =>
              setInput(event.currentTarget.value.slice(0, CHAT_USER_TEXT_MAX))
            }
            maxLength={CHAT_USER_TEXT_MAX}
            placeholder={geminiReady ? "Ask Chillmate…" : "Gemini key missing"}
            disabled={!geminiReady || status === "streaming"}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!geminiReady || status === "streaming" || !input.trim()}
          >
            Send
          </Button>
        </div>
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
              {proposal ? (
                <span className="mt-2 block font-mono text-xs">
                  {proposal.type}:{proposal.id}
                </span>
              ) : null}
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
      <AlertDialog
        open={!!moveProposal}
        onOpenChange={(next) => {
          if (!next && moveProposal) setDismissedMoveKey(moveProposal.key);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Move {moveProposal?.noteLabel} to {moveProposal?.subjectName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Copilot cannot move notes on its own. Confirm to file this note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!moveProposal) return;
                await confirmMoveAction(moveProposal.noteId, moveProposal.subjectId);
                setDismissedMoveKey(moveProposal.key);
              }}
            >
              Move
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={timerProposal !== null}
        onOpenChange={(next) => {
          if (!next) setTimerProposal(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Copilot wants to set {timerProposal}m
            </AlertDialogTitle>
            <AlertDialogDescription>
              Confirm to change the Focus timer. Copilot cannot change it on its
              own.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (timerProposal === null) return;
                setPomodoroMinutes(timerProposal);
                setTimerProposal(null);
              }}
            >
              Set timer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
