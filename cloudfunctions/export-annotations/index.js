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
  const quality_status = data.quality_status;
  const limit = Math.min(parseInt(data.limit, 10) || 5000, 10000);

  const client = await getPool().connect();
  try {
    await requireRole(client, event, context, ["admin", "reviewer"]);

    let recordsQuery = `
      SELECT ar.id, ar.user_id, ar.image_id, ar.mode_type, ar.thought_text, ar.final_answer,
             ar.confidence, ar.annotated_image_url, ar.quality_status, ar.created_at,
             u.username, ia.storage_url AS image_storage_url, ia.true_location, ia.lat, ia.lng, ia.mode_tags,
             lr.review_score AS last_review_score,
             lr.comments AS last_review_comments,
             lr.created_at AS last_reviewed_at,
             ru.username AS last_reviewer_username
      FROM annotation_records ar
      JOIN users u ON u.id = ar.user_id
      JOIN image_assets ia ON ia.id = ar.image_id
      LEFT JOIN LATERAL (
        SELECT rr.reviewer_id, rr.review_score, rr.comments, rr.created_at
        FROM review_records rr
        WHERE rr.annotation_record_id = ar.id
        ORDER BY rr.created_at DESC
        LIMIT 1
      ) lr ON true
      LEFT JOIN users ru ON ru.id = lr.reviewer_id
    `;
    const params = [];

    if (quality_status) {
      params.push(quality_status);
      recordsQuery += " WHERE ar.quality_status = $1";
    }

    params.push(limit);
    recordsQuery += ` ORDER BY ar.created_at DESC LIMIT $${params.length}`;

    const recordsResult = await client.query(recordsQuery, params);
    const annotations = [];

    for (const row of recordsResult.rows || []) {
      const bboxResult = await client.query(
        `SELECT x, y, width, height, label_type, explanation
         FROM annotation_bboxes
         WHERE record_id = $1
         ORDER BY id`,
        [row.id]
      );

      annotations.push({
        record_id: row.id,
        username: row.username,
        image_id: row.image_id,
        image_storage_url: row.image_storage_url,
        true_location: row.true_location,
        lat: row.lat != null ? parseFloat(row.lat) : null,
        lng: row.lng != null ? parseFloat(row.lng) : null,
        mode_tags: Array.isArray(row.mode_tags) ? row.mode_tags : [],
        mode_type: row.mode_type,
        thought_text: row.thought_text || "",
        final_answer: row.final_answer || "",
        confidence: row.confidence ?? 50,
        annotated_image_url: row.annotated_image_url || null,
        quality_status: row.quality_status,
        created_at: row.created_at ? new Date(row.created_at).toISOString() : "",
        last_review_score: row.last_review_score != null ? parseInt(row.last_review_score, 10) : null,
        last_review_comments: row.last_review_comments || null,
        last_reviewed_at: row.last_reviewed_at ? new Date(row.last_reviewed_at).toISOString() : null,
        last_reviewer_username: row.last_reviewer_username || null,
        bboxes: (bboxResult.rows || []).map((bbox) => ({
          x: parseFloat(bbox.x),
          y: parseFloat(bbox.y),
          width: parseFloat(bbox.width),
          height: parseFloat(bbox.height),
          label_type: bbox.label_type || "",
          explanation: bbox.explanation || "",
        })),
      });
    }

    return ok({
      annotations,
      total: annotations.length,
    });
  } catch (error) {
    return fail(error, { annotations: [] });
  } finally {
    client.release();
  }
};
