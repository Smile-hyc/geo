/**
 * 部署前自检：禁止残留 ../_shared/；凡引用 ./_shared/ 的函数目录下须有复制的 _shared。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cfRoot = path.join(__dirname, "..", "cloudfunctions");
let failed = false;

for (const ent of fs.readdirSync(cfRoot, { withFileTypes: true })) {
  if (!ent.isDirectory() || ent.name === "_shared") continue;
  const fnDir = path.join(cfRoot, ent.name);
  const idxPath = path.join(fnDir, "index.js");
  if (!fs.existsSync(idxPath)) continue;
  const body = fs.readFileSync(idxPath, "utf8");
  if (body.includes("../_shared/")) {
    console.error(`[verify-cloudfunction-shared] ${ent.name}/index.js 仍含 ../_shared/，请改为 ./_shared/`);
    failed = true;
  }
  if (body.includes("./_shared/")) {
    const dbPath = path.join(fnDir, "_shared", "db.js");
    if (!fs.existsSync(dbPath)) {
      console.error(`[verify-cloudfunction-shared] ${ent.name} 引用 ./_shared/ 但缺少目录 _shared/，请运行 npm run cloudfunctions:sync-shared`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log("verify-cloudfunction-shared: OK");
