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

const BASE_REWARD = 50;

/**
 * 管理员审核标注：通过时发放积分
 * 入参：{ record_id: number, quality_status: 'approved' | 'rejected' }
 */
exports.main = async (event, context) => {
  try {
    const raw = event && typeof event === "object" ? event : {};
    const data = raw.body && typeof raw.body === "object" ? raw.body : raw;
    const record_id = parseInt(data.record_id, 10);
    const quality_status = data.quality_status;

    if (!record_id || isNaN(record_id)) return { errMsg: "缺少 record_id" };
    if (quality_status !== "approved" && quality_status !== "rejected") {
      return { errMsg: "quality_status 需为 approved 或 rejected" };
    }

    const db = getPool();
    const client = await db.connect();
    try {
      const recordResult = await client.query(
        `SELECT ar.id, ar.user_id, ar.reward_granted,
                (SELECT COUNT(*) FROM annotation_bboxes WHERE record_id = ar.id) AS bbox_count
         FROM annotation_records ar WHERE ar.id = $1`,
        [record_id]
      );
      if (recordResult.rows.length === 0) return { errMsg: "记录不存在" };
      const record = recordResult.rows[0];
      const user_id = record.user_id;
      const reward_granted = record.reward_granted;
      const bbox_count = parseInt(record.bbox_count, 10) || 0;

      await client.query(
        "UPDATE annotation_records SET quality_status = $1 WHERE id = $2",
        [quality_status, record_id]
      );

      if (quality_status === "approved" && !reward_granted) {
        const reward = BASE_REWARD + Math.round(bbox_count * 5);
        const userResult = await client.query(
          "SELECT points_balance FROM users WHERE id = $1",
          [user_id]
        );
        if (userResult.rows.length > 0) {
          const currentBalance = parseInt(userResult.rows[0].points_balance, 10) || 0;
          const newBalance = currentBalance + reward;

          await client.query(
            "UPDATE users SET points_balance = $1, updated_at = NOW() WHERE id = $2",
            [newBalance, user_id]
          );
          await client.query(
            `INSERT INTO points_ledger (user_id, change_amount, balance_after, reason_type)
             VALUES ($1, $2, $3, 'annotation_reward')`,
            [user_id, reward, newBalance]
          );
          await client.query(
            "UPDATE annotation_records SET reward_granted = true WHERE id = $1",
            [record_id]
          );
        }
      }

      return { success: true };
    } finally {
      client.release();
    }
  } catch (err) {
    return { errMsg: err && err.message ? String(err.message) : "审核失败" };
  }
};
