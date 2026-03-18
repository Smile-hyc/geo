/**
 * 标注模式定义（与图片 mode_tags 及数据库一致）
 */
export const ANNOTATION_MODES = [
  { id: "street_view", name: "街景模式", description: "街景、街道全景照片" },
  { id: "remote_sensing", name: "遥感模式", description: "卫星遥感影像" },
  { id: "map_mode", name: "地图模式", description: "地图截图、平面地图" },
  { id: "terrain", name: "地形图模式", description: "地形图、等高线图" },
  { id: "mixed", name: "混合模式", description: "多种类型混合" },
] as const;

export type AnnotationModeId = (typeof ANNOTATION_MODES)[number]["id"];

export function getModeName(id: string): string {
  const found = ANNOTATION_MODES.find((m) => m.id === id);
  if (found) return found.name;
  if (id === "general") return "通用";
  return id;
}
