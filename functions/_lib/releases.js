export const DEFAULT_MANIFEST = {
  product: "天才猫直播数据管理",
  latest: "datacenter-stable",
  releases: [
    {
      id: "datacenter-stable",
      channel: "stable",
      category: "数据管理",
      name: "数据中心独立版",
      description: "直播数据录入、复盘、报表和后台管理工具。",
      version: "待上传",
      date: "2026-05-09",
      key: "releases/DyDataCenter.App.zip",
      fileName: "DyDataCenter.App.zip",
      size: "",
      sha256: "",
      notes: ["上传安装包和 manifest.json 后，这里会自动显示正式版本。"]
    },
    {
      id: "live-assistant-stable",
      channel: "stable",
      category: "直播辅助",
      name: "直播辅助工具",
      description: "自动讲解、快速回复、宏录制独立打包，授权系统保持原绑定逻辑。",
      version: "待上传",
      date: "2026-05-09",
      key: "releases/TianCaiMao.LiveAssistant.zip",
      fileName: "TianCaiMao.LiveAssistant.zip",
      size: "",
      sha256: "",
      notes: ["自动讲解、快速回复、宏录制已拆分为独立软件。"]
    }
  ]
};

export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
};

export async function loadManifest(env) {
  if (!env.SOFTWARE_BUCKET?.get) {
    return DEFAULT_MANIFEST;
  }

  const key = env.MANIFEST_KEY || "releases/manifest.json";
  const object = await env.SOFTWARE_BUCKET.get(key);
  if (!object) {
    return DEFAULT_MANIFEST;
  }

  try {
    return JSON.parse(stripBom(await object.text()));
  } catch {
    return DEFAULT_MANIFEST;
  }
}

function stripBom(value) {
  return String(value || "").replace(/^\uFEFF/, "");
}

export function findLatestRelease(manifest) {
  const releases = Array.isArray(manifest.releases) ? manifest.releases : [];
  return releases.find(item => item.id === manifest.latest) || releases[0] || DEFAULT_MANIFEST.releases[0];
}

export async function serveRelease(env, release, request = null) {
  if (!env.SOFTWARE_BUCKET?.get) {
    return text("R2 binding SOFTWARE_BUCKET is not configured", 500);
  }

  if (!release?.key) {
    return text("Release is not configured", 404);
  }

  const response = await serveR2Object(env, request, release.key, {
    fileName: release.fileName || release.key.split("/").pop(),
    cacheControl: "public, max-age=3600"
  });
  return response || text("File has not been uploaded to R2 yet", 404);
}

/**
 * 从 R2 读取对象并返回下载响应，支持 HEAD、单段 Range（断点续传 / 多线程下载）。
 * 对象不存在时返回 null，由调用方决定 404 文案。
 */
export async function serveR2Object(env, request, key, options = {}) {
  const bucket = env.SOFTWARE_BUCKET;
  const method = String(request?.method || "GET").toUpperCase();
  const isHead = method === "HEAD";
  const rangeHeader = request?.headers?.get("Range") || "";
  const requested = parseRangeHeader(rangeHeader);

  let object;
  let range = null;
  if (requested) {
    const meta = await bucket.head(key);
    if (!meta) return null;
    range = resolveRange(requested, meta.size);
    if (!range) {
      const headers = new Headers(SECURITY_HEADERS);
      headers.set("Content-Range", `bytes */${meta.size}`);
      headers.set("Accept-Ranges", "bytes");
      return new Response(null, { status: 416, headers });
    }
    object = isHead ? meta : await bucket.get(key, { range });
  } else {
    object = isHead ? await bucket.head(key) : await bucket.get(key);
  }
  if (!object) return null;

  const headers = new Headers(SECURITY_HEADERS);
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", headers.get("Content-Type") || "application/octet-stream");
  headers.set("ETag", object.httpEtag);
  headers.set("Last-Modified", new Date(object.uploaded || Date.now()).toUTCString());
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", options.cacheControl || "public, max-age=3600");
  if (options.fileName !== false) {
    headers.set("Content-Disposition", contentDisposition(options.fileName || key.split("/").pop()));
  }

  const body = isHead ? null : object.body;
  if (range) {
    headers.set("Content-Length", String(range.length));
    headers.set("Content-Range", `bytes ${range.offset}-${range.offset + range.length - 1}/${object.size}`);
    return new Response(body, { status: 206, headers });
  }

  headers.set("Content-Length", String(object.size));
  return new Response(body, { status: 200, headers });
}

/** 是否应计入下载次数：只统计 GET 且从头开始的请求，避免多线程下载器 / 续传重复计数 */
export function shouldCountDownload(request) {
  if (!request || String(request.method || "GET").toUpperCase() !== "GET") return !request;
  const requested = parseRangeHeader(request.headers.get("Range") || "");
  return !requested || (requested.offset === 0 && requested.suffix === undefined);
}

function parseRangeHeader(value) {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(String(value || "").trim());
  if (!match || (!match[1] && !match[2])) return null;
  if (!match[1]) return { suffix: Number(match[2]) };
  const offset = Number(match[1]);
  const end = match[2] ? Number(match[2]) : undefined;
  if (!Number.isSafeInteger(offset)) return null;
  if (end !== undefined && (!Number.isSafeInteger(end) || end < offset)) return null;
  return { offset, end };
}

function resolveRange(requested, size) {
  if (requested.suffix !== undefined) {
    if (requested.suffix <= 0 || size <= 0) return null;
    const length = Math.min(requested.suffix, size);
    return { offset: size - length, length };
  }
  if (requested.offset >= size) return null;
  const end = Math.min(requested.end ?? size - 1, size - 1);
  return { offset: requested.offset, length: end - requested.offset + 1 };
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      ...SECURITY_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export function text(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      ...SECURITY_HEADERS,
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function sanitizeFileName(value) {
  return String(value || "download.bin").replace(/["\\\r\n]/g, "");
}

function contentDisposition(fileName) {
  const safeName = sanitizeFileName(fileName);
  const asciiName = safeName.replace(/[^\x20-\x7E]/g, "_");
  return `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeRFC5987ValueChars(safeName)}`;
}

function encodeRFC5987ValueChars(value) {
  return encodeURIComponent(value).replace(/['()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}
