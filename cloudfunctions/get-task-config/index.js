"use strict";

const { getPool } = require("../_shared/db");
const { requireLogin } = require("../_shared/auth");
const { ok, fail } = require("../_shared/response");
const { getCurrentTaskConfig } = require("../_shared/config");

exports.main = async (event, context) => {
  const client = await getPool().connect();
  try {
    await requireLogin(client, event, context);
    const config = await getCurrentTaskConfig(client);
    return ok({ config });
  } catch (error) {
    return fail(error);
  } finally {
    client.release();
  }
};
