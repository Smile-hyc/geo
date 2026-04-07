"use strict";

const { getPool, withTransaction } = require("../_shared/db");
const { requireRole } = require("../_shared/auth");
const { ok, fail } = require("../_shared/response");

function getData(event) {
  const raw = event && typeof event === "object" ? event : {};
  return raw.body && typeof raw.body === "object" ? raw.body : raw;
}

exports.main = async (event, context) => {
  const data = getData(event);
  const userId = parseInt(data.user_id, 10);
  const delta = parseInt(data.delta, 10);
  const reason =
    typeof data.reason === "string" && data.reason.trim()
      ? data.reason.trim().slice(0, 500)
      : "admin_adjust";

  if (!userId || Number.isNaN(userId)) {
    return fail("缺少 user_id");
  }
  if (Number.isNaN(delta) || delta === 0) {
    return fail("delta 须为非零整数");
  }

  try {
    const row = await withTransaction(async (client) => {
      await requireRole(client, event, context, ["admin"]);

      const cur = await client.query(
        "SELECT id, points_balance FROM users WHERE id = $1 FOR UPDATE",
        [userId]
      );
      if (cur.rows.length === 0) {
        throw new Error("用户不存在");
      }
      const next = (cur.rows[0].points_balance ?? 0) + delta;
      if (next < 0) {
        throw new Error("积分不能为负");
      }

      await client.query(
        `INSERT INTO points_ledger (user_id, change_amount, balance_after, reason_type, reference_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, delta, next, "admin_adjust", null]
      );

      const upd = await client.query(
        "UPDATE users SET points_balance = $1, updated_at = NOW() WHERE id = $2 RETURNING id, points_balance",
        [next, userId]
      );
      return upd.rows[0];
    });

    return ok({ user_id: row.id, points_balance: row.points_balance });
  } catch (error) {
    return fail(error);
  }
};
