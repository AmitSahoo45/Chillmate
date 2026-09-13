import { getAmbientTrackSrc, type AmbientTrackId } from "@/lib/focus/tracks";

const nodes: Partial<Record<AmbientTrackId, HTMLAudioElement>> = {};
let onFail: ((id: AmbientTrackId) => void) | null = null;

export function setAmbientFailHandler(handler: ((id: AmbientTrackId) => void) | null) {
  onFail = handler;
}

export function getAmbientAudio(id: AmbientTrackId, volume: number) {
  const existing = nodes[id];
  if (existing) {
    if (existing.error) existing.load();
    existing.volume = volume / 100;
    return existing;
  }
  const audio = new Audio(getAmbientTrackSrc(id));
  audio.loop = true;
  audio.preload = "none";
  audio.volume = volume / 100;
  audio.addEventListener("error", () => {
    onFail?.(id);
  });
  nodes[id] = audio;
  return audio;
}

export function isAmbientPlaying(id: AmbientTrackId) {
  const audio = nodes[id];
  return Boolean(audio && !audio.paused && !audio.ended);
}

export function pauseAmbient(id: AmbientTrackId) {
  nodes[id]?.pause();
}

export function pauseAllAmbient() {
  for (const audio of Object.values(nodes)) {
    audio?.pause();
  }
}

export function setAmbientVolume(id: AmbientTrackId, volume: number) {
  const audio = nodes[id];
  if (audio) audio.volume = volume / 100;
}

export function resumePlayingAmbient(
  playing: Partial<Record<AmbientTrackId, { volume: number }>>,
) {
  for (const [id, state] of Object.entries(playing) as Array<
    [AmbientTrackId, { volume: number }]
  >) {
    if (!state) continue;
    const audio = nodes[id];
    if (!audio || !audio.paused) continue;
    audio.volume = state.volume / 100;
    void audio.play().catch(() => undefined);
  }
}
