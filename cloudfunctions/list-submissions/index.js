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
  const limit = Math.min(Math.max(Number(data.limit) || 50, 1), 200);
  const offset = Math.max(Number(data.offset) || 0, 0);
  const quality_status = data.quality_status;

  const client = await getPool().connect();
  try {
    await requireRole(client, event, context, ["admin", "reviewer"]);

    let query = `
      SELECT ar.id, u.username, ar.mode_type,
             ar.thought_text, ar.final_answer, ar.confidence,
             ar.quality_status, ar.annotated_image_url,
             ar.created_at, ia.storage_url AS image_storage_url,
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
      query += " WHERE ar.quality_status = $1";
      params.push(quality_status);
    }

    query += ` ORDER BY ar.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await client.query(query, params);
    const rows = result.rows || [];
    const recordIds = rows.map((row) => row.id);
    const bboxMap = {};

    if (recordIds.length > 0) {
      const placeholders = recordIds.map((_, index) => `$${index + 1}`).join(", ");
      const bboxResult = await client.query(
        `SELECT record_id, x, y, width, height, label_type, explanation
         FROM annotation_bboxes
         WHERE record_id IN (${placeholders})
         ORDER BY record_id, id`,
        recordIds
      );

      for (const bbox of bboxResult.rows || []) {
        if (!bboxMap[bbox.record_id]) {
          bboxMap[bbox.record_id] = [];
        }
        bboxMap[bbox.record_id].push({
          x: parseFloat(bbox.x),
          y: parseFloat(bbox.y),
          width: parseFloat(bbox.width),
          height: parseFloat(bbox.height),
          label_type: bbox.label_type || "",
          explanation: bbox.explanation || "",
        });
      }
    }

    const submissions = rows.map((r) => ({
      id: r.id,
      username: r.username,
      mode_type: r.mode_type,
      thought_text: r.thought_text || "",
      final_answer: r.final_answer || "",
      confidence: r.confidence ?? 50,
      quality_status: r.quality_status || "pending",
      annotated_image_url: r.annotated_image_url || null,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : "",
      image_storage_url: r.image_storage_url || "",
      last_review_score: r.last_review_score != null ? parseInt(r.last_review_score, 10) : null,
      last_review_comments: r.last_review_comments || null,
      last_reviewed_at: r.last_reviewed_at ? new Date(r.last_reviewed_at).toISOString() : null,
      last_reviewer_username: r.last_reviewer_username || null,
      bboxes: bboxMap[r.id] || [],
    }));

    const countQuery = quality_status
      ? "SELECT COUNT(*) FROM annotation_records WHERE quality_status = $1"
      : "SELECT COUNT(*) FROM annotation_records";
    const countResult = await client.query(
      countQuery,
      quality_status ? [quality_status] : []
    );

    return ok({
      submissions,
      total: parseInt(countResult.rows[0].count, 10) || 0,
    });
  } catch (error) {
    return fail(error);
  } finally {
    client.release();
  }
};
