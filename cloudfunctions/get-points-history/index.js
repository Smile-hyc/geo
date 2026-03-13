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
 * 获取用户积分明细
 * 入参：{ cloudbase_uid?, email? } 可选，用于 context 无 userInfo 时
 * 出参：{ entries: LedgerEntry[], total_earned: number }
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

    if (!cloudbase_uid) return { errMsg: "未登录", entries: [], total_earned: 0 };

    const db = getPool();
    const client = await db.connect();
    try {
      const userResult = await client.query(
        "SELECT id FROM users WHERE cloudbase_uid = $1 OR email = $2",
        [cloudbase_uid, clientEmail || cloudbase_uid]
      );
      if (userResult.rows.length === 0) return { entries: [], total_earned: 0 };
      const user_id = userResult.rows[0].id;

      const result = await client.query(
        `SELECT id, change_amount, balance_after, reason_type, created_at
         FROM points_ledger WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
        [user_id]
      );

      const entries = (result.rows || []).map((r) => ({
        id: r.id,
        change_amount: r.change_amount ?? 0,
        balance_after: r.balance_after ?? 0,
        reason_type: r.reason_type || "",
        created_at: r.created_at ? new Date(r.created_at).toISOString() : "",
      }));

      const total_earned = entries.reduce((sum, e) => sum + (e.change_amount > 0 ? e.change_amount : 0), 0);

      return { entries, total_earned };
    } finally {
      client.release();
    }
  } catch (err) {
    return { errMsg: err && err.message ? String(err.message) : "加载失败", entries: [], total_earned: 0 };
  }
};
