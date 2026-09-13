export const AMBIENT_TRACKS = [
  { id: "rain", label: "Rain", file: "rain.mp3" },
  { id: "camp_fire", label: "Campfire", file: "campfire.mp3" },
  { id: "birds", label: "Nature birds", file: "birds-nature.mp3" },
  { id: "morning_birds", label: "Morning birds", file: "morning-birds.mp3" },
  { id: "birds_spring", label: "Spring birds", file: "birds-spring.mp3" },
  { id: "summer_insects", label: "Summer insects", file: "summer-insects.mp3" },
  { id: "winds_and_waves", label: "Wind and waves", file: "winds-and-waves.mp3" },
  { id: "thunder", label: "Thunder", file: "thunder.mp3" },
] as const;

export type AmbientTrackId = (typeof AMBIENT_TRACKS)[number]["id"];

export const AMBIENT_TRACK_IDS = AMBIENT_TRACKS.map((track) => track.id) as [
  AmbientTrackId,
  ...AmbientTrackId[],
];

export function getAmbientTrackSrc(id: AmbientTrackId) {
  const track = AMBIENT_TRACKS.find((item) => item.id === id);
  if (!track) throw new Error("Unknown ambient track");
  return "/audio/v1/" + track.file;
}
