"use strict";

const { Pool } = require("pg");

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
 * 各地理定位模式下的个人历史最高对战得分
 * 入参：{ cloudbase_uid?, email? }
 * 出参：{ high_scores: [{ mode_type, best_score, achieved_at }] }
 */
exports.main = async (event, context) => {
  try {
    const raw = event && typeof event === "object" ? event : {};
    const data = raw.body && typeof raw.body === "object" ? raw.body : raw;

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
        "SELECT id FROM users WHERE cloudbase_uid = $1 OR email = $2",
        [cloudbase_uid, clientEmail || cloudbase_uid]
      );
      if (userResult.rows.length === 0) return { errMsg: "用户不存在" };
      const userId = userResult.rows[0].id;

      const scoresResult = await client.query(
        `WITH ranked AS (
           SELECT
             mode_type,
             user_total_score,
             COALESCE(finished_at, created_at) AS achieved_at,
             ROW_NUMBER() OVER (
               PARTITION BY mode_type
               ORDER BY user_total_score DESC, COALESCE(finished_at, created_at) DESC
             ) AS rn
           FROM battle_sessions
           WHERE user_id = $1
             AND status IN ('finished', 'rewarded')
         )
         SELECT mode_type, user_total_score AS best_score, achieved_at
         FROM ranked
         WHERE rn = 1
         ORDER BY mode_type ASC`,
        [userId]
      );

      const high_scores = (scoresResult.rows || []).map((row) => ({
        mode_type: row.mode_type,
        best_score: parseInt(row.best_score, 10) || 0,
        achieved_at: row.achieved_at ? new Date(row.achieved_at).toISOString() : null,
      }));

      return { high_scores };
    } finally {
      client.release();
    }
  } catch (err) {
    return { errMsg: err && err.message ? String(err.message) : "获取模式最高分失败" };
  }
};
