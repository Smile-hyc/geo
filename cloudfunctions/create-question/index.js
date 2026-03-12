"use strict";

const { Pool } = require("pg");
const tcb = require("@cloudbase/node-sdk");

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2, idleTimeoutMillis: 10000 }
    : { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || "5432"), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD, ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false, max: 2, idleTimeoutMillis: 10000 }
);

const cbApp = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV });

/**
 * 管理员上传图片，写入 PostgreSQL ImageAsset
 * 入参：{ original_image_base64, true_location, lat?, lng?, mode_tags?, difficulty? }
 * 出参：{ question_id }
 */
exports.main = async (event, context) => {
  const {
    original_image_base64, true_location, lat, lng,
    mode_tags, difficulty,
  } = event;

  if (!original_image_base64 || !true_location) {
    return { errMsg: "缺少 original_image_base64 或 true_location" };
  }

  const buffer = Buffer.from(original_image_base64, "base64");
  const cloudPath = `questions/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

  const uploadResult = await cbApp.uploadFile({ cloudPath, fileContent: buffer });
  const fileID = uploadResult.fileID;
  if (!fileID) return { errMsg: "上传云存储失败" };

  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO image_assets (storage_url, lat, lng, true_location, mode_tags, difficulty)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        fileID,
        lat ?? null,
        lng ?? null,
        true_location.trim(),
        mode_tags ?? [],
        difficulty ?? 1,
      ]
    );
    return { question_id: result.rows[0].id };
  } catch (err) {
    return { errMsg: err.message || "写入数据库失败" };
  } finally {
    client.release();
  }
};
