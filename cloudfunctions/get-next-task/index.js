"use strict";

const { Pool } = require("pg");

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2, idleTimeoutMillis: 10000 }
    : { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || "5432"), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD, ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false, max: 2, idleTimeoutMillis: 10000 }
);

/**
 * 返回下一个标注任务（支持 mode 过滤）
 * 入参：{ mode?: string }
 * 出参：{ task: { id, storage_url, mode_tags, difficulty } | null }
 */
exports.main = async (event) => {
  const { mode } = event || {};

  const client = await pool.connect();
  try {
    let query;
    let params;

    if (mode) {
      query = `SELECT id, storage_url, mode_tags, difficulty
               FROM image_assets
               WHERE $1 = ANY(mode_tags)
               ORDER BY RANDOM()
               LIMIT 1`;
      params = [mode];
    } else {
      query = `SELECT id, storage_url, mode_tags, difficulty
               FROM image_assets
               ORDER BY RANDOM()
               LIMIT 1`;
      params = [];
    }

    const result = await client.query(query, params);
    if (result.rows.length === 0) {
      return { task: null };
    }
    return { task: result.rows[0] };
  } catch (err) {
    return { errMsg: err.message || "获取任务失败" };
  } finally {
    client.release();
  }
};
