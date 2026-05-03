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

/** 对战与「空间求证」共用的推理模型选项（ai_model_id / 前端透传） */
export const INFERENCE_MODELS = [
  {
    id: "mock-v1",
    label: "模拟对手（本地）",
    description:
      "搭载基础「识图」大模型架构的轻量级链路；对战内为本地快速占位，不调用远程 GPU。",
    image: "/images/mock.png",
    /** 空间求证页走浏览器推理，不包含本地 mock */
    standaloneInference: false as const,
  },
  {
    id: "research-baseline",
    label: "寻境 · 研究基线（HF）",
    description:
      "集成类 OpenClaw 工作流的「寻境」空间推理 Agent，多轮工具调用与证据链分析（默认对接 HF Space）。",
    image: "/images/baseline.png",
    standaloneInference: true as const,
  },
  {
    id: "deepseek-chat",
    label: "DeepSeek Chat",
    description:
      "DeepSeek 对话模型 API；需在推理服务侧配置对应路由后，由接口识别 model_id。",
    image: "/images/baseline.png",
    standaloneInference: true as const,
  },
  {
    id: "deepseek-reasoner",
    label: "DeepSeek 推理（Reasoner）",
    description:
      "DeepSeek 深度推理模型；适合复杂空间链路与长思维链（依赖服务端与密钥配置）。",
    image: "/images/baseline.png",
    standaloneInference: true as const,
  },
] as const;

/** @deprecated 使用 INFERENCE_MODELS；保留别名以免旧代码断裂 */
export const AI_OPPONENTS = INFERENCE_MODELS;

export const TIME_OPTIONS = [10, 30, 60, 120] as const;
export const ROUND_OPTIONS = [1, 3, 5, 10] as const;

export function getBattleModeLabel(id: string): string {
  return BATTLE_MODES.find((mode) => mode.id === id)?.label ?? id;
}

export function getInferenceModelLabel(id: string): string {
  return INFERENCE_MODELS.find((m) => m.id === id)?.label ?? id;
}

export function getAiOpponentLabel(id: string): string {
  return getInferenceModelLabel(id);
}

export type InferenceModelId = (typeof INFERENCE_MODELS)[number]["id"];

export function getInferenceModelsForContext(
  ctx: "battle" | "standalone"
): (typeof INFERENCE_MODELS)[number][] {
  if (ctx === "standalone") {
    return INFERENCE_MODELS.filter((m) => m.standaloneInference);
  }
  return [...INFERENCE_MODELS];
}
