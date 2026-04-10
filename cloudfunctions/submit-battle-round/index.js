"use strict";

const { Pool } = require("pg");

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2, idleTimeoutMillis: 10000 }
    : { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || "5432"), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD, ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false, max: 2, idleTimeoutMillis: 10000 }
);

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcScore(distKm) {
  return Math.max(0, Math.round(5000 - distKm * 2));
}

exports.main = async (event, context) => {
  const raw = event && typeof event === "object" ? event : {};
  const data = raw.body && typeof raw.body === "object" ? raw.body : raw;
  
  // 队长要求：加上 elapsed_ms
  const { session_id, round_index, user_guess_lat, user_guess_lng, elapsed_ms, cloudbase_uid: clientUid, email: clientEmail } = data;
  
  const cloudbase_uid = context?.userInfo?.openId || context?.userInfo?.uid || (clientUid && String(clientUid).trim()) || "";
  const email = clientEmail && String(clientEmail).trim();
  
  if (!cloudbase_uid && !email) return { errMsg: "未登录" };
  if (session_id == null || round_index == null) return { errMsg: "缺少必要参数" };

  const client = await pool.connect();
  
  try {
    let userResult;
    if (cloudbase_uid) {
      userResult = await client.query("SELECT id FROM users WHERE cloudbase_uid = $1", [cloudbase_uid]);
    }
    if ((!userResult || userResult.rows.length === 0) && email) {
      userResult = await client.query("SELECT id FROM users WHERE email = $1", [email]);
    }
    if (!userResult || userResult.rows.length === 0) return { errMsg: "用户记录不存在" };
    const userId = userResult.rows[0].id;

    // ============ 事务开始 ============
    await client.query("BEGIN");

    // 取出记录，加上 FOR UPDATE 锁住这行数据，防止玩家开连点器瞬间扣两次分
    const roundResult = await client.query(
      `SELECT br.id, br.truth_lat, br.truth_lng, br.completed,
              bs.user_id, bs.user_total_score, bs.ai_total_score, bs.round_count
       FROM battle_rounds br
       JOIN battle_sessions bs ON bs.id = br.session_id
       WHERE br.session_id = $1 AND br.round_index = $2
       FOR UPDATE`,
      [session_id, round_index]
    );

    if (roundResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return { errMsg: "轮次不存在" };
    }
    
    const round = roundResult.rows[0];

    // 队长要求：校验 session 属于当前用户
    if (round.user_id !== userId) {
      await client.query("ROLLBACK");
      return { errMsg: "作弊警告：您不是该对战房间的玩家！" };
    }

    // 队长要求：校验当前 round 未提交，防重复提交
    if (round.completed) {
      await client.query("ROLLBACK");
      return { errMsg: "该轮次已交卷，请勿重复提交" };
    }

    // 队长要求：走快照数据，而不是去连表查图库
    const trueLat = round.truth_lat;
    const trueLng = round.truth_lng;
    if (trueLat == null || trueLng == null) {
      await client.query("ROLLBACK");
      return { errMsg: "题目快照数据丢失" };
    }

    const userDist = haversineKm(user_guess_lat, user_guess_lng, trueLat, trueLng);
    const userScore = calcScore(userDist);

    const aiLatOffset = (Math.random() - 0.5) * 10;
    const aiLngOffset = (Math.random() - 0.5) * 10;
    const aiLat = trueLat + aiLatOffset;
    const aiLng = trueLng + aiLngOffset;
    const aiDist = haversineKm(aiLat, aiLng, trueLat, trueLng);
    const aiScore = calcScore(aiDist);

    // 队长要求：记录 round_winner_type
    let roundWinnerType = "draw";
    if (userScore > aiScore) roundWinnerType = "user";
    else if (aiScore > userScore) roundWinnerType = "ai";

    // 更新当前这一局，加上 elapsed_ms 和 round_winner_type
    await client.query(
      `UPDATE battle_rounds
       SET user_guess_lat=$1, user_guess_lng=$2,
           ai_guess_lat=$3, ai_guess_lng=$4,
           user_score=$5, ai_score=$6, completed=true,
           round_winner_type=$7, elapsed_ms=$8
       WHERE session_id=$9 AND round_index=$10`,
      [user_guess_lat, user_guess_lng, aiLat, aiLng, userScore, aiScore, roundWinnerType, elapsed_ms || null, session_id, round_index]
    );

    const newUserTotal = parseInt(round.user_total_score) + userScore;
    const newAiTotal = parseInt(round.ai_total_score) + aiScore;
    const sessionEnded = round_index >= parseInt(round.round_count);

    let winner = null;
    if (sessionEnded) {
      winner = newUserTotal > newAiTotal ? "user" : newUserTotal < newAiTotal ? "ai" : "draw";
    }

    await client.query(
      `UPDATE battle_sessions
       SET user_total_score=$1, ai_total_score=$2,
           winner=$3, status=$4, updated_at=NOW()
       WHERE id=$5`,
      [newUserTotal, newAiTotal, winner, sessionEnded ? "finished" : "active", session_id]
    );

    // ============ 事务成功结束 ============
    await client.query("COMMIT");

    return {
      user_score: userScore,
      ai_score: aiScore,
      true_lat: trueLat,
      true_lng: trueLng,
      distance_km: Math.round(userDist),
      session_ended: sessionEnded,
    };
    
  } catch (err) {
    // 遇到任何系统报错，强制撤回刚才的所有数据库修改
    await client.query("ROLLBACK");
    return { errMsg: err.message || "提交对战轮次失败" };
  } finally {
    client.release();
  }
};