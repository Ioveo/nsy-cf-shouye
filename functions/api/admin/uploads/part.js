import { MAX_PART_COUNT, resolveUploadTarget, safeDecode, uploadMultipartPart } from "../../../_lib/multipart.js";
import { json } from "../../../_lib/releases.js";
import { requireAdminToken } from "../_lib.js";

// 上传单个分片（发布版本 / 替换安装包 / 资源库共用），可并发调用
export async function onRequestPost({ request, env }) {
  const auth = await requireAdminToken(request, env);
  if (!auth.ok) return auth.response;

  const uploadId = request.headers.get("X-Upload-Id") || "";
  const fileKey = safeDecode(request.headers.get("X-File-Key") || "");
  const storageId = request.headers.get("X-Storage-Id") || "default";
  const partNumber = Number(request.headers.get("X-Part-Number") || "0");

  if (!uploadId || !fileKey || !Number.isInteger(partNumber) || partNumber < 1 || partNumber > MAX_PART_COUNT) {
    return json({ success: false, msg: "缺少分片参数" }, 400);
  }

  try {
    const target = await resolveUploadTarget(env, storageId);
    const etag = await uploadMultipartPart(target, fileKey, uploadId, partNumber, request);
    return json({ success: true, partNumber, etag });
  } catch (error) {
    return json({ success: false, msg: `分片上传失败: ${error.message || "未知错误"}` }, error.status || 500);
  }
}
