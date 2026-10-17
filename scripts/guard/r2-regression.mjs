// R2 上传 / 下载 / 热更新回归测试（内存模拟 R2，不连真实 Cloudflare）
// 运行：node scripts/guard/r2-regression.mjs     全部通过退出码 0，任何失败退出码 1
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const imp = p => import(pathToFileURL(path.join(ROOT, "functions", p)).href);
let failed = 0;
const check = (name, ok, detail = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  " + detail}`); if (!ok) failed++; };

// ---------- 内存 R2（Workers 绑定接口） ----------
const store = new Map(); const uploads = new Map();
const meta = (k, v) => ({ key: k, size: v.data.length, httpEtag: '"etag"', uploaded: new Date(), writeHttpMetadata(h) { h.set("Content-Type", v.type || "application/octet-stream"); } });
const bucket = {
  async head(k) { const v = store.get(k); return v ? meta(k, v) : null; },
  async get(k, o = {}) {
    const v = store.get(k); if (!v) return null;
    const r = o.range; const data = r ? v.data.slice(r.offset, r.offset + r.length) : v.data;
    return { ...meta(k, v), range: r, body: new Blob([data]).stream(), text: async () => new TextDecoder().decode(v.data) };
  },
  async put(k, d, o = {}) { store.set(k, { data: typeof d === "string" ? new TextEncoder().encode(d) : new Uint8Array(d instanceof ArrayBuffer ? d : d.buffer ? d : await new Response(d).arrayBuffer()), type: o.httpMetadata?.contentType }); },
  async delete(k) { store.delete(k); },
  async createMultipartUpload(k, o = {}) { const id = "up" + uploads.size; uploads.set(id, { k, parts: new Map(), type: o.httpMetadata?.contentType }); return { uploadId: id }; },
  resumeMultipartUpload(k, id) { return {
    async uploadPart(n, b) { uploads.get(id).parts.set(n, new Uint8Array(await new Response(b).arrayBuffer())); return { partNumber: n, etag: "e" + n }; },
    async complete(ps) { const u = uploads.get(id); let prev = 0; const bufs = ps.map(p => { if (p.partNumber <= prev) throw new Error("parts not ascending"); prev = p.partNumber; if (p.etag !== "e" + p.partNumber) throw new Error("bad etag"); return u.parts.get(p.partNumber); });
      const all = new Uint8Array(bufs.reduce((s, b) => s + b.length, 0)); let o = 0; for (const b of bufs) { all.set(b, o); o += b.length; } store.set(k, { data: all, type: u.type }); },
    async abort() { uploads.delete(id); } }; }
};
const env = { SOFTWARE_BUCKET: bucket, ADMIN_PASSWORD: "pw", STORAGE_SECRET: "guard-test-secret-123456" };

const { loginAdmin } = await imp("api/admin/_lib.js");
const token = (await (await loginAdmin(new Request("https://x", { method: "POST", body: '{"password":"pw"}' }), env)).json()).token;
check("后台登录拿到令牌", Boolean(token));
const post = async (p, body) => { const m = await imp(p); const r = await m.onRequestPost({ env, request: new Request("https://x/", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) }), waitUntil() {} }); return { status: r.status, ...(await r.json()) }; };

const cat = await imp("_lib/catalog.js");
await bucket.put(cat.CATALOG_KEY || "catalog.json", JSON.stringify({ software: [{ id: "sw1", slug: "desktop", name: "桌面", releases: [] }] }));

// ---------- 分片上传：发布新版本（乱序并发上传分片） ----------
const file = new Uint8Array(25 * 1024 * 1024 + 7).map((_, i) => (i * 31) % 251);
const PART = 10 * 1024 * 1024;
const part = await imp("api/admin/uploads/part.js");
async function uploadParts(init) {
  const n = Math.ceil(file.length / PART);
  const res = await Promise.all([...Array(n).keys()].reverse().map(async i => {
    const body = file.slice(i * PART, Math.min((i + 1) * PART, file.length));
    const r = await part.onRequestPost({ env, request: new Request("https://x", { method: "POST", body, headers: { Authorization: `Bearer ${token}`, "X-Upload-Id": init.uploadId, "X-File-Key": encodeURIComponent(init.fileKey), "X-Storage-Id": init.storageId || "default", "X-Part-Number": String(i + 1) } }) });
    return { i, ...(await r.json()) };
  }));
  return res.every(r => r.success) ? res.map(r => ({ partNumber: r.i + 1, etag: r.etag })) : null;
}
const same = k => { const d = store.get(k)?.data; return Boolean(d) && d.length === file.length && d.every((v, i) => v === file[i]); };

let init = await post("api/admin/releases/presign.js", { softwareId: "sw1", version: "9.9.9", fileName: "Runner 安装包.rar", fileSize: file.length, storageId: "default" });
check("presign 初始化分片上传", init.success && init.fileKey?.startsWith("software/desktop/"), JSON.stringify(init));
check("文件名里的字母 r/n 没被删", /Runner/.test(init.fileKey || ""), init.fileKey);
let parts = await uploadParts(init);
check("8 路乱序上传分片", Boolean(parts));
let done = await post("api/admin/releases/complete-upload.js", { ...init, parts, softwareId: "sw1", version: "9.9.9", fileName: "Runner 安装包.rar", fileSize: file.length, isLatest: true });
const rel = done.catalog?.software?.[0]?.releases?.[0];
check("合并分片并发布版本", done.success && rel?.version === "9.9.9", JSON.stringify(done).slice(0, 200));
check("合并后文件与原文件逐字节一致", same(init.fileKey));

// ---------- 替换安装包 ----------
init = await post("api/admin/releases/presign.js", { releaseId: rel.id, fileName: "new.exe", fileSize: file.length });
parts = await uploadParts(init);
done = await post("api/admin/releases/complete-upload.js", { ...init, parts, releaseId: rel.id, fileName: "new.exe", fileSize: file.length });
const rel2 = done.catalog?.software?.[0]?.releases?.[0];
check("替换安装包后版本 ID 不变", done.success && rel2?.id === rel.id && rel2?.fileName === "new.exe" && same(init.fileKey));
check("超过 10GB 被拒绝", !(await post("api/admin/releases/presign.js", { releaseId: rel.id, fileName: "a.exe", fileSize: 11 * 1024 ** 3 })).success);

// ---------- 下载：整包 / 断点续传 / HEAD / 越界 ----------
const dl = await imp("download/[id].js");
const get = (h = {}, method = "GET") => dl.onRequestGet({ env, params: { id: rel.id }, request: new Request("https://x/download/" + rel.id, { method, headers: h }), waitUntil() {} });
let r = await get();
const whole = new Uint8Array(await r.arrayBuffer());
check("整包下载 200 且内容完整", r.status === 200 && whole.length === file.length && r.headers.get("Accept-Ranges") === "bytes");
check("下载带中文文件名的 Content-Disposition", /filename\*=UTF-8''/.test(r.headers.get("Content-Disposition") || ""));
r = await get({ Range: "bytes=100-199" });
const slice = new Uint8Array(await r.arrayBuffer());
check("断点续传 206 返回正确片段", r.status === 206 && slice.length === 100 && slice[0] === file[100] && r.headers.get("Content-Range") === `bytes 100-199/${file.length}`);
r = await get({ Range: "bytes=-10" });
check("尾部 Range 206", r.status === 206 && (await r.arrayBuffer()).byteLength === 10);
r = await get({ Range: `bytes=${file.length + 5}-` });
check("越界 Range 返回 416", r.status === 416);
r = await (await imp("download/[id].js")).onRequestHead({ env, params: { id: rel.id }, request: new Request("https://x/download/" + rel.id, { method: "HEAD" }), waitUntil() {} });
check("HEAD 请求返回大小", r.status === 200 && r.headers.get("Content-Length") === String(file.length));
const latest = await imp("download/latest/[software].js");
r = await latest.onRequestGet({ env, params: { software: "desktop" }, request: new Request("https://x/download/latest/desktop"), waitUntil() {} });
check("/download/latest/desktop 可下载", r.status === 200);

// ---------- 资源库 / 热更新文件上传 + /apps 路由 ----------
init = await post("api/admin/assets/presign.js", { kind: "hotupdate", folder: "desktop", fileName: "TianCaiMao.Desktop.exe", fileSize: file.length });
parts = await uploadParts(init);
done = await post("api/admin/assets/complete-upload.js", { ...init, parts, kind: "hotupdate", fileName: "TianCaiMao.Desktop.exe", fileSize: file.length });
check("热更新文件分片上传到 apps/", done.success && init.fileKey?.startsWith("apps/desktop/") && same(init.fileKey), JSON.stringify(done).slice(0, 200));
const apps = await imp("apps/[[path]].js");
r = await apps.onRequestGet({ env, params: { path: init.fileKey.split("/").slice(1) }, request: new Request("https://x/" + init.fileKey), next: async () => new Response("next") });
check("/apps/* 路由能下载热更新文件", r.status === 200 && (await r.arrayBuffer()).byteLength === file.length);
r = await apps.onRequestGet({ env, params: { path: [] }, request: new Request("https://x/apps"), next: async () => new Response("next") });
check("/apps 空路径交回静态页面", (await r.text()) === "next");

// ---------- 热更新发布接口 ----------
const upd = await imp("api/update.js");
r = await upd.onRequestPost({ env, request: new Request("https://x/api/update", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ app: "desktop", version: "9.9.10", patchUrl: "/" + init.fileKey, fullSetupUrl: `/download/${rel.id}` }) }) });
const ur = await r.json();
check("发布热更新写入 version.json", ur.success && store.has("apps/desktop/version.json"));
r = await upd.onRequestGet({ env, request: new Request("https://x/api/update?app=desktop") });
const vj = await r.json();
check("客户端读取热更新信息", vj.version === "9.9.10" && /\/apps\/desktop\//.test(vj.patchUrl), JSON.stringify(vj).slice(0, 200));

// ---------- 登录续期 ----------
const refresh = await imp("api/admin/refresh.js");
r = await refresh.onRequestPost({ env, request: new Request("https://x", { method: "POST", headers: { Authorization: `Bearer ${token}` } }) });
check("登录令牌续期", (await r.json()).success === true);

console.log(failed ? `\n${failed} 项失败 —— 你的改动弄坏了上传/下载，请回退后重做` : "\n全部通过");
process.exit(failed ? 1 : 0);
