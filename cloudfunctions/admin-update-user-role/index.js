"use strict";

const { getPool } = require("../_shared/db");
const { requireRole } = require("../_shared/auth");
const { ok, fail } = require("../_shared/response");

function getData(event) {
  const raw = event && typeof event === "object" ? event : {};
  return raw.body && typeof raw.body === "object" ? raw.body : raw;
}

const ALLOWED_ROLES = new Set(["user", "admin", "reviewer", "researcher"]);

exports.main = async (event, context) => {
  const data = getData(event);
  const userId = parseInt(data.user_id, 10);
  const role = typeof data.role === "string" ? data.role.trim() : "";

  if (!userId || Number.isNaN(userId)) {
    return fail("缺少 user_id");
  }
  if (!ALLOWED_ROLES.has(role)) {
    return fail("无效角色");
  }

  const client = await getPool().connect();
  try {
    await requireRole(client, event, context, ["admin"]);

    const result = await client.query(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, email, role`,
      [role, userId]
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
