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
 * 用户兑换奖品 (带行级悲观锁，绝对防超卖)
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
    // ============ 开启兑换事务 ============
    await client.query("BEGIN");

    // 1. 查用户信息并【上锁】(FOR UPDATE)
    const userResult = await client.query(
      "SELECT id, points_balance FROM users WHERE cloudbase_uid = $1 OR email = $2 FOR UPDATE",
      [cloudbase_uid, email || cloudbase_uid]
    );
    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return { errMsg: "用户不存在" };
    }
    const user = userResult.rows[0];
    const user_id = user.id;
    const user_balance = parseInt(user.points_balance, 10) || 0;

    // 2. 查奖品库存并【上锁】(FOR UPDATE) —— 这才是真正的防超卖核心！
    const prizeResult = await client.query(
      "SELECT id, name, points_cost, stock FROM prizes WHERE id = $1 AND is_active = true FOR UPDATE",
      [prize_id]
    );
    if (prizeResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return { errMsg: "奖品不存在或已下架" };
    }
    const prize = prizeResult.rows[0];
    const points_cost = parseInt(prize.points_cost, 10);
    const stock = parseInt(prize.stock, 10);

    // 3. 判断库存和钱
    if (stock <= 0) {
      await client.query("ROLLBACK");
      return { errMsg: "手慢了，奖品已被抢空" };
    }
    if (user_balance < points_cost) {
      await client.query("ROLLBACK");
      return { errMsg: `积分不足，需要 ${points_cost} 积分` };
    }

    const newBalance = user_balance - points_cost;

    // 4. 扣除积分
    await client.query(
      "UPDATE users SET points_balance = $1, updated_at = NOW() WHERE id = $2",
      [newBalance, user_id]
    );

    // 5. 写入积分账本
    await client.query(
      "INSERT INTO points_ledger (user_id, change_amount, balance_after, reason_type, created_at) VALUES ($1, $2, $3, 'prize_redemption', NOW())",
      [user_id, -points_cost, newBalance]
    );

    // 6. 扣除库存
    await client.query(
      "UPDATE prizes SET stock = stock - 1, updated_at = NOW() WHERE id = $1",
      [prize_id]
    );

    // 7. 写入兑换记录 (队长要求：加上 status 状态字段！)
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
    
  } catch (err) {
    await client.query("ROLLBACK");
    return { errMsg: err && err.message ? String(err.message) : "兑换失败" };
  } finally {
    client.release();
  }
};