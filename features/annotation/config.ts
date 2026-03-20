export const ANNOTATION_MODES = [
  {
    id: "street_view",
    name: "Street View",
    description: "Panoramas, roads, storefronts, signs, and urban clues.",
    defaultReward: 50,
    showTruthLocation: true,
    enabled: true,
  },
  {
    id: "remote_sensing",
    name: "Remote Sensing",
    description: "Satellite imagery, land cover, and large-scale spatial cues.",
    defaultReward: 60,
    showTruthLocation: true,
    enabled: true,
  },
  {
    id: "map_mode",
    name: "Map",
    description: "Map screenshots, cartographic symbols, and road topology.",
    defaultReward: 45,
    showTruthLocation: true,
    enabled: true,
  },
  {
    id: "terrain",
    name: "Terrain",
    description: "Topographic maps, contour lines, and elevation patterns.",
    defaultReward: 55,
    showTruthLocation: true,
    enabled: true,
  },
  {
    id: "mixed",
    name: "Mixed",
    description: "A mixed pool for broader data collection experiments.",
    defaultReward: 65,
    showTruthLocation: true,
    enabled: true,
  },
] as const;

export const ANNOTATION_TYPES = [
  {
    id: "reasoning",
    name: "Reasoning Capture",
    description: "Record reasoning text, final answer, and confidence.",
  },
  {
    id: "bbox",
    name: "Geo Element BBoxes",
    description: "Draw bounding boxes, assign labels, and explain clues.",
  },
  {
    id: "hybrid",
    name: "Hybrid",
    description: "Combine reasoning capture with geo-element box annotations.",
  },
] as const;

export type AnnotationModeId = (typeof ANNOTATION_MODES)[number]["id"];
export type AnnotationTypeId = (typeof ANNOTATION_TYPES)[number]["id"];

export function getModeName(id: string): string {
  const found = ANNOTATION_MODES.find((mode) => mode.id === id);
  if (found) {
    return found.name;
  }
  if (id === "general") {
    return "General";
  }
  return id;
}

export function getAnnotationTypeName(id: string): string {
  const found = ANNOTATION_TYPES.find((type) => type.id === id);
  return found?.name ?? id;
}
