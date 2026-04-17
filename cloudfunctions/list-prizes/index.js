"use strict";

const { Pool } = require("pg");
const { hasColumn } = require("./_shared/schema");

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
 * 获取可兑换奖品列表（仅上架且有余量）
 */
exports.main = async (event) => {
  try {
    const raw = event && typeof event === "object" ? event : {};
    const data = raw.body && typeof raw.body === "object" ? raw.body : raw;
    const limit = Math.min(parseInt(data.limit, 10) || 50, 100);

    const db = getPool();
    const client = await db.connect();
    try {
      const hasDeletedAt = await hasColumn(client, "prizes", "deleted_at");
      const result = await client.query(
        `SELECT id, name, description, points_cost, stock, image_url
         FROM prizes
         WHERE is_active = true AND stock > 0${
           hasDeletedAt ? " AND deleted_at IS NULL" : ""
         }
         ORDER BY points_cost ASC
         LIMIT $1`,
        [limit]
      );
      const prizes = (result.rows || []).map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description || "",
        points_cost: r.points_cost,
        stock: r.stock,
        image_url: r.image_url || null,
      }));
      return { prizes };
    } finally {
      client.release();
    }
  } catch (err) {
    return { errMsg: err && err.message ? String(err.message) : "加载失败", prizes: [] };
  }
};
