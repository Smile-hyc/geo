export const ANNOTATION_MODES = [
  {
    id: "street_view",
    name: "街景",
    description: "适合包含道路、店铺、路牌与城市线索的图像。",
    defaultReward: 50,
    showTruthLocation: true,
    enabled: true,
  },
  {
    id: "remote_sensing",
    name: "遥感",
    description: "适合卫星图像、地表覆盖与大尺度空间线索。",
    defaultReward: 60,
    showTruthLocation: true,
    enabled: true,
  },
  {
    id: "map_mode",
    name: "地图",
    description: "适合地图截图、制图符号与道路拓扑判断。",
    defaultReward: 45,
    showTruthLocation: true,
    enabled: true,
  },
  {
    id: "terrain",
    name: "地形",
    description: "适合地形图、等高线与海拔变化模式。",
    defaultReward: 55,
    showTruthLocation: true,
    enabled: true,
  },
  {
    id: "mixed",
    name: "混合",
    description: "用于更广泛采集实验的混合题池。",
    defaultReward: 65,
    showTruthLocation: true,
    enabled: true,
  },
] as const;

export const ANNOTATION_TYPES = [
  {
    id: "reasoning",
    name: "思维链标注",
    description: "记录推理过程、最终答案与置信度。",
  },
  {
    id: "bbox",
    name: "地理元素框选",
    description: "绘制目标框、标记类别并补充线索说明。",
  },
  {
    id: "hybrid",
    name: "混合标注",
    description: "同时采集思维链与地理元素框选信息。",
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
