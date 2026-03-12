"use strict";

const { Pool } = require("pg");

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2, idleTimeoutMillis: 10000 }
    : { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || "5432"), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD, ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false, max: 2, idleTimeoutMillis: 10000 }
);

/**
 * 返回完整 Session + 所有 Round 详情
 * 入参：{ session_id }
 */
exports.main = async (event) => {
  const { session_id } = event;
  if (!session_id) return { errMsg: "缺少 session_id" };

  const client = await pool.connect();
  try {
    const sessionResult = await client.query(
      `SELECT id, mode_type, time_limit_sec, round_count,
              user_total_score, ai_total_score, winner, status
       FROM battle_sessions WHERE id = $1`,
      [session_id]
    );
    if (sessionResult.rows.length === 0) return { errMsg: "对战不存在" };
    const session = sessionResult.rows[0];

    const roundsResult = await client.query(
      `SELECT br.round_index,
              br.user_guess_lat, br.user_guess_lng,
              br.ai_guess_lat, br.ai_guess_lng,
              br.user_score, br.ai_score,
              ia.lat AS true_lat, ia.lng AS true_lng,
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
        mode_type: session.mode_type,
        user_total_score: session.user_total_score,
        ai_total_score: session.ai_total_score,
        winner: session.winner,
        round_count: session.round_count,
      },
      rounds: roundsResult.rows,
    };
  } catch (err) {
    return { errMsg: err.message || "获取对战结果失败" };
  } finally {
    client.release();
  }
};
