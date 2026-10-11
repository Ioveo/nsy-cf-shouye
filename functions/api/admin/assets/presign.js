import { ASSET_LIMITS, inferredContentType, keyFor, normalizeKind, sanitizeFileName } from "../../../_lib/asset-upload.js";
import { createMultipart, formatLimit, resolveUploadTarget } from "../../../_lib/multipart.js";
import { json } from "../../../_lib/releases.js";
import { requireAdmin } from "../_lib.js";

// 资源库大文件：初始化分片上传
export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = auth.body || {};
  const fileName = sanitizeFileName(body.fileName || "asset.bin");
  const fileSize = Number(body.fileSize || 0);
  const contentType = String(body.contentType || inferredContentType(fileName) || "application/octet-stream");
  const kind = normalizeKind(String(body.kind || "other"), fileName, contentType);
  if (!kind) return json({ success: false, msg: "文件类型不支持" }, 400);
  const limit = ASSET_LIMITS[kind] || ASSET_LIMITS.other;
  if (fileSize > limit) return json({ success: false, msg: `文件超过允许大小（${formatLimit(limit)}）` }, 400);

  const fileKey = keyFor(kind, String(body.folder || ""), fileName);
  try {
    const target = await resolveUploadTarget(env, body.storageId || "default");
    const uploadId = await createMultipart(target, fileKey, contentType);
    return json({ success: true, uploadId, fileKey, storageId: target.storageId, kind });
  } catch (error) {
    return json({ success: false, msg: `初始化分片上传失败: ${error.message || "未知错误"}` }, error.status || 500);
  }
}
