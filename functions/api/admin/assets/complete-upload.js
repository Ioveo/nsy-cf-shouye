import { saveAsset } from "../../../_lib/assets-db.js";
import { inferredContentType, normalizeKind, withAssetUrl } from "../../../_lib/asset-upload.js";
import { completeMultipart, normalizeParts, publicUrlForTarget, resolveUploadTarget } from "../../../_lib/multipart.js";
import { json } from "../../../_lib/releases.js";
import { requireAdmin } from "../_lib.js";

// 资源库大文件：合并分片并登记资源
export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = auth.body || {};
  const uploadId = String(body.uploadId || "");
  const fileKey = String(body.fileKey || "");
  if (!uploadId || !fileKey || !Array.isArray(body.parts) || !body.parts.length) {
    return json({ success: false, msg: "缺少上传确认参数" }, 400);
  }

  const fileName = String(body.fileName || fileKey.split("/").pop() || "asset.bin");
  const contentType = String(body.contentType || inferredContentType(fileName) || "application/octet-stream");
  const kind = normalizeKind(String(body.kind || "other"), fileName, contentType) || "other";

  let target;
  let size;
  try {
    target = await resolveUploadTarget(env, body.storageId || "default");
    size = (await completeMultipart(target, fileKey, uploadId, normalizeParts(body.parts))).size || Number(body.fileSize || 0);
  } catch (error) {
    return json({ success: false, msg: `完成上传失败: ${error.message || "未知错误"}` }, error.status || 500);
  }

  const asset = await saveAsset(env, {
    storageId: target.storageId,
    bucket: target.bucketName,
    key: fileKey,
    kind,
    mimeType: contentType,
    fileName,
    fileSize: size,
    sha256: "",
    publicUrl: publicUrlForTarget(target, fileKey),
    source: "chunked-upload",
    refType: String(body.refType || ""),
    refId: String(body.refId || "")
  });
  if (!asset) return json({ success: false, msg: `文件已上传到 ${fileKey}，但 D1 未配置，资源记录保存失败` }, 500);
  return json({ success: true, asset: withAssetUrl(asset) });
}
