"use strict";

const {
  isValidCoordinatePair,
  predictGeoAgentFromBuffer,
} = require("./_shared/hfSpace");

const DEFAULT_PROMPT =
  "Based on the image, tell me the specific location and your thinking process";
const DEFAULT_MAX_NEW_TOKENS = 2048;
const MAX_BASE64_LEN = 9 * 1024 * 1024;

function getData(event) {
  const raw = event && typeof event === "object" ? event : {};
  return raw.body && typeof raw.body === "object" ? raw.body : raw;
}

function normalizePrompt(value) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : DEFAULT_PROMPT;
}

function normalizeMaxNewTokens(value) {
  const parsed =
    typeof value === "number" ? value : parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) return DEFAULT_MAX_NEW_TOKENS;
  return Math.min(4096, Math.max(64, parsed));
}

exports.main = async (event) => {
  try {
    const data = getData(event);

    let imageBase64 = data.image_base64;
    if (typeof imageBase64 !== "string" || !imageBase64.trim()) {
      return { errMsg: "Missing image_base64." };
    }
    imageBase64 = imageBase64.trim();
    if (imageBase64.length > MAX_BASE64_LEN) {
      return { errMsg: "Image payload is too large." };
    }

    const prompt = normalizePrompt(data.prompt);
    const maxNewTokens = normalizeMaxNewTokens(data.max_new_tokens);
    const imageBuffer = Buffer.from(imageBase64, "base64");

    let predicted;
    try {
      predicted = await predictGeoAgentFromBuffer({
        buffer: imageBuffer,
        prompt,
        maxNewTokens,
      });
    } catch (error) {
      return {
        errMsg:
          error && error.message
            ? String(error.message)
            : "GeoAgent Space request failed.",
      };
    }

    const result = {
      address: predicted.address,
      chain_of_thought: predicted.chain_of_thought,
      source: "remote",
      model_ref: predicted.model_ref,
    };

    if (isValidCoordinatePair(predicted.latitude, predicted.longitude)) {
      result.latitude = predicted.latitude;
      result.longitude = predicted.longitude;
    }

    return result;
  } catch (error) {
    return {
      errMsg:
        error && error.message ? String(error.message) : "Server error.",
    };
  }
};
