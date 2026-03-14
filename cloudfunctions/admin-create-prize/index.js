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
 * 管理员添加奖品
 * 入参：{ name, description?, points_cost, stock, image_url?, cloudbase_uid?, email? }
 */
exports.main = async (event, context) => {
  try {
    const raw = event && typeof event === "object" ? event : {};
    const data = raw.body && typeof raw.body === "object" ? raw.body : raw;
    const name = data.name && String(data.name).trim();
    const description = data.description ? String(data.description).trim() : null;
    const points_cost = parseInt(data.points_cost, 10);
    const stock = parseInt(data.stock, 10) || 0;
    const image_url = data.image_url ? String(data.image_url).trim() : null;

    const cloudbase_uid =
      context?.userInfo?.openId ||
      context?.userInfo?.uid ||
      (data.cloudbase_uid && String(data.cloudbase_uid).trim()) ||
      "";
    const email = data.email && String(data.email).trim();
    if (!cloudbase_uid && !email) return { errMsg: "未登录" };
    if (!name) return { errMsg: "请输入奖品名称" };
    if (isNaN(points_cost) || points_cost < 0) return { errMsg: "积分兑换需大于等于 0" };

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

      const result = await client.query(
        `INSERT INTO prizes (name, description, points_cost, stock, image_url, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
         RETURNING id`,
        [name, description, points_cost, stock >= 0 ? stock : 0, image_url]
      );
      const prize_id = result.rows[0]?.id;
      return { prize_id: prize_id || 0 };
    } finally {
      client.release();
    }
  } catch (err) {
    return { errMsg: err && err.message ? String(err.message) : "添加失败" };
  }
};
