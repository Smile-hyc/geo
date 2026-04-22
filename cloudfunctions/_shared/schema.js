"use strict";

const cache = new Map();

async function hasColumn(client, tableName, columnName) {
  const key = `${tableName}.${columnName}`;
  if (cache.has(key)) {
    return cache.get(key);
  }

  const result = await client.query(
    `SELECT 1
       FROM information_schema.columns
      WHERE table_schema = CURRENT_SCHEMA()
        AND table_name = $1
        AND column_name = $2
      LIMIT 1`,
    [tableName, columnName]
  );

  const exists = result.rows.length > 0;
  cache.set(key, exists);
  return exists;
}

module.exports = {
  hasColumn,
};
