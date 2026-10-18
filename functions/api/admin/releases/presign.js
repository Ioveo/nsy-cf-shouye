import { findRelease, inferPlatform, loadCatalog, slugify } from "../../../_lib/catalog.js";
import { createMultipart, formatLimit, hasStorage, MAX_MULTIPART_SIZE, resolveUploadTarget } from "../../../_lib/multipart.js";
import { json } from "../../../_lib/releases.js";
import { requireAdmin } from "../_lib.js";

// 初始化安装包分片上传：新版本发布或替换已有版本（releaseId），支持默认 R2 和外部 R2
export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = auth.body || {};
  const releaseId = String(body.releaseId || "");
  let softwareId = String(body.softwareId || "");
  let version = String(body.version || "").trim();
  let storageId = String(body.storageId || "default");
  const rawFileName = String(body.fileName || "");
  const fileSize = Number(body.fileSize || 0);
  const catalog = await loadCatalog(env);

  if (releaseId) {
    const match = findRelease(catalog, releaseId);
    if (!match) return json({ success: false, msg: "版本不存在" }, 404);
    softwareId = match.software.id;
    version = String(match.release.version || "version");
    storageId = match.release.storageId || "default";
    // 外链版本或存储已删除时，替换包落到默认 R2
    if (!hasStorage(catalog, storageId)) storageId = "default";
  }

  if (!softwareId || !version || !rawFileName) {
    return json({ success: false, msg: "请填写软件、版本号和文件名" }, 400);
  }

  const fileName = sanitizeFileName(rawFileName);
  if (!isAllowedPackage(fileName)) {
    return json({ success: false, msg: "安装包格式不支持，请上传 zip、7z、rar、exe 或 msi 文件" }, 400);
  }
  if (fileSize > MAX_MULTIPART_SIZE) {
    return json({ success: false, msg: `安装包不能超过 ${formatLimit(MAX_MULTIPART_SIZE)}` }, 400);
  }

  const software = catalog.software.find(item => item.id === softwareId);
  if (!software) return json({ success: false, msg: "软件不存在" }, 404);

  const ext = (fileName.split(".").pop() || "zip").toLowerCase();
  const rawBase = fileName.slice(0, fileName.lastIndexOf(".")) || fileName;
  const asciiBase = rawBase
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  const hasMeaningfulAscii = /[a-zA-Z]{2,}/.test(asciiBase);
  const platform = String(body.platform || inferPlatform(fileName));
  const keyFileName = hasMeaningfulAscii
    ? `${software.slug}-v${version}-${asciiBase}.${ext}`
    : `${software.slug}-v${version}-${platform}.${ext}`;
  const fileKey = `software/${software.slug}/${version}/${keyFileName}`;

  try {
    const target = await resolveUploadTarget(env, storageId, catalog);
    const uploadId = await createMultipart(target, fileKey, contentTypeFor(fileName));
    return json({ success: true, uploadId, fileKey, storageId: target.storageId });
  } catch (error) {
    return json({ success: false, msg: `初始化分片上传失败: ${error.message || "未知错误"}` }, error.status || 500);
  }
}

function sanitizeFileName(value) {
  return String(value || "download.bin").replace(/["\\\r\n]/g, "");
}

function isAllowedPackage(fileName) {
  const ext = String(fileName || "").toLowerCase().split(".").pop();
  return ["zip", "7z", "rar", "exe", "msi"].includes(ext);
}

function contentTypeFor(fileName) {
  const ext = String(fileName || "").toLowerCase().split(".").pop();
  return { zip: "application/zip", "7z": "application/x-7z-compressed", rar: "application/vnd.rar", exe: "application/x-msdownload", msi: "application/x-msi" }[ext] || "application/octet-stream";
}
