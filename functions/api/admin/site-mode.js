import { loadCatalog, normalizeSite, saveCatalog, SITE_MODES } from "../../_lib/catalog.js";
import { json } from "../../_lib/releases.js";
import { requireAdmin, success } from "./_lib.js";

// 一键切换网站模式：software 软件下载站 / portal 综合门户 / blog 博客
export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;
  const mode = String(auth.body?.mode || "");
  if (!SITE_MODES.includes(mode)) return json({ success: false, msg: "未知的网站模式" }, 400);
  const catalog = await loadCatalog(env);
  catalog.site = normalizeSite({ ...(catalog.site || {}), siteMode: mode });
  return success(await saveCatalog(env, catalog));
}
