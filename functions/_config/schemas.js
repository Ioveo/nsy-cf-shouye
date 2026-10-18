export function validateUrl(url, fieldName = "链接") {
  if (url === undefined || url === null) return "";
  const str = String(url).trim();
  if (!str) return "";
  if (/^\s*javascript:/i.test(str)) {
    throw new Error(`${fieldName}包含非法 javascript 协议`);
  }
  if (!/^(https?:\/\/|\/)/i.test(str)) {
    throw new Error(`${fieldName}不合法，必须以 /、http:// 或 https:// 开头`);
  }
  return str.slice(0, 500);
}

export const DEFAULTS = {
  "software-center": {
    accent: "cyan",
    hero: { mode: "featured", showSearch: true, autoplaySeconds: 6 },
    stats: { show: true, items: ["software", "downloads", "monthlyUpdates", "platforms"], hideBelow: 0 },
    newArrivals: { show: true, days: 30, max: 8 },
    ranking: { show: true, tabs: ["downloads", "updated"], size: 10 },
    density: "comfortable",
    pageSize: 12,
    announcement: { show: false, text: "", href: "", tone: "info" }
  },
  "promotions": {
    items: []
  },
  "article-taxonomy": {
    categories: [
      { slug: "tutorial", name: "上手教程", description: "软件使用与配置教学", icon: "book-open", color: "#06B6D4", layout: "list", order: 10, showInNav: true },
      { slug: "news", name: "版本动态", description: "产品更新与新特性发布", icon: "sparkles", color: "#3B82F6", layout: "grid", order: 20, showInNav: true },
      { slug: "guide", name: "使用手册", description: "深度技术与操作手册", icon: "file-text", color: "#8B5CF6", layout: "docs", order: 30, showInNav: true }
    ]
  },
  "playlists": {
    items: []
  }
};

const VALID_ACCENTS = ["cyan", "gold", "violet"];
const VALID_HERO_MODES = ["featured", "promotions"];
const VALID_STATS_ITEMS = ["software", "downloads", "monthlyUpdates", "platforms"];
const VALID_DENSITIES = ["comfortable", "compact", "list"];
const VALID_ANNOUNCEMENT_TONES = ["info", "warning", "success"];
const VALID_PLACEMENTS = ["portal", "software", "music", "articles"];
const VALID_ENTITY_TYPES = ["software", "article", "playlist", "custom"];
const VALID_PROMO_STATUS = ["active", "paused"];
const VALID_ARTICLE_LAYOUTS = ["grid", "list", "docs"];
const VALID_PLAYLIST_SCENES = ["live", "soundcheck", "night", "sales", "other"];
const VALID_PLAYLIST_STATUS = ["published", "draft"];

export const VALIDATORS = {
  "software-center": function validateSoftwareCenter(raw) {
    const data = raw && typeof raw === "object" ? raw : {};
    const heroRaw = data.hero && typeof data.hero === "object" ? data.hero : {};
    const statsRaw = data.stats && typeof data.stats === "object" ? data.stats : {};
    const newArrivalsRaw = data.newArrivals && typeof data.newArrivals === "object" ? data.newArrivals : {};
    const rankingRaw = data.ranking && typeof data.ranking === "object" ? data.ranking : {};
    const announcementRaw = data.announcement && typeof data.announcement === "object" ? data.announcement : {};

    const statsItems = Array.isArray(statsRaw.items)
      ? statsRaw.items.filter(item => VALID_STATS_ITEMS.includes(item))
      : DEFAULTS["software-center"].stats.items;

    const rankingTabs = Array.isArray(rankingRaw.tabs)
      ? rankingRaw.tabs.filter(tab => ["downloads", "updated"].includes(tab))
      : DEFAULTS["software-center"].ranking.tabs;

    return {
      accent: VALID_ACCENTS.includes(data.accent) ? data.accent : "cyan",
      hero: {
        mode: VALID_HERO_MODES.includes(heroRaw.mode) ? heroRaw.mode : "featured",
        showSearch: heroRaw.showSearch !== false,
        autoplaySeconds: Math.max(2, Math.min(60, Number(heroRaw.autoplaySeconds) || 6))
      },
      stats: {
        show: statsRaw.show !== false,
        items: statsItems.length ? statsItems : DEFAULTS["software-center"].stats.items,
        hideBelow: Math.max(0, Number(statsRaw.hideBelow) || 0)
      },
      newArrivals: {
        show: newArrivalsRaw.show !== false,
        days: Math.max(1, Math.min(365, Number(newArrivalsRaw.days) || 30)),
        max: Math.max(1, Math.min(50, Number(newArrivalsRaw.max) || 8))
      },
      ranking: {
        show: rankingRaw.show !== false,
        tabs: rankingTabs.length ? rankingTabs : DEFAULTS["software-center"].ranking.tabs,
        size: Math.max(1, Math.min(50, Number(rankingRaw.size) || 10))
      },
      density: VALID_DENSITIES.includes(data.density) ? data.density : "comfortable",
      pageSize: Math.max(1, Math.min(100, Number(data.pageSize) || 12)),
      announcement: {
        show: Boolean(announcementRaw.show),
        text: String(announcementRaw.text || "").trim().slice(0, 200),
        href: validateUrl(announcementRaw.href, "公告链接"),
        tone: VALID_ANNOUNCEMENT_TONES.includes(announcementRaw.tone) ? announcementRaw.tone : "info"
      }
    };
  },

  "promotions": function validatePromotions(raw) {
    const data = raw && typeof raw === "object" ? raw : {};
    const rawItems = Array.isArray(data.items) ? data.items : [];
    // 数组上限 ≤ 30
    const items = rawItems.slice(0, 30).map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const id = String(item.id || `promo_${Date.now()}_${index}`).trim().slice(0, 60);

      const rawPlacements = Array.isArray(item.placements) ? item.placements : [];
      const placements = rawPlacements.filter(p => VALID_PLACEMENTS.includes(p));
      const finalPlacements = placements.length ? placements : ["software"];

      const rawEntity = item.entity && typeof item.entity === "object" ? item.entity : {};
      const entityType = VALID_ENTITY_TYPES.includes(rawEntity.type) ? rawEntity.type : "custom";
      const entityId = String(rawEntity.id || "").trim().slice(0, 100);

      const rawOverride = item.override && typeof item.override === "object" ? item.override : {};
      const overrideTitle = String(rawOverride.title || "").trim().slice(0, 100);
      const overrideSubtitle = String(rawOverride.subtitle || "").trim().slice(0, 200);
      const overrideImage = validateUrl(rawOverride.image, "推广图片地址");
      const overrideCtaText = String(rawOverride.ctaText || "").trim().slice(0, 50);
      const overrideCtaHref = validateUrl(rawOverride.ctaHref, "推广跳转链接");

      const status = VALID_PROMO_STATUS.includes(item.status) ? item.status : "active";

      // 规则：custom 类型如果激活，必须提供图片与链接
      if (entityType === "custom" && status === "active") {
        if (!overrideImage || !overrideCtaHref) {
          throw new Error(`推广位「${overrideTitle || id}」属于自定义类型，必须提供推广图片地址和跳转链接`);
        }
      }

      return {
        id,
        placements: finalPlacements,
        entity: {
          type: entityType,
          id: entityId
        },
        override: {
          title: overrideTitle,
          subtitle: overrideSubtitle,
          image: overrideImage,
          ctaText: overrideCtaText,
          ctaHref: overrideCtaHref
        },
        badge: String(item.badge || "").trim().slice(0, 20),
        startAt: Math.max(0, Number(item.startAt) || 0),
        endAt: Math.max(0, Number(item.endAt) || 0),
        status,
        order: Number(item.order ?? index * 10)
      };
    }).filter(Boolean);

    return { items };
  },

  "article-taxonomy": function validateArticleTaxonomy(raw) {
    const data = raw && typeof raw === "object" ? raw : {};
    const rawCategories = Array.isArray(data.categories) ? data.categories : [];
    // 数组上限 ≤ 30
    const categories = rawCategories.slice(0, 30).map((cat, index) => {
      if (!cat || typeof cat !== "object") return null;
      const slug = String(cat.slug || "").trim().toLowerCase().slice(0, 50);
      if (!slug) throw new Error("文章分类标识 slug 不能为空");
      if (!/^[a-z0-9_-]+$/i.test(slug)) {
        throw new Error(`文章分类标识「${slug}」不合法，只能包含字母、数字、短横线和下划线`);
      }

      const name = String(cat.name || "").trim().slice(0, 50);
      if (!name) throw new Error("文章分类名称不能为空");

      return {
        slug,
        name,
        description: String(cat.description || "").trim().slice(0, 200),
        icon: String(cat.icon || "book-open").trim().slice(0, 50),
        color: String(cat.color || "#06B6D4").trim().slice(0, 20),
        layout: VALID_ARTICLE_LAYOUTS.includes(cat.layout) ? cat.layout : "list",
        order: Number(cat.order ?? index * 10),
        showInNav: cat.showInNav !== false
      };
    }).filter(Boolean);

    return { categories };
  },

  "playlists": function validatePlaylists(raw) {
    const data = raw && typeof raw === "object" ? raw : {};
    const rawItems = Array.isArray(data.items) ? data.items : [];
    // 歌单上限 ≤ 50
    const items = rawItems.slice(0, 50).map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const id = String(item.id || `pl_${Date.now()}_${index}`).trim().slice(0, 60);
      const title = String(item.title || "").trim().slice(0, 100);
      if (!title) throw new Error("歌单标题不能为空");

      const rawTracks = Array.isArray(item.trackIds) ? item.trackIds : [];
      // 每个歌单 ≤ 200 首
      const trackIds = rawTracks.map(String).map(s => s.trim()).filter(Boolean).slice(0, 200);

      return {
        id,
        title,
        description: String(item.description || "").trim().slice(0, 300),
        cover: validateUrl(item.cover, "歌单封面地址"),
        scene: VALID_PLAYLIST_SCENES.includes(item.scene) ? item.scene : "other",
        trackIds,
        status: VALID_PLAYLIST_STATUS.includes(item.status) ? item.status : "published",
        order: Number(item.order ?? index * 10),
        featured: Boolean(item.featured)
      };
    }).filter(Boolean);

    return { items };
  }
};
