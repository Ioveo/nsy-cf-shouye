import { findRelease, formatBytes, id, loadCatalog, normalizeRelease, saveCatalog } from "../../../_lib/catalog.js";
import { saveAsset } from "../../../_lib/assets-db.js";
import { completeMultipart, normalizeParts, publicUrlForTarget, resolveUploadTarget } from "../../../_lib/multipart.js";
import { json } from "../../../_lib/releases.js";
import { requireAdmin, success } from "../_lib.js";

// 合并分片并写入版本：新发布，或替换已有版本（releaseId，版本号和下载链接不变）
export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = auth.body || {};
  const uploadId = String(body.uploadId || "");
  const fileKey = String(body.fileKey || "");
  const storageId = String(body.storageId || "default");
  const softwareId = String(body.softwareId || "");
  const version = String(body.version || "").trim();
  const fileName = String(body.fileName || "").trim() || fileKey.split("/").pop();
  const fileSize = Number(body.fileSize || 0);
  const changelog = String(body.changelog || "");
  const isLatest = body.isLatest === true || body.isLatest === "1";
  const replaceReleaseId = String(body.releaseId || "");

  if (!uploadId || !fileKey || !Array.isArray(body.parts) || !body.parts.length) {
    return json({ success: false, msg: "缺少上传确认参数" }, 400);
  }
  if (!replaceReleaseId && (!softwareId || !version)) {
    return json({ success: false, msg: "缺少软件和版本信息" }, 400);
  }

  const catalog = await loadCatalog(env);
  let target;
  let actualSize;
  try {
    target = await resolveUploadTarget(env, storageId, catalog);
    const result = await completeMultipart(target, fileKey, uploadId, normalizeParts(body.parts));
    actualSize = result.size || fileSize;
  } catch (error) {
    return json({ success: false, msg: `完成上传失败: ${error.message || "未知错误"}` }, error.status || 500);
  }

  const publicUrl = publicUrlForTarget(target, fileKey);
  const mimeType = contentTypeFor(fileName);
  const assetInput = {
    storageId: target.storageId,
    bucket: target.bucketName,
    key: fileKey,
    kind: "software",
    mimeType,
    fileName,
    fileSize: actualSize,
    sha256: "",
    publicUrl,
    refType: "release"
  };
  const fileFields = {
    fileKey,
    storageId: target.storageId,
    publicUrl,
    fileName,
    fileSize: actualSize,
    size: formatBytes(actualSize),
    sha256: ""
  };

  if (replaceReleaseId) {
    const match = findRelease(catalog, replaceReleaseId);
    if (!match) return json({ success: false, msg: "版本不存在" }, 404);
    const asset = await saveAsset(env, { ...assetInput, source: "chunked-replace", refId: replaceReleaseId });
    Object.assign(match.release, fileFields, {
      assetId: asset?.id || match.release.assetId || "",
      status: "published",
      updatedAt: Date.now()
    });
    match.software.updatedAt = Date.now();
    return success(await saveCatalog(env, catalog));
  }

  const software = catalog.software.find(item => item.id === softwareId);
  if (!software) return json({ success: false, msg: "软件不存在" }, 404);
  if (isLatest) {
    for (const release of software.releases) release.isLatest = false;
  }

  const releaseId = id("rel");
  const asset = await saveAsset(env, { ...assetInput, source: "chunked-upload", refId: releaseId });
  software.releases.unshift(normalizeRelease({
    id: releaseId,
    version,
    changelog,
    assetId: asset?.id || "",
    ...fileFields,
    isLatest,
    status: "published",
    createdAt: Date.now(),
    updatedAt: Date.now()
  }, software.slug));
  software.updatedAt = Date.now();

  return success(await saveCatalog(env, catalog));
}

function contentTypeFor(fileName) {
  const ext = String(fileName || "").toLowerCase().split(".").pop();
  return { zip: "application/zip", "7z": "application/x-7z-compressed", rar: "application/vnd.rar", exe: "application/x-msdownload", msi: "application/x-msi" }[ext] || "application/octet-stream";
}
