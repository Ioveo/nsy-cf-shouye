// 受保护文件指纹校验：这些文件负责 R2 上传/下载/热更新，其它 AI 不允许修改
// 运行：node scripts/guard/check-protected.mjs        （有改动则退出码 1）
// 只有项目负责人确认后才能运行：node scripts/guard/check-protected.mjs --update
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const MANIFEST = path.join(ROOT, "scripts/guard/protected.sha256.json");
const PROTECTED = [
  "functions/_lib/r2-s3.js", "functions/_lib/multipart.js", "functions/_lib/releases.js", "functions/_lib/asset-upload.js",
  "functions/_lib/assets-db.js", "functions/_lib/crypto.js", "functions/_lib/download-stats.js", "functions/_lib/catalog.js",
  "functions/api/admin/_lib.js", "functions/api/admin/login.js", "functions/api/admin/refresh.js", "functions/api/admin/releases.js",
  "functions/api/admin/releases", "functions/api/admin/uploads", "functions/api/admin/assets", "functions/api/admin/storage",
  "functions/api/admin/software.js", "functions/api/admin/software", "functions/api/update.js", "functions/api/catalog.js",
  "functions/api/releases.js", "functions/download", "functions/apps", "functions/software", "functions/media",
  "public/console/lib/r2-upload.js", "scripts/guard/r2-regression.mjs", "wrangler.toml"
];
const files = [];
const walk = p => { const full = path.join(ROOT, p); if (!existsSync(full)) return; if (statSync(full).isDirectory()) readdirSync(full).forEach(n => walk(path.join(p, n))); else files.push(p.split(path.sep).join("/")); };
PROTECTED.forEach(walk);
const hash = f => createHash("sha256").update(readFileSync(path.join(ROOT, f)).toString("utf8").replace(/\r\n/g, "\n")).digest("hex");
const current = Object.fromEntries(files.sort().map(f => [f, hash(f)]));
if (process.argv.includes("--update")) { writeFileSync(MANIFEST, JSON.stringify(current, null, 2)); console.log(`已记录 ${files.length} 个受保护文件`); process.exit(0); }
const saved = JSON.parse(readFileSync(MANIFEST, "utf8"));
const changed = [...new Set([...Object.keys(saved), ...Object.keys(current)])].filter(f => saved[f] !== current[f]);
if (changed.length) { console.log("以下受保护文件被改动、新增或删除：\n" + changed.map(f => "  - " + f).join("\n") + "\n请用 git checkout -- <文件> 还原。"); process.exit(1); }
console.log(`受保护文件未改动（${files.length} 个）`);
