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
 * 指定地理定位模式下，按用户历史最高对战得分排名
 * 入参：{ mode_type: string, limit?: number }
 * 出参：{ leaderboard: [{ rank, username, best_score }] }
 */
exports.main = async (event) => {
  try {
    const raw = event && typeof event === "object" ? event : {};
    const data = raw.body && typeof raw.body === "object" ? raw.body : raw;

    const mode_type = data.mode_type && String(data.mode_type).trim();
    if (!mode_type || !VALID_MODES.has(mode_type)) {
      return { errMsg: "无效的模式参数" };
    }

    const limit = Math.min(Math.max(parseInt(data.limit, 10) || 5, 1), 50);

    const db = getPool();
    const client = await db.connect();
    try {
      const result = await client.query(
        `WITH user_best AS (
           SELECT
             u.username,
             MAX(bs.user_total_score)::int AS best_score
           FROM battle_sessions bs
           JOIN users u ON u.id = bs.user_id
           WHERE bs.mode_type = $1
             AND bs.status IN ('finished', 'rewarded')
           GROUP BY u.id, u.username
         )
         SELECT
           username,
           best_score,
           ROW_NUMBER() OVER (ORDER BY best_score DESC, username ASC) AS rank
         FROM user_best
         ORDER BY best_score DESC, username ASC
         LIMIT $2`,
        [mode_type, limit]
      );

      const leaderboard = (result.rows || []).map((row) => ({
        rank: parseInt(row.rank, 10) || 0,
        username: row.username,
        best_score: parseInt(row.best_score, 10) || 0,
      }));

      return { leaderboard, mode_type };
    } finally {
      client.release();
    }
  } catch (err) {
    return { errMsg: err && err.message ? String(err.message) : "获取模式排行榜失败" };
  }
};
