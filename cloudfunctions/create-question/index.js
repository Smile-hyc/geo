"use strict";

const { Pool } = require("pg");
const tcb = require("@cloudbase/node-sdk");

let pool = null;
let cbApp = null;

function getPool() {
  if (!pool) {
    pool = new Pool(
      process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2, idleTimeoutMillis: 10000 }
        : { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || "5432", 10), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD, ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false, max: 2, idleTimeoutMillis: 10000 }
    );
  }
  return pool;
}

function getApp(context) {
  if (!cbApp) {
    const opts = { env: tcb.SYMBOL_CURRENT_ENV };
    if (context) opts.context = context;
    cbApp = tcb.init(opts);
  }
  return cbApp;
}

/**
 * 管理员上传图片，写入 PostgreSQL ImageAsset
 * 入参：{ original_image_base64, true_location, lat?, lng?, mode_tags?, difficulty? }
 * 出参：{ question_id }
 */
exports.main = async (event, context) => {
  try {
    const raw = event && typeof event === "object" ? event : {};
    const data = raw.body && typeof raw.body === "object" ? raw.body : raw;
    const original_image_base64 = data.original_image_base64;
    const true_location = data.true_location;
    const lat = data.lat;
    const lng = data.lng;
    const mode_tags = Array.isArray(data.mode_tags) ? data.mode_tags : (data.mode_tags ? [data.mode_tags] : []);
    const difficulty = typeof data.difficulty === "number" ? data.difficulty : (parseInt(data.difficulty, 10) || 1);

    if (!original_image_base64 || typeof original_image_base64 !== "string") {
      return { errMsg: "缺少 original_image_base64" };
    }
    if (!true_location || typeof true_location !== "string" || !String(true_location).trim()) {
      return { errMsg: "缺少 true_location" };
    }

    const buffer = Buffer.from(original_image_base64, "base64");
    const cloudPath = `questions/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

    const app = getApp(context);
    const uploadResult = await app.uploadFile({ cloudPath, fileContent: buffer });
    const fileID = uploadResult && uploadResult.fileID ? String(uploadResult.fileID) : null;
    if (!fileID) {
      return { errMsg: "上传云存储失败" };
    }

    const db = getPool();
    const client = await db.connect();
    try {
      const result = await client.query(
        `INSERT INTO image_assets (storage_url, lat, lng, true_location, mode_tags, difficulty)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          fileID,
          lat != null ? parseFloat(lat) : null,
          lng != null ? parseFloat(lng) : null,
          String(true_location).trim(),
          mode_tags,
          difficulty,
        ]
      );
      const id = result.rows[0] && result.rows[0].id;
      if (id == null) return { errMsg: "写入数据库失败" };
      return { question_id: Number(id) };
    } finally {
      client.release();
    }
  } catch (err) {
    const msg = err && err.message ? String(err.message) : "未知错误";
    return { errMsg: msg };
  }
};
