"use strict";

const { Pool } = require("pg");
const tcb = require("@cloudbase/node-sdk");

let pool = null;
let cbApp = null;

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

function getApp(context) {
  if (!cbApp) {
    const opts = { env: tcb.SYMBOL_CURRENT_ENV };
    if (context) opts.context = context;
    cbApp = tcb.init(opts);
  }
  return cbApp;
}

/**
 * 管理员删除图片（同时删除云存储文件和数据库记录）
 * 入参：{ image_id: number }
 * 出参：{ success: true }
 */
exports.main = async (event, context) => {
  try {
    const raw = event && typeof event === "object" ? event : {};
    const data = raw.body && typeof raw.body === "object" ? raw.body : raw;
    const image_id = parseInt(data.image_id, 10);
    if (!image_id || isNaN(image_id)) return { errMsg: "缺少有效的 image_id" };

    const db = getPool();
    const client = await db.connect();
    try {
      // 先查出 storage_url 以便删除云存储文件
      const selectResult = await client.query(
        "SELECT storage_url FROM image_assets WHERE id = $1",
        [image_id]
      );
      if (selectResult.rows.length === 0) return { errMsg: "图片不存在" };

      const storageUrl = selectResult.rows[0].storage_url;

      // 使用事务：先删除关联数据，再删除图片
      await client.query("BEGIN");
      try {
        // 1. 删除标注框（annotation_bboxes 通过 record 关联）
        await client.query(
          `DELETE FROM annotation_bboxes WHERE record_id IN (SELECT id FROM annotation_records WHERE image_id = $1)`,
          [image_id]
        );
        // 2. 删除标注记录
        await client.query("DELETE FROM annotation_records WHERE image_id = $1", [image_id]);
        // 3. 删除对战轮次
        await client.query("DELETE FROM battle_rounds WHERE image_id = $1", [image_id]);
        // 4. 删除图片
        await client.query("DELETE FROM image_assets WHERE id = $1", [image_id]);
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      }

      // 尝试删除云存储文件（失败不影响结果）
      if (storageUrl && (storageUrl.startsWith("cloud://") || storageUrl.startsWith("cos://"))) {
        try {
          const app = getApp(context);
          await app.deleteFile({ fileList: [storageUrl] });
        } catch (_) {
          // 忽略云存储删除失败
        }
      }

      return { success: true };
    } finally {
      client.release();
    }
  } catch (err) {
    return { errMsg: err && err.message ? String(err.message) : "删除失败" };
  }
};
