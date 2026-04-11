"use strict";

function createAppError(message) {
  const error = new Error(message);
  error.errMsg = message;
  return error;
}

function assertPositiveAmount(amount) {
  const parsed = parseInt(amount, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createAppError("amount 必须为正整数");
  }
  return parsed;
}

function assertReasonType(reasonType) {
  if (typeof reasonType !== "string" || !reasonType.trim()) {
    throw createAppError("reasonType 不能为空");
  }
  return reasonType.trim();
}

async function grantPoints(client, params) {
  const amount = assertPositiveAmount(params?.amount);
  const userId = parseInt(params?.userId, 10);
  const reasonType = assertReasonType(params?.reasonType);
  const referenceId = params?.referenceId ? String(params.referenceId) : null;

  if (!Number.isInteger(userId) || userId <= 0) {
    throw createAppError("userId 不合法");
  }

  const updateResult = await client.query(
    `UPDATE users
     SET points_balance = points_balance + $1, updated_at = NOW()
     WHERE id = $2
     RETURNING points_balance`,
    [amount, userId]
  );

  if (updateResult.rows.length === 0) {
    throw createAppError("用户不存在");
  }

  const balanceAfter = Number(updateResult.rows[0].points_balance) || 0;

  await client.query(
    `INSERT INTO points_ledger (user_id, change_amount, balance_after, reason_type, reference_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, amount, balanceAfter, reasonType, referenceId]
  );

  return { balance_after: balanceAfter };
}

async function deductPoints(client, params) {
  const amount = assertPositiveAmount(params?.amount);
  const userId = parseInt(params?.userId, 10);
  const reasonType = assertReasonType(params?.reasonType);
  const referenceId = params?.referenceId ? String(params.referenceId) : null;

  if (!Number.isInteger(userId) || userId <= 0) {
    throw createAppError("userId 不合法");
  }

  const updateResult = await client.query(
    `UPDATE users
     SET points_balance = points_balance - $1, updated_at = NOW()
     WHERE id = $2 AND points_balance >= $1
     RETURNING points_balance`,
    [amount, userId]
  );

  if (updateResult.rows.length === 0) {
    throw createAppError("积分不足或用户不存在");
  }

  const balanceAfter = Number(updateResult.rows[0].points_balance) || 0;

  await client.query(
    `INSERT INTO points_ledger (user_id, change_amount, balance_after, reason_type, reference_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, -amount, balanceAfter, reasonType, referenceId]
  );

  return { balance_after: balanceAfter };
}

module.exports = {
  grantPoints,
  deductPoints,
};
