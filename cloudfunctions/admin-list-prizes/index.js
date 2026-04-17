"use strict";

const { getPool } = require("./_shared/db");
const { requireRole } = require("./_shared/auth");
const { ok, fail } = require("./_shared/response");
const { hasColumn } = require("./_shared/schema");

exports.main = async (event, context) => {
  const client = await getPool().connect();
  try {
    await requireRole(client, event, context, ["admin"]);
    const hasDeletedAt = await hasColumn(client, "prizes", "deleted_at");

    const result = await client.query(
      `SELECT id, name, description, points_cost, stock, image_url, is_active, created_at${
        hasDeletedAt ? ", deleted_at" : ""
      }
       FROM prizes
       ORDER BY created_at DESC`
    );

    const prizes = (result.rows || []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || "",
      points_cost: row.points_cost,
      stock: row.stock,
      image_url: row.image_url || null,
      is_active: row.is_active,
      deleted_at:
        hasDeletedAt && row.deleted_at
          ? new Date(row.deleted_at).toISOString()
          : null,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : "",
    }));

    return ok({ prizes });
  } catch (error) {
    return fail(error);
  } finally {
    client.release();
  }
};
