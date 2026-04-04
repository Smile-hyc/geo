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
  const name = data.name && String(data.name).trim();
  const description = data.description ? String(data.description).trim() : null;
  const points_cost = parseInt(data.points_cost, 10);
  const stock = parseInt(data.stock, 10) || 0;
  const image_url = data.image_url ? String(data.image_url).trim() : null;

  if (!name) {
    return fail("请输入奖品名称");
  }
  if (isNaN(points_cost) || points_cost < 0) {
    return fail("积分兑换需大于等于 0");
  }

  const client = await getPool().connect();
  try {
    await requireRole(client, event, context, ["admin"]);

    const result = await client.query(
      `INSERT INTO prizes (name, description, points_cost, stock, image_url, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
       RETURNING id`,
      [name, description, points_cost, stock >= 0 ? stock : 0, image_url]
    );

    return ok({ prize_id: Number(result.rows[0]?.id) || 0 });
  } catch (error) {
    return fail(error);
  } finally {
    client.release();
  }
};
