import { isKnownConfig, loadConfig } from "../../_config/store.js";

export async function onRequestGet({ env, params }) {
  const name = String(params.name || "").replace(/\.json$/, "");
  if (!isKnownConfig(name)) {
    return new Response(JSON.stringify({ success: false, msg: `未知配置：${name}` }), {
      status: 404,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-cache"
      }
    });
  }

  try {
    const config = await loadConfig(env, name);
    return new Response(JSON.stringify(config), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-cache"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, msg: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-cache"
      }
    });
  }
}
