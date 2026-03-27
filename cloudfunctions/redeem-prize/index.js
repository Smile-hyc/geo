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
 * 用户兑换奖品
 * 入参：{ prize_id: number, cloudbase_uid?, email? }
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
    if (!prize_id || isNaN(prize_id)) return { errMsg: "请选择奖品" };

    const db = getPool();
    const client = await db.connect();
    try {
      const userResult = await client.query(
        "SELECT id, points_balance FROM users WHERE cloudbase_uid = $1 OR email = $2",
        [cloudbase_uid, email || cloudbase_uid]
      );
      if (userResult.rows.length === 0) return { errMsg: "用户不存在" };
      const user = userResult.rows[0];
      const user_id = user.id;
      const user_balance = parseInt(user.points_balance, 10) || 0;

      const prizeResult = await client.query(
        "SELECT id, name, points_cost, stock FROM prizes WHERE id = $1 AND is_active = true AND deleted_at IS NULL",
        [prize_id]
      );
      if (prizeResult.rows.length === 0) return { errMsg: "奖品不存在或已下架" };
      const prize = prizeResult.rows[0];
      const points_cost = parseInt(prize.points_cost, 10);
      const stock = parseInt(prize.stock, 10);
      if (stock <= 0) return { errMsg: "奖品已兑完" };
      if (user_balance < points_cost) return { errMsg: `积分不足，需要 ${points_cost} 积分` };

      await client.query("BEGIN");
      try {
        const newBalance = user_balance - points_cost;
        await client.query(
          "UPDATE users SET points_balance = $1, updated_at = NOW() WHERE id = $2",
          [newBalance, user_id]
        );
        await client.query(
          "INSERT INTO points_ledger (user_id, change_amount, balance_after, reason_type) VALUES ($1, $2, $3, 'prize_redemption')",
          [user_id, -points_cost, newBalance]
        );
        const stockUpd = await client.query(
          "UPDATE prizes SET stock = stock - 1, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL AND stock > 0",
          [prize_id]
        );
        if (stockUpd.rowCount === 0) {
          throw new Error("库存不足或奖品已下架");
        }
        await client.query(
          "INSERT INTO prize_redemptions (user_id, prize_id, points_spent) VALUES ($1, $2, $3)",
          [user_id, prize_id, points_cost]
        );
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      }

      return {
        success: true,
        prize_name: prize.name,
        points_spent: points_cost,
        balance_after: user_balance - points_cost,
      };
    } finally {
      client.release();
    }
  } catch (err) {
    return { errMsg: err && err.message ? String(err.message) : "兑换失败" };
  }
};
