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
  const days = Math.min(Math.max(parseInt(data.days, 10) || 30, 1), 365);
  const client = await getPool().connect();
  try {
    await requireRole(client, event, context, ["admin"]);

    const result = await client.query(
      `
      SELECT (created_at AT TIME ZONE 'UTC')::date::text AS day, COUNT(*)::int AS count
      FROM annotation_records
      WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
      GROUP BY 1
      ORDER BY 1
    `,
      [days]
    );

    const series = (result.rows || []).map((r) => ({
      day: r.day,
      count: Number(r.count) || 0,
    }));

    return ok({ series });
  } catch (error) {
    return fail(error);
  } finally {
    client.release();
  }
};
