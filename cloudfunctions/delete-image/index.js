"use strict";

const { withTransaction } = require("./_shared/db");
const { requireRole } = require("./_shared/auth");
const { ok, fail } = require("./_shared/response");

function getData(event) {
  const raw = event && typeof event === "object" ? event : {};
  return raw.body && typeof raw.body === "object" ? raw.body : raw;
}

exports.main = async (event, context) => {
  const data = getData(event);
  const image_id = parseInt(data.image_id, 10);

  if (!image_id || isNaN(image_id)) {
    return fail("缺少有效的 image_id");
  }

  try {
    await withTransaction(async (client) => {
      await requireRole(client, event, context, ["admin"]);

      const upd = await client.query(
        `UPDATE image_assets
         SET deleted_at = COALESCE(deleted_at, NOW())
         WHERE id = $1
         RETURNING id, storage_url, deleted_at`,
        [image_id]
      );

      if (upd.rows.length === 0) {
        throw new Error("图片不存在");
      }
      return upd.rows[0];
    });

    return ok({ soft_deleted: true });
  } catch (error) {
    return fail(error);
  }
};
