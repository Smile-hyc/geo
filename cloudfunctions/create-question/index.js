"use strict";

const tcb = require("@cloudbase/node-sdk");
const { getPool } = require("../_shared/db");
const { requireRole } = require("../_shared/auth");
const { ok, fail } = require("../_shared/response");

let cbApp = null;

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

function getData(event) {
  const raw = event && typeof event === "object" ? event : {};
  return raw.body && typeof raw.body === "object" ? raw.body : raw;
}

exports.main = async (event, context) => {
  const data = getData(event);
  const original_image_base64 = data.original_image_base64;
  const true_location = data.true_location;
  const lat = data.lat;
  const lng = data.lng;
  const mode_tags = Array.isArray(data.mode_tags)
    ? data.mode_tags
    : data.mode_tags
      ? [data.mode_tags]
      : [];
  const difficulty =
    typeof data.difficulty === "number"
      ? data.difficulty
      : parseInt(data.difficulty, 10) || 1;

  if (!original_image_base64 || typeof original_image_base64 !== "string") {
    return fail("缺少 original_image_base64");
  }
  if (!true_location || typeof true_location !== "string" || !true_location.trim()) {
    return fail("缺少 true_location");
  }

  const client = await getPool().connect();
  try {
    await requireRole(client, event, context, ["admin"]);

    const buffer = Buffer.from(original_image_base64, "base64");
    const cloudPath = `questions/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

    const app = getApp(context);
    const uploadResult = await app.uploadFile({ cloudPath, fileContent: buffer });
    const fileID = uploadResult && uploadResult.fileID ? String(uploadResult.fileID) : null;

    if (!fileID) {
      return fail("上传云存储失败");
    }

    const result = await client.query(
      `INSERT INTO image_assets (storage_url, lat, lng, true_location, mode_tags, difficulty)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        fileID,
        lat != null ? parseFloat(lat) : null,
        lng != null ? parseFloat(lng) : null,
        true_location.trim(),
        mode_tags,
        difficulty,
      ]
    );

    const question_id = Number(result.rows[0]?.id);
    if (!question_id) {
      return fail("写入数据库失败");
    }

    return ok({ question_id });
  } catch (error) {
    return fail(error);
  } finally {
    client.release();
  }
};
