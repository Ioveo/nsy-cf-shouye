import { loadCatalog, saveCatalog, id, normalizeRelease, formatBytes } from "../_lib/catalog.js";
import { json } from "../_lib/releases.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-storage-id",
};

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

function getR2Bucket(env) {
  const candidate = env.SOFTWARE_BUCKET || env.BUCKET || env.R2;
  if (candidate && typeof candidate.get === "function" && typeof candidate.put === "function") {
    return candidate;
  }
  return null;
}

function getPublicUrl(env) {
  const pub = env.PUBURL || env.PUBLIC_URL || env.CDN_URL || "";
  return typeof pub === "string" ? pub.trim().replace(/\/$/, "") : "";
}

function resolveUrl(targetUrl, publicUrl, origin) {
  if (!targetUrl) return "";
  if (/^https?:\/\//i.test(targetUrl)) return targetUrl;
  const cleanPath = targetUrl.replace(/^\/+/, "");
  if (publicUrl) {
    return `${publicUrl}/${cleanPath}`;
  }
  return `${origin}/${cleanPath}`;
}

// 把 fullSetupUrl 解析成 R2 key（相对路径或 PUBURL 下的地址）并确认文件存在；其它外部直链原样返回
async function resolveSetupFile(bucket, rawUrl, publicUrl) {
  const value = String(rawUrl || "").trim();
  if (!value) return null;
  let key = "";
  if (/^https?:\/\//i.test(value)) {
    if (publicUrl && value.startsWith(`${publicUrl}/`)) {
      key = value.slice(publicUrl.length + 1);
    } else {
      return { publicUrl: value };
    }
  } else {
    key = value.replace(/^\/+/, "");
  }
  key = key.split(/[?#]/)[0];
  try {
    key = key.split("/").map(part => decodeURIComponent(part)).join("/");
  } catch {}
  if (!key || !bucket?.head) return null;
  const head = await bucket.head(key).catch(() => null);
  return head ? { fileKey: key, size: head.size } : null;
}

async function verifyAuth(request, env, body = {}) {
  // 1. Bearer Token
  const authHeader = request.headers.get("Authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) {
      const parts = token.split(".");
      if (parts.length === 3) {
        const expiresAt = Number(parts[0]);
        if (Number.isFinite(expiresAt) && expiresAt > Date.now()) {
          const secret = env.ADMIN_TOKEN_SECRET || env.ADMIN_PASSWORD;
          if (secret) {
            try {
              const key = await crypto.subtle.importKey(
                "raw",
                new TextEncoder().encode(secret),
                { name: "HMAC", hash: "SHA-256" },
                false,
                ["sign"]
              );
              const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
              let binary = "";
              for (const byte of new Uint8Array(signature)) binary += String.fromCharCode(byte);
              const expected = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
              if (expected === parts[2]) return true;
            } catch {}
          }
        }
      }
    }
  }

  // 2. Basic Auth (Cloudflare-R2-puls format)
  if (authHeader.startsWith("Basic ")) {
    try {
      const decoded = atob(authHeader.slice(6).trim());
      const [, pass] = decoded.split(":");
      if (env.ADMIN_PASSWORD && pass === env.ADMIN_PASSWORD) return true;
      if (env.PASS && pass === env.PASS) return true;
    } catch {}
  }

  // 3. Body password
  const password = String(body.password || "");
  if (env.ADMIN_PASSWORD && password === env.ADMIN_PASSWORD) return true;
  if (env.PASS && password === env.PASS) return true;

  return false;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const app = (url.searchParams.get("app") || "desktop").toLowerCase().trim();
  const action = (url.searchParams.get("action") || "").toLowerCase().trim();
  const bucket = getR2Bucket(env);
  const publicUrl = getPublicUrl(env);
  const origin = url.origin;

  // 1. 查询发版历史记录 apps/${app}/history.json
  if (action === "history") {
    let historyList = [];
    if (bucket) {
      try {
        const historyObj = await bucket.get(`apps/${app}/history.json`);
        if (historyObj) {
          historyList = JSON.parse(await historyObj.text());
        }
      } catch (e) {
        console.warn("读取 history.json 失败:", e);
      }
    }

    // 若 R2 暂无历史记录，从 catalog 软件发版列表中尝试填充
    if (!historyList.length) {
      try {
        const catalog = await loadCatalog(env);
        const software = (catalog.software || []).find(s => (s.slug || s.id) === app || (app === "desktop" && /桌面/i.test(s.name)));
        if (software && Array.isArray(software.releases) && software.releases.length) {
          historyList = software.releases.map(r => ({
            app,
            version: r.version,
            appName: software.name,
            minSupportedVersion: r.version,
            patchUrl: resolveUrl((r.fileKey || r.publicUrl) ? `/download/${encodeURIComponent(r.id)}` : `/apps/${app}/patch_v${r.version}.zip`, publicUrl, origin),
            patchMd5: r.sha256 || "",
            patchSize: Number(r.fileSize || 0),
            fullSetupUrl: resolveUrl((r.fileKey || r.publicUrl) ? `/download/${encodeURIComponent(r.id)}` : `/apps/${app}/${software.name}-Setup-v${r.version}.exe`, publicUrl, origin),
            forceUpdate: false,
            changelog: r.changelog || "",
            updatedAt: new Date(r.createdAt || Date.now()).toISOString(),
            source: "catalog"
          }));
        }
      } catch {}
    }

    return new Response(JSON.stringify(historyList, null, 2), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  }

  // 2. 正常查询最新热更版本信息 (version.json)
  const candidateKeys = [
    `apps/${app}/version.json`,
    `${app}-update/version.json`,
    `dy-update/version.json`,
    `version.json`,
  ];

  let versionObj = null;

  if (bucket) {
    for (const key of candidateKeys) {
      try {
        const obj = await bucket.get(key);
        if (obj) {
          const text = await obj.text();
          versionObj = JSON.parse(text);
          break;
        }
      } catch (e) {}
    }
  }

  // 若 R2 中未找到，回退到 catalog 软件配置中生成
  if (!versionObj) {
    try {
      const catalog = await loadCatalog(env);
      const software = (catalog.software || []).find(s => (s.slug || s.id) === app || (app === "desktop" && /桌面/i.test(s.name)));
      if (software) {
        const latest = (software.releases || []).find(r => r.isLatest) || software.releases?.[0];
        const v = latest?.version || "2.0.0";
        versionObj = {
          app,
          version: v,
          appName: software.name || (app === "desktop" ? "天才猫桌面 2.0" : app === "live" ? "天才猫极速直播助手" : app === "datacenter" ? "天才猫数据中心" : "天才猫软件"),
          minSupportedVersion: v,
          patchUrl: (latest?.fileKey || latest?.publicUrl) ? `/download/${encodeURIComponent(latest.id)}` : `/apps/${app}/TianCaiMao.${app === "datacenter" ? "DataCenter" : app === "desktop" ? "Desktop" : "LiveAssistant"}.exe`,
          patchMd5: latest?.sha256 || "",
          patchSize: Number(latest?.fileSize || 0),
          fullSetupUrl: (latest?.fileKey || latest?.publicUrl) ? `/download/${encodeURIComponent(latest.id)}` : `/apps/${app}/${software.name}-Setup-v${v}.exe`,
          forceUpdate: false,
          changelog: latest?.changelog || "官方稳定更新，零依赖独立运行时。",
          updatedAt: new Date(latest?.createdAt || Date.now()).toISOString(),
          isFallback: true,
        };
      }
    } catch {}
  }

  if (!versionObj) {
    return new Response(
      JSON.stringify({
        error: "Version metadata not found",
        app,
        hint: `请先在管理后台中发布 apps/${app}/version.json`,
      }, null, 2),
      {
        status: 404,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  }

  // 格式化补丁与全量安装包下载直链
  versionObj.patchUrl = resolveUrl(versionObj.patchUrl, publicUrl, origin);
  versionObj.fullSetupUrl = resolveUrl(versionObj.fullSetupUrl, publicUrl, origin);

  return new Response(JSON.stringify(versionObj, null, 2), {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const bucket = getR2Bucket(env);

  let body = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // 管理员鉴权
  const isAuthed = await verifyAuth(request, env, body);
  if (!isAuthed) {
    return new Response(JSON.stringify({ error: "未授权或管理员密码错误", success: false }), {
      status: 401,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const app = String(body.app || "desktop").toLowerCase().trim();
  const version = String(body.version || "").replace(/^v/i, "").trim();

  if (!version) {
    return new Response(JSON.stringify({ error: "版本号不能为空", success: false }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const defaultNames = {
    desktop: "天才猫桌面 2.0",
    live: "天才猫极速直播助手",
    dy: "天才猫直播助手",
    datacenter: "天才猫数据中心 2.0",
  };

  const appName = body.appName || defaultNames[app] || "天才猫应用软件";

  const versionPayload = {
    app,
    version,
    appName,
    minSupportedVersion: body.minSupportedVersion || version,
    patchUrl: body.patchUrl || `/apps/${app}/TianCaiMao.${app === "datacenter" ? "DataCenter" : app === "desktop" ? "Desktop" : "LiveAssistant"}.exe`,
    patchMd5: body.patchMd5 || "",
    patchSize: Number(body.patchSize || 0),
    fullSetupUrl: body.fullSetupUrl || `/apps/${app}/${appName}-Setup-v${version}.exe`,
    forceUpdate: Boolean(body.forceUpdate),
    changelog: body.changelog || "优化系统稳定性，提升运行流畅度。",
    updatedAt: new Date().toISOString(),
  };

  const targetKey = `apps/${app}/version.json`;

  // 1. 写入 R2 存储桶
  if (bucket) {
    await bucket.put(targetKey, JSON.stringify(versionPayload, null, 2), {
      httpMetadata: {
        contentType: "application/json; charset=utf-8",
        cacheControl: "no-cache, no-store, must-revalidate",
      },
    });

    // 2. 自动归档至历史记录 apps/${app}/history.json (保留最近 50 次)
    try {
      const historyKey = `apps/${app}/history.json`;
      const histObj = await bucket.get(historyKey);
      let historyList = [];
      if (histObj) {
        try {
          historyList = JSON.parse(await histObj.text());
        } catch {}
      }
      historyList = historyList.filter(item => item.version !== version);
      historyList.unshift(versionPayload);
      if (historyList.length > 50) {
        historyList = historyList.slice(0, 50);
      }
      await bucket.put(historyKey, JSON.stringify(historyList, null, 2), {
        httpMetadata: {
          contentType: "application/json; charset=utf-8",
          cacheControl: "no-cache, no-store, must-revalidate",
        },
      });
    } catch (err) {
      console.error("更新 history.json 失败:", err);
    }
  }

  // 3. 联动同步至 catalog.json 保证官网软件展示与下载卡片同步保持最新
  let catalogWarning = "";
  try {
    const catalog = await loadCatalog(env);
    let software = (catalog.software || []).find(s => (s.slug || s.id) === app || (app === "desktop" && /桌面/i.test(s.name)));
    // 引用的是已发布版本（/download/<id>），版本库里已有记录，不需要再同步
    const referencesRelease = /^(https?:\/\/[^/]+)?\/download\//i.test(String(versionPayload.fullSetupUrl || ""));
    if (software && !referencesRelease) {
      // 只有全量包在 R2 中真实存在（或是外部直链）时才写入下载信息，避免把已上传版本的 fileKey 覆盖成不存在的路径
      const setup = await resolveSetupFile(bucket, versionPayload.fullSetupUrl, getPublicUrl(env));
      if (!setup) {
        catalogWarning = `全量安装包 ${versionPayload.fullSetupUrl} 在 R2 中不存在，官网下载信息未更新`;
      }
      const downloadFields = setup?.fileKey
        ? { fileKey: setup.fileKey, storageId: "default", publicUrl: "", fileSize: setup.size, size: formatBytes(setup.size) }
        : setup?.publicUrl
          ? { fileKey: "", storageId: "url", publicUrl: setup.publicUrl }
          : null;

      software.releases = software.releases || [];
      const existingRel = software.releases.find(r => r.version === version);
      if (downloadFields || existingRel) {
        // 取消旧最新标记
        for (const r of software.releases) {
          r.isLatest = false;
        }
      }
      if (existingRel) {
        existingRel.isLatest = true;
        existingRel.changelog = versionPayload.changelog;
        if (downloadFields) Object.assign(existingRel, downloadFields, { status: "published" });
        existingRel.updatedAt = Date.now();
      } else {
        const newRel = normalizeRelease({
          id: id("rel"),
          softwareId: software.id,
          softwareSlug: software.slug || app,
          version,
          changelog: versionPayload.changelog,
          fileName: decodeURIComponent(String(versionPayload.fullSetupUrl || "").split("?")[0].split("/").pop() || ""),
          ...(downloadFields || {}),
          isLatest: Boolean(downloadFields),
          status: downloadFields ? "published" : "draft",
          createdAt: Date.now(),
        }, software.slug || app);
        software.releases.unshift(newRel);
      }
      await saveCatalog(env, catalog);
    }
  } catch (err) {
    console.warn("同步更新 catalog.json 异常:", err);
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `🎉 版本 v${version} 发布成功！已秒级更新至 ${targetKey} 并同步历史版本库与全网 CDN。`,
      data: versionPayload,
      ...(catalogWarning ? { warning: catalogWarning } : {}),
    }, null, 2),
    {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json; charset=utf-8",
      },
    }
  );
}
