"use strict";

const { Pool } = require("pg");
const tcb = require("@cloudbase/node-sdk");

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2, idleTimeoutMillis: 10000 }
    : { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || "5432"), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD, ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false, max: 2, idleTimeoutMillis: 10000 }
);

const cbApp = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV });
const BASE_REWARD = 50;

/**
 * 提交思维链 + BBox 数组 + 可选标注图，发积分
 * 入参：{ image_id, mode_type, thought_text, final_answer, confidence, annotated_image_base64?, bboxes? }
 * 出参：{ record_id, reward }
 */
exports.main = async (event, context) => {
  const {
    image_id, mode_type, thought_text, final_answer,
    confidence, annotated_image_base64, bboxes,
  } = event;

  if (!image_id || !thought_text) {
    return { errMsg: "缺少必要参数" };
  }

  const cloudbase_uid = context?.userInfo?.openId || context?.userInfo?.uid || "";
  if (!cloudbase_uid) return { errMsg: "未登录" };

  const client = await pool.connect();
  try {
    const userResult = await client.query(
      "SELECT id, points_balance FROM users WHERE cloudbase_uid = $1",
      [cloudbase_uid]
    );
    if (userResult.rows.length === 0) return { errMsg: "用户不存在，请先同步账号" };
    const user = userResult.rows[0];

    let annotatedImageUrl = null;
    if (annotated_image_base64) {
      const buffer = Buffer.from(annotated_image_base64, "base64");
      const cloudPath = `annotations/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const uploadResult = await cbApp.uploadFile({ cloudPath, fileContent: buffer });
      annotatedImageUrl = uploadResult.fileID || null;
    }

    const recordResult = await client.query(
      `INSERT INTO annotation_records
         (user_id, image_id, mode_type, thought_text, final_answer, confidence, annotated_image_url, quality_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING id`,
      [user.id, image_id, mode_type || "general", thought_text, final_answer || "", confidence || 50, annotatedImageUrl]
    );
    const record_id = recordResult.rows[0].id;

    if (bboxes && bboxes.length > 0) {
      for (const bbox of bboxes) {
        await client.query(
          `INSERT INTO annotation_bboxes (record_id, x, y, width, height, label_type, explanation)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [record_id, bbox.x, bbox.y, bbox.width, bbox.height, bbox.label_type, bbox.explanation || ""]
        );
      }
    }

    const reward = BASE_REWARD + Math.round((bboxes?.length ?? 0) * 5);
    const newBalance = user.points_balance + reward;

    await client.query(
      "UPDATE users SET points_balance = $1, updated_at = NOW() WHERE id = $2",
      [newBalance, user.id]
    );
    await client.query(
      `INSERT INTO points_ledger (user_id, change_amount, balance_after, reason_type)
       VALUES ($1, $2, $3, 'annotation_reward')`,
      [user.id, reward, newBalance]
    );
    await client.query(
      "UPDATE annotation_records SET reward_granted = true WHERE id = $1",
      [record_id]
    );

    return { record_id, reward };
  } catch (err) {
    return { errMsg: err.message || "提交失败" };
  } finally {
    client.release();
  }
};
