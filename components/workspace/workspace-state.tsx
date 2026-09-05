"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { AMBIENT_TRACKS, type AmbientTrackId } from "@/lib/focus/tracks";

type Mode = "pomodoro" | "short" | "long";

type TrackState = {
  failed: boolean;
  playing: boolean;
  volume: number;
};

type WorkspaceStateValue = {
  copilotOpen: boolean;
  setCopilotOpen: (open: boolean) => void;
  mode: Mode;
  remaining: number;
  isPaused: boolean;
  period: number;
  durations: { pomodoro: number; short: number; long: number };
  togglePause: () => void;
  setMode: (mode: Mode) => void;
  setPomodoroMinutes: (minutes: number) => void;
  applyDurations: (next: { pomodoro: number; short: number; long: number }) => void;
  tracks: Record<AmbientTrackId, TrackState>;
  toggleTrack: (id: AmbientTrackId) => void;
  setTrackVolume: (id: AmbientTrackId, volume: number) => void;
  pauseAllAudio: () => void;
};

const WorkspaceStateContext = createContext<WorkspaceStateValue | null>(null);

const BELL = "/assets/audio/bell-ring.mp3";

function durationFor(mode: Mode, durations: WorkspaceStateValue["durations"]) {
  if (mode === "short") return durations.short;
  if (mode === "long") return durations.long;
  return durations.pomodoro;
}

/** Clamp a duration in seconds to 1–90 minutes. Never NaN/zero. */
function clampSeconds(value: number) {
  if (!Number.isFinite(value)) return 25 * 60;
  return Math.max(60, Math.min(90 * 60, Math.round(value)));
}

const initialTracks = Object.fromEntries(
  AMBIENT_TRACKS.map((track) => [
    track.id,
    { failed: false, playing: false, volume: 70 },
  ]),
) as Record<AmbientTrackId, TrackState>;

export function WorkspaceStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [mode, setModeState] = useState<Mode>("pomodoro");
  const [isPaused, setIsPaused] = useState(true);
  const [period, setPeriod] = useState(1);
  const [durations, setDurations] = useState({
    pomodoro: 25 * 60,
    short: 5 * 60,
    long: 15 * 60,
  });
  const [remaining, setRemaining] = useState(25 * 60);
  const [tracks, setTracks] = useState(initialTracks);
  const audioRefs = useRef<Partial<Record<AmbientTrackId, HTMLAudioElement>>>({});
  const periodRef = useRef(1);
  const remainingRef = useRef(remaining);
  const modeRef = useRef(mode);
  const durationsRef = useRef(durations);

  useEffect(() => {
    remainingRef.current = remaining;
    modeRef.current = mode;
    durationsRef.current = durations;
  }, [remaining, mode, durations]);

  useEffect(() => {
    const nodes = audioRefs.current;
    return () => {
      for (const audio of Object.values(nodes)) {
        audio?.pause();
      }
    };
  }, []);

  const setMode = useCallback(
    (next: Mode) => {
      setModeState(next);
      const nextRemaining = durationFor(next, durations);
      remainingRef.current = nextRemaining;
      setRemaining(nextRemaining);
      setIsPaused(true);
    },
    [durations],
  );

  const applyDurations = useCallback(
    (next: { pomodoro: number; short: number; long: number }) => {
      const safe = {
        pomodoro: clampSeconds(next.pomodoro),
        short: clampSeconds(next.short),
        long: clampSeconds(next.long),
      };
      setDurations(safe);
      const nextRemaining = durationFor(mode, safe);
      remainingRef.current = nextRemaining;
      setRemaining(nextRemaining);
      setIsPaused(true);
    },
    [mode],
  );

  const setPomodoroMinutes = useCallback((minutes: number) => {
    const safe = Math.max(1, Math.min(90, Math.round(minutes)));
    const nextSeconds = safe * 60;
    setDurations((prev) => ({ ...prev, pomodoro: nextSeconds }));
    setModeState("pomodoro");
    remainingRef.current = nextSeconds;
    setRemaining(nextSeconds);
    setIsPaused(true);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      if (remainingRef.current > 1) {
        remainingRef.current -= 1;
        setRemaining(remainingRef.current);
        return;
      }
      const audio = new Audio(BELL);
      void audio.play().catch(() => undefined);
      periodRef.current += 1;
      setPeriod(periodRef.current);
      const nextMode: Mode =
        periodRef.current % 8 === 0
          ? "long"
          : modeRef.current === "pomodoro"
            ? "short"
            : "pomodoro";
      setModeState(nextMode);
      const nextRemaining = durationFor(nextMode, durationsRef.current);
      remainingRef.current = nextRemaining;
      setRemaining(nextRemaining);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isPaused]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const ensureAudio = useCallback((id: AmbientTrackId, volume: number) => {
    const existing = audioRefs.current[id];
    if (existing) return existing;
    const audio = new Audio(`/audio/${id}.mp3`);
    audio.loop = true;
    audio.preload = "none";
    audio.volume = volume / 100;
    audio.addEventListener("error", () => {
      setTracks((prev) => ({
        ...prev,
        [id]: { ...prev[id], failed: true, playing: false },
      }));
    });
    audioRefs.current[id] = audio;
    return audio;
  }, []);

  const toggleTrack = useCallback(
    (id: AmbientTrackId) => {
      const current = tracks[id];
      if (current.failed) return;
      if (current.playing) {
        audioRefs.current[id]?.pause();
        setTracks((prev) => ({
          ...prev,
          [id]: { ...prev[id], playing: false },
        }));
        return;
      }
      const audio = ensureAudio(id, current.volume);
      audio.volume = current.volume / 100;
      setTracks((prev) => ({
        ...prev,
        [id]: { ...prev[id], playing: true },
      }));
      void audio.play().catch(() => {
        setTracks((now) => ({
          ...now,
          [id]: { ...now[id], failed: true, playing: false },
        }));
      });
    },
    [ensureAudio, tracks],
  );

  const setTrackVolume = useCallback((id: AmbientTrackId, volume: number) => {
    const audio = audioRefs.current[id];
    if (audio) audio.volume = volume / 100;
    setTracks((prev) => ({
      ...prev,
      [id]: { ...prev[id], volume },
    }));
  }, []);

  const pauseAllAudio = useCallback(() => {
    const ids = Object.keys(audioRefs.current) as AmbientTrackId[];
    for (const audio of Object.values(audioRefs.current)) {
      audio?.pause();
    }
    if (ids.length === 0) return;
    setTracks((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        next[id] = { ...next[id], playing: false };
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      copilotOpen,
      setCopilotOpen,
      mode,
      remaining,
      isPaused,
      period,
      durations,
      togglePause,
      setMode,
      setPomodoroMinutes,
      applyDurations,
      tracks,
      toggleTrack,
      setTrackVolume,
      pauseAllAudio,
    }),
    [
      copilotOpen,
      mode,
      remaining,
      isPaused,
      period,
      durations,
      togglePause,
      setMode,
      setPomodoroMinutes,
      applyDurations,
      tracks,
      toggleTrack,
      setTrackVolume,
      pauseAllAudio,
    ],
  );

  return (
    <WorkspaceStateContext.Provider value={value}>
      {children}
    </WorkspaceStateContext.Provider>
  );
}

export function useWorkspaceState() {
  const value = useContext(WorkspaceStateContext);
  if (!value) {
    throw new Error("useWorkspaceState must be used within WorkspaceStateProvider");
  }
  return value;
}
