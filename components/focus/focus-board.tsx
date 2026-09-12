"use client";

import Image from "next/image";

import { ConfirmDelete } from "@/components/confirm-delete";
import { TooBig } from "@/components/focus/too-big";
import { PendingSubmit } from "@/components/notes/pending-submit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspaceState } from "@/components/workspace/workspace-state";
import {
  createTaskAction,
  deleteTaskAction,
  toggleTaskAction,
} from "@/lib/actions/tasks";
import { SOUND_PRESETS } from "@/lib/focus/presets";
import { AMBIENT_TRACKS } from "@/lib/focus/tracks";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/db/schema";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** Parse a minutes field; fall back to the current value on empty/invalid input. */
function minutesField(raw: FormDataEntryValue | null, currentSeconds: number) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return currentSeconds / 60;
  return Math.max(1, Math.min(90, Math.round(parsed)));
}

export function FocusBoard({ tasks }: { tasks: Task[] }) {
  const {
    mode,
    remaining,
    isPaused,
    togglePause,
    setMode,
    durations,
    applyDurations,
    tracks,
    toggleTrack,
    setTrackVolume,
    applyPreset,
    visualTick,
    setVisualTick,
    minutePulse,
  } = useWorkspaceState();

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const total = mode === "short" ? durations.short : mode === "long" ? durations.long : durations.pomodoro;
  const pct = total ? (remaining / total) * 100 : 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={mode === "pomodoro" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("pomodoro")}
          >
            Pomodoro
          </Button>
          <Button
            variant={mode === "short" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("short")}
          >
            Short break
          </Button>
          <Button
            variant={mode === "long" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("long")}
          >
            Long break
          </Button>
        </div>
        <div
          className={cn(
            "mx-auto flex size-56 items-center justify-center rounded-full border-8 border-theme-forest-green transition-transform",
            visualTick && minutePulse ? "scale-105" : "",
          )}
          style={{
            background: `conic-gradient(var(--theme-orange) ${pct}%, transparent 0)`,
          }}
        >
          <div className="flex size-44 items-center justify-center rounded-full bg-theme-ecru-white text-4xl font-semibold">
            {pad(minutes)}:{pad(seconds)}
          </div>
        </div>
        <div className="flex justify-center">
          <Button variant="accent" onClick={togglePause}>
            {isPaused ? "Start" : "Pause"}
          </Button>
        </div>
        <details className="rounded-xl border border-border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium">Timer settings</summary>
          <form
            className="mt-4 grid grid-cols-3 gap-2 text-sm"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              applyDurations({
                pomodoro: minutesField(data.get("pomodoro"), durations.pomodoro) * 60,
                short: minutesField(data.get("short"), durations.short) * 60,
                long: minutesField(data.get("long"), durations.long) * 60,
              });
            }}
          >
            <label>
              Focus
              <Input name="pomodoro" type="number" min={1} defaultValue={durations.pomodoro / 60} />
            </label>
            <label>
              Short
              <Input name="short" type="number" min={1} defaultValue={durations.short / 60} />
            </label>
            <label>
              Long
              <Input name="long" type="number" min={1} defaultValue={durations.long / 60} />
            </label>
            <Button type="submit" variant="outline" className="col-span-3">
              Apply times
            </Button>
          </form>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={visualTick}
              onChange={(event) => setVisualTick(event.currentTarget.checked)}
            />
            Minute pulse (no extra sound)
          </label>
        </details>
      </section>
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Tasks</h2>
          <form action={createTaskAction} className="mt-2 flex gap-2">
            <Input name="text" placeholder="Add a task" required />
            <PendingSubmit label="Add" pendingLabel="Adding…" />
          </form>
          <ul className="mt-3 space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="flex flex-wrap items-center gap-2 text-sm">
                <form action={toggleTaskAction.bind(null, task.id)}>
                  <Button type="submit" size="xs">
                    {task.completed ? "Undo" : "Done"}
                  </Button>
                </form>
                <span className={task.completed ? "text-muted-foreground line-through" : ""}>
                  {task.text}
                </span>
                {task.completed ? null : <TooBig id={task.id} text={task.text} />}
                <ConfirmDelete
                  label={task.text}
                  action={deleteTaskAction.bind(null, task.id)}
                />
              </li>
            ))}
          </ul>
        </div>
        <details className="rounded-xl border border-border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium">Ambient</summary>
          <p className="mt-3 text-sm text-muted-foreground">
            Add mp3s to public/audio/ to enable mixers. Last mix is remembered.
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {SOUND_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                type="button"
                size="xs"
                variant="outline"
                onClick={() => applyPreset(preset.id)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {AMBIENT_TRACKS.map((track) => {
              const state = tracks[track.id];
              return (
                <div
                  key={track.id}
                  className="rounded-xl border border-border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Image src={track.icon} alt="" width={36} height={36} />
                    <div>
                      <p className="text-sm font-medium">{track.label}</p>
                      <Button
                        size="xs"
                        variant="outline"
                        disabled={state.failed}
                        onClick={() => toggleTrack(track.id)}
                      >
                        {state.playing ? "Pause" : "Play"}
                      </Button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={state.volume}
                    disabled={state.failed}
                    onChange={(event) =>
                      setTrackVolume(track.id, Number(event.currentTarget.value))
                    }
                    className="mt-2 w-full"
                  />
                </div>
              );
            })}
          </div>
        </details>
      </section>
    </div>
  );
}
