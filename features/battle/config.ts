export const BATTLE_MODES = [
  {
    id: "general",
    label: "综合模式",
    description: "覆盖多种地理定位风格的平衡题集。",
  },
  {
    id: "street_view",
    label: "街景模式",
    description: "以城市环境、道路、路牌和建筑线索为主。",
  },
  {
    id: "remote_sensing",
    label: "遥感模式",
    description: "以航拍和卫星影像为主，定位范围通常更大。",
  },
  {
    id: "terrain",
    label: "地形模式",
    description: "以地貌、起伏和等高线线索为主。",
  },
] as const;

export const AI_OPPONENTS = [
  {
    id: "mock-v1",
    label: "模拟对手",
    description: "当前通过云函数接入的本地模拟 AI。",
  },
  {
    id: "research-baseline",
    label: "研究基线",
    description: "为后续可插拔 AI 适配层预留的基线对手。",
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
