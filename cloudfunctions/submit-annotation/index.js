"use strict";

const { Pool } = require("pg");
const tcb = require("@cloudbase/node-sdk");

let pool = null;
let cbApp = null;

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
            ssl:
              process.env.DB_SSL === "true"
                ? { rejectUnauthorized: false }
                : false,
            max: 2,
            idleTimeoutMillis: 10000,
          }
    );
  }
  return pool;
}

function getApp(context) {
  if (!cbApp) {
    const options = { env: tcb.SYMBOL_CURRENT_ENV };
    if (context) {
      options.context = context;
    }
    cbApp = tcb.init(options);
  }
  return cbApp;
}

exports.main = async (event, context) => {
  try {
    const raw = event && typeof event === "object" ? event : {};
    const data = raw.body && typeof raw.body === "object" ? raw.body : raw;

    const imageId = data.image_id;
    const modeType = data.mode_type || "general";
    const annotationType =
      data.annotation_type ||
      (Array.isArray(data.bboxes) && data.bboxes.length > 0 ? "hybrid" : "reasoning");
    const thoughtText = data.thought_text || "";
    const finalAnswer = data.final_answer || "";
    const confidence = data.confidence ?? 50;
    const annotatedImageBase64 = data.annotated_image_base64;
    const bboxes = Array.isArray(data.bboxes) ? data.bboxes : [];

    const requiresReasoning =
      annotationType === "reasoning" || annotationType === "hybrid";
    const requiresBoxes = annotationType === "bbox" || annotationType === "hybrid";

    if (!imageId) {
      return { errMsg: "image_id is required." };
    }
    if (requiresReasoning && !thoughtText.trim()) {
      return { errMsg: "thought_text is required for this annotation type." };
    }
    if (requiresBoxes && bboxes.length === 0) {
      return { errMsg: "At least one bounding box is required for this annotation type." };
    }

    const contextUid =
      context?.userInfo?.openId ||
      context?.userInfo?.uid ||
      context?.userInfo?.user_id ||
      context?.userInfo?.sub ||
      "";
    const clientUid = data.cloudbase_uid && String(data.cloudbase_uid).trim();
    const clientEmail = data.email && String(data.email).trim();
    const cloudbaseUid = contextUid || clientUid || clientEmail || "";

    if (!cloudbaseUid) {
      return { errMsg: "User identity is missing." };
    }

    const db = getPool();
    const client = await db.connect();
    try {
      const userResult = await client.query(
        "SELECT id FROM users WHERE cloudbase_uid = $1 OR email = $2",
        [cloudbaseUid, clientEmail || cloudbaseUid]
      );

      if (userResult.rows.length === 0) {
        return { errMsg: "User record not found. Sync auth first." };
      }

      const user = userResult.rows[0];
      let annotatedImageUrl = null;

      if (annotatedImageBase64 && typeof annotatedImageBase64 === "string") {
        const buffer = Buffer.from(annotatedImageBase64, "base64");
        const cloudPath = `annotations/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.jpg`;
        const app = getApp(context);
        const uploadResult = await app.uploadFile({
          cloudPath,
          fileContent: buffer,
        });
        annotatedImageUrl =
          uploadResult && uploadResult.fileID ? String(uploadResult.fileID) : null;
      }

      const recordResult = await client.query(
        `INSERT INTO annotation_records
           (user_id, image_id, mode_type, annotation_type, thought_text, final_answer, confidence, annotated_image_url, quality_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
         RETURNING id`,
        [
          user.id,
          imageId,
          modeType,
          annotationType,
          thoughtText,
          finalAnswer,
          confidence,
          annotatedImageUrl,
        ]
      );

      const recordId = recordResult.rows[0].id;

      if (bboxes.length > 0) {
        for (const bbox of bboxes) {
          await client.query(
            `INSERT INTO annotation_bboxes (record_id, x, y, width, height, label_type, explanation)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              recordId,
              bbox.x,
              bbox.y,
              bbox.width,
              bbox.height,
              bbox.label_type || "",
              bbox.explanation || "",
            ]
          );
        }
      }

      return { record_id: recordId, reward: 0 };
    } finally {
      client.release();
    }
  } catch (err) {
    return { errMsg: err && err.message ? String(err.message) : "Submit failed." };
  }
};
