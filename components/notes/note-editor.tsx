"use client";

import { useEffect, useRef, useState } from "react";

import { MarkdownPreview } from "@/components/markdown-preview";
import { PendingSubmit } from "@/components/notes/pending-submit";
import { WriteSprint } from "@/components/notes/write-sprint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatTags } from "@/lib/tags";

type NoteDefaults = {
  title: string;
  description: string;
  tags: string[];
  bodyMarkdown: string;
};

const TEMPLATES: Array<{ label: string; body: string }> = [
  {
    label: "Brain dump",
    body: "# Brain dump\n\n- \n- \n- \n\n## Worth keeping\n\n",
  },
  {
    label: "Interview",
    body: "# Interview postmortem\n\n**Role:** \n**Went well:** \n**Went wrong:** \n**Fix next time:** \n",
  },
  {
    label: "Job follow-up",
    body: "# Job follow-up\n\n**Company:** \n**Last touch:** \n**Next:** \n",
  },
  {
    label: "On my mind",
    body: "# What's on my mind\n\n- \n",
  },
];

const ZEN_KEY = "chillmate:zen";
const GOAL_KEY = "chillmate:word-goal";
const DEFAULT_GOAL = 200;

function snapshotOf(values: {
  title: string;
  description: string;
  tags: string;
  body: string;
}) {
  return JSON.stringify(values);
}

function countWords(text: string) {
  if (text.trim() === "") return 0;
  return text.trim().split(/\s+/).length;
}

function readStored(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage full/unavailable — editing still works.
  }
}

function removeStored(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function looksLikeDraft(raw: string) {
  try {
    const parsed = JSON.parse(raw) as { title?: unknown; body?: unknown };
    return typeof parsed.title === "string" || typeof parsed.body === "string";
  } catch {
    return false;
  }
}

function parseDraft(raw: string) {
  try {
    const parsed = JSON.parse(raw) as {
      title?: unknown;
      description?: unknown;
      tags?: unknown;
      body?: unknown;
    };
    return {
      title: typeof parsed.title === "string" ? parsed.title : undefined,
      description:
        typeof parsed.description === "string" ? parsed.description : undefined,
      tags: typeof parsed.tags === "string" ? parsed.tags : undefined,
      body: typeof parsed.body === "string" ? parsed.body : undefined,
    };
  } catch {
    return {};
  }
}

export function NoteEditor({
  action,
  defaults,
  submitLabel,
  ownerKey,
  draftKey,
  savedKey,
}: {
  action: (formData: FormData) => Promise<void>;
  defaults?: NoteDefaults;
  submitLabel: string;
  /** Current user id — scopes the localStorage draft per user. */
  ownerKey: string;
  /** Stable id for the draft slot (the note id). */
  draftKey: string;
  /** Changes whenever the server-saved note changes (e.g. updatedAt). */
  savedKey: string;
}) {
  const initial = {
    title: defaults?.title ?? "",
    description: defaults?.description ?? "",
    tags: defaults ? formatTags(defaults.tags) : "",
    body: defaults?.bodyMarkdown ?? "",
  };
  const storageKey = `chillmate:draft:${ownerKey}:${draftKey}`;

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [tags, setTags] = useState(initial.tags);
  const [body, setBody] = useState(initial.body);
  const [zen, setZen] = useState(() => readStored(ZEN_KEY) === "1");
  const [goal, setGoal] = useState(() => {
    const stored = Number(readStored(GOAL_KEY));
    return Number.isFinite(stored) && stored > 0
      ? Math.min(5000, Math.round(stored))
      : DEFAULT_GOAL;
  });
  const [baseline, setBaseline] = useState(() =>
    snapshotOf({ title: initial.title, description: initial.description, tags: initial.tags, body: initial.body }),
  );
  const [pendingDraft, setPendingDraft] = useState<string | null>(() => {
    const raw = readStored(storageKey);
    if (!raw) return null;
    if (
      raw ===
      snapshotOf({ title: initial.title, description: initial.description, tags: initial.tags, body: initial.body })
    ) {
      return null;
    }
    return looksLikeDraft(raw) ? raw : null;
  });
  const [draftTime, setDraftTime] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Server saved (savedKey changed) → re-baseline to what is on screen.
  // Storage cleanup happens in the reconciling effect below.
  const [prevSavedKey, setPrevSavedKey] = useState(savedKey);
  if (prevSavedKey !== savedKey) {
    setPrevSavedKey(savedKey);
    setBaseline(snapshotOf({ title, description, tags, body }));
    setPendingDraft(null);
    setDraftTime(null);
  }

  // Reconcile localStorage with the baseline (debounced), and flush on
  // page hide so a sudden navigation never loses the last keystrokes.
  useEffect(() => {
    const snapshot = snapshotOf({ title, description, tags, body });
    const flush = (current: string) => {
      if (current === baseline) {
        removeStored(storageKey);
        setDraftTime(null);
      } else {
        writeStored(storageKey, current);
        setDraftTime(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
      }
    };
    const onBeforeUnload = () => flush(snapshot);
    window.addEventListener("beforeunload", onBeforeUnload);
    const timer = window.setTimeout(() => flush(snapshot), 800);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.clearTimeout(timer);
    };
  }, [title, description, tags, body, baseline, storageKey]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "s") {
        return;
      }
      event.preventDefault();
      formRef.current?.requestSubmit();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const dirty =
    snapshotOf({ title, description, tags, body }) !== baseline;
  const words = countWords(body);
  const progress = Math.min(100, Math.round((words / goal) * 100));

  function discardDraft() {
    setPendingDraft(null);
    setDraftTime(null);
    removeStored(storageKey);
  }

  function toggleZen() {
    setZen((prev) => {
      writeStored(ZEN_KEY, prev ? "0" : "1");
      return !prev;
    });
  }

  function changeGoal(raw: string) {
    const parsed = Math.round(Number(raw));
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const safe = Math.min(5000, parsed);
    setGoal(safe);
    writeStored(GOAL_KEY, String(safe));
  }

  function insertTemplate(template: string) {
    const el = document.getElementById("bodyMarkdown") as HTMLTextAreaElement | null;
    if (!el) {
      setBody((prev) => (prev ? `${prev}\n\n${template}` : template));
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + template + el.value.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + template.length, start + template.length);
    });
  }

  async function handleSubmit(formData: FormData) {
    // The server re-baselines via savedKey on success; drop the draft now so
    // a redirect (or stale tab) never resurrects pre-save text. If validation
    // fails, the fields keep their values and typing re-saves the draft.
    removeStored(storageKey);
    await action(formData);
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      {pendingDraft ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm">
          <span>Unsaved draft from an earlier visit found.</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              const draft = parseDraft(pendingDraft);
              if (draft.title !== undefined) setTitle(draft.title);
              if (draft.description !== undefined) setDescription(draft.description);
              if (draft.tags !== undefined) setTags(draft.tags);
              if (draft.body !== undefined) setBody(draft.body);
              setPendingDraft(null);
            }}
          >
            Restore draft
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={discardDraft}>
            Discard
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Button type="button" size="sm" variant="outline" onClick={toggleZen}>
          {zen ? "Exit zen" : "Zen mode"}
        </Button>
        <WriteSprint ownerKey={ownerKey} />
        <span className="text-muted-foreground" aria-live="polite">
          {words} word{words === 1 ? "" : "s"}
          {words >= goal ? " — goal reached" : ""}
        </span>
        {!zen ? (
          <label className="ml-auto flex items-center gap-1 text-muted-foreground">
            Goal
            <Input
              type="number"
              min={1}
              max={5000}
              value={goal}
              onChange={(event) => changeGoal(event.currentTarget.value)}
              className="h-7 w-20"
            />
          </label>
        ) : null}
      </div>
      {!zen ? (
        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full bg-theme-orange" style={{ width: `${progress}%` }} />
        </div>
      ) : null}

      <div className={zen ? "mx-auto w-full max-w-2xl space-y-4" : "space-y-4"}>
        <Input
          id="title"
          name="title"
          value={title}
          aria-label="Title"
          placeholder="Title (optional)"
          onChange={(event) => setTitle(event.currentTarget.value)}
        />
        {zen ? (
          <>
            <input type="hidden" name="description" value={description} />
            <input type="hidden" name="tags" value={tags} />
          </>
        ) : null}
      </div>

      <div className={zen ? "mx-auto w-full max-w-2xl" : "grid gap-4 lg:grid-cols-2"}>
        <div className="space-y-1">
          <Label htmlFor="bodyMarkdown">Write</Label>
          <Textarea
            id="bodyMarkdown"
            name="bodyMarkdown"
            value={body}
            autoFocus
            placeholder="Don't organize yet. Get the thought out."
            onChange={(event) => setBody(event.currentTarget.value)}
            className={zen ? "min-h-[70svh] text-lg leading-relaxed" : "min-h-[22rem]"}
          />
        </div>
        {!zen ? (
          <div className="space-y-1">
            <Label>Preview</Label>
            <div className="min-h-[22rem] rounded-lg border border-border p-3">
              <MarkdownPreview markdown={body} />
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <PendingSubmit label={submitLabel} />
        <span className="text-sm text-muted-foreground" aria-live="polite">
          {dirty
            ? "Unsaved — Ctrl+S"
            : draftTime
              ? `Draft kept ${draftTime}`
              : ""}
        </span>
      </div>
      {zen ? null : (
        <details className="rounded-xl border border-border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium">Details</summary>
          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="description">
                Description <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="description"
                name="description"
                value={description}
                onChange={(event) => setDescription(event.currentTarget.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                name="tags"
                value={tags}
                onChange={(event) => setTags(event.currentTarget.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Start from:</span>
              {TEMPLATES.map((template) => (
                <Button
                  key={template.label}
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => insertTemplate(template.body)}
                >
                  {template.label}
                </Button>
              ))}
            </div>
          </div>
        </details>
      )}
    </form>
  );
}
