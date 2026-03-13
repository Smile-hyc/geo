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
 * 获取用户历史记录（标注 + 对战）
 * 入参：{ cloudbase_uid?, email? } 可选，用于 context 无 userInfo 时
 * 出参：{ entries: HistoryEntry[] }
 */
exports.main = async (event, context) => {
  try {
    const raw = event && typeof event === "object" ? event : {};
    const data = raw.body && typeof raw.body === "object" ? raw.body : raw;

    const ctxUid =
      context?.userInfo?.openId ||
      context?.userInfo?.uid ||
      context?.userInfo?.user_id ||
      context?.userInfo?.sub ||
      "";
    const clientUid = data.cloudbase_uid && String(data.cloudbase_uid).trim();
    const clientEmail = data.email && String(data.email).trim();
    const cloudbase_uid = ctxUid || clientUid || clientEmail || "";

    if (!cloudbase_uid) return { errMsg: "未登录", entries: [] };

    const db = getPool();
    const client = await db.connect();
    try {
      const userResult = await client.query(
        "SELECT id FROM users WHERE cloudbase_uid = $1 OR email = $2",
        [cloudbase_uid, clientEmail || cloudbase_uid]
      );
      if (userResult.rows.length === 0) return { entries: [] };
      const user_id = userResult.rows[0].id;

      const [annRes, battleRes] = await Promise.all([
        client.query(
          `SELECT id, mode_type, created_at, thought_text, final_answer, quality_status
           FROM annotation_records WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
          [user_id]
        ),
        client.query(
          `SELECT id, mode_type, created_at, user_total_score, ai_total_score, winner,
                  (SELECT COUNT(*) FROM battle_rounds WHERE session_id = battle_sessions.id) AS round_count
           FROM battle_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
          [user_id]
        ),
      ]);

      const entries = [];

      for (const r of annRes.rows || []) {
        entries.push({
          type: "annotation",
          id: r.id,
          mode_type: r.mode_type || "general",
          created_at: r.created_at ? new Date(r.created_at).toISOString() : "",
          annotation: {
            thought_text: r.thought_text || "",
            final_answer: r.final_answer || "",
            quality_status: r.quality_status || "pending",
          },
        });
      }

      for (const r of battleRes.rows || []) {
        entries.push({
          type: "battle",
          id: r.id,
          mode_type: r.mode_type || "general",
          created_at: r.created_at ? new Date(r.created_at).toISOString() : "",
          battle: {
            user_total_score: r.user_total_score ?? 0,
            ai_total_score: r.ai_total_score ?? 0,
            winner: r.winner || "draw",
            round_count: parseInt(r.round_count, 10) || 0,
          },
        });
      }

      entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { entries: entries.slice(0, 50) };
    } finally {
      client.release();
    }
  } catch (err) {
    return { errMsg: err && err.message ? String(err.message) : "加载失败", entries: [] };
  }
};
