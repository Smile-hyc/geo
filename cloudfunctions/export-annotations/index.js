"use strict";

const { getPool } = require("./_shared/db");
const { requireRole } = require("./_shared/auth");
const { ok, fail } = require("./_shared/response");
const { rowToJsonlObject } = require("./_shared/jsonlExport");

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
             u.username,
             ia.storage_url, ia.true_location, ia.lat, ia.lng, ia.mode_tags,
             ia.source_type, ia.external_ref, ia.country, ia.region, ia.city, ia.image_meta_json,
             lr.comment AS last_review_comments,
             lr.created_at AS last_reviewed_at,
             ru.username AS last_reviewer_username
      FROM annotation_records ar
      JOIN users u ON u.id = ar.user_id
      JOIN image_assets ia ON ia.id = ar.image_id AND ia.deleted_at IS NULL
      LEFT JOIN LATERAL (
        SELECT rr.reviewer_uid, rr.comment, rr.created_at
        FROM review_records rr
        WHERE rr.record_id = ar.id
        ORDER BY rr.created_at DESC
        LIMIT 1
      ) lr ON true
      LEFT JOIN users ru ON ru.cloudbase_uid = lr.reviewer_uid
    `;
    const params = [];

    if (quality_status) {
      params.push(quality_status);
      recordsQuery += " WHERE ar.quality_status = $1";
    }

    params.push(limit);
    recordsQuery += ` ORDER BY ar.created_at DESC LIMIT $${params.length}`;

    const recordsResult = await client.query(recordsQuery, params);
    const lines = [];
    const skipped = [];

    for (const row of recordsResult.rows || []) {
      const bboxResult = await client.query(
        `SELECT x, y, width, height, label_type, explanation
         FROM annotation_bboxes
         WHERE record_id = $1
         ORDER BY id`,
        [row.id]
      );

      const bboxes = (bboxResult.rows || []).map((bbox) => ({
        x: parseFloat(bbox.x),
        y: parseFloat(bbox.y),
        width: parseFloat(bbox.width),
        height: parseFloat(bbox.height),
        label_type: bbox.label_type || "",
        explanation: bbox.explanation || "",
      }));

      const merged = {
        ...row,
        image_id: row.image_id,
      };

      const obj = rowToJsonlObject(merged, {
        bboxes,
        last_review_comments: row.last_review_comments || null,
        last_reviewed_at: row.last_reviewed_at ? new Date(row.last_reviewed_at).toISOString() : null,
        last_reviewer_username: row.last_reviewer_username || null,
      });

      if (obj && obj.__skipped) {
        skipped.push(obj);
        continue;
      }

      lines.push(JSON.stringify(obj));
    }

    const jsonl = lines.join("\n");
    return ok({ jsonl, skipped });
  } catch (error) {
    const msg = error && error.message ? error.message : String(error);
    return fail(msg);
  } finally {
    client.release();
  }
};
