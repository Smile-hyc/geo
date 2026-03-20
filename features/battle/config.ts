export const BATTLE_MODES = [
  {
    id: "general",
    label: "General Geo",
    description: "A balanced set across multiple geo-localization styles.",
  },
  {
    id: "street_view",
    label: "Street View",
    description: "Urban clues, roads, signage, and built environment hints.",
  },
  {
    id: "remote_sensing",
    label: "Remote Sensing",
    description: "Aerial and satellite imagery with larger uncertainty radius.",
  },
  {
    id: "terrain",
    label: "Terrain",
    description: "Topography-focused rounds with relief and contour cues.",
  },
] as const;

export const AI_OPPONENTS = [
  {
    id: "mock-v1",
    label: "Mock Explorer",
    description: "Current local mock provider wired through cloud functions.",
  },
  {
    id: "research-baseline",
    label: "Research Baseline",
    description: "Placeholder for the future pluggable AI adapter layer.",
  },
] as const;

export const TIME_OPTIONS = [10, 30, 60, 120] as const;
export const ROUND_OPTIONS = [1, 3, 5, 10] as const;

export function getBattleModeLabel(id: string): string {
  return BATTLE_MODES.find((mode) => mode.id === id)?.label ?? id;
}

export function getAiOpponentLabel(id: string): string {
  return AI_OPPONENTS.find((opponent) => opponent.id === id)?.label ?? id;
}
