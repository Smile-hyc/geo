"use strict";

const { Pool } = require("pg");

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2, idleTimeoutMillis: 10000 }
    : { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || "5432"), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD, ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false, max: 2, idleTimeoutMillis: 10000 }
);

/**
 * 更新用户名
 * 入参：{ new_username: string, cloudbase_uid?, email? }
 * 出参：{ username: string }
 */
exports.main = async (event) => {
  const raw = event && typeof event === "object" ? event : {};
  const { new_username, cloudbase_uid: clientUid, email: clientEmail } = raw;
  const username = new_username && String(new_username).trim();
  if (!username || username.length < 2 || username.length > 20) {
    return { errMsg: "用户名需 2-20 个字符" };
  }

  const client = await pool.connect();
  try {
    const findRes = await client.query(
      "SELECT id FROM users WHERE cloudbase_uid = $1 OR email = $2",
      [clientUid || "", clientEmail || ""]
    );
    if (findRes.rows.length === 0) return { errMsg: "用户不存在" };
    const userId = findRes.rows[0].id;

    await client.query(
      "UPDATE users SET username = $1, updated_at = NOW() WHERE id = $2",
      [username, userId]
    );
    return { username };
  } catch (err) {
    return { errMsg: err.message || "更新失败" };
  } finally {
    client.release();
  }
};
