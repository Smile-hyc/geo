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
 * 管理员删除奖品
 * 入参：{ prize_id, cloudbase_uid?, email? }
 */
exports.main = async (event, context) => {
  try {
    const raw = event && typeof event === "object" ? event : {};
    const data = raw.body && typeof raw.body === "object" ? raw.body : raw;
    const prize_id = parseInt(data.prize_id, 10);

    const cloudbase_uid =
      context?.userInfo?.openId ||
      context?.userInfo?.uid ||
      (data.cloudbase_uid && String(data.cloudbase_uid).trim()) ||
      "";
    const email = data.email && String(data.email).trim();
    if (!cloudbase_uid && !email) return { errMsg: "未登录" };
    if (!prize_id || isNaN(prize_id)) return { errMsg: "缺少 prize_id" };

    const db = getPool();
    const client = await db.connect();
    try {
      const userResult = await client.query(
        "SELECT id, role FROM users WHERE cloudbase_uid = $1 OR email = $2",
        [cloudbase_uid, email || cloudbase_uid]
      );
      if (userResult.rows.length === 0 || userResult.rows[0].role !== "admin") {
        return { errMsg: "无权限" };
      }

      await client.query("DELETE FROM prize_redemptions WHERE prize_id = $1", [prize_id]);
      await client.query("DELETE FROM prizes WHERE id = $1", [prize_id]);
      return { success: true };
    } finally {
      client.release();
    }
  } catch (err) {
    return { errMsg: err && err.message ? String(err.message) : "删除失败" };
  }
};
