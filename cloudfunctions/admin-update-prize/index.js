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
 * 管理员更新奖品
 * 入参：{ prize_id, name?, description?, points_cost?, stock?, image_url?, is_active?, cloudbase_uid?, email? }
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

      const existResult = await client.query(
        "SELECT id, deleted_at FROM prizes WHERE id = $1",
        [prize_id]
      );
      if (existResult.rows.length === 0) return { errMsg: "奖品不存在" };
      if (existResult.rows[0].deleted_at != null) {
        return { errMsg: "该奖品已移除，无法编辑" };
      }

      const updates = [];
      const values = [];
      let idx = 1;
      if (data.name !== undefined) {
        updates.push(`name = $${idx++}`);
        values.push(String(data.name).trim());
      }
      if (data.description !== undefined) {
        updates.push(`description = $${idx++}`);
        values.push(data.description ? String(data.description).trim() : null);
      }
      if (data.points_cost !== undefined) {
        const v = parseInt(data.points_cost, 10);
        if (!isNaN(v) && v >= 0) {
          updates.push(`points_cost = $${idx++}`);
          values.push(v);
        }
      }
      if (data.stock !== undefined) {
        const v = parseInt(data.stock, 10);
        if (!isNaN(v) && v >= 0) {
          updates.push(`stock = $${idx++}`);
          values.push(v);
        }
      }
      if (data.image_url !== undefined) {
        updates.push(`image_url = $${idx++}`);
        values.push(data.image_url ? String(data.image_url).trim() : null);
      }
      if (data.is_active !== undefined) {
        updates.push(`is_active = $${idx++}`);
        values.push(!!data.is_active);
      }
      if (updates.length === 0) return { success: true };

      updates.push("updated_at = NOW()");
      values.push(prize_id);
      await client.query(
        `UPDATE prizes SET ${updates.join(", ")} WHERE id = $${idx}`,
        values
      );
      return { success: true };
    } finally {
      client.release();
    }
  } catch (err) {
    return { errMsg: err && err.message ? String(err.message) : "更新失败" };
  }
};
