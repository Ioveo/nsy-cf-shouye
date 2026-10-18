// ⚠️ 受保护文件：R2 分片并行上传模块（从已验证的 public/admin.js 原样抽出）
// 新后台只允许 import 使用，不允许修改。改动会被 scripts/guard/check-protected.mjs 拦下。
//
// 用法：
//   import { configureUpload, uploadFileInParts, uploadReleaseFile, uploadAssetFile, uploadHotUpdateFile } from "./lib/r2-upload.js";
//   configureUpload({ getToken: () => token, setToken: t => { token = t; }, ui: { show(title, fileName) {}, update(percent, text) {}, hide() {} } });
//   const result = await uploadReleaseFile(file, { softwareId, version, changelog, isLatest, storageId });
//   result.success / result.msg / result.catalog

export const CHUNK_SIZE = 10 * 1024 * 1024;
export const CHUNK_UPLOAD_THRESHOLD = 10 * 1024 * 1024;
export const MAX_CHUNKED_SIZE = 10 * 1024 * 1024 * 1024;
export const UPLOAD_CONCURRENCY = 8;
const TOKEN_REFRESH_INTERVAL = 20 * 60 * 1000;

let config = {
  getToken: () => "",
  setToken: () => {},
  ui: { show() {}, update() {}, hide() {} }
};

export function configureUpload(next) {
  config = { ...config, ...next, ui: { ...config.ui, ...(next?.ui || {}) } };
}

const ui = {
  show: (...args) => config.ui.show(...args),
  update: (...args) => config.ui.update(...args),
  hide: (...args) => config.ui.hide(...args)
};

async function api(url, payload = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${config.getToken()}` },
    body: JSON.stringify(payload)
  });
  return response.json();
}

export function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = value / 1024;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) { size /= 1024; index++; }
  return `${size.toFixed(size >= 100 ? 0 : 1)} ${units[index]}`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function parseUploadResponse(text) {
  const value = String(text || "").trim();
  if (!value) return {};
  if (value.startsWith("{")) return JSON.parse(value);
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(value)?.[1]?.replace(/\s+/g, " ").trim();
  return { success: false, msg: title ? `上传接口返回 HTML：${title}` : "上传接口返回 HTML，未命中上传 API" };
}

export async function refreshAdminToken() {
  const response = await fetch("/api/admin/refresh", {
    method: "POST",
    headers: { "Authorization": `Bearer ${config.getToken()}` }
  });
  const result = await response.json();
  if (result.success && result.token) config.setToken(result.token);
  return result;
}

// 小文件（≤10MB）单次上传：url 为接口地址，form 为 FormData（需自带 token 字段）
export function uploadSmallFile(url, form, progress = {}) {
  ui.show(progress.title || "正在上传", progress.fileName || "");
  return new Promise(resolve => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = event => {
      if (!event.lengthComputable) return ui.update(0, "正在上传，等待服务器接收文件...");
      const percent = Math.max(1, Math.min(99, Math.round((event.loaded / event.total) * 100)));
      ui.update(percent, `${formatBytes(event.loaded)} / ${formatBytes(event.total)}`);
    };
    xhr.onload = () => {
      let result = {};
      try { result = parseUploadResponse(xhr.responseText); } catch { result = {}; }
      if (xhr.status >= 200 && xhr.status < 300) {
        ui.update(100, "上传完成");
        setTimeout(() => ui.hide(), 500);
        return resolve(result);
      }
      ui.hide();
      resolve({ success: false, msg: result.msg || `上传失败：HTTP ${xhr.status}` });
    };
    xhr.onerror = () => { ui.hide(); resolve({ success: false, msg: "上传失败：网络或接口异常" }); };
    xhr.onabort = () => { ui.hide(); resolve({ success: false, msg: "上传已取消" }); };
    xhr.send(form);
  });
}

// 通用并行分片上传（与 public/admin.js 中 uploadFileInParts 逻辑一致）
export async function uploadFileInParts(file, options) {
  ui.show(options.title || "正在上传", file.name);

  let init;
  try {
    init = await api(options.initUrl, { ...options.initPayload, fileName: file.name, fileSize: file.size, contentType: file.type || "" });
  } catch (error) {
    init = { success: false, msg: `初始化上传失败：${error.message || "网络异常"}` };
  }
  if (!init.success) {
    ui.hide();
    return init;
  }

  const { uploadId, fileKey, storageId } = init;
  const partSize = Math.max(CHUNK_SIZE, Math.ceil(file.size / 9000 / (1024 * 1024)) * 1024 * 1024);
  const totalParts = Math.max(1, Math.ceil(file.size / partSize));
  const loaded = new Array(totalParts).fill(0);
  const etags = new Array(totalParts);
  const startedAt = Date.now();
  let nextIndex = 0;
  let finishedParts = 0;
  let failure = "";

  const report = () => {
    const uploaded = loaded.reduce((sum, value) => sum + value, 0);
    const elapsed = (Date.now() - startedAt) / 1000;
    const speed = elapsed > 0 ? uploaded / elapsed : 0;
    const eta = speed > 0 ? Math.round((file.size - uploaded) / speed) : 0;
    const etaText = eta > 60 ? `${Math.floor(eta / 60)}分${eta % 60}秒` : `${eta}秒`;
    const percent = Math.max(1, Math.min(97, Math.round((uploaded / Math.max(file.size, 1)) * 97)));
    ui.update(percent, `${formatBytes(uploaded)} / ${formatBytes(file.size)} · ${formatBytes(speed)}/s · 分片 ${finishedParts}/${totalParts} · 预计 ${etaText}`);
  };
  const timer = setInterval(report, 500);
  const refreshTimer = setInterval(() => refreshAdminToken().catch(() => {}), TOKEN_REFRESH_INTERVAL);

  const worker = async () => {
    while (!failure && nextIndex < totalParts) {
      const index = nextIndex++;
      const start = index * partSize;
      const end = Math.min(start + partSize, file.size);
      let lastError = "";
      for (let attempt = 1; attempt <= 4 && !failure; attempt++) {
        try {
          const result = await sendUploadPart(file.slice(start, end), { uploadId, fileKey, storageId, partNumber: index + 1 }, bytes => {
            loaded[index] = bytes;
          });
          etags[index] = result.etag;
          loaded[index] = end - start;
          finishedParts++;
          lastError = "";
          break;
        } catch (error) {
          loaded[index] = 0;
          lastError = error.message || "网络异常";
          if (error.fatal) break;
          await sleep(1000 * attempt);
        }
      }
      if (lastError && !failure) failure = `分片 ${index + 1} 上传失败：${lastError}`;
    }
  };

  await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, totalParts) }, () => worker()));
  clearInterval(timer);
  clearInterval(refreshTimer);

  if (failure) {
    api("/api/admin/uploads/abort", { uploadId, fileKey, storageId }).catch(() => {});
    ui.hide();
    return { success: false, msg: failure };
  }

  report();
  ui.update(98, "所有分片已上传，正在合并文件...");
  let result;
  try {
    result = await api(options.completeUrl, {
      ...options.completePayload,
      uploadId,
      fileKey,
      storageId,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type || "",
      parts: etags.map((etag, index) => ({ partNumber: index + 1, etag }))
    });
  } catch (error) {
    result = { success: false, msg: `完成上传失败：${error.message || "网络异常"}` };
  }

  if (result.success) {
    ui.update(100, options.doneText || "上传完成");
    setTimeout(() => ui.hide(), 800);
  } else {
    ui.hide();
  }
  return result;
}

function sendUploadPart(blob, meta, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/uploads/part");
    xhr.setRequestHeader("Authorization", `Bearer ${config.getToken()}`);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.setRequestHeader("X-Upload-Id", meta.uploadId);
    xhr.setRequestHeader("X-File-Key", encodeURIComponent(meta.fileKey));
    xhr.setRequestHeader("X-Storage-Id", meta.storageId || "default");
    xhr.setRequestHeader("X-Part-Number", String(meta.partNumber));
    xhr.timeout = 10 * 60 * 1000;
    xhr.upload.onprogress = event => {
      if (event.lengthComputable) onProgress(event.loaded);
    };
    xhr.onload = () => {
      let result = {};
      try { result = parseUploadResponse(xhr.responseText); } catch { result = {}; }
      if (xhr.status >= 200 && xhr.status < 300 && result.success && result.etag) return resolve(result);
      const error = new Error(result.msg || `HTTP ${xhr.status}`);
      error.fatal = xhr.status === 401 || xhr.status === 403;
      reject(error);
    };
    xhr.onerror = () => reject(new Error("网络异常"));
    xhr.ontimeout = () => reject(new Error("请求超时"));
    xhr.send(blob);
  });
}

// ---------- 业务封装：新后台只调用下面这几个 ----------

// 发布新版本（file 任意大小；≤10MB 走单次上传，其余分片）
export async function uploadReleaseFile(file, { softwareId, version, changelog = "", isLatest = true, storageId = "default", platform = "" }) {
  if (file.size > MAX_CHUNKED_SIZE) return { success: false, msg: `安装包不能超过 ${formatBytes(MAX_CHUNKED_SIZE)}` };
  if (file.size <= CHUNK_UPLOAD_THRESHOLD) {
    const form = new FormData();
    form.append("token", config.getToken());
    form.append("softwareId", softwareId);
    form.append("storageId", storageId);
    form.append("version", version);
    form.append("changelog", changelog);
    form.append("isLatest", isLatest ? "1" : "0");
    if (platform) form.append("platform", platform);
    form.append("file", file);
    return uploadSmallFile("/api/admin/releases", form, { title: "正在发布版本", fileName: file.name });
  }
  return uploadFileInParts(file, {
    title: "正在发布版本",
    initUrl: "/api/admin/releases/presign",
    initPayload: { softwareId, version, storageId, platform },
    completeUrl: "/api/admin/releases/complete-upload",
    completePayload: { softwareId, version, changelog, isLatest, platform },
    doneText: "上传完成，版本已发布"
  });
}

// 替换已有版本的安装包（版本号和下载链接不变）
export async function replaceReleaseFile(file, releaseId) {
  if (file.size > MAX_CHUNKED_SIZE) return { success: false, msg: `安装包不能超过 ${formatBytes(MAX_CHUNKED_SIZE)}` };
  if (file.size <= CHUNK_UPLOAD_THRESHOLD) {
    const form = new FormData();
    form.append("token", config.getToken());
    form.append("releaseId", releaseId);
    form.append("file", file);
    return uploadSmallFile("/api/admin/releases/replace", form, { title: "正在替换安装包", fileName: file.name });
  }
  return uploadFileInParts(file, {
    title: "正在替换安装包",
    initUrl: "/api/admin/releases/presign",
    initPayload: { releaseId },
    completeUrl: "/api/admin/releases/complete-upload",
    completePayload: { releaseId },
    doneText: "上传完成，安装包已替换"
  });
}

// 资源库上传（kind: image / audio / software / site / other）；返回 { success, asset, url }
export async function uploadAssetFile(file, { kind, folder = "", storageId = "default" }) {
  if (file.size > MAX_CHUNKED_SIZE) return { success: false, msg: `文件不能超过 ${formatBytes(MAX_CHUNKED_SIZE)}` };
  if (file.size <= CHUNK_UPLOAD_THRESHOLD) {
    const form = new FormData();
    form.append("token", config.getToken());
    form.append("kind", kind);
    form.append("folder", folder);
    form.append("storageId", storageId);
    form.append("file", file);
    const result = await uploadSmallFile("/api/admin/assets/upload", form, { title: "正在上传资源", fileName: file.name });
    return { ...result, url: result.url || result.asset?.url || result.asset?.publicUrl || "" };
  }
  return uploadFileInParts(file, {
    title: "正在上传资源",
    initUrl: "/api/admin/assets/presign",
    initPayload: { kind, folder, storageId },
    completeUrl: "/api/admin/assets/complete-upload",
    completePayload: { kind, folder },
    doneText: "上传完成，资源已登记"
  });
}

// 热更新文件上传到 apps/<app>/；返回 { success, url, fileKey }，url 可直接填进 patchUrl / fullSetupUrl
export function uploadHotUpdateFile(file, app) {
  return uploadFileInParts(file, {
    title: "正在上传热更新文件",
    initUrl: "/api/admin/assets/presign",
    initPayload: { kind: "hotupdate", folder: app, storageId: "default" },
    completeUrl: "/api/admin/assets/complete-upload",
    completePayload: { kind: "hotupdate", folder: app, refType: "hotupdate", refId: app },
    doneText: "热更新文件已上传到 R2"
  });
}

// 计算整个文件 SHA256（>512MB 返回空字符串）
export async function computeFileHash(file) {
  if (!file || file.size > 512 * 1024 * 1024) return "";
  try {
    const hashBuffer = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return "";
  }
}

// 检查同域下载地址是否真的能下载（发布热更新前用）
export async function isDownloadUrlReachable(value) {
  try {
    const url = new URL(value, location.origin);
    if (url.origin !== location.origin) return true;
    const response = await fetch(url, { method: "HEAD", cache: "no-store" });
    const type = response.headers.get("Content-Type") || "";
    return response.ok && !type.includes("text/html");
  } catch {
    return true;
  }
}
