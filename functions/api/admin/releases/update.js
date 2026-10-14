import { loadCatalog, saveCatalog } from "../../../_lib/catalog.js";
import { json } from "../../../_lib/releases.js";
import { requireAdmin, success } from "../_lib.js";

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;
  const releaseId = String(auth.body?.releaseId || "");
  const action = String(auth.body?.action || "");
  if (!releaseId || !action) return json({ success: false, msg: "缺少版本 ID 或操作" }, 400);
  const catalog = await loadCatalog(env);
  const match = findRelease(catalog, releaseId);
  if (!match) return json({ success: false, msg: "版本不存在" }, 404);

  if (action === "latest") {
    for (const release of match.software.releases) release.isLatest = release.id === releaseId;
    match.release.status = "published";
  } else if (action === "toggle") {
    match.release.status = match.release.status === "disabled" ? "published" : "disabled";
  } else if (action === "edit") {
    // 编辑版本信息：版本号、更新说明、状态、文件名、是否最新
    const body = auth.body || {};
    const version = String(body.version ?? match.release.version).trim();
    if (!version) return json({ success: false, msg: "版本号不能为空" }, 400);
    if (match.software.releases.some(item => item.id !== releaseId && item.version === version)) {
      return json({ success: false, msg: `版本 ${version} 已存在` }, 400);
    }
    const status = String(body.status || match.release.status);
    if (!["published", "draft", "disabled"].includes(status)) return json({ success: false, msg: "未知状态" }, 400);
    match.release.version = version;
    match.release.status = status;
    if (body.changelog !== undefined) match.release.changelog = String(body.changelog);
    if (body.fileName) match.release.fileName = String(body.fileName).replace(/["\\\r\n]/g, "");
    if (body.isLatest === true || body.isLatest === "1") {
      for (const release of match.software.releases) release.isLatest = release.id === releaseId;
    } else if (body.isLatest === false || body.isLatest === "0") {
      match.release.isLatest = false;
    }
  } else {
    return json({ success: false, msg: "未知操作" }, 400);
  }
  match.release.updatedAt = Date.now();
  match.software.updatedAt = Date.now();
  return success(await saveCatalog(env, catalog));
}

function findRelease(catalog, releaseId) {
  for (const software of catalog.software || []) {
    const release = software.releases?.find(item => item.id === releaseId);
    if (release) return { software, release };
  }
  return null;
}
