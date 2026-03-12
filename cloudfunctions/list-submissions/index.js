"use strict";

const { Pool } = require("pg");

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2, idleTimeoutMillis: 10000 }
    : { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || "5432"), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD, ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false, max: 2, idleTimeoutMillis: 10000 }
);

/**
 * 管理员查看标注记录（JOIN 用户/图片信息）
 * 入参：{ limit?, offset?, quality_status? }
 */
exports.main = async (event) => {
  const { limit = 50, offset = 0, quality_status } = event || {};

  const client = await pool.connect();
  try {
    let query = `
      SELECT ar.id, u.username, ar.mode_type,
             ar.thought_text, ar.final_answer, ar.confidence,
             ar.quality_status, ar.annotated_image_url,
             ar.created_at, ia.storage_url AS image_storage_url
      FROM annotation_records ar
      JOIN users u ON u.id = ar.user_id
      JOIN image_assets ia ON ia.id = ar.image_id
    `;
    const params = [];
    if (quality_status) {
      query += " WHERE ar.quality_status = $1";
      params.push(quality_status);
    }
    query += ` ORDER BY ar.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await client.query(query, params);

    const countQuery = quality_status
      ? "SELECT COUNT(*) FROM annotation_records WHERE quality_status = $1"
      : "SELECT COUNT(*) FROM annotation_records";
    const countResult = await client.query(countQuery, quality_status ? [quality_status] : []);

    return {
      submissions: result.rows,
      total: parseInt(countResult.rows[0].count),
    };
  } catch (err) {
    return { errMsg: err.message || "获取标注记录失败" };
  } finally {
    client.release();
  }
};
