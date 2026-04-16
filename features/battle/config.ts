export const BATTLE_MODES = [
  {
    id: "general",
    label: "综合模式",
    description: "覆盖多种地理定位风格的平衡题集。",
    image: "/images/general.png", // 新增：综合模式的图片路径
  },
  {
    id: "street_view",
    label: "街景模式",
    description: "以城市环境、道路、路牌和建筑线索为主。",
    image: "/images/street_view.png", // 新增：街景模式的图片路径
  },
  {
    id: "remote_sensing",
    label: "遥感模式",
    description: "以航拍和卫星影像为主，定位范围通常更大。",
    image: "/images/remote_sensing.png", // 新增：遥感模式的图片路径
  },
  {
    id: "terrain",
    label: "地形模式",
    description: "以地貌、起伏和等高线线索为主。",
    image: "/images/terrain.png", // 新增：地形模式的图片路径
  },
] as const;

export const AI_OPPONENTS = [
  {
    id: "mock-v1",
    label: "模拟对手",
    description: "当前通过云函数接入的本地模拟 AI。",
    image: "/images/mock.png",
  },
  {
    id: "research-baseline",
    label: "研究基线",
    description: "为后续可插拔 AI 适配层预留的基线对手。",
    image: "/images/baseline.png",
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
