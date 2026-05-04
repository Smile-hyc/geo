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

export type InferenceProvider =
  | "mock"
  | "hf-space"
  | "openai"
  | "deepseek"
  | "kimi"
  | "glm"
  | "qwen";

/** browser-hf：浏览器直连 HF Space；cloud：经云函数 geo-inference（含密钥路由） */
export type InferenceChannel = "browser-hf" | "cloud";

/** 对战与「空间求证」共用的推理模型（ai_model_id；服务端 allowlist 见 cloudfunctions/_shared/modelRegistry.js） */
export const INFERENCE_MODELS = [
  {
    id: "mock-v1",
    label: "模拟对手（本地）",
    description:
      "搭载基础「识图」大模型架构的轻量级链路；对战内为本地快速占位，不调用远程 GPU。",
    image: "/images/mock.png",
    provider: "mock" as const,
    apiModel: null,
    inferenceChannel: "cloud" as const,
    battleRemote: false,
    standaloneInference: false,
  },
  {
    id: "research-baseline",
    label: "寻境 · 研究基线（HF）",
    description:
      "集成类 OpenClaw 工作流的「寻境」空间推理 Agent，多轮工具调用与证据链分析（默认对接 HF Space）。",
    image: "/images/baseline.png",
    provider: "hf-space" as const,
    apiModel: null,
    inferenceChannel: "browser-hf" as const,
    battleRemote: true,
    standaloneInference: true,
  },
  {
    id: "deepseek-chat",
    label: "DeepSeek Chat",
    description:
      "DeepSeek 对话模型 API；经云函数调用，需配置 DEEPSEEK_API_KEY。",
    image: "/images/baseline.png",
    provider: "deepseek" as const,
    apiModel: "deepseek-chat",
    inferenceChannel: "cloud" as const,
    battleRemote: true,
    standaloneInference: true,
  },
  {
    id: "deepseek-reasoner",
    label: "DeepSeek 推理（Reasoner）",
    description:
      "DeepSeek 深度推理模型；经云函数调用，需配置 DEEPSEEK_API_KEY。",
    image: "/images/baseline.png",
    provider: "deepseek" as const,
    apiModel: "deepseek-reasoner",
    inferenceChannel: "cloud" as const,
    battleRemote: true,
    standaloneInference: true,
  },
  {
    id: "openai-gpt-4o-mini",
    label: "ChatGPT（GPT-4o mini）",
    description:
      "OpenAI 多模态模型；经云函数调用，需配置 OPENAI_API_KEY。",
    image: "/images/baseline.png",
    provider: "openai" as const,
    apiModel: "gpt-4o-mini",
    inferenceChannel: "cloud" as const,
    battleRemote: true,
    standaloneInference: true,
  },
  {
    id: "kimi-vision",
    label: "Kimi（Moonshot 视觉）",
    description:
      "月之暗面 Kimi 视觉模型；OpenAI 兼容接口，需配置 MOONSHOT_API_KEY。",
    image: "/images/baseline.png",
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

export function getInferenceModelsForContext(
  ctx: "battle" | "standalone"
): InferenceModelConfig[] {
  if (ctx === "standalone") {
    return INFERENCE_MODELS.filter((m) => m.standaloneInference) as InferenceModelConfig[];
  }
  return [...INFERENCE_MODELS] as InferenceModelConfig[];
}
