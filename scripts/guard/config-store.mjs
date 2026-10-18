// 通用配置存储回归测试（内存模拟 R2，验证与 catalog 隔离）
// 运行：node scripts/guard/config-store.mjs
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const imp = p => import(pathToFileURL(path.join(ROOT, p)).href);

let failed = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  " + detail}`);
  if (!ok) failed++;
};

// 内存模拟 R2
const store = new Map();
const bucket = {
  async head(k) {
    const v = store.get(k);
    return v ? { key: k, size: v.data.length } : null;
  },
  async get(k) {
    const v = store.get(k);
    if (!v) return null;
    return {
      text: async () => new TextDecoder().decode(v.data),
      body: new Blob([v.data]).stream()
    };
  },
  async put(k, d, o = {}) {
    store.set(k, {
      data: typeof d === "string" ? new TextEncoder().encode(d) : new Uint8Array(d),
      type: o.httpMetadata?.contentType
    });
  },
  async delete(k) {
    store.delete(k);
  }
};

const env = {
  SOFTWARE_BUCKET: bucket,
  ADMIN_PASSWORD: "pw",
  CATALOG_KEY: "software/catalog.json"
};

const { isKnownConfig, loadConfig, saveConfig, rollbackConfig } = await imp("functions/_config/store.js");
const { DEFAULTS } = await imp("functions/_config/schemas.js");
const { onRequestGet: configGet } = await imp("functions/api/config/[name].js");
const { onRequestPost: configPost } = await imp("functions/api/admin/config.js");
const { loginAdmin } = await imp("functions/api/admin/_lib.js");
const { onRequestPost: softwarePost } = await imp("functions/api/admin/software.js");

// 1. 未知配置名被拒
let threw = false;
try {
  await loadConfig(env, "unknown_config_xxx");
} catch {
  threw = true;
}
check("未知配置名 loadConfig 抛出异常", threw);

const getUnknownRes = await configGet({ env, params: { name: "unknown_config_xxx" } });
check("GET /api/config/[name] 未知配置返回 404", getUnknownRes.status === 404);

// 登录获取管理员令牌
const loginRes = await loginAdmin(new Request("https://x", { method: "POST", body: '{"password":"pw"}' }), env);
const { token } = await loginRes.json();
check("管理员登录成功", Boolean(token));

const adminPost = async (body) => {
  const req = new Request("https://x/api/admin/config", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const res = await configPost({ request: req, env });
  return { status: res.status, ...(await res.json()) };
};

const postUnknownRes = await adminPost({ action: "get", name: "unknown_config_xxx" });
check("POST /api/admin/config 未知配置名返回 400", postUnknownRes.status === 400 && !postUnknownRes.success);

// 2. 缺文件返回默认值
const initialConfig = await loadConfig(env, "software-center");
check("缺文件时 loadConfig 返回默认值", initialConfig.accent === "cyan" && initialConfig.density === "comfortable");

const getPublicRes = await configGet({ env, params: { name: "software-center" } });
const getPublicData = await getPublicRes.json();
check("GET /api/config/software-center 返回默认配置", getPublicRes.status === 200 && getPublicData.accent === "cyan");

// 3. 保存后读取一致
const saveRes = await adminPost({
  action: "save",
  name: "software-center",
  data: {
    accent: "gold",
    density: "compact",
    hero: { mode: "promotions", showSearch: false, autoplaySeconds: 10 }
  }
});
check("POST /api/admin/config 保存成功", saveRes.status === 200 && saveRes.success && saveRes.config?.accent === "gold");

const loadedAfterSave = await loadConfig(env, "software-center");
check("保存后 loadConfig 读取一致", loadedAfterSave.accent === "gold" && loadedAfterSave.density === "compact" && loadedAfterSave.hero.mode === "promotions");

// 4. 非法链接 javascript: 被拒
const saveIllegalUrl = await adminPost({
  action: "save",
  name: "software-center",
  data: {
    announcement: {
      show: true,
      text: "测试公告",
      href: "javascript:alert(1)"
    }
  }
});
check("非法链接 javascript: 被拒 (400)", saveIllegalUrl.status === 400 && !saveIllegalUrl.success && /javascript/.test(saveIllegalUrl.msg));

// 5. 超长数组被截断
const lotsOfPromos = Array.from({ length: 45 }).map((_, i) => ({
  id: `promo_${i}`,
  placements: ["software"],
  entity: { type: "software", id: "soft_1" },
  override: { title: `推广 ${i}` }
}));
const savedPromos = await saveConfig(env, "promotions", { items: lotsOfPromos });
check("推广位超长数组截断至 30 条", savedPromos.items.length === 30);

const lotsOfTracks = Array.from({ length: 250 }).map((_, i) => `track_${i}`);
const savedPlaylists = await saveConfig(env, "playlists", {
  items: [{
    title: "测试大歌单",
    trackIds: lotsOfTracks
  }]
});
check("歌单内曲目超长截断至 200 首", savedPlaylists.items[0].trackIds.length === 200);

// 6. 保存会生成 .prev.json
const firstSaveConfig = await loadConfig(env, "software-center");
await saveConfig(env, "software-center", { accent: "violet", density: "list" });
const prevObj = await env.SOFTWARE_BUCKET.get("config/software-center.prev.json");
check("再次保存生成 .prev.json", Boolean(prevObj));
const prevData = JSON.parse(await prevObj.text());
check(".prev.json 包含上一版本数据", prevData.accent === "gold" && prevData.density === "compact");

// 7. 回滚生效
const rollbackRes = await adminPost({
  action: "rollback",
  name: "software-center"
});
check("POST /api/admin/config rollback 接口成功", rollbackRes.status === 200 && rollbackRes.success);
const loadedAfterRollback = await loadConfig(env, "software-center");
check("回滚后数据正确恢复为上一版", loadedAfterRollback.accent === "gold" && loadedAfterRollback.density === "compact");

// 8. 保存配置后再保存一次软件，配置仍在（证明与 catalog.json 隔离）
// 初始化 catalog.json
await env.SOFTWARE_BUCKET.put(env.CATALOG_KEY, JSON.stringify({
  product: "天才猫软件中心",
  categories: [{ id: "tools", name: "工具", slug: "tools", sortOrder: 1, status: "active" }],
  software: [{
    id: "soft_1",
    name: "测试软件",
    slug: "test-app",
    categoryId: "tools",
    status: "active",
    releases: []
  }]
}));

// 调用软件保存接口
const reqSw = new Request("https://x/api/admin/software", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    id: "soft_1",
    name: "测试软件更新版",
    slug: "test-app",
    categoryId: "tools",
    status: "active",
    releases: []
  })
});
const swRes = await softwarePost({ request: reqSw, env });
check("保存软件接口成功", swRes.status === 200);

// 重新读取配置，验证未受任何影响
const configAfterCatalogSave = await loadConfig(env, "software-center");
check("保存软件后，独立配置依然完好存在", configAfterCatalogSave.accent === "gold" && configAfterCatalogSave.density === "compact");

console.log("\n==============================");
if (failed === 0) {
  console.log("ALL CONFIG-STORE GUARD TESTS PASSED");
  process.exit(0);
} else {
  console.error(`FAILED: ${failed} tests failed`);
  process.exit(1);
}
