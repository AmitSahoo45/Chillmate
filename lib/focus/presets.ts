import type { AmbientTrackId } from "@/lib/focus/tracks";

export const SOUND_PRESETS: Array<{
  id: string;
  label: string;
  tracks: Array<{ id: AmbientTrackId; volume: number }>;
}> = [
  { id: "rain-soft", label: "Soft rain", tracks: [{ id: "rain", volume: 40 }] },
  {
    id: "rain-wind",
    label: "Rain + wind",
    tracks: [
      { id: "rain", volume: 55 },
      { id: "wind", volume: 30 },
    ],
  },
  {
    id: "cafe",
    label: "Cafe",
    tracks: [
      { id: "city_road", volume: 35 },
      { id: "children_audience", volume: 25 },
    ],
  },
];
