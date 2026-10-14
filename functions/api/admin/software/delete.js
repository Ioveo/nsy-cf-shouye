import { loadCatalog, saveCatalog } from "../../../_lib/catalog.js";
import { json } from "../../../_lib/releases.js";
import { requireAdmin, success } from "../_lib.js";

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;
  const id = String(auth.body?.id || "");
  if (!id) return json({ success: false, msg: "缺少软件 ID" }, 400);
  const catalog = await loadCatalog(env);
  const software = catalog.software.find(item => item.id === id);
  if (!software) return json({ success: false, msg: "软件不存在" }, 404);
  // 有版本的软件需要二次确认，避免误删全部版本记录
  const releaseCount = (software.releases || []).length;
  if (releaseCount && auth.body?.force !== true) {
    return json({ success: false, needForce: true, releaseCount, msg: `该软件还有 ${releaseCount} 个版本` }, 409);
  }
  catalog.software = catalog.software.filter(item => item.id !== id);
  return success(await saveCatalog(env, catalog));
}
