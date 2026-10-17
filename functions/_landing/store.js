export const LANDING_CONFIG_KEY = "config/landing.json";

export const BUILTIN_PAGES = [
  { id: "portal", title: "综合门户", path: "/portal.html", builtin: true },
  { id: "desktop", title: "桌面 2.0", path: "/desktop.html", builtin: true },
  { id: "software", title: "软件中心", path: "/download.html", builtin: true },
  { id: "music", title: "音乐", path: "/music.html", builtin: true },
  { id: "gallery", title: "画廊", path: "/gallery.html", builtin: true },
  { id: "photo-wall", title: "照片墙", path: "/photo-wall.html", builtin: true },
  { id: "articles", title: "文章", path: "/articles.html", builtin: true },
  { id: "novadisk", title: "NovaDisk", path: "/novadisk.html", builtin: true }
];

const PROHIBITED_PATHS = ["/admin.html", "/console", "/studio", "/lvtuang"];

export function validatePagePath(path) {
  if (typeof path !== "string") return false;
  if (!path.startsWith("/")) return false;
  if (!path.endsWith(".html")) return false;
  if (path.includes("..")) return false;
  for (const p of PROHIBITED_PATHS) {
    if (path === p || path.startsWith(p + "/") || path.startsWith(p + ".")) return false;
  }
  return true;
}

export function validateContent(content) {
  if (!content || typeof content !== "object") return {};
  const cleaned = {};
  for (const [pageId, pageContent] of Object.entries(content)) {
    if (!pageContent || typeof pageContent !== "object") continue;
    const pageCleaned = {};
    const entries = Object.entries(pageContent).slice(0, 200); // 每页 ≤ 200 个键
    for (const [key, val] of entries) {
      if (typeof val === "string" && val.length <= 5000) {
        pageCleaned[key] = val;
      }
    }
    cleaned[pageId] = pageCleaned;
  }
  return cleaned;
}

export async function loadLanding(env) {
  try {
    if (env.SOFTWARE_BUCKET) {
      const obj = await env.SOFTWARE_BUCKET.get(LANDING_CONFIG_KEY);
      if (obj) {
        const text = await obj.text();
        const data = JSON.parse(text);
        return {
          homeLanding: typeof data.homeLanding === "string" ? data.homeLanding : "portal",
          pages: Array.isArray(data.pages) ? data.pages : [],
          content: validateContent(data.content || {}),
          updatedAt: data.updatedAt || 0,
          exists: true
        };
      }
    }
  } catch {}

  return {
    homeLanding: null,
    pages: [],
    content: {},
    updatedAt: 0,
    exists: false
  };
}

export async function saveLanding(env, data) {
  const toSave = {
    homeLanding: typeof data.homeLanding === "string" ? data.homeLanding : "portal",
    pages: Array.isArray(data.pages) ? data.pages.filter(p => p && p.id && validatePagePath(p.path)) : [],
    content: validateContent(data.content || {}),
    updatedAt: Date.now()
  };

  if (env.SOFTWARE_BUCKET) {
    await env.SOFTWARE_BUCKET.put(LANDING_CONFIG_KEY, JSON.stringify(toSave, null, 2), {
      httpMetadata: { contentType: "application/json" }
    });
  }

  return toSave;
}
