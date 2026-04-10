"use strict";

const { getPool } = require("./_shared/db");
const { requireRole } = require("./_shared/auth");
const { ok, fail } = require("./_shared/response");

function getData(event) {
  const raw = event && typeof event === "object" ? event : {};
  return raw.body && typeof raw.body === "object" ? raw.body : raw;
}

exports.main = async (event, context) => {
  getData(event);
  const client = await getPool().connect();
  try {
    await requireRole(client, event, context, ["admin"]);

    const totals = await client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS total_users,
        (SELECT COUNT(*)::int FROM image_assets WHERE deleted_at IS NULL) AS total_images,
        (SELECT COUNT(*)::int FROM annotation_records) AS total_annotations,
        (SELECT COUNT(*)::int FROM annotation_records WHERE quality_status = 'pending') AS pending_reviews
    `);

    const byQ = await client.query(`
      SELECT quality_status, COUNT(*)::int AS count
      FROM annotation_records
      GROUP BY quality_status
      ORDER BY quality_status
    `);

    const row = totals.rows[0] || {};
    return ok({
      total_users: Number(row.total_users) || 0,
      total_images: Number(row.total_images) || 0,
      total_annotations: Number(row.total_annotations) || 0,
      pending_reviews: Number(row.pending_reviews) || 0,
      by_quality: (byQ.rows || []).map((r) => ({
        quality_status: r.quality_status,
        count: Number(r.count) || 0,
      })),
    });
  } catch (error) {
    return fail(error);
  } finally {
    client.release();
  }
};
