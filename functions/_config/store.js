import { DEFAULTS, VALIDATORS } from "./schemas.js";

const keyOf = name => `config/${name}.json`;

export function isKnownConfig(name) {
  return typeof name === "string" && Object.hasOwn(DEFAULTS, name);
}

export async function loadConfig(env, name) {
  if (!isKnownConfig(name)) throw new Error(`未知配置名：${name}`);
  const object = await env.SOFTWARE_BUCKET?.get(keyOf(name));
  if (!object) return structuredClone(DEFAULTS[name]);
  try {
    const raw = JSON.parse(await object.text());
    return VALIDATORS[name]({ ...structuredClone(DEFAULTS[name]), ...raw });
  } catch {
    return structuredClone(DEFAULTS[name]);
  }
}

export async function saveConfig(env, name, data) {
  if (!isKnownConfig(name)) throw new Error(`未知配置名：${name}`);
  if (!env.SOFTWARE_BUCKET?.put) throw new Error("R2 绑定 SOFTWARE_BUCKET 未配置");
  const clean = VALIDATORS[name](data);
  clean.version = 1;
  clean.updatedAt = Date.now();
  const previous = await env.SOFTWARE_BUCKET.get(keyOf(name));
  if (previous) {
    await env.SOFTWARE_BUCKET.put(`config/${name}.prev.json`, await previous.text(), {
      httpMetadata: { contentType: "application/json; charset=utf-8" }
    });
  }
  await env.SOFTWARE_BUCKET.put(keyOf(name), JSON.stringify(clean, null, 2), {
    httpMetadata: { contentType: "application/json; charset=utf-8" }
  });
  return clean;
}

export async function rollbackConfig(env, name) {
  if (!isKnownConfig(name)) throw new Error(`未知配置名：${name}`);
  if (!env.SOFTWARE_BUCKET?.get) throw new Error("R2 绑定 SOFTWARE_BUCKET 未配置");
  const prevObj = await env.SOFTWARE_BUCKET.get(`config/${name}.prev.json`);
  if (!prevObj) throw new Error("没有可回滚的历史版本");
  const text = await prevObj.text();
  const data = JSON.parse(text);
  return await saveConfig(env, name, data);
}
