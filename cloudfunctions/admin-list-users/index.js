"use strict";

const { getPool } = require("./_shared/db");
const { requireRole } = require("./_shared/auth");
const { ok, fail } = require("./_shared/response");

function getData(event) {
  const raw = event && typeof event === "object" ? event : {};
  return raw.body && typeof raw.body === "object" ? raw.body : raw;
}

const SELECT_FIELDS = `id, cloudbase_uid, username, email, role, status, points_balance, level,
  last_login_at, created_at`;

exports.main = async (event, context) => {
  const data = getData(event);
  const limit = Math.min(Math.max(parseInt(data.limit, 10) || 50, 1), 200);
  const offset = Math.max(parseInt(data.offset, 10) || 0, 0);
  const q = typeof data.q === "string" ? data.q.trim() : "";

  const client = await getPool().connect();
  try {
    await requireRole(client, event, context, ["admin"]);

    const params = [];
    let where = "";
    if (q) {
      params.push(`%${q}%`);
      where = " WHERE (username ILIKE $1 OR email ILIKE $1)";
    }

    const countResult = await client.query(
      `SELECT COUNT(*)::int AS c FROM users${where}`,
      params
    );
    const total = countResult.rows[0]?.c ?? 0;

    params.push(limit, offset);
    const lim = params.length - 1;
    const off = params.length;
    const listSql = `SELECT ${SELECT_FIELDS} FROM users${where} ORDER BY id DESC LIMIT $${lim} OFFSET $${off}`;

    const listResult = await client.query(listSql, params);
    const users = (listResult.rows || []).map((r) => ({
      id: r.id,
      cloudbase_uid: r.cloudbase_uid,
      username: r.username,
      email: r.email,
      role: r.role,
      status: r.status,
      points_balance: r.points_balance ?? 0,
      level: r.level ?? 1,
      last_login_at: r.last_login_at ? new Date(r.last_login_at).toISOString() : null,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : "",
    }));

    return ok({ users, total });
  } catch (error) {
    return fail(error, { users: [], total: 0 });
  } finally {
    client.release();
  }
};
