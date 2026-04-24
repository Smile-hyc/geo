"use client";

import type { GeoInferenceResult } from "@/lib/cloudbase";

const DEFAULT_SPACE_ID = "EugeneZhao/geoagent-api";
const DEFAULT_SPACE_URL =
  process.env.NEXT_PUBLIC_GEO_INFERENCE_SPACE_URL?.trim() ||
  "https://eugenezhao-geoagent-api.hf.space";
const DEFAULT_PROMPT =
  '请基于图片判断具体地点，并用简体中文输出推理过程。如果返回 JSON，请保留英文键名（如 "FinalAnswer"、"ChainOfThought"），但所有值都使用简体中文。';
const DEFAULT_MAX_NEW_TOKENS = 2048;

const SECTION_LABELS: Record<string, string> = {
  CountryIdentification: "国家判断",
  RegionalGuess: "区域猜测",
  PreciseLocalization: "精确定位",
};

const FIELD_LABELS: Record<string, string> = {
  Conclusion: "结论",
  conclusion: "结论",
  Reasoning: "推理",
  reasoning: "推理",
  Clues: "线索",
  clues: "线索",
  Uncertainty: "不确定性",
  uncertainty: "不确定性",
};

const VALUE_LABELS: Record<string, string> = {
  Low: "低",
  Medium: "中",
  High: "高",
};

function buildSpaceUrl(pathname: string): string {
  return new URL(pathname, DEFAULT_SPACE_URL).toString();
}

async function ensureSuccess(response: Response, context: string) {
  if (response.ok) return;

  let detail = "";
  try {
    detail = (await response.text()).trim();
  } catch {
    // Ignore secondary read failures.
  }

  throw new Error(
    `${context} failed with ${response.status}${detail ? `: ${detail}` : ""}`
  );
}

function safeParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function maybeParseEmbeddedJson(value: unknown): unknown {
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

function unwrapRemoteResult(value: unknown): unknown {
  let current = maybeParseEmbeddedJson(value);

  for (let index = 0; index < 5; index += 1) {
    current = maybeParseEmbeddedJson(current);

    if (Array.isArray(current) && current.length === 1) {
      current = current[0];
      continue;
    }

    if (current && typeof current === "object") {
      const record = current as Record<string, unknown>;
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

function pickString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function formatChainSection(
  title: string,
  value: unknown
): string | null {
  if (!value || typeof value !== "object") return null;

  const section = value as Record<string, unknown>;
  const parts: string[] = [];
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

function formatChainOfThought(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const sections = Object.entries(record)
    .map(([key, sectionValue]) => formatChainSection(key, sectionValue))
    .filter((item): item is string => Boolean(item));

  if (sections.length > 0) {
    return sections.join("\n\n");
  }

  const serialized = JSON.stringify(record, null, 2);
  return serialized && serialized !== "{}" ? serialized : null;
}

function pickNumber(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    const number =
      typeof value === "number" ? value : Number.parseFloat(String(value || ""));
    if (Number.isFinite(number)) {
      return number;
    }
  }
  return null;
}

function extractCoordinatesFromText(text: string): {
  latitude: number | null;
  longitude: number | null;
} {
  const value = text.trim();
  if (!value) return { latitude: null, longitude: null };

  const latLabel = value.match(/lat(?:itude)?\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i);
  const lngLabel = value.match(
    /(?:lng|lon|long|longitude)\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i
  );
  if (latLabel && lngLabel) {
    return {
      latitude: Number.parseFloat(latLabel[1]),
      longitude: Number.parseFloat(lngLabel[1]),
    };
  }

  const pairContext = value.match(
    /(?:coordinate|coordinates|coords)[^-\d]{0,20}(-?\d{1,2}(?:\.\d+)?)\s*[, ]+\s*(-?\d{1,3}(?:\.\d+)?)/i
  );
  if (pairContext) {
    return {
      latitude: Number.parseFloat(pairContext[1]),
      longitude: Number.parseFloat(pairContext[2]),
    };
  }

  return { latitude: null, longitude: null };
}

function mapTextPayload(text: string): GeoInferenceResult | null {
  const raw = text.trim();
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
    /(?:final(?:\s+answer|\s+guess)?|predicted(?:\s+address|\s+location)?|location|address)\s*[:：]\s*(.+)/i
  );
  const coords = extractCoordinatesFromText(raw);

  return {
    address: (addressMatch?.[1] || firstLine).trim(),
    chain_of_thought: raw,
    latitude: coords.latitude ?? undefined,
    longitude: coords.longitude ?? undefined,
    source: "remote",
    model_ref: `hf-space:${DEFAULT_SPACE_ID}`,
  };
}

function mapObjectPayload(record: Record<string, unknown>): GeoInferenceResult | null {
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
    const coordinates = record.coordinates as Record<string, unknown>;
    latitude = latitude ?? pickNumber(coordinates, ["latitude", "lat", "y"]);
    longitude =
      longitude ?? pickNumber(coordinates, ["longitude", "lng", "lon", "x"]);
  }

  const textFallback = chain || address;
  const textMapped =
    typeof textFallback === "string" ? mapTextPayload(textFallback) : null;

  const finalAddress = address || textMapped?.address || null;
  const finalChain = chain || textMapped?.chain_of_thought || null;

  if (latitude == null || longitude == null) {
    const coords =
      typeof textFallback === "string"
        ? extractCoordinatesFromText(textFallback)
        : { latitude: null, longitude: null };
    latitude = latitude ?? coords.latitude;
    longitude = longitude ?? coords.longitude;
  }

  if (!finalAddress && !finalChain) return null;

  return {
    address: finalAddress || finalChain || "Unknown location",
    chain_of_thought: finalChain || finalAddress || "",
    latitude: latitude ?? undefined,
    longitude: longitude ?? undefined,
    source: "remote",
    model_ref: `hf-space:${DEFAULT_SPACE_ID}`,
  };
}

function mapRemoteBody(payload: unknown): GeoInferenceResult | null {
  const unwrapped = unwrapRemoteResult(payload);

  if (typeof unwrapped === "string") {
    return mapTextPayload(unwrapped);
  }

  if (Array.isArray(unwrapped) && unwrapped.length > 0) {
    return mapRemoteBody(unwrapped[0]);
  }

  if (unwrapped && typeof unwrapped === "object") {
    return mapObjectPayload(unwrapped as Record<string, unknown>);
  }

  return null;
}

function parseSseEvents(text: string): Array<{ event: string; data: string }> {
  const events: Array<{ event: string; data: string }> = [];
  let eventName = "message";
  let dataLines: string[] = [];

  const flush = () => {
    if (!dataLines.length) return;
    events.push({ event: eventName, data: dataLines.join("\n") });
    eventName = "message";
    dataLines = [];
  };

  for (const rawLine of text.split(/\r?\n/)) {
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

async function uploadFile(file: File, signal?: AbortSignal): Promise<string> {
  const formData = new FormData();
  formData.append("files", file);

  const response = await fetch(buildSpaceUrl("/gradio_api/upload"), {
    method: "POST",
    body: formData,
    signal,
  });
  await ensureSuccess(response, "GeoAgent upload");

  const payload = (await response.json()) as unknown;
  const uploadedPath = Array.isArray(payload) ? payload[0] : null;
  if (typeof uploadedPath !== "string" || !uploadedPath.trim()) {
    throw new Error("GeoAgent upload did not return a file path");
  }

  return uploadedPath.trim();
}

async function startPrediction(
  uploadedPath: string,
  prompt: string,
  maxNewTokens: number,
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch(buildSpaceUrl("/gradio_api/call/v2/predict"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: {
        path: uploadedPath,
        meta: { _type: "gradio.FileData" },
      },
      prompt,
      max_new_tokens: maxNewTokens,
    }),
    signal,
  });
  await ensureSuccess(response, "GeoAgent predict");

  const payload = (await response.json()) as { event_id?: string };
  const eventId = typeof payload.event_id === "string" ? payload.event_id.trim() : "";
  if (!eventId) {
    throw new Error("GeoAgent predict did not return an event_id");
  }

  return eventId;
}

async function fetchPredictionPayload(
  eventId: string,
  signal?: AbortSignal
): Promise<unknown> {
  const response = await fetch(
    buildSpaceUrl(`/gradio_api/call/predict/${encodeURIComponent(eventId)}`),
    { method: "GET", signal }
  );
  await ensureSuccess(response, "GeoAgent result");

  const text = await response.text();
  const events = parseSseEvents(text);

  const completeEvent = [...events].reverse().find((event) => event.event === "complete");
  if (!completeEvent) {
    const errorEvent = [...events].reverse().find((event) => event.event === "error");
    if (errorEvent) {
      throw new Error(`GeoAgent Space returned error: ${errorEvent.data}`);
    }
    throw new Error("GeoAgent result stream did not include a complete event");
  }

  const parsed = safeParseJson(completeEvent.data);
  return parsed != null ? parsed : completeEvent.data;
}

export type GeoInferencePhase = "upload" | "predict" | "poll";

const DEFAULT_INFERENCE_TIMEOUT_MS = 120_000;

function isAbortError(reason: unknown): boolean {
  return (
    (reason instanceof Error && reason.name === "AbortError") ||
    (typeof DOMException !== "undefined" &&
      reason instanceof DOMException &&
      reason.name === "AbortError")
  );
}

export async function runGeoInferenceFromSpace(params: {
  file: File;
  prompt?: string;
  maxNewTokens?: number;
  /** 当前阶段：上传 → 发起任务 → 等待推理结果 */
  onPhase?: (phase: GeoInferencePhase) => void;
  /** 全流程超时（毫秒），默认 120000 */
  timeoutMs?: number;
}): Promise<GeoInferenceResult> {
  const prompt = params.prompt?.trim() || DEFAULT_PROMPT;
  const maxNewTokens = Math.min(
    4096,
    Math.max(64, params.maxNewTokens ?? DEFAULT_MAX_NEW_TOKENS)
  );
  const timeoutMs = params.timeoutMs ?? DEFAULT_INFERENCE_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    params.onPhase?.("upload");
    const uploadedPath = await uploadFile(params.file, controller.signal);
    params.onPhase?.("predict");
    const eventId = await startPrediction(
      uploadedPath,
      prompt,
      maxNewTokens,
      controller.signal
    );
    params.onPhase?.("poll");
    const payload = await fetchPredictionPayload(eventId, controller.signal);
    const mapped = mapRemoteBody(payload);

    if (!mapped) {
      throw new Error("GeoAgent Space returned an unsupported payload");
    }

    return mapped;
  } catch (reason) {
    if (isAbortError(reason)) {
      throw new Error("推理等待超时，请检查网络后重试。");
    }
    throw reason;
  } finally {
    clearTimeout(timeoutId);
  }
}
