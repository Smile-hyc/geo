"use strict";

const { Pool } = require("pg");
const https = require("https");
const { URL } = require("url");

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 2,
        idleTimeoutMillis: 10000,
      }
    : {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || "5432", 10),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl:
          process.env.DB_SSL === "true"
            ? { rejectUnauthorized: false }
            : false,
        max: 2,
        idleTimeoutMillis: 10000,
      }
);

/** ~6MB 原图经 base64 后的安全上限 */
const MAX_BASE64_LEN = 9 * 1024 * 1024;
const REMOTE_TIMEOUT_MS = 60_000;
const REMOTE_BODY_MAX = 2 * 1024 * 1024;

/**
 * @param {string} urlString
 * @param {Record<string, unknown>} payload
 * @param {string} [apiKey]
 */
function postJson(urlString, payload, apiKey) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const url = new URL(urlString);
    const body = JSON.stringify(payload);
    const opts = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body, "utf8"),
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
    };

    const req = https.request(opts, (res) => {
      const chunks = [];
      let size = 0;
      res.on("data", (chunk) => {
        size += chunk.length;
        if (size > REMOTE_BODY_MAX) {
          if (!settled) {
            settled = true;
            req.destroy();
            reject(new Error("推理服务响应过大"));
          }
        } else {
          chunks.push(chunk);
        }
      });
      res.on("end", () => {
        if (settled) return;
        settled = true;
        const text = Buffer.concat(chunks).toString("utf8");
        resolve({ status: res.statusCode || 0, text });
      });
    });

    req.setTimeout(REMOTE_TIMEOUT_MS, () => {
      if (!settled) {
        settled = true;
        req.destroy();
        reject(new Error("推理服务请求超时"));
      }
    });

    req.on("error", (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    });

    req.write(body);
    req.end();
  });
}

/**
 * @param {unknown} parsed
 * @returns {{ address: string, chain_of_thought: string } | null}
 */
function mapRemoteBody(parsed) {
  if (!parsed || typeof parsed !== "object") return null;
  const o = /** @type {Record<string, unknown>} */ (parsed);
  const address =
    typeof o.address === "string"
      ? o.address
      : typeof o.predicted_address === "string"
        ? o.predicted_address
        : typeof o.location_text === "string"
          ? o.location_text
          : null;
  const chain =
    typeof o.chain_of_thought === "string"
      ? o.chain_of_thought
      : typeof o.thought === "string"
        ? o.thought
        : typeof o.reasoning === "string"
          ? o.reasoning
          : typeof o.cot === "string"
            ? o.cot
            : null;
  if (address == null || chain == null) return null;
  return { address, chain_of_thought: chain };
}

exports.main = async (event, context) => {
  try {
    const raw = event && typeof event === "object" ? event : {};
    const data = raw.body && typeof raw.body === "object" ? raw.body : raw;

    const cloudbase_uid =
      context?.userInfo?.openId ||
      context?.userInfo?.uid ||
      (data.cloudbase_uid && String(data.cloudbase_uid).trim()) ||
      "";
    const email = data.email && String(data.email).trim();

    if (!cloudbase_uid && !email) {
      return { errMsg: "未登录" };
    }

    let image_base64 = data.image_base64;
    if (typeof image_base64 !== "string" || !image_base64.trim()) {
      return { errMsg: "缺少 image_base64" };
    }
    image_base64 = image_base64.trim();
    if (image_base64.length > MAX_BASE64_LEN) {
      return { errMsg: "图片数据过大" };
    }

    const db = await pool.connect();
    try {
      let userResult;
      if (cloudbase_uid) {
        userResult = await db.query(
          "SELECT id FROM users WHERE cloudbase_uid = $1",
          [cloudbase_uid]
        );
      }
      if ((!userResult || userResult.rows.length === 0) && email) {
        userResult = await db.query("SELECT id FROM users WHERE email = $1", [
          email,
        ]);
      }
      if (!userResult || userResult.rows.length === 0) {
        return { errMsg: "用户记录不存在" };
      }
    } finally {
      db.release();
    }

    const serviceUrl =
      process.env.GEO_INFERENCE_SERVICE_URL &&
      String(process.env.GEO_INFERENCE_SERVICE_URL).trim();
    const mime_type = data.mime_type && String(data.mime_type).trim();

    if (!serviceUrl) {
      return {
        address:
          "（占位）请在 CloudBase 云函数环境变量中配置 GEO_INFERENCE_SERVICE_URL 后接入 GPU 推理服务。",
        chain_of_thought:
          "当前为占位模式：未向远程模型发送图片。部署兼容接口的推理 worker（HTTP POST JSON，返回字段 address 与 chain_of_thought，亦可使用 predicted_address / reasoning 等别名）后即可获得真实输出。参考模型：Hugging Face ghost233lism/GeoAgent。",
        source: "stub",
        model_ref: "ghost233lism/GeoAgent",
      };
    }

    const apiKey =
      process.env.GEO_INFERENCE_API_KEY &&
      String(process.env.GEO_INFERENCE_API_KEY).trim();

    /** @type {{ status: number, text: string }} */
    let res;
    try {
      res = await postJson(
        serviceUrl,
        { image_base64, ...(mime_type ? { mime_type } : {}) },
        apiKey || undefined
      );
    } catch (e) {
      const msg = e && e.message ? String(e.message) : "推理服务不可用";
      return { errMsg: msg };
    }

    if (res.status < 200 || res.status >= 300) {
      return { errMsg: `推理服务返回 HTTP ${res.status}` };
    }

    let parsed;
    try {
      parsed = JSON.parse(res.text);
    } catch {
      return { errMsg: "推理服务返回非 JSON" };
    }

    const mapped = mapRemoteBody(parsed);
    if (!mapped) {
      return {
        errMsg:
          "推理服务响应缺少 address / chain_of_thought（或可映射字段）",
      };
    }

    const extra =
      parsed && typeof parsed === "object"
        ? /** @type {Record<string, unknown>} */ (parsed)
        : {};

    return {
      address: mapped.address,
      chain_of_thought: mapped.chain_of_thought,
      source: "remote",
      model_ref:
        typeof extra.model_ref === "string" ? extra.model_ref : undefined,
    };
  } catch (e) {
    return { errMsg: e && e.message ? String(e.message) : "服务器错误" };
  }
};
