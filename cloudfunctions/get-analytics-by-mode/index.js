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

    const result = await client.query(`
      SELECT mode_type, COUNT(*)::int AS count
      FROM annotation_records
      GROUP BY mode_type
      ORDER BY count DESC, mode_type ASC
    `);

    const modes = (result.rows || []).map((r) => ({
      mode_type: r.mode_type,
      count: Number(r.count) || 0,
    }));

    return ok({ modes });
  } catch (error) {
    return fail(error);
  } finally {
    client.release();
  }
};
