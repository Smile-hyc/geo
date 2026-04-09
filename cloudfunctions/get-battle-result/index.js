"use strict";

const { Pool } = require("pg");

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2, idleTimeoutMillis: 10000 }
    : { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || "5432", 10), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD, ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false, max: 2, idleTimeoutMillis: 10000 }
);

exports.main = async (event, context) => {
  const raw = event && typeof event === "object" ? event : {};
  const data = raw.body && typeof raw.body === "object" ? raw.body : raw;
  
  const { session_id, cloudbase_uid: clientUid, email: clientEmail } = data;

  // 1. 队长要求：校验访问权限 (获取当前操作的用户身份)
  const cloudbase_uid = context?.userInfo?.openId || context?.userInfo?.uid || (clientUid && String(clientUid).trim()) || "";
  const email = clientEmail && String(clientEmail).trim();

  if (!session_id) return { errMsg: "缺少 session_id 参数" };
  if (!cloudbase_uid && !email) return { errMsg: "未登录，无权访问" };

  const client = await pool.connect();
  
  try {
    // 查出当前用户在数据库里的真实 ID
    let userResult;
    if (cloudbase_uid) {
      userResult = await client.query("SELECT id FROM users WHERE cloudbase_uid = $1", [cloudbase_uid]);
    }
    if ((!userResult || userResult.rows.length === 0) && email) {
      userResult = await client.query("SELECT id FROM users WHERE email = $1", [email]);
    }
    if (!userResult || userResult.rows.length === 0) return { errMsg: "用户记录不存在" };
    const userId = userResult.rows[0].id;

    // ============ 开启发奖事务 ============
    await client.query("BEGIN");

    // 查出房间信息，并锁住这行防止并发刷钱
    const sessionResult = await client.query(
      `SELECT id, user_id, ai_model_id, mode_type, time_limit_sec, round_count,
              user_total_score, ai_total_score, winner, status
       FROM battle_sessions
       WHERE id = $1 FOR UPDATE`,
      [session_id]
    );

    if (sessionResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return { errMsg: "找不到该对战记录" };
    }

    const session = sessionResult.rows[0];

    // 队长要求：校验访问权限（只能看自己的）
    if (session.user_id !== userId) {
      await client.query("ROLLBACK");
      return { errMsg: "越权警告：不能查看或结算他人的对战！" };
    }

    // 2. 队长要求：battle 奖励入账 (只在 status 为 finished 时发奖，发完改成 rewarded)
    if (session.status === "finished") {
      // 计算奖励：这里设定为每 100 分换 1 个积分 (你可以根据队长的意思改这个比例)
      const rewardPoints = Math.floor(session.user_total_score / 100);

      if (rewardPoints > 0) {
        // 更新用户余额
        const updateBalanceRes = await client.query(
          `UPDATE users SET points_balance = points_balance + $1 WHERE id = $2 RETURNING points_balance`,
          [rewardPoints, userId]
        );
        const newBalance = updateBalanceRes.rows[0].points_balance;

        // 写 battle_reward 到 points ledger (积分账本)
        await client.query(
          `INSERT INTO points_ledger (user_id, change_amount, balance_after, reason_type, created_at)
           VALUES ($1, $2, $3, 'battle_reward', NOW())`,
          [userId, rewardPoints, newBalance]
        );
      }

      // 把状态改成 rewarded，彻底堵死重复刷分的漏洞！
      await client.query(
        `UPDATE battle_sessions SET status = 'rewarded', updated_at = NOW() WHERE id = $1`,
        [session_id]
      );
      
      // 更新给前端看的 session 状态
      session.status = "rewarded";
    }

    // ============ 发奖事务结束 ============
    await client.query("COMMIT");

    // 3. 队长要求：返回整局结果和逐轮结果 (连同你刚加的快照和赢家数据一起查出来)
    const roundsResult = await client.query(
      `SELECT br.round_index,
              br.user_guess_lat, br.user_guess_lng,
              br.ai_guess_lat, br.ai_guess_lng,
              br.user_score, br.ai_score,
              br.truth_lat AS true_lat, br.truth_lng AS true_lng, 
              br.round_winner_type, br.elapsed_ms,
              ia.storage_url AS image_storage_url
       FROM battle_rounds br
       JOIN image_assets ia ON ia.id = br.image_id
       WHERE br.session_id = $1
       ORDER BY br.round_index`,
      [session_id]
    );

    return {
      session: {
        id: session.id,
        ai_model_id: session.ai_model_id,
        mode_type: session.mode_type,
        time_limit_sec: session.time_limit_sec,
        user_total_score: session.user_total_score,
        ai_total_score: session.ai_total_score,
        winner: session.winner,
        round_count: session.round_count,
        status: session.status // 让前端知道已经发过奖了
      },
      rounds: roundsResult.rows,
    };
    
  } catch (err) {
    await client.query("ROLLBACK");
    return { errMsg: err.message || "获取结果或结算奖励时发生错误" };
  } finally {
    client.release();
  }
};