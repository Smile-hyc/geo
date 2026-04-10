"use strict";

function resolveMessage(errMsg) {
  if (typeof errMsg === "string" && errMsg.trim()) {
    return errMsg;
  }
  if (errMsg && typeof errMsg === "object") {
    if (typeof errMsg.errMsg === "string" && errMsg.errMsg.trim()) {
      return errMsg.errMsg;
    }
    if (typeof errMsg.message === "string" && errMsg.message.trim()) {
      return errMsg.message;
    }
  }
  return "未知错误";
}

function ok(data = {}) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { success: true, data };
  }
  return { success: true, ...data };
}

function fail(errMsg, extra = {}) {
  return {
    errMsg: resolveMessage(errMsg),
    ...extra,
  };
}

module.exports = {
  ok,
  fail,
};
