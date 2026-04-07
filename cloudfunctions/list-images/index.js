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
  const limit = Math.min(Math.max(Number(data.limit) || 30, 1), 100);
  const offset = Math.max(Number(data.offset) || 0, 0);
  const includeDeleted = Boolean(data.include_deleted);

  const client = await getPool().connect();
  try {
    await requireRole(client, event, context, ["admin"]);

    const where = includeDeleted ? "" : " WHERE deleted_at IS NULL";
    const result = await client.query(
      `SELECT id, storage_url, true_location, lat, lng, mode_tags, difficulty, created_at, deleted_at,
              source_type, external_ref, country, region, city, image_meta_json
       FROM image_assets
       ${where}
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const images = (result.rows || []).map((row) => ({
      id: row.id,
      storage_url: row.storage_url,
      true_location: row.true_location,
      lat: row.lat != null ? parseFloat(row.lat) : null,
      lng: row.lng != null ? parseFloat(row.lng) : null,
      mode_tags: Array.isArray(row.mode_tags) ? row.mode_tags : [],
      difficulty: row.difficulty ?? 1,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : "",
      deleted_at: row.deleted_at ? new Date(row.deleted_at).toISOString() : null,
      source_type: row.source_type || null,
      external_ref: row.external_ref || null,
      country: row.country || null,
      region: row.region || null,
      city: row.city || null,
      image_meta_json: row.image_meta_json && typeof row.image_meta_json === "object" ? row.image_meta_json : {},
    }));

    return ok({ images });
  } catch (error) {
    return fail(error, { images: [] });
  } finally {
    client.release();
  }
};
