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
 * 并发安全：事务内对奖品行 FOR UPDATE；积分用条件 UPDATE 原子扣减；库存用条件 UPDATE 防超卖。
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
        "SELECT id FROM users WHERE cloudbase_uid = $1 OR email = $2",
        [cloudbase_uid, email || cloudbase_uid]
      );
      if (userResult.rows.length === 0) return { errMsg: "用户不存在" };
      const user_id = userResult.rows[0].id;

      await client.query("BEGIN");
      try {
        const prizeLock = await client.query(
          `SELECT id, name, points_cost, stock
           FROM prizes
           WHERE id = $1 AND is_active = true AND deleted_at IS NULL
           FOR UPDATE`,
          [prize_id]
        );
        if (prizeLock.rows.length === 0) {
          throw new Error("奖品不存在或已下架");
        }
        const prize = prizeLock.rows[0];
        const points_cost = parseInt(prize.points_cost, 10);
        const stock = parseInt(prize.stock, 10);
        if (Number.isNaN(points_cost) || points_cost < 0) {
          throw new Error("奖品数据异常");
        }
        if (stock <= 0) {
          throw new Error("奖品已兑完");
        }

        const balUpd = await client.query(
          `UPDATE users
           SET points_balance = points_balance - $1, updated_at = NOW()
           WHERE id = $2 AND points_balance >= $1
           RETURNING points_balance`,
          [points_cost, user_id]
        );
        if (balUpd.rows.length === 0) {
          throw new Error(`积分不足，需要 ${points_cost} 积分`);
        }
        const newBalance = parseInt(balUpd.rows[0].points_balance, 10) || 0;

        await client.query(
          "INSERT INTO points_ledger (user_id, change_amount, balance_after, reason_type) VALUES ($1, $2, $3, 'prize_redemption')",
          [user_id, -points_cost, newBalance]
        );

        const stockUpd = await client.query(
          `UPDATE prizes
           SET stock = stock - 1, updated_at = NOW()
           WHERE id = $1 AND stock > 0`,
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

        return {
          success: true,
          prize_name: prize.name,
          points_spent: points_cost,
          balance_after: newBalance,
        };
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      }
    } finally {
      client.release();
    }
  } catch (err) {
    return { errMsg: err && err.message ? String(err.message) : "兑换失败" };
  }
};
