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

import { SOUND_PRESETS } from "@/lib/focus/presets";
import {
  AMBIENT_TRACKS,
  getAmbientTrackSrc,
  type AmbientTrackId,
} from "@/lib/focus/tracks";

type Mode = "pomodoro" | "short" | "long";

type TrackState = {
  failed: boolean;
  playing: boolean;
  volume: number;
};

type WorkspaceStateValue = {
  copilotOpen: boolean;
  setCopilotOpen: (open: boolean) => void;
  dumpOpen: boolean;
  setDumpOpen: (open: boolean) => void;
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
  applyPreset: (id: string) => void;
  visualTick: boolean;
  setVisualTick: (on: boolean) => void;
  minutePulse: boolean;
};

const WorkspaceStateContext = createContext<WorkspaceStateValue | null>(null);

const BELL = "/assets/audio/bell-ring.mp3";
const TIMER_KEY = "chillmate:focus-timer";
const MIX_KEY = "chillmate:ambient-mix";
const TICK_KEY = "chillmate:visual-tick";

function durationFor(mode: Mode, durations: WorkspaceStateValue["durations"]) {
  if (mode === "short") return durations.short;
  if (mode === "long") return durations.long;
  return durations.pomodoro;
}

function clampSeconds(value: number) {
  if (!Number.isFinite(value)) return 25 * 60;
  return Math.max(60, Math.min(90 * 60, Math.round(value)));
}

function readJson(key: string) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

const initialTracks = Object.fromEntries(
  AMBIENT_TRACKS.map((track) => [
    track.id,
    { failed: false, playing: false, volume: 70 },
  ]),
) as Record<AmbientTrackId, TrackState>;

function defaultDurations() {
  return { pomodoro: 25 * 60, short: 5 * 60, long: 15 * 60 };
}

function loadTimer() {
  const fallback = {
    mode: "pomodoro" as Mode,
    remaining: 25 * 60,
    isPaused: true,
    period: 1,
    durations: defaultDurations(),
  };
  if (typeof window === "undefined") return fallback;
  const saved = readJson(TIMER_KEY) as {
    mode?: Mode;
    remaining?: number;
    isPaused?: boolean;
    period?: number;
    durations?: WorkspaceStateValue["durations"];
    savedAt?: number;
  } | null;
  const durations = saved?.durations
    ? {
        pomodoro: clampSeconds(saved.durations.pomodoro),
        short: clampSeconds(saved.durations.short),
        long: clampSeconds(saved.durations.long),
      }
    : fallback.durations;
  const mode =
    saved?.mode === "pomodoro" || saved?.mode === "short" || saved?.mode === "long"
      ? saved.mode
      : fallback.mode;
  const period = typeof saved?.period === "number" ? saved.period : 1;
  const baseRemaining =
    typeof saved?.remaining === "number"
      ? saved.remaining
      : durationFor(mode, durations);
  const paused = saved?.isPaused !== false;
  if (!paused && typeof saved?.savedAt === "number") {
    const left = baseRemaining - Math.floor((Date.now() - saved.savedAt) / 1000);
    if (left > 0) {
      return { mode, remaining: left, isPaused: false, period, durations };
    }
    return {
      mode,
      remaining: durationFor(mode, durations),
      isPaused: true,
      period,
      durations,
    };
  }
  return { mode, remaining: baseRemaining, isPaused: true, period, durations };
}

function loadTracks() {
  if (typeof window === "undefined") return initialTracks;
  const mix = readJson(MIX_KEY) as Record<string, { volume?: number }> | null;
  if (!mix) return initialTracks;
  const next = { ...initialTracks };
  for (const track of AMBIENT_TRACKS) {
    const item = mix[track.id];
    if (!item || typeof item.volume !== "number") continue;
    next[track.id] = { ...next[track.id], volume: item.volume };
  }
  return next;
}

export function WorkspaceStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [dumpOpen, setDumpOpen] = useState(false);
  const [mode, setModeState] = useState<Mode>(() => loadTimer().mode);
  const [isPaused, setIsPaused] = useState(() => loadTimer().isPaused);
  const [period, setPeriod] = useState(() => loadTimer().period);
  const [durations, setDurations] = useState(() => loadTimer().durations);
  const [remaining, setRemaining] = useState(() => loadTimer().remaining);
  const [tracks, setTracks] = useState(loadTracks);
  const [visualTick, setVisualTickState] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem(TICK_KEY) === "1",
  );
  const [minutePulse, setMinutePulse] = useState(false);
  const audioRefs = useRef<Partial<Record<AmbientTrackId, HTMLAudioElement>>>({});
  const periodRef = useRef(period);
  const remainingRef = useRef(remaining);
  const modeRef = useRef(mode);
  const durationsRef = useRef(durations);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    remainingRef.current = remaining;
    modeRef.current = mode;
    durationsRef.current = durations;
    isPausedRef.current = isPaused;
    periodRef.current = period;
  }, [remaining, mode, durations, isPaused, period]);

  useEffect(() => {
    writeJson(TIMER_KEY, {
      mode,
      remaining: remainingRef.current,
      isPaused,
      period,
      durations,
      savedAt: Date.now(),
    });
  }, [mode, isPaused, period, durations]);

  useEffect(() => {
    const flush = () => {
      writeJson(TIMER_KEY, {
        mode: modeRef.current,
        remaining: remainingRef.current,
        isPaused: isPausedRef.current,
        period: periodRef.current,
        durations: durationsRef.current,
        savedAt: Date.now(),
      });
    };
    const onHidden = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, []);

  useEffect(() => {
    writeJson(
      MIX_KEY,
      Object.fromEntries(
        AMBIENT_TRACKS.map((track) => [
          track.id,
          { volume: tracks[track.id].volume, playing: tracks[track.id].playing },
        ]),
      ),
    );
  }, [tracks]);

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
        if (remainingRef.current % 60 === 0) {
          setMinutePulse(true);
          window.setTimeout(() => setMinutePulse(false), 400);
        }
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

  const setVisualTick = useCallback((on: boolean) => {
    setVisualTickState(on);
    try {
      window.localStorage.setItem(TICK_KEY, on ? "1" : "0");
    } catch {
      // ignore
    }
  }, []);

  const ensureAudio = useCallback((id: AmbientTrackId, volume: number) => {
    const existing = audioRefs.current[id];
    if (existing) {
      if (existing.error) existing.load();
      return existing;
    }
    const audio = new Audio(getAmbientTrackSrc(id));
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
        [id]: { ...prev[id], failed: false, playing: true },
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
    if (ids.length === 0) {
      setTracks((prev) => {
        const next = { ...prev };
        for (const track of AMBIENT_TRACKS) {
          next[track.id] = { ...next[track.id], playing: false };
        }
        return next;
      });
      return;
    }
    setTracks((prev) => {
      const next = { ...prev };
      for (const id of AMBIENT_TRACKS.map((track) => track.id)) {
        next[id] = { ...next[id], playing: false };
      }
      return next;
    });
  }, []);

  const applyPreset = useCallback(
    (id: string) => {
      const preset = SOUND_PRESETS.find((item) => item.id === id);
      if (!preset) return;
      pauseAllAudio();
      const wanted = new Map(preset.tracks.map((track) => [track.id, track.volume]));
      setTracks((prev) => {
        const next = { ...prev };
        for (const track of AMBIENT_TRACKS) {
          const volume = wanted.get(track.id);
          next[track.id] = {
            ...next[track.id],
            volume: volume ?? next[track.id].volume,
            playing: volume !== undefined && !next[track.id].failed,
          };
        }
        return next;
      });
      for (const item of preset.tracks) {
        const audio = ensureAudio(item.id, item.volume);
        audio.volume = item.volume / 100;
        void audio.play().catch(() => {
          setTracks((now) => ({
            ...now,
            [item.id]: { ...now[item.id], failed: true, playing: false },
          }));
        });
      }
    },
    [ensureAudio, pauseAllAudio],
  );

  const value = useMemo(
    () => ({
      copilotOpen,
      setCopilotOpen,
      dumpOpen,
      setDumpOpen,
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
      applyPreset,
      visualTick,
      setVisualTick,
      minutePulse,
    }),
    [
      copilotOpen,
      dumpOpen,
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
      applyPreset,
      visualTick,
      setVisualTick,
      minutePulse,
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
