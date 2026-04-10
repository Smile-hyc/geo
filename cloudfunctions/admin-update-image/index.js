"use strict";

const { getPool } = require("../_shared/db");
const { requireRole } = require("../_shared/auth");
const { ok, fail } = require("../_shared/response");

function getData(event) {
  const raw = event && typeof event === "object" ? event : {};
  return raw.body && typeof raw.body === "object" ? raw.body : raw;
}

exports.main = async (event, context) => {
  const data = getData(event);
  const imageId = parseInt(data.image_id, 10);
  if (!imageId || Number.isNaN(imageId)) {
    return fail("缺少 image_id");
  }

  const client = await getPool().connect();
  try {
    await requireRole(client, event, context, ["admin"]);

    const cur = await client.query("SELECT id FROM image_assets WHERE id = $1", [imageId]);
    if (cur.rows.length === 0) {
      return fail("图片不存在");
    }

    const sets = [];
    const params = [];
    let i = 1;

    const setStr = (col, val) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };

    if (typeof data.true_location === "string") {
      setStr("true_location", data.true_location.trim());
    }
    if (data.lat !== undefined && data.lat !== null && data.lat !== "") {
      const v = parseFloat(data.lat);
      if (!Number.isNaN(v)) setStr("lat", v);
    }
    if (data.lat === null) {
      sets.push("lat = NULL");
    }
    if (data.lng !== undefined && data.lng !== null && data.lng !== "") {
      const v = parseFloat(data.lng);
      if (!Number.isNaN(v)) setStr("lng", v);
    }
    if (data.lng === null) {
      sets.push("lng = NULL");
    }
    if (Array.isArray(data.mode_tags)) {
      setStr("mode_tags", data.mode_tags.map(String));
    }
    if (typeof data.difficulty === "number" || typeof data.difficulty === "string") {
      const d = parseInt(data.difficulty, 10);
      if (!Number.isNaN(d) && d >= 1 && d <= 5) setStr("difficulty", d);
    }
    if (typeof data.source_type === "string") {
      setStr("source_type", data.source_type.trim() || null);
    }
    if (typeof data.external_ref === "string") {
      setStr("external_ref", data.external_ref.trim() || null);
    }
    if (typeof data.country === "string") {
      setStr("country", data.country.trim() || null);
    }
    if (typeof data.region === "string") {
      setStr("region", data.region.trim() || null);
    }
    if (typeof data.city === "string") {
      setStr("city", data.city.trim() || null);
    }
    if (data.is_active === true || data.is_active === false) {
      setStr("is_active", data.is_active);
    }
    if (Boolean(data.clear_deleted)) {
      sets.push("deleted_at = NULL");
    }
    if (data.image_meta_json && typeof data.image_meta_json === "object" && !Array.isArray(data.image_meta_json)) {
      sets.push(`image_meta_json = COALESCE(image_meta_json, '{}'::jsonb) || $${i++}::jsonb`);
      params.push(JSON.stringify(data.image_meta_json));
    }

    if (sets.length === 0) {
      return fail("无可更新字段");
    }

    params.push(imageId);
    const sql = `UPDATE image_assets SET ${sets.join(", ")} WHERE id = $${i} RETURNING id, true_location, lat, lng, mode_tags, difficulty, source_type, external_ref, country, region, city, image_meta_json, deleted_at`;
    const result = await client.query(sql, params);
    return ok({ image: result.rows[0] });
  } catch (error) {
    return fail(error);
  } finally {
    client.release();
  }
};
