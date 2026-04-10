"use strict";

function createAppError(message) {
  const error = new Error(message);
  error.errMsg = message;
  return error;
}

function parsePositiveInt(value, fieldName = "value") {
  const parsed = parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createAppError(`${fieldName} 必须为正整数`);
  }
  return parsed;
}

function parseNonNegativeInt(value, fieldName = "value") {
  const parsed = parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw createAppError(`${fieldName} 必须为非负整数`);
  }
  return parsed;
}

function assertEnum(value, allowedValues, fieldName = "value") {
  if (!allowedValues.includes(value)) {
    throw createAppError(`${fieldName} 不合法`);
  }
  return value;
}

function assertStringLength(value, options = {}) {
  const fieldName = options.fieldName || "value";
  const min = Number.isInteger(options.min) ? options.min : 0;
  const max = Number.isInteger(options.max) ? options.max : Number.POSITIVE_INFINITY;
  const text = value == null ? "" : String(value);

  if (text.length < min || text.length > max) {
    throw createAppError(`${fieldName} 长度不合法`);
  }

  return text;
}

module.exports = {
  parsePositiveInt,
  parseNonNegativeInt,
  assertEnum,
  assertStringLength,
};
