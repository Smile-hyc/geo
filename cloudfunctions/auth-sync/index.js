"use strict";

const { Pool } = require("pg");

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2, idleTimeoutMillis: 10000 }
    : { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || "5432"), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD, ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false, max: 2, idleTimeoutMillis: 10000 }
);

function pickString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * CloudBase Auth 登录后同步用户信息到 PostgreSQL
 * 入参：{ username: string, email: string }
 * 出参：{ user_id: number }
 */
exports.main = async (event, context) => {
  const raw = event && typeof event === "object" ? event : {};
  const username = pickString(raw.username);
  const email = pickString(raw.email);
  const clientUid = pickString(raw.cloudbase_uid);
  if (!email) return { errMsg: "缺少 email 参数" };

  const cloudbase_uid =
    pickString(context?.userInfo?.openId) ||
    pickString(context?.userInfo?.uid) ||
    clientUid ||
    email;
  const fallbackUsername = username || email.split("@")[0];

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existingResult = await client.query(
      `SELECT id
       FROM users
       WHERE cloudbase_uid = $1 OR email = $2
       ORDER BY CASE WHEN cloudbase_uid = $1 THEN 0 ELSE 1 END, id ASC
       LIMIT 1
       FOR UPDATE`,
      [cloudbase_uid, email]
    );

    let row;

    if (existingResult.rows.length > 0) {
      const existingId = existingResult.rows[0].id;
      const result = await client.query(
        `UPDATE users
         SET cloudbase_uid = $1,
             email = $2,
             username = CASE
               WHEN NULLIF(BTRIM(username), '') IS NULL THEN $3
               ELSE username
             END,
             last_login_at = NOW(),
             updated_at = NOW()
         WHERE id = $4
         RETURNING id, role, username, points_balance, level`,
        [cloudbase_uid, email, fallbackUsername, existingId]
      );
      row = result.rows[0];
    } else {
      const result = await client.query(
        `INSERT INTO users (cloudbase_uid, username, email, role, points_balance, level, last_login_at, created_at, updated_at)
         VALUES ($1, $2, $3, 'user', 0, 1, NOW(), NOW(), NOW())
         RETURNING id, role, username, points_balance, level`,
        [cloudbase_uid, fallbackUsername, email]
      );
      row = result.rows[0];
    }

    await client.query("COMMIT");

    return {
      user_id: row.id,
      role: row.role,
      username: row.username,
      points_balance: row.points_balance,
      level: row.level,
    };
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {
      // ignore rollback failure and preserve the original error
    }
    return { errMsg: err.message || "数据库操作失败" };
  } finally {
    client.release();
  }
};
