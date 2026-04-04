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
 * 管理员：分页查询兑换记录
 * 入参：{ limit?: number, offset?: number, cloudbase_uid?, email? }
 * 出参：{ redemptions: [...], total: number }
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
    if (!cloudbase_uid && !email) return { errMsg: "未登录", redemptions: [], total: 0 };

    const limit = Math.min(Math.max(Number(data.limit) || 50, 1), 200);
    const offset = Math.max(Number(data.offset) || 0, 0);

    const db = getPool();
    const client = await db.connect();
    try {
      const userResult = await client.query(
        "SELECT id, role FROM users WHERE cloudbase_uid = $1 OR email = $2",
        [cloudbase_uid, email || cloudbase_uid]
      );
      if (userResult.rows.length === 0 || userResult.rows[0].role !== "admin") {
        return { errMsg: "无权限", redemptions: [], total: 0 };
      }

      const countResult = await client.query(
        `SELECT COUNT(*)::int AS c FROM prize_redemptions`
      );
      const total = countResult.rows[0]?.c ?? 0;

      const result = await client.query(
        `SELECT pr.id,
                pr.user_id,
                pr.prize_id,
                pr.points_spent,
                pr.created_at,
                u.username,
                u.email,
                p.name AS prize_name,
                p.deleted_at AS prize_deleted_at
         FROM prize_redemptions pr
         JOIN users u ON u.id = pr.user_id
         JOIN prizes p ON p.id = pr.prize_id
         ORDER BY pr.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const redemptions = (result.rows || []).map((r) => ({
        id: r.id,
        user_id: r.user_id,
        prize_id: r.prize_id,
        points_spent: r.points_spent,
        username: r.username || "",
        email: r.email || "",
        prize_name: r.prize_name || "",
        prize_removed: r.prize_deleted_at != null,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : "",
      }));

      return { redemptions, total };
    } finally {
      client.release();
    }
  } catch (err) {
    return {
      errMsg: err && err.message ? String(err.message) : "加载失败",
      redemptions: [],
      total: 0,
    };
  }
};
