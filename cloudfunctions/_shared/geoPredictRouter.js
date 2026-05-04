"use strict";

const {
  predictGeoAgentFromBuffer,
  mapRemoteBody,
  ensureInferenceRuntime,
} = require("./hfSpace");
const { resolveModel } = require("./modelRegistry");

function getOpenAiKey() {
  const v = process.env.OPENAI_API_KEY;
  return v && String(v).trim() ? String(v).trim() : "";
}

function getOpenAiBase() {
  const v = process.env.OPENAI_BASE_URL;
  const raw =
    v && String(v).trim()
      ? String(v).trim()
      : "https://api.openai.com/v1";
  return raw.replace(/\/$/, "");
}

function getDeepSeekKey() {
  const v = process.env.DEEPSEEK_API_KEY;
  return v && String(v).trim() ? String(v).trim() : "";
}

function getDeepSeekBase() {
  const v = process.env.DEEPSEEK_BASE_URL || process.env.DEEPSEEK_API_BASE_URL;
  const raw =
    v && String(v).trim()
      ? String(v).trim()
      : "https://api.deepseek.com/v1";
  return raw.replace(/\/$/, "");
}

function getMoonshotKey() {
  const v =
    process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY;
  return v && String(v).trim() ? String(v).trim() : "";
}

function getMoonshotBase() {
  const v = process.env.MOONSHOT_BASE_URL;
  const raw =
    v && String(v).trim()
      ? String(v).trim()
      : "https://api.moonshot.cn/v1";
  return raw.replace(/\/$/, "");
}

function getZhipuKey() {
  const v = process.env.ZHIPU_API_KEY;
  return v && String(v).trim() ? String(v).trim() : "";
}

function getZhipuBase() {
  const v = process.env.ZHIPU_BASE_URL;
  const raw =
    v && String(v).trim()
      ? String(v).trim()
      : "https://open.bigmodel.cn/api/paas/v4";
  return raw.replace(/\/$/, "");
}

function getQwenKey() {
  const v = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
  return v && String(v).trim() ? String(v).trim() : "";
}

function getQwenBase() {
  const v = process.env.QWEN_BASE_URL || process.env.DASHSCOPE_COMPAT_BASE_URL;
  const raw =
    v && String(v).trim()
      ? String(v).trim()
      : "https://dashscope.aliyuncs.com/compatible-mode/v1";
  return raw.replace(/\/$/, "");
}

async function predictOpenAiCompatibleVision(options) {
  const {
    buffer,
    prompt,
    maxNewTokens,
    apiKey,
    baseUrl,
    apiModel,
    providerTag,
  } = options;

  ensureInferenceRuntime();

  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("Vision input buffer is empty");
  }

  const b64 = buffer.toString("base64");
  const url = `${baseUrl}/chat/completions`;
  const maxTokens = Math.min(4096, Math.max(64, maxNewTokens));

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: apiModel,
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${b64}`,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(
      `${providerTag} HTTP ${res.status}: ${t.slice(0, 500)}`
    );
  }

  const data = await res.json();
  let text = "";
  if (
    data &&
    data.choices &&
    data.choices[0] &&
    data.choices[0].message
  ) {
    const c = data.choices[0].message.content;
    if (typeof c === "string") {
      text = c;
    } else if (Array.isArray(c)) {
      text = c
        .map((part) =>
          part && part.type === "text" && typeof part.text === "string"
            ? part.text
            : ""
        )
        .filter(Boolean)
        .join("\n");
    }
  }

  text = typeof text === "string" ? text.trim() : "";
  let mapped = text ? mapRemoteBody(text) : null;
  if (!mapped && text) {
    mapped = mapRemoteBody({
      FinalAnswer: text,
      ChainOfThought: text,
    });
  }
  if (!mapped) {
    throw new Error(`${providerTag} returned empty or unparseable content`);
  }

  return {
    ...mapped,
    source: providerTag,
    model_ref: `${providerTag}:${apiModel}`,
  };
}

/**
 * 统一入口：按 ai_model_id 路由到 HF / OpenAI / DeepSeek / Kimi / GLM / Qwen（服务端密钥）。
 * @param {{ buffer: Buffer, prompt: string, maxNewTokens: number, aiModelId?: string|null }} params
 */
async function predictFromBuffer(params) {
  const buffer = params.buffer;
  const prompt = params.prompt || "";
  const maxNewTokens =
    typeof params.maxNewTokens === "number" ? params.maxNewTokens : 2048;
  const meta = resolveModel(params.aiModelId);

  if (meta.provider === "mock") {
    throw new Error("predictFromBuffer must not be called for mock provider");
  }

  if (meta.provider === "hf-space") {
    const hfModelId =
      typeof meta.hfModelId === "string" && meta.hfModelId.trim()
        ? meta.hfModelId.trim()
        : "";
    const callOpts = {
      buffer,
      prompt,
      maxNewTokens,
    };
    if (hfModelId) {
      callOpts.modelId = hfModelId;
    }
    return predictGeoAgentFromBuffer(callOpts);
  }

  if (meta.provider === "openai") {
    const key = getOpenAiKey();
    if (!key) {
      throw new Error("OPENAI_API_KEY is not configured for this environment.");
    }
    if (!meta.apiModel) {
      throw new Error("openai provider missing apiModel in registry.");
    }
    return predictOpenAiCompatibleVision({
      buffer,
      prompt,
      maxNewTokens,
      apiKey: key,
      baseUrl: getOpenAiBase(),
      apiModel: meta.apiModel,
      providerTag: "openai",
    });
  }

  if (meta.provider === "deepseek") {
    const key = getDeepSeekKey();
    if (!key) {
      throw new Error(
        "DEEPSEEK_API_KEY is not configured for this environment."
      );
    }
    if (!meta.apiModel) {
      throw new Error("deepseek provider missing apiModel in registry.");
    }
    return predictOpenAiCompatibleVision({
      buffer,
      prompt,
      maxNewTokens,
      apiKey: key,
      baseUrl: getDeepSeekBase(),
      apiModel: meta.apiModel,
      providerTag: "deepseek",
    });
  }

  if (meta.provider === "kimi") {
    const key = getMoonshotKey();
    if (!key) {
      throw new Error(
        "MOONSHOT_API_KEY (或 KIMI_API_KEY) is not configured for this environment."
      );
    }
    if (!meta.apiModel) {
      throw new Error("kimi provider missing apiModel in registry.");
    }
    return predictOpenAiCompatibleVision({
      buffer,
      prompt,
      maxNewTokens,
      apiKey: key,
      baseUrl: getMoonshotBase(),
      apiModel: meta.apiModel,
      providerTag: "kimi",
    });
  }

  if (meta.provider === "glm") {
    const key = getZhipuKey();
    if (!key) {
      throw new Error("ZHIPU_API_KEY is not configured for this environment.");
    }
    if (!meta.apiModel) {
      throw new Error("glm provider missing apiModel in registry.");
    }
    return predictOpenAiCompatibleVision({
      buffer,
      prompt,
      maxNewTokens,
      apiKey: key,
      baseUrl: getZhipuBase(),
      apiModel: meta.apiModel,
      providerTag: "glm",
    });
  }

  if (meta.provider === "qwen") {
    const key = getQwenKey();
    if (!key) {
      throw new Error(
        "DASHSCOPE_API_KEY (或 QWEN_API_KEY) is not configured for this environment."
      );
    }
    if (!meta.apiModel) {
      throw new Error("qwen provider missing apiModel in registry.");
    }
    return predictOpenAiCompatibleVision({
      buffer,
      prompt,
      maxNewTokens,
      apiKey: key,
      baseUrl: getQwenBase(),
      apiModel: meta.apiModel,
      providerTag: "qwen",
    });
  }

  throw new Error(`Unknown provider: ${meta.provider}`);
}

module.exports = { predictFromBuffer };
