"use strict";

const path = require("path");
const { createRequire } = require("module");

const runtimeRequire = createRequire(path.join(process.cwd(), "package.json"));
const { Pool } = runtimeRequire("pg");

let pool = null;

function getPool() {
  if (!pool) {
    pool = new Pool(
      process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            max: 2,
            idleTimeoutMillis: 10000,
          }
        : {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || "5432", 10),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            ssl:
              process.env.DB_SSL === "true"
                ? { rejectUnauthorized: false }
                : false,
            max: 2,
            idleTimeoutMillis: 10000,
          }
    );
  }
  return pool;
}

async function withTransaction(handler) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await handler(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getPool,
  withTransaction,
};
