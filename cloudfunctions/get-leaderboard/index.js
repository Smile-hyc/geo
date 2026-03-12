"use strict";

const { Pool } = require("pg");
const Redis = require("ioredis");

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2, idleTimeoutMillis: 10000 }
    : { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || "5432"), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD, ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false, max: 2, idleTimeoutMillis: 10000 }
);

let redis = null;
function getRedis() {
  if (!redis && process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL);
  }
  return redis;
}

const CACHE_KEY = "leaderboard:top50";
const CACHE_TTL = 300;

/**
 * 排行榜（Redis 缓存 5 分钟）
 * 入参：{ limit?: number }
 * 出参：{ leaderboard: [{ rank, username, points_balance, level }] }
 */
exports.main = async (event) => {
  const limit = Math.min(event?.limit || 50, 100);
  const r = getRedis();

  if (r) {
    try {
      const cached = await r.get(CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        return { leaderboard: data.slice(0, limit) };
      }
    } catch {
      // Redis 不可用，降级到 DB 查询
    }
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT username, points_balance, level,
              ROW_NUMBER() OVER (ORDER BY points_balance DESC) AS rank
       FROM users
       ORDER BY points_balance DESC
       LIMIT 50`
    );
    const leaderboard = result.rows.map((row) => ({
      rank: parseInt(row.rank),
      username: row.username,
      points_balance: row.points_balance,
      level: row.level,
    }));

    if (r) {
      try {
        await r.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(leaderboard));
      } catch {
        // ignore
      }
    }

    return { leaderboard: leaderboard.slice(0, limit) };
  } catch (err) {
    return { errMsg: err.message || "获取排行榜失败" };
  } finally {
    client.release();
  }
};
