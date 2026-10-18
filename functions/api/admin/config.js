import { requireAdmin } from "./_lib.js";
import { isKnownConfig, loadConfig, saveConfig, rollbackConfig } from "../../_config/store.js";
import { json } from "../../_lib/releases.js";

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const body = auth.body || {};
  const action = body.action || "get";
  const name = String(body.name || "").trim().replace(/\.json$/, "");

  if (!name || !isKnownConfig(name)) {
    return json({ success: false, msg: `未知或未指定的配置名：${name || "(空)"}` }, 400);
  }

  try {
    if (action === "get") {
      const config = await loadConfig(env, name);
      return json({ success: true, name, config });
    }

    if (action === "save") {
      const data = body.data;
      if (!data || typeof data !== "object") {
        return json({ success: false, msg: "配置数据不能为空" }, 400);
      }
      const clean = await saveConfig(env, name, data);
      return json({ success: true, name, config: clean });
    }

    if (action === "rollback") {
      const restored = await rollbackConfig(env, name);
      return json({ success: true, name, config: restored });
    }

    return json({ success: false, msg: `未知操作：${action}` }, 400);
  } catch (err) {
    return json({ success: false, msg: err.message }, 400);
  }
}
