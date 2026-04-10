"use strict";

function createAppError(message) {
  const error = new Error(message);
  error.errMsg = message;
  return error;
}

function pickString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function resolvePayload(event) {
  if (!event || typeof event !== "object") {
    return {};
  }

  if (event.body && typeof event.body === "object") {
    return event.body;
  }

  if (typeof event.body === "string") {
    try {
      const parsed = JSON.parse(event.body);
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    } catch (_) {
      return event;
    }
  }

  return event;
}

function resolveAuthIdentity(event, context) {
  const data = resolvePayload(event);
  const eventCloudbaseUid =
    event && typeof event === "object" ? pickString(event.cloudbase_uid) : "";
  const eventEmail =
    event && typeof event === "object" ? pickString(event.email) : "";

  const cloudbase_uid =
    pickString(context?.userInfo?.openId) ||
    pickString(context?.userInfo?.uid) ||
    eventCloudbaseUid ||
    pickString(data.cloudbase_uid) ||
    "";

  const email = eventEmail || pickString(data.email) || "";

  return {
    cloudbase_uid,
    email,
    data,
  };
}

async function getCurrentUser(client, event, context) {
  const identity = resolveAuthIdentity(event, context);
  const lookupUid = identity.cloudbase_uid || identity.email;
  const lookupEmail = identity.email || identity.cloudbase_uid;

  if (!lookupUid && !lookupEmail) {
    return null;
  }

  const result = await client.query(
    "SELECT * FROM users WHERE cloudbase_uid = $1 OR email = $2 ORDER BY id ASC LIMIT 1",
    [lookupUid, lookupEmail]
  );

  return result.rows[0] || null;
}

async function requireLogin(client, event, context) {
  const user = await getCurrentUser(client, event, context);
  if (!user) {
    throw createAppError("未登录");
  }
  return user;
}

async function requireRole(client, event, context, roles) {
  const user = await requireLogin(client, event, context);
  const normalizedRoles = Array.isArray(roles) ? roles : [roles];
  if (!normalizedRoles.includes(user.role)) {
    throw createAppError("无权限");
  }
  return user;
}

module.exports = {
  resolveAuthIdentity,
  getCurrentUser,
  requireLogin,
  requireRole,
};
