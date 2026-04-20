"use strict";

const { getPool } = require("./_shared/db");
const { requireRole } = require("./_shared/auth");
const { ok, fail } = require("./_shared/response");
const { hasColumn } = require("./_shared/schema");

function getData(event) {
  const raw = event && typeof event === "object" ? event : {};
  return raw.body && typeof raw.body === "object" ? raw.body : raw;
}

exports.main = async (event, context) => {
  const data = getData(event);
  const prize_id = parseInt(data.prize_id, 10);

  if (!prize_id || isNaN(prize_id)) {
    return fail("缺少 prize_id");
  }

  const client = await getPool().connect();
  try {
    await requireRole(client, event, context, ["admin"]);
    const hasDeletedAt = await hasColumn(client, "prizes", "deleted_at");

    const result = hasDeletedAt
      ? await client.query(
          `UPDATE prizes
           SET deleted_at = NOW(), is_active = false, updated_at = NOW()
           WHERE id = $1 AND deleted_at IS NULL`,
          [prize_id]
        )
      : await client.query(
          `UPDATE prizes
           SET is_active = false, updated_at = NOW()
           WHERE id = $1 AND is_active = true`,
          [prize_id]
        );

    if (result.rowCount === 0) {
      return fail("奖品不存在或已移除");
    }

    return ok();
  } catch (error) {
    return fail(error);
  } finally {
    client.release();
  }
};
