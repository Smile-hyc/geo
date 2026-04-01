"use strict";

const { Pool } = require("pg");

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2, idleTimeoutMillis: 10000 }
    : { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || "5432", 10), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD, ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false, max: 2, idleTimeoutMillis: 10000 }
);

/**
 * 管理员查看标注记录（JOIN 用户/图片信息，含最近一次审核摘要）
 * 入参 body：{ limit?, offset?, quality_status?, cloudbase_uid?, email? }
 */
exports.main = async (event, context) => {
  const raw = event && typeof event === "object" ? event : {};
  const data = raw.body && typeof raw.body === "object" ? raw.body : raw;

  const cloudbase_uid =
    context?.userInfo?.openId ||
    context?.userInfo?.uid ||
    (data.cloudbase_uid && String(data.cloudbase_uid).trim()) ||
    "";
  const email = data.email && String(data.email).trim();
  if (!cloudbase_uid && !email) {
    return { errMsg: "未登录", submissions: [], total: 0 };
  }

  const limit = Math.min(Math.max(parseInt(data.limit, 10) || 50, 1), 200);
  const offset = Math.max(parseInt(data.offset, 10) || 0, 0);
  const quality_status = data.quality_status && String(data.quality_status).trim();

  const client = await pool.connect();
  try {
    const adminResult = await client.query(
      "SELECT id, role FROM users WHERE cloudbase_uid = $1 OR email = $2",
      [cloudbase_uid, email || cloudbase_uid]
    );
    if (adminResult.rows.length === 0 || adminResult.rows[0].role !== "admin") {
      return { errMsg: "无权限", submissions: [], total: 0 };
    }

    let query = `
      SELECT ar.id, u.username, ar.mode_type,
             ar.thought_text, ar.final_answer, ar.confidence,
             ar.quality_status, ar.annotated_image_url,
             ar.created_at, ia.storage_url AS image_storage_url,
             lr.review_score AS last_review_score,
             lr.comments AS last_review_comments,
             lr.created_at AS last_reviewed_at,
             ru.username AS last_reviewer_username
      FROM annotation_records ar
      JOIN users u ON u.id = ar.user_id
      JOIN image_assets ia ON ia.id = ar.image_id
      LEFT JOIN LATERAL (
        SELECT rr.reviewer_id, rr.review_score, rr.comments, rr.created_at
        FROM review_records rr
        WHERE rr.annotation_record_id = ar.id
        ORDER BY rr.created_at DESC
        LIMIT 1
      ) lr ON true
      LEFT JOIN users ru ON ru.id = lr.reviewer_id
    `;
    const params = [];
    if (quality_status) {
      query += " WHERE ar.quality_status = $1";
      params.push(quality_status);
    }
    query += ` ORDER BY ar.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await client.query(query, params);
    const rows = result.rows || [];

    const recordIds = rows.map((r) => r.id);
    const bboxMap = {};
    if (recordIds.length > 0) {
      const placeholders = recordIds.map((_, i) => `$${i + 1}`).join(", ");
      const bboxResult = await client.query(
        `SELECT record_id, x, y, width, height, label_type, explanation
         FROM annotation_bboxes WHERE record_id IN (${placeholders}) ORDER BY record_id, id`,
        recordIds
      );
      for (const b of bboxResult.rows || []) {
        if (!bboxMap[b.record_id]) bboxMap[b.record_id] = [];
        bboxMap[b.record_id].push({
          x: parseFloat(b.x),
          y: parseFloat(b.y),
          width: parseFloat(b.width),
          height: parseFloat(b.height),
          label_type: b.label_type || "",
          explanation: b.explanation || "",
        });
      }
    }

    const submissions = rows.map((r) => ({
      id: r.id,
      username: r.username,
      mode_type: r.mode_type,
      thought_text: r.thought_text || "",
      final_answer: r.final_answer || "",
      confidence: r.confidence ?? 50,
      quality_status: r.quality_status || "pending",
      annotated_image_url: r.annotated_image_url || null,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : "",
      image_storage_url: r.image_storage_url || "",
      last_review_score: r.last_review_score != null ? parseInt(r.last_review_score, 10) : null,
      last_review_comments: r.last_review_comments || null,
      last_reviewed_at: r.last_reviewed_at ? new Date(r.last_reviewed_at).toISOString() : null,
      last_reviewer_username: r.last_reviewer_username || null,
      bboxes: bboxMap[r.id] || [],
    }));

    const countQuery = quality_status
      ? "SELECT COUNT(*) FROM annotation_records WHERE quality_status = $1"
      : "SELECT COUNT(*) FROM annotation_records";
    const countResult = await client.query(countQuery, quality_status ? [quality_status] : []);

    return {
      submissions,
      total: parseInt(countResult.rows[0].count, 10),
    };
  } catch (err) {
    return { errMsg: err.message || "获取标注记录失败", submissions: [], total: 0 };
  } finally {
    client.release();
  }
};
