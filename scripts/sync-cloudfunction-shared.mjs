/**
 * CloudBase 打每个函数子目录为独立包时，上级目录 cloudfunctions/_shared 不会上传。
 * 部署前运行本脚本，将 _shared 复制到各含 index.js 的函数目录内。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const cfRoot = path.join(root, "cloudfunctions");
const srcShared = path.join(cfRoot, "_shared");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

let n = 0;
for (const ent of fs.readdirSync(cfRoot, { withFileTypes: true })) {
  if (!ent.isDirectory() || ent.name === "_shared") continue;
  const fnDir = path.join(cfRoot, ent.name);
  const idxPath = path.join(fnDir, "index.js");
  if (!fs.existsSync(idxPath)) continue;
  const entry = fs.readFileSync(idxPath, "utf8");
  if (!entry.includes("./_shared/")) continue;
  copyDir(srcShared, path.join(fnDir, "_shared"));
  n++;
}
console.log(`sync-cloudfunction-shared: copied _shared into ${n} function director(y/ies).`);
