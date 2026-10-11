import { abortMultipart, resolveUploadTarget } from "../../../_lib/multipart.js";
import { json } from "../../../_lib/releases.js";
import { requireAdmin } from "../_lib.js";

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = auth.body || {};
  const uploadId = String(body.uploadId || "");
  const fileKey = String(body.fileKey || "");
  if (!uploadId || !fileKey) return json({ success: false, msg: "缺少上传参数" }, 400);

  try {
    const target = await resolveUploadTarget(env, body.storageId || "default");
    await abortMultipart(target, fileKey, uploadId);
  } catch {
    // 取消失败不影响结果，未完成的分片会被 R2 自动清理
  }
  return json({ success: true, msg: "上传已取消" });
}
