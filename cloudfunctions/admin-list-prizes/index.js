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
 * 管理员获取所有奖品列表
 */
exports.main = async (event, context) => {
  try {
    const raw = event && typeof event === "object" ? event : {};
    const data = raw.body && typeof raw.body === "object" ? raw.body : raw;

    const cloudbase_uid =
      context?.userInfo?.openId ||
      context?.userInfo?.uid ||
      (data.cloudbase_uid && String(data.cloudbase_uid).trim()) ||
      "";
    const email = data.email && String(data.email).trim();
    if (!cloudbase_uid && !email) return { errMsg: "未登录", prizes: [] };

    const db = getPool();
    const client = await db.connect();
    try {
      const userResult = await client.query(
        "SELECT id, role FROM users WHERE cloudbase_uid = $1 OR email = $2",
        [cloudbase_uid, email || cloudbase_uid]
      );
      if (userResult.rows.length === 0 || userResult.rows[0].role !== "admin") {
        return { errMsg: "无权限", prizes: [] };
      }

      const result = await client.query(
        `SELECT id, name, description, points_cost, stock, image_url, is_active, created_at
         FROM prizes ORDER BY created_at DESC`
      );
      const prizes = (result.rows || []).map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description || "",
        points_cost: r.points_cost,
        stock: r.stock,
        image_url: r.image_url || null,
        is_active: r.is_active,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : "",
      }));
      return { prizes };
    } finally {
      client.release();
    }
  } catch (err) {
    return { errMsg: err && err.message ? String(err.message) : "加载失败", prizes: [] };
  }
};
