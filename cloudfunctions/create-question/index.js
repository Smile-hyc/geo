"use strict";

const sizeOf = require("image-size");
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

  const MAX_BYTES = 5 * 1024 * 1024;

  const client = await getPool().connect();
  try {
    await requireRole(client, event, context, ["admin"]);

    const buffer = Buffer.from(original_image_base64, "base64");
    if (buffer.length > MAX_BYTES) {
      return fail("图片超过 5MB");
    }
    if (buffer.length < 32) {
      return fail("图片数据无效");
    }

    let width;
    let height;
    let mimeHint = "jpeg";
    try {
      const dim = sizeOf(buffer);
      width = dim.width;
      height = dim.height;
      if (dim.type) mimeHint = dim.type;
    } catch (_) {
      return fail("无法解析图片尺寸，请上传有效 JPG/PNG 等图片");
    }

    const ext = mimeHint === "png" ? "png" : "jpg";
    const cloudPath = `questions/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const app = getApp(context);
    const uploadResult = await app.uploadFile({ cloudPath, fileContent: buffer });
    const fileID = uploadResult && uploadResult.fileID ? String(uploadResult.fileID) : null;

    if (!fileID) {
      return fail("上传云存储失败");
    }

    const imageMeta = {
      width,
      height,
      original_filename: typeof data.original_filename === "string" ? data.original_filename.slice(0, 255) : undefined,
    };

    const result = await client.query(
      `INSERT INTO image_assets (storage_url, lat, lng, true_location, mode_tags, difficulty, image_meta_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       RETURNING id`,
      [
        fileID,
        lat != null ? parseFloat(lat) : null,
        lng != null ? parseFloat(lng) : null,
        true_location.trim(),
        mode_tags,
        difficulty,
        JSON.stringify(imageMeta),
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
