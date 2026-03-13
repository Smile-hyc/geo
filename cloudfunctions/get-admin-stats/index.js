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
 * 管理员仪表盘统计数据
 * 入参：无
 * 出参：{ total_users, total_images, total_annotations, pending_reviews }
 */
exports.main = async () => {
  const db = getPool();
  const client = await db.connect();
  try {
    const result = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM users)                                        AS total_users,
        (SELECT COUNT(*) FROM image_assets)                                 AS total_images,
        (SELECT COUNT(*) FROM annotation_records)                           AS total_annotations,
        (SELECT COUNT(*) FROM annotation_records WHERE quality_status = 'pending') AS pending_reviews
    `);
    const row = result.rows[0] || {};
    return {
      total_users:       Number(row.total_users)       || 0,
      total_images:      Number(row.total_images)      || 0,
      total_annotations: Number(row.total_annotations) || 0,
      pending_reviews:   Number(row.pending_reviews)   || 0,
    };
  } catch (err) {
    return { errMsg: err.message || "查询失败", total_users: 0, total_images: 0, total_annotations: 0, pending_reviews: 0 };
  } finally {
    client.release();
  }
};
