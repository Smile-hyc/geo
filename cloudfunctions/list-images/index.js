"use strict";

const { Pool } = require("pg");

let pool = null;

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

/**
 * 管理员获取已上传图片列表
 * 入参：{ limit?: number, offset?: number }
 * 出参：{ images: ImageAsset[] }
 */
exports.main = async (event) => {
  const raw = event && typeof event === "object" ? event : {};
  const limit = Math.min(Math.max(Number(raw.limit) || 30, 1), 100);
  const offset = Math.max(Number(raw.offset) || 0, 0);

  const db = getPool();
  const client = await db.connect();
  try {
    const result = await client.query(
      `SELECT id, storage_url, true_location, mode_tags, difficulty, created_at
       FROM image_assets
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const images = (result.rows || []).map((r) => ({
      id: r.id,
      storage_url: r.storage_url,
      true_location: r.true_location,
      mode_tags: Array.isArray(r.mode_tags) ? r.mode_tags : [],
      difficulty: r.difficulty ?? 1,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : "",
    }));
    return { images };
  } catch (err) {
    return { errMsg: err.message || "获取图片列表失败", images: [] };
  } finally {
    client.release();
  }
};
