"use strict";

const { Pool } = require("pg");

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2, idleTimeoutMillis: 10000 }
    : { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || "5432"), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD, ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false, max: 2, idleTimeoutMillis: 10000 }
);

/**
 * CloudBase Auth 登录后同步用户信息到 PostgreSQL
 * 入参：{ username: string, email: string }
 * 出参：{ user_id: number }
 */
exports.main = async (event, context) => {
  const { username, email } = event;
  if (!email) return { errMsg: "缺少 email 参数" };

  const cloudbase_uid = context?.userInfo?.openId || context?.userInfo?.uid || email;

  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO users (cloudbase_uid, username, email, role, points_balance, level)
       VALUES ($1, $2, $3, 'user', 0, 1)
       ON CONFLICT (cloudbase_uid) DO UPDATE
         SET username = EXCLUDED.username,
             email = EXCLUDED.email,
             updated_at = NOW()
       RETURNING id`,
      [cloudbase_uid, username || email.split("@")[0], email]
    );
    return { user_id: result.rows[0].id };
  } catch (err) {
    return { errMsg: err.message || "数据库操作失败" };
  } finally {
    client.release();
  }
};
