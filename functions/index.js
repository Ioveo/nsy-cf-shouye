import { loadCatalog, normalizeSite } from "./_lib/catalog.js";

// 首页按网站模式输出：软件站显示下载中心，博客显示文章列表，综合门户显示原首页
const MODE_HOME = { software: "/download", blog: "/articles" };

export async function onRequestGet(context) {
  const { env, request } = context;
  let mode = "portal";
  try {
    mode = normalizeSite((await loadCatalog(env)).site || {}).siteMode;
  } catch {}
  const target = MODE_HOME[mode];
  if (!target || !env.ASSETS?.fetch) return context.next();
  const response = await env.ASSETS.fetch(new Request(new URL(target, request.url), request));
  if (!response.ok) return context.next();
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-cache");
  return new Response(response.body, { status: 200, headers });
}
