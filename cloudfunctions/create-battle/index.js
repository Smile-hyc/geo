"use strict";

const { Pool } = require("pg");

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2, idleTimeoutMillis: 10000 }
    : { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || "5432"), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD, ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false, max: 2, idleTimeoutMillis: 10000 }
);

/**
 * 创建对战 Session，分配 N 张图
 * 入参：{ mode_type, time_limit_sec, round_count }
 * 出参：{ session_id }
 */
exports.main = async (event, context) => {
  const { mode_type, time_limit_sec, round_count } = event;
  const cloudbase_uid = context?.userInfo?.openId || context?.userInfo?.uid || "";
  if (!cloudbase_uid) return { errMsg: "未登录" };

  const count = Math.min(round_count || 5, 10);
  const timeLimit = time_limit_sec || 30;

  const client = await pool.connect();
  try {
    const userResult = await client.query(
      "SELECT id FROM users WHERE cloudbase_uid = $1",
      [cloudbase_uid]
    );
    if (userResult.rows.length === 0) return { errMsg: "用户不存在" };
    const user_id = userResult.rows[0].id;

    const imagesResult = await client.query(
      `SELECT id, lat, lng FROM image_assets
       WHERE lat IS NOT NULL AND lng IS NOT NULL
       ORDER BY RANDOM()
       LIMIT $1`,
      [count]
    );
    if (imagesResult.rows.length < count) {
      return { errMsg: `图片不足，当前仅有 ${imagesResult.rows.length} 张带坐标的图片` };
    }

    const sessionResult = await client.query(
      `INSERT INTO battle_sessions (user_id, mode_type, time_limit_sec, round_count, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING id`,
      [user_id, mode_type || "general", timeLimit, count]
    );
    const session_id = sessionResult.rows[0].id;

    for (let i = 0; i < imagesResult.rows.length; i++) {
      await client.query(
        `INSERT INTO battle_rounds (session_id, round_index, image_id)
         VALUES ($1, $2, $3)`,
        [session_id, i, imagesResult.rows[i].id]
      );
    }

    return { session_id };
  } catch (err) {
    return { errMsg: err.message || "创建对战失败" };
  } finally {
    client.release();
  }
};
