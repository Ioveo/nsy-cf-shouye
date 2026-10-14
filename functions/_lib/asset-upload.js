import { id, slugify } from "./catalog.js";
import { publicAssetUrl } from "./assets-db.js";
import { MAX_MULTIPART_SIZE } from "./multipart.js";

// 资源库上传共用的规则（单次上传与分片上传共用）
export const ASSET_LIMITS = {
  image: 8 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
  software: MAX_MULTIPART_SIZE,
  hotupdate: MAX_MULTIPART_SIZE,
  site: 8 * 1024 * 1024,
  other: 30 * 1024 * 1024
};

export function normalizeKind(kind, name, type) {
  const ext = String(name || "").toLowerCase().split(".").pop();
  if (String(type || "").toLowerCase() === "image/svg+xml" || ext === "svg") return "";
  if (kind === "image" && ["png", "jpg", "jpeg", "gif", "webp", "avif"].includes(ext)) return "image";
  if (kind === "audio" && ["mp3", "m4a", "aac", "wav", "ogg", "oga", "webm", "flac"].includes(ext)) return "audio";
  if (kind === "software" && ["zip", "7z", "rar", "exe", "msi"].includes(ext)) return "software";
  if (kind === "hotupdate" && ["zip", "7z", "rar", "exe", "msi", "dll", "gz", "bin", "json"].includes(ext)) return "hotupdate";
  if (kind === "site" && ["png", "jpg", "jpeg", "gif", "webp", "avif", "ico"].includes(ext)) return "site";
  if (kind === "other") return "other";
  return "";
}

export function keyFor(kind, folder, fileName) {
  const safeFolder = slugify(folder || kind);
  const ym = new Date().toISOString().slice(0, 7).replace("-", "/");
  if (kind === "software") return `software/manual/${Date.now()}-${fileName}`;
  // 热更新文件放在 apps/<应用>/ 下，由 /apps/* 路由直接提供下载
  if (kind === "hotupdate") return `apps/${slugify(folder || "desktop")}/${Date.now()}-${fileName}`;
  if (kind === "site") return `site/${safeFolder}/${Date.now()}-${fileName}`;
  if (kind === "audio") return `media/audio/${ym}/${id("audio")}-${fileName}`;
  if (kind === "image") return `media/images/${ym}/${id("image")}-${fileName}`;
  return `media/other/${ym}/${id("asset")}-${fileName}`;
}

export function sanitizeFileName(value) {
  return String(value || "asset.bin").replace(/["\\\r\n]/g, "").replace(/[^a-zA-Z0-9._-]/g, "-");
}

export function inferredContentType(name) {
  const ext = String(name || "").toLowerCase().split(".").pop();
  return {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    avif: "image/avif",
    ico: "image/x-icon",
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    aac: "audio/aac",
    wav: "audio/wav",
    ogg: "audio/ogg",
    oga: "audio/ogg",
    webm: "audio/webm",
    flac: "audio/flac",
    zip: "application/zip",
    "7z": "application/x-7z-compressed",
    rar: "application/vnd.rar",
    exe: "application/x-msdownload",
    msi: "application/x-msi"
  }[ext] || "";
}

export function withAssetUrl(asset) {
  if (asset.storageId && asset.storageId !== "default" && !asset.publicUrl) return { ...asset, url: "" };
  return { ...asset, url: publicAssetUrl(asset) };
}
