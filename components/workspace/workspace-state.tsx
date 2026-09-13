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

import {
  getAmbientAudio,
  isAmbientPlaying,
  pauseAllAmbient,
  pauseAmbient,
  resumePlayingAmbient,
  setAmbientFailHandler,
  setAmbientVolume,
} from "@/lib/focus/ambient-player";
import { SOUND_PRESETS } from "@/lib/focus/presets";
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

function defaultTimer() {
  return {
    mode: "pomodoro" as Mode,
    remaining: 25 * 60,
    isPaused: true,
    period: 1,
    durations: defaultDurations(),
  };
}

function loadTimer() {
  const fallback = defaultTimer();
  if (typeof window === "undefined") return fallback;
  const saved = readJson(TIMER_KEY) as {
    mode?: Mode;
    remaining?: number;
    isPaused?: boolean;
    period?: number;
    durations?: WorkspaceStateValue["durations"];
    savedAt?: number;
    endsAt?: number | null;
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
  if (!paused) {
    const endsAt =
      typeof saved?.endsAt === "number"
        ? saved.endsAt
        : typeof saved?.savedAt === "number"
          ? saved.savedAt + baseRemaining * 1000
          : null;
    if (endsAt) {
      const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
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
  }
  return { mode, remaining: baseRemaining, isPaused: true, period, durations };
}

function loadTracks() {
  if (typeof window === "undefined") return initialTracks;
  const mix = readJson(MIX_KEY) as Record<string, { volume?: number }> | null;
  const next = { ...initialTracks };
  for (const track of AMBIENT_TRACKS) {
    const item = mix?.[track.id];
    next[track.id] = {
      failed: false,
      volume:
        item && typeof item.volume === "number" ? item.volume : next[track.id].volume,
      playing: isAmbientPlaying(track.id),
    };
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
  const [mode, setModeState] = useState<Mode>("pomodoro");
  const [isPaused, setIsPaused] = useState(true);
  const [period, setPeriod] = useState(1);
  const [durations, setDurations] = useState(defaultDurations);
  const [remaining, setRemaining] = useState(25 * 60);
  const [tracks, setTracks] = useState(() => ({ ...initialTracks }));
  const [visualTick, setVisualTickState] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [minutePulse, setMinutePulse] = useState(false);
  const hydratedRef = useRef(false);
  const tracksRef = useRef(tracks);
  const periodRef = useRef(period);
  const remainingRef = useRef(remaining);
  const modeRef = useRef(mode);
  const durationsRef = useRef(durations);
  const isPausedRef = useRef(isPaused);
  const endsAtRef = useRef<number | null>(null);

  useEffect(() => {
    remainingRef.current = remaining;
    modeRef.current = mode;
    durationsRef.current = durations;
    isPausedRef.current = isPaused;
    periodRef.current = period;
    tracksRef.current = tracks;
  }, [remaining, mode, durations, isPaused, period, tracks]);

  /* eslint-disable react-hooks/set-state-in-effect -- localStorage after SSR */
  useEffect(() => {
    const t = loadTimer();
    setModeState(t.mode);
    setIsPaused(t.isPaused);
    setPeriod(t.period);
    setDurations(t.durations);
    setRemaining(t.remaining);
    remainingRef.current = t.remaining;
    modeRef.current = t.mode;
    durationsRef.current = t.durations;
    isPausedRef.current = t.isPaused;
    periodRef.current = t.period;
    setTracks(loadTracks());
    try {
      setVisualTickState(window.localStorage.getItem(TICK_KEY) === "1");
    } catch {
      setVisualTickState(false);
    }
    hydratedRef.current = true;
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    writeJson(TIMER_KEY, {
      mode,
      remaining: remainingRef.current,
      isPaused,
      period,
      durations,
      endsAt: isPaused ? null : (endsAtRef.current ?? Date.now() + remainingRef.current * 1000),
      savedAt: Date.now(),
    });
  }, [mode, isPaused, period, durations, hydrated]);

  useEffect(() => {
    const flush = () => {
      if (!hydratedRef.current) return;
      writeJson(TIMER_KEY, {
        mode: modeRef.current,
        remaining: remainingRef.current,
        isPaused: isPausedRef.current,
        period: periodRef.current,
        durations: durationsRef.current,
        endsAt: isPausedRef.current
          ? null
          : (endsAtRef.current ?? Date.now() + remainingRef.current * 1000),
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
    if (!hydrated) return;
    writeJson(
      MIX_KEY,
      Object.fromEntries(
        AMBIENT_TRACKS.map((track) => [
          track.id,
          { volume: tracks[track.id].volume, playing: tracks[track.id].playing },
        ]),
      ),
    );
  }, [tracks, hydrated]);

  useEffect(() => {
    setAmbientFailHandler((id) => {
      setTracks((prev) => ({
        ...prev,
        [id]: { ...prev[id], failed: true, playing: false },
      }));
    });
    const resume = () => {
      if (document.visibilityState !== "visible") return;
      const current = tracksRef.current;
      resumePlayingAmbient(
        Object.fromEntries(
          AMBIENT_TRACKS.filter((track) => current[track.id].playing && !current[track.id].failed).map(
            (track) => [track.id, { volume: current[track.id].volume }],
          ),
        ),
      );
    };
    document.addEventListener("visibilitychange", resume);
    return () => {
      setAmbientFailHandler(null);
      document.removeEventListener("visibilitychange", resume);
    };
  }, []);

  const setMode = useCallback(
    (next: Mode) => {
      setModeState(next);
      const nextRemaining = durationFor(next, durations);
      remainingRef.current = nextRemaining;
      setRemaining(nextRemaining);
      endsAtRef.current = null;
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
      endsAtRef.current = null;
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
    endsAtRef.current = null;
    setIsPaused(true);
  }, []);

  useEffect(() => {
    if (isPaused) {
      endsAtRef.current = null;
      return;
    }
    if (endsAtRef.current == null) {
      endsAtRef.current = Date.now() + remainingRef.current * 1000;
    }
    const tick = () => {
      const endsAt = endsAtRef.current;
      if (endsAt == null) return;
      const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      if (left > 0) {
        if (left !== remainingRef.current) {
          if (left % 60 === 0 && remainingRef.current > left) {
            setMinutePulse(true);
            window.setTimeout(() => setMinutePulse(false), 400);
          }
          remainingRef.current = left;
          setRemaining(left);
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
      endsAtRef.current = Date.now() + nextRemaining * 1000;
    };
    tick();
    const timer = window.setInterval(tick, 250);
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [isPaused]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      if (prev) {
        endsAtRef.current = Date.now() + remainingRef.current * 1000;
      } else {
        const left = endsAtRef.current
          ? Math.max(0, Math.round((endsAtRef.current - Date.now()) / 1000))
          : remainingRef.current;
        remainingRef.current = left;
        setRemaining(left);
        endsAtRef.current = null;
      }
      return !prev;
    });
  }, []);

  const setVisualTick = useCallback((on: boolean) => {
    setVisualTickState(on);
    try {
      window.localStorage.setItem(TICK_KEY, on ? "1" : "0");
    } catch {
      // ignore
    }
  }, []);

  const toggleTrack = useCallback(
    (id: AmbientTrackId) => {
      const current = tracks[id];
      if (current.playing) {
        pauseAmbient(id);
        setTracks((prev) => ({
          ...prev,
          [id]: { ...prev[id], playing: false },
        }));
        return;
      }
      const audio = getAmbientAudio(id, current.volume);
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
    [tracks],
  );

  const setTrackVolume = useCallback((id: AmbientTrackId, volume: number) => {
    setAmbientVolume(id, volume);
    setTracks((prev) => ({
      ...prev,
      [id]: { ...prev[id], volume },
    }));
  }, []);

  const pauseAllAudio = useCallback(() => {
    pauseAllAmbient();
    setTracks((prev) => {
      const next = { ...prev };
      for (const track of AMBIENT_TRACKS) {
        next[track.id] = { ...next[track.id], playing: false };
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
            failed: volume !== undefined ? false : next[track.id].failed,
            playing: volume !== undefined,
          };
        }
        return next;
      });
      for (const item of preset.tracks) {
        const audio = getAmbientAudio(item.id, item.volume);
        void audio.play().catch(() => {
          setTracks((now) => ({
            ...now,
            [item.id]: { ...now[item.id], failed: true, playing: false },
          }));
        });
      }
    },
    [pauseAllAudio],
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
