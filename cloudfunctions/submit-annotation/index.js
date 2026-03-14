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

const BASE_REWARD = 50;

/**
 * 提交思维链 + BBox 数组 + 可选标注图，发积分
 * 入参：{ image_id, mode_type, thought_text, final_answer, confidence, annotated_image_base64?, bboxes? }
 * 出参：{ record_id, reward }
 */
exports.main = async (event, context) => {
  try {
    const raw = event && typeof event === "object" ? event : {};
    const data = raw.body && typeof raw.body === "object" ? raw.body : raw;

    const image_id = data.image_id;
    const mode_type = data.mode_type || "general";
    const thought_text = data.thought_text;
    const final_answer = data.final_answer || "";
    const confidence = data.confidence ?? 50;
    const annotated_image_base64 = data.annotated_image_base64;
    const bboxes = Array.isArray(data.bboxes) ? data.bboxes : [];

    if (!image_id || !thought_text) {
      return { errMsg: "缺少必要参数" };
    }

    const ctxUid =
      context?.userInfo?.openId ||
      context?.userInfo?.uid ||
      context?.userInfo?.user_id ||
      context?.userInfo?.sub ||
      "";
    const clientUid = data.cloudbase_uid && String(data.cloudbase_uid).trim();
    const clientEmail = data.email && String(data.email).trim();
    const cloudbase_uid = ctxUid || clientUid || clientEmail || "";
    if (!cloudbase_uid) return { errMsg: "未登录" };

    const db = getPool();
    const client = await db.connect();
    try {
      const userResult = await client.query(
        "SELECT id, points_balance FROM users WHERE cloudbase_uid = $1 OR email = $2",
        [cloudbase_uid, clientEmail || cloudbase_uid]
      );
      if (userResult.rows.length === 0) return { errMsg: "用户不存在，请先同步账号" };
      const user = userResult.rows[0];

      let annotatedImageUrl = null;
      if (annotated_image_base64 && typeof annotated_image_base64 === "string") {
        const buffer = Buffer.from(annotated_image_base64, "base64");
        const cloudPath = `annotations/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        const app = getApp(context);
        const uploadResult = await app.uploadFile({ cloudPath, fileContent: buffer });
        annotatedImageUrl = uploadResult && uploadResult.fileID ? String(uploadResult.fileID) : null;
      }

      const recordResult = await client.query(
        `INSERT INTO annotation_records
           (user_id, image_id, mode_type, thought_text, final_answer, confidence, annotated_image_url, quality_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
         RETURNING id`,
        [user.id, image_id, mode_type, thought_text, final_answer, confidence, annotatedImageUrl]
      );
      const record_id = recordResult.rows[0].id;

      if (bboxes.length > 0) {
        for (const bbox of bboxes) {
          await client.query(
            `INSERT INTO annotation_bboxes (record_id, x, y, width, height, label_type, explanation)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [record_id, bbox.x, bbox.y, bbox.width, bbox.height, bbox.label_type || "", bbox.explanation || ""]
          );
        }
      }

      // 积分改为审核通过后发放，防止刷分
      return { record_id, reward: 0 };
    } finally {
      client.release();
    }
  } catch (err) {
    const msg = err && err.message ? String(err.message) : "提交失败";
    return { errMsg: msg };
  }
};
