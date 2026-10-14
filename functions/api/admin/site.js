import { loadCatalog, normalizeSite, saveCatalog } from "../../_lib/catalog.js";
import { requireAdmin, success } from "./_lib.js";

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;
  const catalog = await loadCatalog(env);
  // 合并保存，避免保存首页文案时把网站模式等其它设置重置
  catalog.site = normalizeSite({ ...(catalog.site || {}), ...(auth.body || {}) });
  return success(await saveCatalog(env, catalog));
}
