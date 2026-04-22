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

    const existResult = await client.query(
      `SELECT id${hasDeletedAt ? ", deleted_at" : ""} FROM prizes WHERE id = $1`,
      [prize_id]
    );
    if (existResult.rows.length === 0) {
      return fail("奖品不存在");
    }
    if (hasDeletedAt && existResult.rows[0].deleted_at != null) {
      return fail("该奖品已移除，无法编辑");
    }

    const updates = [];
    const values = [];
    let index = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${index++}`);
      values.push(String(data.name).trim());
    }
    if (data.description !== undefined) {
      updates.push(`description = $${index++}`);
      values.push(data.description ? String(data.description).trim() : null);
    }
    if (data.points_cost !== undefined) {
      const value = parseInt(data.points_cost, 10);
      if (!isNaN(value) && value >= 0) {
        updates.push(`points_cost = $${index++}`);
        values.push(value);
      }
    }
    if (data.stock !== undefined) {
      const value = parseInt(data.stock, 10);
      if (!isNaN(value) && value >= 0) {
        updates.push(`stock = $${index++}`);
        values.push(value);
      }
    }
    if (data.image_url !== undefined) {
      updates.push(`image_url = $${index++}`);
      values.push(data.image_url ? String(data.image_url).trim() : null);
    }
    if (data.is_active !== undefined) {
      updates.push(`is_active = $${index++}`);
      values.push(Boolean(data.is_active));
    }

    if (updates.length === 0) {
      return ok();
    }

    updates.push("updated_at = NOW()");
    values.push(prize_id);

    await client.query(
      `UPDATE prizes SET ${updates.join(", ")} WHERE id = $${index}`,
      values
    );

    return ok();
  } catch (error) {
    return fail(error);
  } finally {
    client.release();
  }
};
