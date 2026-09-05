"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

const OPTIONS = [5, 10, 15];

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function WriteSprint() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [done, setDone] = useState(false);
  const runningRef = useRef(false);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (runningRef.current) {
        runningRef.current = false;
        setDone(true);
        const audio = new Audio("/assets/audio/bell-ring.mp3");
        void audio.play().catch(() => {});
      }
      return;
    }
    runningRef.current = true;
    const id = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(id);
  }, [secondsLeft]);

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
            setSecondsLeft(minutes * 60);
          }}
        >
          {minutes}m
        </Button>
      ))}
    </div>
  );
}
