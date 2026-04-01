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
const MAX_COMMENTS_LEN = 4000;

/**
 * 管理员审核标注：写入 review_records 审计行，更新 annotation_records；通过时发放积分
 * 入参：{ record_id, quality_status: 'approved' | 'rejected', comments?, review_score? (1-5), cloudbase_uid?, email? }
 */
exports.main = async (event, context) => {
  try {
    const raw = event && typeof event === "object" ? event : {};
    const data = raw.body && typeof raw.body === "object" ? raw.body : raw;
    const record_id = parseInt(data.record_id, 10);
    const quality_status = data.quality_status;

    const cloudbase_uid =
      context?.userInfo?.openId ||
      context?.userInfo?.uid ||
      (data.cloudbase_uid && String(data.cloudbase_uid).trim()) ||
      "";
    const email = data.email && String(data.email).trim();
    if (!cloudbase_uid && !email) return { errMsg: "未登录" };
    if (!record_id || isNaN(record_id)) return { errMsg: "缺少 record_id" };
    if (quality_status !== "approved" && quality_status !== "rejected") {
      return { errMsg: "quality_status 需为 approved 或 rejected" };
    }

    let comments = null;
    if (data.comments != null && String(data.comments).trim()) {
      comments = String(data.comments).trim().slice(0, MAX_COMMENTS_LEN);
    }

    let review_score = null;
    if (data.review_score !== undefined && data.review_score !== null && data.review_score !== "") {
      const s = parseInt(data.review_score, 10);
      if (!Number.isNaN(s) && s >= 1 && s <= 5) review_score = s;
    }

    const db = getPool();
    const client = await db.connect();
    try {
      const reviewerResult = await client.query(
        "SELECT id, role FROM users WHERE cloudbase_uid = $1 OR email = $2",
        [cloudbase_uid, email || cloudbase_uid]
      );
      if (reviewerResult.rows.length === 0 || reviewerResult.rows[0].role !== "admin") {
        return { errMsg: "无权限" };
      }
      const reviewer_id = reviewerResult.rows[0].id;

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

      await client.query("BEGIN");
      try {
        await client.query(
          `INSERT INTO review_records (annotation_record_id, reviewer_id, review_status, review_score, comments)
           VALUES ($1, $2, $3, $4, $5)`,
          [record_id, reviewer_id, quality_status, review_score, comments]
        );

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

        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      }

      return { success: true };
    } finally {
      client.release();
    }
  } catch (err) {
    return { errMsg: err && err.message ? String(err.message) : "审核失败" };
  }
};
