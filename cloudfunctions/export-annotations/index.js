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

/**
 * 导出标注数据（管理员）
 * 入参：{ quality_status?: 'approved'|'pending'|'rejected', limit?: number, cloudbase_uid?, email? }
 * 出参：{ annotations: [...] }
 */
exports.main = async (event, context) => {
  try {
    const raw = event && typeof event === "object" ? event : {};
    const data = raw.body && typeof raw.body === "object" ? raw.body : raw;

    const cloudbase_uid =
      context?.userInfo?.openId ||
      context?.userInfo?.uid ||
      (data.cloudbase_uid && String(data.cloudbase_uid).trim()) ||
      "";
    const email = data.email && String(data.email).trim();
    if (!cloudbase_uid && !email) return { errMsg: "未登录", annotations: [] };

    const quality_status = data.quality_status;
    const limit = Math.min(parseInt(data.limit, 10) || 5000, 10000);

    const db = getPool();
    const client = await db.connect();
    try {
      const userResult = await client.query(
        "SELECT id, role FROM users WHERE cloudbase_uid = $1 OR email = $2",
        [cloudbase_uid, email || cloudbase_uid]
      );
      if (userResult.rows.length === 0 || userResult.rows[0].role !== "admin") {
        return { errMsg: "无权限", annotations: [] };
      }

      let recordsQuery = `
        SELECT ar.id, ar.user_id, ar.image_id, ar.mode_type, ar.thought_text, ar.final_answer,
               ar.confidence, ar.annotated_image_url, ar.quality_status, ar.created_at,
               u.username, ia.storage_url AS image_storage_url, ia.true_location, ia.lat, ia.lng, ia.mode_tags,
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
        params.push(quality_status);
        recordsQuery += ` WHERE ar.quality_status = $1`;
      }
      params.push(limit);
      recordsQuery += ` ORDER BY ar.created_at DESC LIMIT $${params.length}`;

      const recordsResult = await client.query(recordsQuery, params);
      const records = recordsResult.rows || [];

      const annotations = [];
      for (const r of records) {
        const bboxResult = await client.query(
          "SELECT x, y, width, height, label_type, explanation FROM annotation_bboxes WHERE record_id = $1 ORDER BY id",
          [r.id]
        );
        const bboxes = (bboxResult.rows || []).map((b) => ({
          x: parseFloat(b.x),
          y: parseFloat(b.y),
          width: parseFloat(b.width),
          height: parseFloat(b.height),
          label_type: b.label_type || "",
          explanation: b.explanation || "",
        }));

        annotations.push({
          record_id: r.id,
          username: r.username,
          image_id: r.image_id,
          image_storage_url: r.image_storage_url,
          true_location: r.true_location,
          lat: r.lat != null ? parseFloat(r.lat) : null,
          lng: r.lng != null ? parseFloat(r.lng) : null,
          mode_tags: Array.isArray(r.mode_tags) ? r.mode_tags : [],
          mode_type: r.mode_type,
          thought_text: r.thought_text || "",
          final_answer: r.final_answer || "",
          confidence: r.confidence ?? 50,
          annotated_image_url: r.annotated_image_url || null,
          quality_status: r.quality_status,
          created_at: r.created_at ? new Date(r.created_at).toISOString() : "",
          last_review_score: r.last_review_score != null ? parseInt(r.last_review_score, 10) : null,
          last_review_comments: r.last_review_comments || null,
          last_reviewed_at: r.last_reviewed_at ? new Date(r.last_reviewed_at).toISOString() : null,
          last_reviewer_username: r.last_reviewer_username || null,
          bboxes,
        });
      }

      return { annotations, total: annotations.length };
    } finally {
      client.release();
    }
  } catch (err) {
    return { errMsg: err && err.message ? String(err.message) : "导出失败", annotations: [] };
  }
};
