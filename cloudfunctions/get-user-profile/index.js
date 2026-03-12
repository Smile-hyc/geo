"use strict";

const { Pool } = require("pg");

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2, idleTimeoutMillis: 10000 }
    : { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || "5432"), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD, ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false, max: 2, idleTimeoutMillis: 10000 }
);

/**
 * 返回用户信息 + 积分 + 标注统计
 * 出参：{ user: { id, username, email, role, points_balance, level, annotation_count, battle_count } }
 */
exports.main = async (event, context) => {
  const cloudbase_uid = context?.userInfo?.openId || context?.userInfo?.uid || "";
  if (!cloudbase_uid) return { errMsg: "未登录" };

  const client = await pool.connect();
  try {
    const userResult = await client.query(
      "SELECT id, username, email, role, points_balance, level FROM users WHERE cloudbase_uid = $1",
      [cloudbase_uid]
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
        annotation_count: parseInt(stats.annotation_count),
        battle_count: parseInt(stats.battle_count),
      },
    };
  } catch (err) {
    return { errMsg: err.message || "获取用户信息失败" };
  } finally {
    client.release();
  }
};
