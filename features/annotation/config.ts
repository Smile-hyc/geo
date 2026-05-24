export const ANNOTATION_MODES = [
  {
    id: "street_view",
    name: "街景",
    description: "城市道路、店铺、路牌与建筑线索",
    defaultReward: 50,
    showTruthLocation: true,
    enabled: true,
  },
  {
    id: "remote_sensing",
    name: "遥感",
    description: "卫星影像、地表覆盖与大尺度空间线索",
    defaultReward: 60,
    showTruthLocation: true,
    enabled: true,
  },
  {
    id: "map_mode",
    name: "地图",
    description: "地图截图、制图符号与道路拓扑判断",
    defaultReward: 45,
    showTruthLocation: true,
    enabled: true,
  },
  {
    id: "terrain",
    name: "地形",
    description: "地貌、等高线与海拔变化模式",
    defaultReward: 55,
    showTruthLocation: true,
    enabled: true,
  },
  {
    id: "mixed",
    name: "混合",
    description: "覆盖多模态地理线索，适合综合能力训练",
    defaultReward: 65,
    showTruthLocation: true,
    enabled: true,
  },
] as const;

export const ANNOTATION_TYPES = [
  {
    id: "reasoning",
    name: "思维链标注",
    description: "记录定位推理、最终答案与置信度",
    estimatedTime: "45-60s",
  },
  {
    id: "bbox",
    name: "地理元素框选",
    description: "框选路牌、建筑、地貌、地图符号等关键线索",
    estimatedTime: "30-45s",
  },
  {
    id: "hybrid",
    name: "混合标注",
    description: "同时完成视觉线索选择、地理元素标注与简短推理说明",
    estimatedTime: "60-90s",
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
    return "综合";
  }
  return id;
}

export function getAnnotationTypeName(id: string): string {
  const found = ANNOTATION_TYPES.find((type) => type.id === id);
  return found?.name ?? id;
}
