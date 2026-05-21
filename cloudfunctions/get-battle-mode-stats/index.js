"use strict";

const { Pool } = require("pg");

const VALID_MODES = new Set(["general", "street_view", "remote_sensing", "terrain"]);

let pool = null;

function getPool() {
  if (!pool) {
    pool = new Pool(
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
            ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
            max: 2,
            idleTimeoutMillis: 10000,
          }
    );
  }
  return pool;
}

/**
 * 指定模式的全服对战统计
 * 入参：{ mode_type: string }
 * 出参：{
 *   mode_type,
 *   total_battles,
 *   count_7d,
 *   daily_counts: number[7],  // 近 7 个自然日（含今日），由旧到新
 *   as_of
 * }
 */
exports.main = async (event) => {
  try {
    const raw = event && typeof event === "object" ? event : {};
    const data = raw.body && typeof raw.body === "object" ? raw.body : raw;

    const mode_type = data.mode_type && String(data.mode_type).trim();
    if (!mode_type || !VALID_MODES.has(mode_type)) {
      return { errMsg: "无效的模式参数" };
    }

    const db = getPool();
    const client = await db.connect();
    try {
      const totalResult = await client.query(
        `SELECT COUNT(*)::int AS total
         FROM battle_sessions
         WHERE mode_type = $1
           AND status IN ('finished', 'rewarded')`,
        [mode_type]
      );

      const dailyResult = await client.query(
        `WITH days AS (
           SELECT generate_series(
             (CURRENT_DATE - INTERVAL '6 days')::date,
             CURRENT_DATE::date,
             '1 day'::interval
           )::date AS day
         ),
         counts AS (
           SELECT
             DATE(COALESCE(finished_at, created_at)) AS day,
             COUNT(*)::int AS cnt
           FROM battle_sessions
           WHERE mode_type = $1
             AND status IN ('finished', 'rewarded')
             AND COALESCE(finished_at, created_at) >= CURRENT_DATE - INTERVAL '6 days'
             AND COALESCE(finished_at, created_at) < CURRENT_DATE + INTERVAL '1 day'
           GROUP BY 1
         )
         SELECT d.day, COALESCE(c.cnt, 0)::int AS count
         FROM days d
         LEFT JOIN counts c ON c.day = d.day
         ORDER BY d.day ASC`,
        [mode_type]
      );

      const daily_counts = (dailyResult.rows || []).map((row) => parseInt(row.count, 10) || 0);
      const count_7d = daily_counts.reduce((sum, n) => sum + n, 0);

      return {
        mode_type,
        total_battles: parseInt(totalResult.rows[0]?.total, 10) || 0,
        count_7d,
        daily_counts,
        as_of: new Date().toISOString(),
      };
    } finally {
      client.release();
    }
  } catch (err) {
    return { errMsg: err && err.message ? String(err.message) : "获取模式对战统计失败" };
  }
};
