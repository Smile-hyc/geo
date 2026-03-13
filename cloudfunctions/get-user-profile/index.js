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
 * 返回用户信息 + 积分 + 标注统计
 * 入参：{ cloudbase_uid?, email? } 可选，用于 context 无 userInfo 时
 * 出参：{ user: { id, username, email, role, points_balance, level, annotation_count, battle_count } }
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
        "SELECT id, username, email, role, points_balance, level FROM users WHERE cloudbase_uid = $1 OR email = $2",
        [cloudbase_uid, clientEmail || cloudbase_uid]
      );
      if (userResult.rows.length === 0) return { errMsg: "用户不存在" };
      const user = userResult.rows[0];

      const statsResult = await client.query(
        `SELECT
           (SELECT COUNT(*) FROM annotation_records WHERE user_id = $1) AS annotation_count,
           (SELECT COUNT(*) FROM battle_sessions WHERE user_id = $1) AS battle_count`,
        [user.id]
      );
      const stats = statsResult.rows[0];

      return {
        user: {
          ...user,
          annotation_count: parseInt(stats.annotation_count, 10) || 0,
          battle_count: parseInt(stats.battle_count, 10) || 0,
        },
      };
    } finally {
      client.release();
    }
  } catch (err) {
    return { errMsg: err && err.message ? String(err.message) : "获取用户信息失败" };
  }
};
