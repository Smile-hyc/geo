"use strict";

const { Pool } = require("pg");

const VALID_MODES = new Set(["general", "street_view", "remote_sensing", "terrain"]);

/** 与 features/battle/config.ts INFERENCE_MODELS 保持一致 */
const KNOWN_MODEL_IDS = [
  "research-baseline",
  "kimi-vision",
  "glm-4v",
  "qwen-vl",
];

let pool = null;

function getPool() {
  if (!pool) {
    pool = new Pool(
      process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            max: 2,
            idleTimeoutMillis: 10000,
          }
        : {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || "5432", 10),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
            max: 2,
            idleTimeoutMillis: 10000,
          }
    );
  }
  return pool;
}

/**
 * 各模型在指定模式下近 30 日「战胜玩家」胜率
 * 胜率 = AI 获胜场次 / 已完成对局总数（含平局；平局计为 AI 未胜）
 * 入参：{ mode_type: string }
 * 出参：{ mode_type, win_rates: [{ ai_model_id, win_rate, total_battles, ai_wins }] }
 */
exports.main = async (event) => {
  try {
    const raw = event && typeof event === "object" ? event : {};
    const data = raw.body && typeof raw.body === "object" ? raw.body : raw;

    const mode_type = data.mode_type && String(data.mode_type).trim();
    if (!mode_type || !VALID_MODES.has(mode_type)) {
      return { errMsg: "无效的模式参数" };
    }

    const db = getPool();
    const client = await db.connect();
    try {
      const result = await client.query(
        `SELECT
           ai_model_id,
           COUNT(*)::int AS total_battles,
           COUNT(*) FILTER (
             WHERE COALESCE(winner_type, winner) = 'ai'
           )::int AS ai_wins
         FROM battle_sessions
         WHERE mode_type = $1
           AND status IN ('finished', 'rewarded')
           AND COALESCE(finished_at, created_at) >= NOW() - INTERVAL '30 days'
           AND ai_model_id = ANY($2::text[])
         GROUP BY ai_model_id`,
        [mode_type, KNOWN_MODEL_IDS]
      );

      const byModel = new Map();
      for (const row of result.rows || []) {
        const total = parseInt(row.total_battles, 10) || 0;
        const aiWins = parseInt(row.ai_wins, 10) || 0;
        byModel.set(row.ai_model_id, {
          ai_model_id: row.ai_model_id,
          total_battles: total,
          ai_wins: aiWins,
          win_rate: total > 0 ? Math.round((aiWins * 1000) / total) / 10 : null,
        });
      }

      const win_rates = KNOWN_MODEL_IDS.map((id) => {
        const existing = byModel.get(id);
        if (existing) return existing;
        return {
          ai_model_id: id,
          total_battles: 0,
          ai_wins: 0,
          win_rate: null,
        };
      });

      return { mode_type, win_rates };
    } finally {
      client.release();
    }
  } catch (err) {
    return { errMsg: err && err.message ? String(err.message) : "获取模型胜率失败" };
  }
};
