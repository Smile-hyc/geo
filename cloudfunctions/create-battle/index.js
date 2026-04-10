"use strict";

const { Pool } = require("pg");

const pool = new Pool(
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
        ssl:
          process.env.DB_SSL === "true"
            ? { rejectUnauthorized: false }
            : false,
        max: 2,
        idleTimeoutMillis: 10000,
      }
);

exports.main = async (event, context) => {
  const raw = event && typeof event === "object" ? event : {};
  const data = raw.body && typeof raw.body === "object" ? raw.body : raw;
  const {
    ai_model_id,
    mode_type,
    time_limit_sec,
    round_count,
    cloudbase_uid: clientUid,
    email: clientEmail,
  } = data;

  const cloudbaseUid =
    context?.userInfo?.openId ||
    context?.userInfo?.uid ||
    (clientUid && String(clientUid).trim()) ||
    "";
  const email = clientEmail && String(clientEmail).trim();

  if (!cloudbaseUid && !email) {
    return { errMsg: "User identity is missing." };
  }

  const count = Math.min(round_count || 5, 10);
  const timeLimit = time_limit_sec || 30;
  const aiModelId = ai_model_id || "mock-v1";

  const client = await pool.connect();
  try {
    let userResult;

    if (cloudbaseUid) {
      userResult = await client.query(
        "SELECT id FROM users WHERE cloudbase_uid = $1",
        [cloudbaseUid]
      );
    }
    if ((!userResult || userResult.rows.length === 0) && email) {
      userResult = await client.query("SELECT id FROM users WHERE email = $1", [
        email,
      ]);
    }
    if (!userResult || userResult.rows.length === 0) {
      return { errMsg: "User record not found." };
    }

    const userId = userResult.rows[0].id;
    const resolvedModeType = mode_type && String(mode_type).trim()
      ? String(mode_type).trim()
      : "general";
    /** 综合模式：全库有坐标的图片；其它模式与标注任务池一致（mode_tags 包含该模式） */
    const useModePool = resolvedModeType !== "general";

    const imagesSql = useModePool
      ? `SELECT id, lat, lng
         FROM image_assets
         WHERE deleted_at IS NULL
           AND lat IS NOT NULL AND lng IS NOT NULL
           AND $2 = ANY(mode_tags)
         ORDER BY RANDOM()
         LIMIT $1`
      : `SELECT id, lat, lng
         FROM image_assets
         WHERE deleted_at IS NULL
           AND lat IS NOT NULL AND lng IS NOT NULL
         ORDER BY RANDOM()
         LIMIT $1`;

    const imagesParams = useModePool ? [count, resolvedModeType] : [count];
    const imagesResult = await client.query(imagesSql, imagesParams);

    if (imagesResult.rows.length < count) {
      return {
        errMsg: useModePool
          ? `该对战模式下可用题目不足（需有坐标且 mode_tags 含「${resolvedModeType}」）。当前可用: ${imagesResult.rows.length}。`
          : `Not enough geocoded images. Available: ${imagesResult.rows.length}.`,
      };
    }

    const sessionResult = await client.query(
      `INSERT INTO battle_sessions
         (user_id, ai_model_id, mode_type, time_limit_sec, round_count, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
       RETURNING id`,
      [userId, aiModelId, resolvedModeType, timeLimit, count]
    );

    const sessionId = sessionResult.rows[0].id;

    // --- 修改后的循环部分 ---
    for (let index = 0; index < imagesResult.rows.length; index += 1) {
      const img = imagesResult.rows[index];
      await client.query(
        `INSERT INTO battle_rounds 
           (session_id, round_index, image_id, truth_lat, truth_lng)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          sessionId, 
          index + 1, // 第几轮，从 1 开始
          img.id, 
          img.lat,   // 队长要求的真纬度快照
          img.lng    // 队长要求的真经度快照
        ]
      );
    }
    // --- 修改结束 ---

    return { session_id: sessionId };
  } catch (err) {
    return { errMsg: err.message || "Failed to create battle session." };
  } finally {
    client.release();
  }
};
