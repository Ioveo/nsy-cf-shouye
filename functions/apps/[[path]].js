import { serveR2Object, text } from "../_lib/releases.js";

// 直接按 R2 key 提供 apps/ 下的文件（热更新 patchUrl / fullSetupUrl 默认指向这里）
export async function onRequestGet(context) {
  const { env, params, request } = context;
  const segments = Array.isArray(params.path) ? params.path : [params.path].filter(Boolean);
  // /apps 本身（如 Pages 的美化 URL）交回静态资源处理
  if (!segments.length) return context.next();
  if (!env.SOFTWARE_BUCKET?.get) return text("R2 binding SOFTWARE_BUCKET is not configured", 500);
  if (segments.some(part => part === ".." || part === ".")) return text("File not found", 404);

  const key = `apps/${segments.map(safeDecode).join("/")}`;
  const isJson = /\.json$/i.test(key);
  const response = await serveR2Object(env, request, key, {
    fileName: isJson ? false : segments[segments.length - 1],
    cacheControl: isJson ? "no-cache, no-store, must-revalidate" : "public, max-age=3600"
  });
  if (response) response.headers.set("Access-Control-Allow-Origin", "*");
  return response || text("File not found", 404);
}

export const onRequestHead = onRequestGet;

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
