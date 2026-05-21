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

export type InferenceProvider = "hf-space" | "kimi" | "glm" | "qwen";

/** browser-hf：浏览器直连 HF Space；cloud：经云函数 geo-inference（含密钥路由） */
export type InferenceChannel = "browser-hf" | "cloud";

/** 对战与「空间求证」共用的推理模型（ai_model_id；服务端 allowlist 见 cloudfunctions/_shared/modelRegistry.js） */
export const INFERENCE_MODELS = [
  {
    id: "research-baseline",
    label: "寻境 · 研究基线（HF）",
    description:
      "集成类 OpenClaw 工作流的「寻境」空间推理 Agent，多轮工具调用与证据链分析（默认对接 HF Space）。",
    image: "/images/baseline.png",
    /** UI 展示用标签 */
    tags: ["Baseline", "VLM", "Multimodal"] as const,
    /** 近 30 天 mock 胜率（占位，待接入统计 API） */
    mockWinRate: 55.2,
    provider: "hf-space" as const,
    apiModel: null,
    inferenceChannel: "browser-hf" as const,
    battleRemote: true,
    standaloneInference: true,
  },
  {
    id: "kimi-vision",
    label: "Kimi（Moonshot 视觉）",
    description:
      "月之暗面 Kimi 视觉模型；OpenAI 兼容接口，需配置 MOONSHOT_API_KEY。",
    image: "/images/baseline.png",
    tags: ["VLM", "Multimodal"] as const,
    mockWinRate: 48.6,
    provider: "kimi" as const,
    apiModel: "moonshot-v1-8k-vision-preview",
    inferenceChannel: "cloud" as const,
    battleRemote: true,
    standaloneInference: true,
  },
  {
    id: "glm-4v",
    label: "智谱 GLM-4V",
    description:
      "智谱多模态；兼容 OpenAI 格式，需配置 ZHIPU_API_KEY。",
    image: "/images/baseline.png",
    tags: ["VLM", "Multimodal"] as const,
    mockWinRate: 51.3,
    provider: "glm" as const,
    apiModel: "glm-4v-plus",
    inferenceChannel: "cloud" as const,
    battleRemote: true,
    standaloneInference: true,
  },
  {
    id: "qwen-vl",
    label: "通义 Qwen-VL",
    description:
      "阿里云 DashScope OpenAI 兼容模式，需配置 DASHSCOPE_API_KEY（或 QWEN_API_KEY）。",
    image: "/images/baseline.png",
    tags: ["VLM", "Multimodal"] as const,
    mockWinRate: 49.8,
    provider: "qwen" as const,
    apiModel: "qwen-vl-plus",
    inferenceChannel: "cloud" as const,
    battleRemote: true,
    standaloneInference: true,
  },
] as const;

export type InferenceModelConfig = (typeof INFERENCE_MODELS)[number];

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

export function getInferenceModelConfig(
  id: string
): InferenceModelConfig | undefined {
  return INFERENCE_MODELS.find((m) => m.id === id);
}

/** 对战 UI：模型类型标签 */
export function getModelTags(modelId: string): readonly string[] {
  const cfg = getInferenceModelConfig(modelId);
  return cfg?.tags ?? [];
}

/** 对战 UI：近 30 天 mock 胜率（0–100） */
export function getMockWinRate(modelId: string): number {
  const cfg = getInferenceModelConfig(modelId);
  return cfg?.mockWinRate ?? 0;
}

export function getInferenceModelsForContext(
  ctx: "battle" | "standalone"
): InferenceModelConfig[] {
  if (ctx === "standalone") {
    return INFERENCE_MODELS.filter((m) => m.standaloneInference) as InferenceModelConfig[];
  }
  return [...INFERENCE_MODELS] as InferenceModelConfig[];
}
