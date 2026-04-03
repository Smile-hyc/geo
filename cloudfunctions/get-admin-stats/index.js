"use strict";

const { getPool } = require("../_shared/db");
const { requireRole } = require("../_shared/auth");
const { ok, fail } = require("../_shared/response");

exports.main = async (event, context) => {
  const client = await getPool().connect();
  try {
    await requireRole(client, event, context, ["admin"]);

    const result = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM image_assets) AS total_images,
        (SELECT COUNT(*) FROM annotation_records) AS total_annotations,
        (SELECT COUNT(*) FROM annotation_records WHERE quality_status = 'pending') AS pending_reviews
    `);

    const row = result.rows[0] || {};
    return ok({
      total_users: Number(row.total_users) || 0,
      total_images: Number(row.total_images) || 0,
      total_annotations: Number(row.total_annotations) || 0,
      pending_reviews: Number(row.pending_reviews) || 0,
    });
  } catch (error) {
    return fail(error, {
      total_users: 0,
      total_images: 0,
      total_annotations: 0,
      pending_reviews: 0,
    });
  } finally {
    client.release();
  }
};
