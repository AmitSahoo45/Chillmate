export const AMBIENT_TRACKS = [
  { id: "rain", label: "Rain", icon: "/assets/images/rain.png" },
  { id: "camp_fire", label: "Camp fire", icon: "/assets/images/camp_fire.png" },
  { id: "birds", label: "Birds", icon: "/assets/images/birds.png" },
  { id: "city_road", label: "City", icon: "/assets/images/city_road.png" },
  { id: "children_audience", label: "Crowd", icon: "/assets/images/children_audience.png" },
  { id: "thunder", label: "Thunder", icon: "/assets/images/thunder.png" },
  { id: "water_waves", label: "Waves", icon: "/assets/images/water_waves.png" },
  { id: "wind", label: "Wind", icon: "/assets/images/wind.png" },
] as const;

export type AmbientTrackId = (typeof AMBIENT_TRACKS)[number]["id"];
