import type { AmbientTrackId } from "@/lib/focus/tracks";

export const SOUND_PRESETS: Array<{
  id: string;
  label: string;
  tracks: Array<{ id: AmbientTrackId; volume: number }>;
}> = [
  { id: "rain-soft", label: "Soft rain", tracks: [{ id: "rain", volume: 40 }] },
  {
    id: "forest",
    label: "Forest",
    tracks: [
      { id: "birds", volume: 40 },
      { id: "summer_insects", volume: 20 },
    ],
  },
  {
    id: "rain-coast",
    label: "Rain + coast",
    tracks: [
      { id: "rain", volume: 45 },
      { id: "winds_and_waves", volume: 25 },
    ],
  },
];
