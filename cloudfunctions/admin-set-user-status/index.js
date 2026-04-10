"use strict";

const { getPool } = require("./_shared/db");
const { requireRole } = require("./_shared/auth");
const { ok, fail } = require("./_shared/response");

function getData(event) {
  const raw = event && typeof event === "object" ? event : {};
  return raw.body && typeof raw.body === "object" ? raw.body : raw;
}

const ALLOWED_STATUS = new Set(["active", "suspended"]);

exports.main = async (event, context) => {
  const data = getData(event);
  const userId = parseInt(data.user_id, 10);
  const status = typeof data.status === "string" ? data.status.trim() : "";

  if (!userId || Number.isNaN(userId)) {
    return fail("缺少 user_id");
  }
  if (!ALLOWED_STATUS.has(status)) {
    return fail("状态仅支持 active 或 suspended");
  }

  const client = await getPool().connect();
  try {
    await requireRole(client, event, context, ["admin"]);

    const result = await client.query(
      `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, email, status`,
      [status, userId]
    );
    if (result.rows.length === 0) {
      return fail("用户不存在");
    }
    return ok({ user: result.rows[0] });
  } catch (error) {
    return fail(error);
  } finally {
    client.release();
  }
};
