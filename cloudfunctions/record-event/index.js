"use strict";

const { getPool } = require("../_shared/db");
const { requireLogin } = require("../_shared/auth");
const { ok, fail } = require("../_shared/response");

function getData(event) {
  const raw = event && typeof event === "object" ? event : {};
  return raw.body && typeof raw.body === "object" ? raw.body : raw;
}

exports.main = async (event, context) => {
  const data = getData(event);
  const event_type = typeof data.event_type === "string" ? data.event_type.trim() : "";
  const session_id = typeof data.session_id === "string" ? data.session_id.trim().slice(0, 128) : null;
  let payload = data.event_payload_json;
  if (payload != null && typeof payload !== "object") {
    return fail("event_payload_json 须为对象");
  }
  if (!event_type || event_type.length > 64) {
    return fail("缺少或无效 event_type");
  }

  const client = await getPool().connect();
  try {
    const user = await requireLogin(client, event, context);
    await client.query(
      `INSERT INTO behavior_events (session_id, user_id, event_type, event_payload_json)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [session_id, user.id, event_type, JSON.stringify(payload || {})]
    );
    return ok({ ok: true });
  } catch (error) {
    return fail(error);
  } finally {
    client.release();
  }
};
