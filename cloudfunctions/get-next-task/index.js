"use strict";

const { Pool } = require("pg");

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

exports.main = async (event) => {
  const { mode } = event || {};
  /** 混合模式：与对战「综合」一致，使用全库图片池（不按 mode_tags 过滤） */
  const useModePool = Boolean(mode) && mode !== "mixed";

  const client = await pool.connect();
  try {
    const query = useModePool
      ? `SELECT id, storage_url, mode_tags, difficulty, lat, lng, true_location
         FROM image_assets
         WHERE $1 = ANY(mode_tags)
         ORDER BY RANDOM()
         LIMIT 1`
      : `SELECT id, storage_url, mode_tags, difficulty, lat, lng, true_location
         FROM image_assets
         ORDER BY RANDOM()
         LIMIT 1`;

    const params = useModePool ? [mode] : [];
    const result = await client.query(query, params);

    if (result.rows.length === 0) {
      return { task: null };
    }

    return { task: result.rows[0] };
  } catch (err) {
    return { errMsg: err.message || "Failed to fetch the next task." };
  } finally {
    client.release();
  }
};
