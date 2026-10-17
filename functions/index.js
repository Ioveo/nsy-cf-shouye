import { loadLanding, BUILTIN_PAGES } from "./_landing/store.js";
import { loadCatalog, normalizeSite } from "./_lib/catalog.js";

const MODE_TO_LANDING = {
  software: "software",
  blog: "articles",
  portal: "portal"
};

async function handleLanding(context) {
  context.passThroughOnException?.();
  const { env, request } = context;
  const url = new URL(request.url);

  // 2. 支持预览参数 /?landing=<id>（后台预览用）
  const previewLanding = url.searchParams.get("landing");

  let homeLanding = previewLanding;
  let customPages = [];

  try {
    const landing = await loadLanding(env);
    if (!homeLanding) {
      if (landing.exists && landing.homeLanding) {
        homeLanding = landing.homeLanding;
      }
    }
    customPages = landing.pages || [];
  } catch {}

  // 1. 读 config/landing.json 的 homeLanding；文件不存在时按旧的 site.siteMode 兼容
  if (!homeLanding) {
    try {
      const site = normalizeSite((await loadCatalog(env)).site || {});
      homeLanding = MODE_TO_LANDING[site.siteMode] || "portal";
    } catch {
      homeLanding = "portal";
    }
  }

  const allPages = [...BUILTIN_PAGES, ...customPages];
  const page = allPages.find(p => p.id === homeLanding) || allPages.find(p => p.id === "portal");
  if (!page || !page.path) {
    return context.next();
  }

  // 去掉 .html 的路径（Pages 漂亮 URL 规则）
  const targetPath = page.path.replace(/\.html$/i, "");
  if (!env.ASSETS?.fetch) return context.next();

  try {
    const targetUrl = new URL(targetPath, request.url);
    const response = await env.ASSETS.fetch(new Request(targetUrl, request));
    if (!response.ok) return context.next();

    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-cache");
    return new Response(response.body, { status: 200, headers });
  } catch {
    return context.next();
  }
}

export async function onRequest(context) {
  return handleLanding(context);
}

export async function onRequestGet(context) {
  return handleLanding(context);
}
