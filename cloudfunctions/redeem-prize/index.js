"use strict";

const { Pool } = require("pg");
const { hasColumn } = require("./_shared/schema");

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
 * 用户兑换奖品 (终极融合版：包含队友的软删除校验 + 我们的 status 状态写入)
 */
exports.main = async (event, context) => {
  const raw = event && typeof event === "object" ? event : {};
  const data = raw.body && typeof raw.body === "object" ? raw.body : raw;
  const prize_id = parseInt(data.prize_id, 10);

  const cloudbase_uid = context?.userInfo?.openId || context?.userInfo?.uid || (data.cloudbase_uid && String(data.cloudbase_uid).trim()) || "";
  const email = data.email && String(data.email).trim();
  
  if (!cloudbase_uid && !email) return { errMsg: "未登录" };
  if (!prize_id || isNaN(prize_id)) return { errMsg: "请选择奖品" };

  const db = getPool();
  const client = await db.connect();
  
  try {
    const hasDeletedAt = await hasColumn(client, "prizes", "deleted_at");
    const userResult = await client.query(
      "SELECT id FROM users WHERE cloudbase_uid = $1 OR email = $2",
      [cloudbase_uid, email || cloudbase_uid]
    );
    if (userResult.rows.length === 0) return { errMsg: "用户不存在" };
    const user_id = userResult.rows[0].id;

    // ============ 开启兑换事务 ============
    await client.query("BEGIN");
    try {
      // 1. 保留队友的逻辑：查库存、查是否被删除，并加上 FOR UPDATE 悲观锁
      const prizeLock = await client.query(
        `SELECT id, name, points_cost, stock
         FROM prizes
         WHERE id = $1 AND is_active = true${
           hasDeletedAt ? " AND deleted_at IS NULL" : ""
         }
         FOR UPDATE`,
        [prize_id]
      );
      if (prizeLock.rows.length === 0) throw new Error("奖品不存在或已下架");
      
      const prize = prizeLock.rows[0];
      const points_cost = parseInt(prize.points_cost, 10);
      const stock = parseInt(prize.stock, 10);
      
      if (Number.isNaN(points_cost) || points_cost < 0) throw new Error("奖品数据异常");
      if (stock <= 0) throw new Error("奖品已兑完");

      // 2. 保留队友的逻辑：原子扣减余额 (非常安全)
      const balUpd = await client.query(
        `UPDATE users
         SET points_balance = points_balance - $1, updated_at = NOW()
         WHERE id = $2 AND points_balance >= $1
         RETURNING points_balance`,
        [points_cost, user_id]
      );
      if (balUpd.rows.length === 0) throw new Error(`积分不足，需要 ${points_cost} 积分`);
      const newBalance = parseInt(balUpd.rows[0].points_balance, 10) || 0;

      // 3. 写入积分账本
      await client.query(
        "INSERT INTO points_ledger (user_id, change_amount, balance_after, reason_type, created_at) VALUES ($1, $2, $3, 'prize_redemption', NOW())",
        [user_id, -points_cost, newBalance]
      );

      // 4. 保留队友的逻辑：原子扣减库存
      const stockUpd = await client.query(
        `UPDATE prizes
         SET stock = stock - 1, updated_at = NOW()
         WHERE id = $1 AND stock > 0`,
        [prize_id]
      );
      if (stockUpd.rowCount === 0) throw new Error("库存不足或奖品已下架");

      // 5. 【关键！！！】保留你的核心任务：写入 status = 'pending' 字段！
      await client.query(
        "INSERT INTO prize_redemptions (user_id, prize_id, points_spent, status, created_at) VALUES ($1, $2, $3, 'pending', NOW())",
        [user_id, prize_id, points_cost]
      );

      // ============ 事务成功结束 ============
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
  } catch (err) {
    return { errMsg: err && err.message ? String(err.message) : "兑换失败" };
  } finally {
    client.release();
  }
};
