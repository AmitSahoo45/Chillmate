"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

const OPTIONS = [5, 10, 15];
const MAX_LOG = 8;

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function sprintKey(ownerKey: string) {
  return `chillmate:sprints:${ownerKey}`;
}

function readLog(ownerKey: string): number[] {
  try {
    const raw = window.localStorage.getItem(sprintKey(ownerKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is number => typeof item === "number").slice(0, MAX_LOG);
  } catch {
    return [];
  }
}

function writeLog(ownerKey: string, minutes: number) {
  const next = [minutes, ...readLog(ownerKey)].slice(0, MAX_LOG);
  try {
    window.localStorage.setItem(sprintKey(ownerKey), JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function WriteSprint({ ownerKey }: { ownerKey: string }) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [done, setDone] = useState(false);
  const [log, setLog] = useState<number[]>(() =>
    typeof window === "undefined" ? [] : readLog(ownerKey),
  );
  const runningRef = useRef(false);
  const minutesRef = useRef(0);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (runningRef.current) {
        runningRef.current = false;
        setDone(true);
        setLog(writeLog(ownerKey, minutesRef.current));
        const audio = new Audio("/assets/audio/bell-ring.mp3");
        void audio.play().catch(() => {});
      }
      return;
    }
    runningRef.current = true;
    const id = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(id);
  }, [ownerKey, secondsLeft]);

  if (secondsLeft > 0) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="tabular-nums" aria-live="polite">
          {formatClock(secondsLeft)} left
        </span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            runningRef.current = false;
            setSecondsLeft(0);
            setDone(false);
          }}
        >
          Stop
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">
        {done ? "Sprint done." : "Sprint"}
      </span>
      {OPTIONS.map((minutes) => (
        <Button
          key={minutes}
          type="button"
          size="xs"
          variant="outline"
          onClick={() => {
            setDone(false);
            minutesRef.current = minutes;
            setSecondsLeft(minutes * 60);
          }}
        >
          {minutes}m
        </Button>
      ))}
      {log.length > 0 ? (
        <span className="text-muted-foreground">Last: {log.map((item) => `${item}m`).join(" · ")}</span>
      ) : null}
    </div>
  );
}
