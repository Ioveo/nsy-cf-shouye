import { loadCatalog, saveCatalog } from "../../../_lib/catalog.js";
import { json } from "../../../_lib/releases.js";
import { requireAdmin, success } from "../_lib.js";

// 删除版本记录；deleteFile=true 时同时删除默认 R2 中的安装包（没有其它版本引用时）
export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;
  const releaseId = String(auth.body?.releaseId || "");
  const deleteFile = auth.body?.deleteFile === true;
  if (!releaseId) return json({ success: false, msg: "缺少版本 ID" }, 400);
  const catalog = await loadCatalog(env);
  let removed = null;
  for (const software of catalog.software || []) {
    const index = (software.releases || []).findIndex(release => release.id === releaseId);
    if (index >= 0) {
      removed = software.releases.splice(index, 1)[0];
      software.updatedAt = Date.now();
      if (removed.isLatest && software.releases.length) {
        const next = software.releases.find(release => release.status === "published") || software.releases[0];
        next.isLatest = true;
      }
      break;
    }
  }
  if (!removed) return json({ success: false, msg: "版本不存在" }, 404);

  let fileDeleted = false;
  if (deleteFile && removed.fileKey && (removed.storageId || "default") === "default" && env.SOFTWARE_BUCKET?.delete) {
    const stillUsed = (catalog.software || []).some(software => (software.releases || []).some(release => release.fileKey === removed.fileKey));
    if (!stillUsed) {
      await env.SOFTWARE_BUCKET.delete(removed.fileKey);
      fileDeleted = true;
    }
  }
  return success(await saveCatalog(env, catalog), { fileDeleted });
}
