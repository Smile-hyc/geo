"use strict";

/** 未知或可空 id 时回退到研究基线（HF），与前端 INFERENCE_MODELS 对齐 */
const DEFAULT_MODEL_ID = "research-baseline";

/** @type {Record<string, { id: string, provider: 'mock'|'hf-space'|'openai'|'deepseek'|'kimi'|'glm'|'qwen', apiModel: string|null, inferenceChannel: 'browser-hf'|'cloud', battleRemote: boolean, hfModelId?: string|null }>} */
const REGISTRY = {
  "mock-v1": {
    id: "mock-v1",
    provider: "mock",
    apiModel: null,
    inferenceChannel: "cloud",
    battleRemote: false,
    hfModelId: null,
  },
  "research-baseline": {
    id: "research-baseline",
    provider: "hf-space",
    apiModel: null,
    inferenceChannel: "browser-hf",
    battleRemote: true,
    hfModelId: null,
  },
  "deepseek-chat": {
    id: "deepseek-chat",
    provider: "deepseek",
    apiModel: "deepseek-chat",
    inferenceChannel: "cloud",
    battleRemote: true,
    hfModelId: null,
  },
  "deepseek-reasoner": {
    id: "deepseek-reasoner",
    provider: "deepseek",
    apiModel: "deepseek-reasoner",
    inferenceChannel: "cloud",
    battleRemote: true,
    hfModelId: null,
  },
  "openai-gpt-4o-mini": {
    id: "openai-gpt-4o-mini",
    provider: "openai",
    apiModel: "gpt-4o-mini",
    inferenceChannel: "cloud",
    battleRemote: true,
    hfModelId: null,
  },
  "kimi-vision": {
    id: "kimi-vision",
    provider: "kimi",
    apiModel: "moonshot-v1-8k-vision-preview",
    inferenceChannel: "cloud",
    battleRemote: true,
    hfModelId: null,
  },
  "glm-4v": {
    id: "glm-4v",
    provider: "glm",
    apiModel: "glm-4v-plus",
    inferenceChannel: "cloud",
    battleRemote: true,
    hfModelId: null,
  },
  "qwen-vl": {
    id: "qwen-vl",
    provider: "qwen",
    apiModel: "qwen-vl-plus",
    inferenceChannel: "cloud",
    battleRemote: true,
    hfModelId: null,
  },
};

function normalizeId(id) {
  if (typeof id !== "string" || !id.trim()) {
    return DEFAULT_MODEL_ID;
  }
  const trimmed = id.trim();
  if (REGISTRY[trimmed]) {
    return trimmed;
  }
  return DEFAULT_MODEL_ID;
}

function resolveModel(id) {
  return REGISTRY[normalizeId(id)];
}

function shouldUseRemoteInference(aiModelId) {
  return resolveModel(aiModelId).provider !== "mock";
}

module.exports = {
  DEFAULT_MODEL_ID,
  REGISTRY,
  normalizeId,
  resolveModel,
  shouldUseRemoteInference,
};
