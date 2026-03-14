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
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcScore(distKm) {
  return Math.max(0, Math.round(5000 - distKm * 2));
}

/**
 * 接收用户 lat/lng 猜测，调用 AI Mock，返回双方分数
 * 入参：{ session_id, round_index, user_guess_lat, user_guess_lng, cloudbase_uid?, email? }
 */
exports.main = async (event, context) => {
  const raw = event && typeof event === "object" ? event : {};
  const data = raw.body && typeof raw.body === "object" ? raw.body : raw;
  const { session_id, round_index, user_guess_lat, user_guess_lng, cloudbase_uid: clientUid, email: clientEmail } = data;
  const cloudbase_uid =
    context?.userInfo?.openId ||
    context?.userInfo?.uid ||
    (clientUid && String(clientUid).trim()) ||
    "";
  const email = clientEmail && String(clientEmail).trim();
  if (!cloudbase_uid && !email) return { errMsg: "未登录" };
  if (session_id == null || round_index == null) return { errMsg: "缺少必要参数" };

  const client = await pool.connect();
  try {
    const roundResult = await client.query(
      `SELECT br.id, br.image_id, ia.lat AS true_lat, ia.lng AS true_lng,
              bs.user_id, bs.user_total_score, bs.ai_total_score, bs.round_count
       FROM battle_rounds br
       JOIN battle_sessions bs ON bs.id = br.session_id
       JOIN image_assets ia ON ia.id = br.image_id
       WHERE br.session_id = $1 AND br.round_index = $2`,
      [session_id, round_index]
    );
    if (roundResult.rows.length === 0) return { errMsg: "轮次不存在" };
    const round = roundResult.rows[0];

    const trueLat = round.true_lat;
    const trueLng = round.true_lng;

    const userDist = haversineKm(user_guess_lat, user_guess_lng, trueLat, trueLng);
    const userScore = calcScore(userDist);

    const aiLatOffset = (Math.random() - 0.5) * 10;
    const aiLngOffset = (Math.random() - 0.5) * 10;
    const aiLat = trueLat + aiLatOffset;
    const aiLng = trueLng + aiLngOffset;
    const aiDist = haversineKm(aiLat, aiLng, trueLat, trueLng);
    const aiScore = calcScore(aiDist);

    await client.query(
      `UPDATE battle_rounds
       SET user_guess_lat=$1, user_guess_lng=$2,
           ai_guess_lat=$3, ai_guess_lng=$4,
           user_score=$5, ai_score=$6, completed=true
       WHERE session_id=$7 AND round_index=$8`,
      [user_guess_lat, user_guess_lng, aiLat, aiLng, userScore, aiScore, session_id, round_index]
    );

    const newUserTotal = parseInt(round.user_total_score) + userScore;
    const newAiTotal = parseInt(round.ai_total_score) + aiScore;
    const completedRounds = round_index + 1;
    const sessionEnded = completedRounds >= parseInt(round.round_count);

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

    return {
      user_score: userScore,
      ai_score: aiScore,
      true_lat: trueLat,
      true_lng: trueLng,
      distance_km: Math.round(userDist),
      session_ended: sessionEnded,
    };
  } catch (err) {
    return { errMsg: err.message || "提交对战轮次失败" };
  } finally {
    client.release();
  }
};
