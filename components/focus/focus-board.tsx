"use client";

import {
  Bird,
  Bug,
  CloudLightning,
  CloudRain,
  Flame,
  Flower2,
  Sunrise,
  Waves,
  type LucideIcon,
} from "lucide-react";

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
import { AMBIENT_TRACKS, type AmbientTrackId } from "@/lib/focus/tracks";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/db/schema";

const TRACK_ICONS: Record<AmbientTrackId, LucideIcon> = {
  rain: CloudRain,
  camp_fire: Flame,
  birds: Bird,
  morning_birds: Sunrise,
  birds_spring: Flower2,
  summer_insects: Bug,
  winds_and_waves: Waves,
  thunder: CloudLightning,
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** Parse a minutes field; fall back to the current value on empty/invalid input. */
function minutesField(raw: FormDataEntryValue | null, currentSeconds: number) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return currentSeconds / 60;
  return Math.max(1, Math.min(90, Math.round(parsed)));
}

export function FocusBoard({
  tasks,
  highlightTaskId,
}: {
  tasks: Task[];
  highlightTaskId?: string;
}) {
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
              <li
                key={task.id}
                className={cn(
                  "flex flex-wrap items-center gap-2 text-sm",
                  highlightTaskId === task.id &&
                    "rounded-md border border-theme-orange px-2 py-1",
                )}
              >
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
            Mix sounds and adjust their volume. Volume levels are saved on this device.
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
          <div className="mt-3 space-y-2">
            {AMBIENT_TRACKS.map((track) => {
              const state = tracks[track.id];
              const Icon = TRACK_ICONS[track.id];
              return (
                <div
                  key={track.id}
                  className="rounded-lg border border-border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className="size-4 shrink-0 text-theme-forest-green"
                      aria-hidden
                    />
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">
                      {track.label}
                    </p>
                    <Button
                      size="xs"
                      variant="outline"
                      className="shrink-0"
                      aria-label={
                        state.playing
                          ? `Pause ${track.label}`
                          : state.failed
                            ? `Retry ${track.label}`
                            : `Play ${track.label}`
                      }
                      onClick={() => toggleTrack(track.id)}
                    >
                      {state.playing ? "Pause" : state.failed ? "Retry" : "Play"}
                    </Button>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={state.volume}
                    aria-label={`${track.label} volume`}
                    onChange={(event) =>
                      setTrackVolume(track.id, Number(event.currentTarget.value))
                    }
                    className="mt-1 w-full"
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
