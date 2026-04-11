import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env");
let url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  try {
    const raw = readFileSync(envPath, "utf8");
    const m = raw.match(/DIRECT_URL="([^"]+)"/) || raw.match(/DATABASE_URL="([^"]+)"/);
    if (m) url = m[1];
  } catch {
    /* noop */
  }
}
if (!url) {
  console.error("Set DIRECT_URL or DATABASE_URL");
  process.exit(1);
}

// 去掉 sslmode，否则与显式 ssl 冲突导致仍校验证书链失败（Node + Supabase 常见）
const connectionString = url.replace(/[?&]sslmode=[^&]*/g, "").replace(/\?$/, "");

const { Client } = pg;
const c = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
await c.connect();
const r = await c.query(`SELECT
  to_regclass('public.behavior_events') IS NOT NULL AS behavior_events_table_ok,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'image_assets' AND column_name = 'image_meta_json'
  ) AS image_assets_image_meta_json_ok,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'image_assets' AND column_name = 'deleted_at'
  ) AS image_assets_deleted_at_ok`);
console.log(JSON.stringify(r.rows[0], null, 2));
await c.end();
