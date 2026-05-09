"use strict";

const DEFAULT_SPACE_ID = "EugeneZhao/geoagent-api";
const DEFAULT_ENDPOINT = "/predict";
const DEFAULT_FILE_NAME = "input.jpg";
const SECTION_LABELS = {
  CountryIdentification: "国家判断",
  RegionalGuess: "区域猜测",
  PreciseLocalization: "精确定位",
};
const FIELD_LABELS = {
  Conclusion: "结论",
  conclusion: "结论",
  Reasoning: "推理",
  reasoning: "推理",
  Clues: "线索",
  clues: "线索",
  Uncertainty: "不确定性",
  uncertainty: "不确定性",
};
const VALUE_LABELS = {
  Low: "低",
  Medium: "中",
  High: "高",
};

function ensureWebStreamGlobals() {
  try {
    const webStreams = require("stream/web");
    const assignments = {
      ReadableStream: webStreams.ReadableStream,
      WritableStream: webStreams.WritableStream,
      TransformStream: webStreams.TransformStream,
      TextEncoderStream: webStreams.TextEncoderStream,
      TextDecoderStream: webStreams.TextDecoderStream,
    };

    for (const [key, value] of Object.entries(assignments)) {
      if (typeof globalThis[key] === "undefined" && typeof value !== "undefined") {
        globalThis[key] = value;
      }
    }
  } catch (_) {
    // Older runtimes may not expose stream/web. Runtime upgrade remains the main fix.
  }
}

function ensureFetchGlobals() {
  try {
    const { Blob } = require("buffer");
    if (typeof globalThis.Blob === "undefined" && typeof Blob !== "undefined") {
      globalThis.Blob = Blob;
    }
  } catch (_) {
    // Ignore buffer polyfill failures and continue with undici.
  }

  try {
    const undici = require("undici");
    const assignments = {
      fetch: undici.fetch,
      Headers: undici.Headers,
      Request: undici.Request,
      Response: undici.Response,
      FormData: undici.FormData,
      File: undici.File,
      Blob: undici.Blob,
    };

    for (const [key, value] of Object.entries(assignments)) {
      if (typeof globalThis[key] === "undefined" && typeof value !== "undefined") {
        globalThis[key] = value;
      }
    }
  } catch (_) {
    // If undici is unavailable, runtime-native fetch globals may still exist.
  }
}

function getSpaceId() {
  const value =
    process.env.GEO_INFERENCE_SPACE_ID &&
    String(process.env.GEO_INFERENCE_SPACE_ID).trim();
  return value || DEFAULT_SPACE_ID;
}

function getSpaceToken() {
  const candidates = [
    process.env.GEO_INFERENCE_HF_TOKEN,
    process.env.HF_TOKEN,
    process.env.HUGGINGFACE_TOKEN,
  ];

  for (const candidate of candidates) {
    if (candidate && String(candidate).trim()) {
      return String(candidate).trim();
    }
  }

  return "";
}

function getSpaceUrl() {
  const explicitUrl =
    process.env.GEO_INFERENCE_SPACE_URL &&
    String(process.env.GEO_INFERENCE_SPACE_URL).trim();
  if (explicitUrl) {
    return explicitUrl;
  }

  const spaceId = getSpaceId();
  const derivedHost = String(spaceId)
    .trim()
    .toLowerCase()
    .replace(/\//g, "-");
  return `https://${derivedHost}.hf.space`;
}

function getModelRef(spaceId) {
  return `hf-space:${spaceId || getSpaceId()}`;
}

function getAuthHeaders(hfToken) {
  if (!hfToken) return {};
  return { Authorization: `Bearer ${hfToken}` };
}

function inferMimeType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return "image/jpeg";

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return "image/jpeg";
}

function buildSpaceUrl(pathname) {
  return new URL(pathname, getSpaceUrl()).toString();
}

async function ensureSuccess(response, context) {
  if (response.ok) return response;

  let detail = "";
  try {
    detail = (await response.text()).trim();
  } catch (_) {
    // Ignore secondary read failures.
  }

  const suffix = detail ? ` ${detail}` : "";
  throw new Error(`${context} failed with ${response.status}.${suffix}`.trim());
}

async function uploadBufferToSpace(buffer, hfToken) {
  ensureFetchGlobals();

  const mimeType = inferMimeType(buffer);
  const formData = new FormData();
  const file = new File([buffer], DEFAULT_FILE_NAME, { type: mimeType });
  formData.append("files", file);

  const response = await fetch(buildSpaceUrl("/gradio_api/upload"), {
    method: "POST",
    headers: getAuthHeaders(hfToken),
    body: formData,
  });
  await ensureSuccess(response, "GeoAgent upload");

  const payload = await response.json();
  const uploadedPath = Array.isArray(payload) ? payload[0] : null;
  if (typeof uploadedPath !== "string" || !uploadedPath.trim()) {
    throw new Error("GeoAgent upload did not return a file path");
  }

  return uploadedPath.trim();
}

async function startPrediction(uploadedPath, prompt, maxNewTokens, hfToken) {
  const body = {
    image: {
      path: uploadedPath,
      meta: { _type: "gradio.FileData" },
    },
    prompt,
    max_new_tokens: maxNewTokens,
  };
  // EugeneZhao/geoagent-api 等 Space 的 predict(image, prompt, max_new_tokens) 不接受 model_id。

  const response = await fetch(buildSpaceUrl("/gradio_api/call/v2/predict"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(hfToken),
    },
    body: JSON.stringify(body),
  });
  await ensureSuccess(response, "GeoAgent predict");

  const payload = await response.json();
  const eventId =
    payload && typeof payload.event_id === "string"
      ? payload.event_id.trim()
      : "";
  if (!eventId) {
    throw new Error("GeoAgent predict did not return an event_id");
  }
  return eventId;
}

function parseSseEvents(text) {
  const events = [];
  let eventName = "message";
  let dataLines = [];

  const flush = () => {
    if (!dataLines.length) return;
    events.push({
      event: eventName,
      data: dataLines.join("\n"),
    });
    eventName = "message";
    dataLines = [];
  };

  const lines = String(text || "").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine || "";
    if (!line.trim()) {
      flush();
      continue;
    }

    if (line.startsWith("event:")) {
      eventName = line.slice("event:".length).trim() || "message";
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  }

  flush();
  return events;
}

async function fetchPredictionPayload(eventId, hfToken) {
  const response = await fetch(
    buildSpaceUrl(`/gradio_api/call/predict/${encodeURIComponent(eventId)}`),
    {
      method: "GET",
      headers: getAuthHeaders(hfToken),
    }
  );
  await ensureSuccess(response, "GeoAgent result");

  const body = await response.text();
  const events = parseSseEvents(body);

  let completePayload = null;
  let errorPayload = null;

  for (const item of events) {
    if (item.event === "complete") {
      completePayload = item.data;
    } else if (item.event === "error") {
      errorPayload = item.data;
    }
  }

  if (completePayload) {
    const parsed = safeParseJson(completePayload);
    return parsed != null ? parsed : completePayload;
  }

  if (errorPayload) {
    throw new Error(`GeoAgent Space returned error: ${errorPayload}`);
  }

  throw new Error("GeoAgent result stream did not include a complete event");
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
}

function maybeParseEmbeddedJson(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;

  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    const parsed = safeParseJson(trimmed);
    if (parsed != null) return parsed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    const parsed = safeParseJson(fenced[1].trim());
    if (parsed != null) return parsed;
  }

  return value;
}

function unwrapRemoteResult(value) {
  let current = maybeParseEmbeddedJson(value);

  for (let index = 0; index < 5; index += 1) {
    current = maybeParseEmbeddedJson(current);

    if (Array.isArray(current) && current.length === 1) {
      current = current[0];
      continue;
    }

    if (current && typeof current === "object") {
      const record = current;
      if ("result" in record) {
        current = record.result;
        continue;
      }
      if ("data" in record) {
        current = record.data;
        continue;
      }
      if ("output" in record) {
        current = record.output;
        continue;
      }
      if ("response" in record) {
        current = record.response;
        continue;
      }
    }

    break;
  }

  return maybeParseEmbeddedJson(current);
}

function pickString(record, keys) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function formatChainSection(title, value) {
  if (!value || typeof value !== "object") return null;

  const section = value;
  const parts = [];
  const sectionTitle = SECTION_LABELS[title] || title;

  const conclusion = pickString(section, ["Conclusion", "conclusion"]);
  if (conclusion) parts.push(`${FIELD_LABELS.Conclusion}: ${conclusion}`);

  const reasoning = pickString(section, ["Reasoning", "reasoning"]);
  if (reasoning) parts.push(`${FIELD_LABELS.Reasoning}: ${reasoning}`);

  const clues = section.Clues ?? section.clues;
  if (Array.isArray(clues) && clues.length > 0) {
    const clueText = clues
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .join(", ");
    if (clueText) parts.push(`${FIELD_LABELS.Clues}: ${clueText}`);
  }

  const uncertainty = pickString(section, ["Uncertainty", "uncertainty"]);
  if (uncertainty) {
    parts.push(
      `${FIELD_LABELS.Uncertainty}: ${VALUE_LABELS[uncertainty] || uncertainty}`
    );
  }

  if (!parts.length) return null;
  return `${sectionTitle}\n${parts.join("\n")}`;
}

function formatChainOfThought(value) {
  if (!value) return null;
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value !== "object") return null;

  const sections = Object.entries(value)
    .map(([key, sectionValue]) => formatChainSection(key, sectionValue))
    .filter(Boolean);

  if (sections.length > 0) {
    return sections.join("\n\n");
  }

  const serialized = JSON.stringify(value, null, 2);
  return serialized && serialized !== "{}" ? serialized : null;
}

function pickNumber(record, keys) {
  for (const key of keys) {
    const value = record[key];
    const number =
      typeof value === "number" ? value : parseFloat(String(value || ""));
    if (Number.isFinite(number)) {
      return number;
    }
  }
  return null;
}

function extractCoordinatesFromText(text) {
  const value = typeof text === "string" ? text.trim() : "";
  if (!value) return { latitude: null, longitude: null };

  const latLabel = value.match(
    /lat(?:itude)?\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i
  );
  const lngLabel = value.match(
    /(?:lng|lon|long|longitude)\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i
  );
  if (latLabel && lngLabel) {
    return {
      latitude: parseFloat(latLabel[1]),
      longitude: parseFloat(lngLabel[1]),
    };
  }

  const directional = value.match(
    /(\d{1,2}(?:\.\d+)?)\s*(?:°|deg|degrees)?\s*([NS])[\s,;/]+(\d{1,3}(?:\.\d+)?)\s*(?:°|deg|degrees)?\s*([EW])/i
  );
  if (directional) {
    const latitude =
      parseFloat(directional[1]) *
      (directional[2].toUpperCase() === "S" ? -1 : 1);
    const longitude =
      parseFloat(directional[3]) *
      (directional[4].toUpperCase() === "W" ? -1 : 1);
    return { latitude, longitude };
  }

  const pairContext = value.match(
    /(?:coordinate|coordinates|coords|经纬度|坐标)[^-\d]{0,20}(-?\d{1,2}(?:\.\d+)?)\s*[,，/ ]+\s*(-?\d{1,3}(?:\.\d+)?)/i
  );
  if (pairContext) {
    return {
      latitude: parseFloat(pairContext[1]),
      longitude: parseFloat(pairContext[2]),
    };
  }

  return { latitude: null, longitude: null };
}

function mapTextPayload(text) {
  const raw = typeof text === "string" ? text.trim() : "";
  if (!raw) return null;

  const parsed = maybeParseEmbeddedJson(raw);
  if (parsed !== raw) {
    return mapRemoteBody(parsed);
  }

  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const firstLine = lines[0] || raw;
  const addressMatch = raw.match(
    /(?:final(?:\s+answer|\s+guess)?|predicted(?:\s+address|\s+location)?|location|address)\s*[:：-]\s*(.+)/i
  );
  const coords = extractCoordinatesFromText(raw);

  return {
    address: (addressMatch?.[1] || firstLine).trim(),
    chain_of_thought: raw,
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}

function mapObjectPayload(record) {
  const address = pickString(record, [
    "address",
    "Address",
    "predicted_address",
    "PredictedAddress",
    "location_text",
    "location",
    "final_answer",
    "FinalAnswer",
    "finalAnswer",
    "final_guess",
    "FinalGuess",
  ]);
  const chainText = pickString(record, [
    "chain_of_thought",
    "ChainOfThought",
    "chainOfThought",
    "thought",
    "Thought",
    "reasoning",
    "Reasoning",
    "cot",
    "analysis",
    "Analysis",
    "text",
    "Text",
    "message",
    "Message",
    "content",
    "Content",
  ]);
  const chainStructured =
    formatChainOfThought(record.ChainOfThought) ??
    formatChainOfThought(record.chainOfThought) ??
    formatChainOfThought(record.chain_of_thought);
  const chain = chainText || chainStructured;

  let latitude = pickNumber(record, ["latitude", "lat"]);
  let longitude = pickNumber(record, ["longitude", "lng", "lon"]);

  if (
    (latitude == null || longitude == null) &&
    record.coordinates &&
    typeof record.coordinates === "object"
  ) {
    latitude =
      latitude ??
      pickNumber(record.coordinates, ["latitude", "lat", "y"]);
    longitude =
      longitude ??
      pickNumber(record.coordinates, ["longitude", "lng", "lon", "x"]);
  }

  const textFallback = chain || address;
  const textMapped = textFallback ? mapTextPayload(textFallback) : null;

  const finalAddress = address || textMapped?.address || null;
  const finalChain = chain || textMapped?.chain_of_thought || null;

  if (latitude == null || longitude == null) {
    const coords = textFallback
      ? extractCoordinatesFromText(textFallback)
      : { latitude: null, longitude: null };
    latitude = latitude ?? coords.latitude;
    longitude = longitude ?? coords.longitude;
  }

  if (!finalAddress && !finalChain) return null;

  return {
    address: finalAddress || finalChain || "Unknown location",
    chain_of_thought: finalChain || finalAddress || "",
    latitude,
    longitude,
  };
}

function mapRemoteBody(parsed) {
  const unwrapped = unwrapRemoteResult(parsed);

  if (typeof unwrapped === "string") {
    return mapTextPayload(unwrapped);
  }

  if (Array.isArray(unwrapped) && unwrapped.length > 0) {
    return mapRemoteBody(unwrapped[0]);
  }

  if (unwrapped && typeof unwrapped === "object") {
    return mapObjectPayload(unwrapped);
  }

  return null;
}

function isValidCoordinatePair(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

async function predictGeoAgentFromBuffer(options) {
  const buffer = options?.buffer;
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("GeoAgent input buffer is empty");
  }

  const spaceId = options?.spaceId || getSpaceId();
  const hfToken = options?.hfToken || getSpaceToken();
  const endpoint = options?.endpoint || DEFAULT_ENDPOINT;
  const prompt = options?.prompt || "";
  const maxNewTokens =
    typeof options?.maxNewTokens === "number" ? options.maxNewTokens : 2048;

  ensureWebStreamGlobals();
  ensureFetchGlobals();

  if (endpoint !== DEFAULT_ENDPOINT) {
    throw new Error(`Unsupported GeoAgent endpoint: ${endpoint}`);
  }

  // modelIdOpt 仅写入返回的 model_ref；Gradio Space predict 若不含同名参数则不可放入请求体。
  const modelIdOpt =
    typeof options?.modelId === "string" && options.modelId.trim()
      ? options.modelId.trim()
      : "";

  const uploadedPath = await uploadBufferToSpace(buffer, hfToken);
  const eventId = await startPrediction(
    uploadedPath,
    prompt,
    maxNewTokens,
    hfToken
  );
  const response = await fetchPredictionPayload(eventId, hfToken);

  const mapped = mapRemoteBody(response);
  if (!mapped) {
    throw new Error("GeoAgent Space returned an unsupported payload");
  }

  return {
    ...mapped,
    source: "hf-space",
    model_ref:
      modelIdOpt !== ""
        ? `${getModelRef(spaceId)}|model=${modelIdOpt}`
        : getModelRef(spaceId),
  };
}

function ensureInferenceRuntime() {
  ensureWebStreamGlobals();
  ensureFetchGlobals();
}

module.exports = {
  ensureInferenceRuntime,
  getModelRef,
  getSpaceId,
  getSpaceUrl,
  isValidCoordinatePair,
  mapRemoteBody,
  predictGeoAgentFromBuffer,
};
