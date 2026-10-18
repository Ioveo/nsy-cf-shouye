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
  },
  "music-portal": {
    hero: {
      chip: "NEW ALBUM · 新专辑上线",
      title: "白夜",
      titleEn: "FIFTEEN REALMS",
      subtitle: "十五首曲子，十五个世界。\n一张用眼睛听的电子专辑。",
      ctaPrimaryText: "播放专辑",
      ctaPrimaryHref: "#tracks",
      ctaSecondaryText: "巡演日程",
      ctaSecondaryHref: "#tour",
      mediaType: "video",
      mediaUrl: "https://muse.ai/files/1331075203424773/1432998841610842/xq500iv9v5g5t769vpxqq7gw/noir.mp4",
      nowPlayingTitle: "霓虹雨夜",
      nowPlayingSub: "Neon Rain · 主打单曲",
      stickerText: "15\nTRACKS",
      stats: [
        { label: "曲目 TRACKS", value: "15" },
        { label: "专辑 ALBUMS", value: "04" },
        { label: "巡演 SHOWS", value: "40+" }
      ]
    },
    marquee: {
      text: "十五境 FIFTEEN REALMS ◆ 白夜 WHITE NIGHT ◆"
    },
    manifesto: {
      show: true,
      chip: "MANIFESTO · 宣言",
      badge: "NEW\nALBUM",
      title: "十五首曲子，",
      highlight: "十五个世界。",
      description: "从霓虹雨夜到云海日出，从深海到星云——这是一张用眼睛听的专辑。每一个画面，都是一段旋律的形状。",
      stats: [
        { label: "曲目 TRACKS", value: "15" },
        { label: "世界 WORLDS", value: "15" },
        { label: "分钟 MINUTES", value: "76" }
      ]
    },
    albums: [
      { id: "alb_1", name: "霓虹雨夜", nameEn: "NEON RAIN", year: "2026 · EP", color1: "#57e6ff", color2: "#a855f7", coverUrl: "", trackIds: [0, 4, 13] },
      { id: "alb_2", name: "万物有声", nameEn: "WILD", year: "2025", color1: "#4ade80", color2: "#bfe3ff", coverUrl: "", trackIds: [2, 9, 10, 11] },
      { id: "alb_3", name: "东方既白", nameEn: "ORIENT", year: "2024", color1: "#3ddc84", color2: "#f0a840", coverUrl: "", trackIds: [12, 7, 6, 8] },
      { id: "alb_4", name: "深渊", nameEn: "ABYSS", year: "2023", color1: "#3d7bff", color2: "#8a7cff", coverUrl: "", trackIds: [5, 1, 3, 14] }
    ],
    genres: [
      { id: "gen_1", name: "电子舞曲", nameEn: "ELECTRONIC", color: "#a855f7", tags: ["INDUSTRIAL", "DARK TECHNO", "LIQUID DNB", "UPLIFTING"] },
      { id: "gen_2", name: "环境氛围", nameEn: "AMBIENT", color: "#4ade80", tags: ["AMBIENT", "DEEP AMBIENT", "DOWNTEMPO"] },
      { id: "gen_3", name: "合成器浪潮", nameEn: "SYNTHWAVE", color: "#57e6ff", tags: ["SYNTHWAVE", "EPIC"] },
      { id: "gen_4", name: "世界融合", nameEn: "WORLD", color: "#f0a840", tags: ["WORLD", "FOLKTRONICA"] },
      { id: "gen_5", name: "电影管弦", nameEn: "CINEMATIC", color: "#bfe3ff", tags: ["CINEMATIC", "ORCHESTRAL"] },
      { id: "gen_6", name: "独立流行", nameEn: "INDIE", color: "#ff8fb3", tags: ["LO-FI", "ART POP"] }
    ],
    tours: [
      { id: "tour_1", date: "2026.11.08", city: "上海", venue: "Modern Sky Lab", status: "hot", statusLabel: "余票" },
      { id: "tour_2", date: "2026.11.15", city: "北京", venue: "愚公移山", status: "hot", statusLabel: "余票" },
      { id: "tour_3", date: "2026.11.22", city: "深圳", venue: "B10 Live", status: "sold", statusLabel: "售罄" },
      { id: "tour_4", date: "2026.11.29", city: "成都", venue: "正火艺术中心", status: "soon", statusLabel: "待售" },
      { id: "tour_5", date: "2026.12.06", city: "杭州", venue: "酒球会", status: "soon", statusLabel: "待售" }
    ],
    about: {
      title: "关于白夜",
      text1: "白夜，电子音乐制作人。以电影感的氛围电子见长，作品游走于合成器浪潮、环境音乐与东方意象之间。",
      text2: "《十五境》是她的第三张录音室专辑——十五首曲子，十五个自然与梦境。从霓虹雨夜的合成器，到云海日出的弦乐，每一轨都配有一部视觉短片。",
      stats: [
        { label: "录音室专辑", value: "3" },
        { label: "单曲", value: "27" },
        { label: "巡演场次", value: "40+" }
      ]
    },
    footer: {
      title: "在云海之上\n听见日出。",
      subtitle: "订阅获取新专辑、巡演预售与未公开曲目",
      subscribeText: "订阅邮件",
      subscribeHref: "#",
      replayText: "重听专辑",
      socialLinks: [
        { label: "网易云音乐", href: "https://music.163.com" },
        { label: "QQ 音乐", href: "https://y.qq.com" },
        { label: "Spotify", href: "https://spotify.com" },
        { label: "Apple Music", href: "https://music.apple.com" },
        { label: "Bilibili", href: "https://bilibili.com" }
      ],
      copyright: "© 2026 白夜 WHITE NIGHT · 天才猫音乐频道"
    }
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
  },

  "music-portal": function validateMusicPortal(raw) {
    const data = raw && typeof raw === "object" ? raw : {};
    const d = DEFAULTS["music-portal"];

    const heroRaw = data.hero && typeof data.hero === "object" ? data.hero : {};
    const marqueeRaw = data.marquee && typeof data.marquee === "object" ? data.marquee : {};
    const manifestoRaw = data.manifesto && typeof data.manifesto === "object" ? data.manifesto : {};
    const aboutRaw = data.about && typeof data.about === "object" ? data.about : {};
    const footerRaw = data.footer && typeof data.footer === "object" ? data.footer : {};

    const hero = {
      chip: String(heroRaw.chip || d.hero.chip).trim().slice(0, 100),
      title: String(heroRaw.title || d.hero.title).trim().slice(0, 50),
      titleEn: String(heroRaw.titleEn || d.hero.titleEn).trim().slice(0, 100),
      subtitle: String(heroRaw.subtitle || d.hero.subtitle).trim().slice(0, 500),
      ctaPrimaryText: String(heroRaw.ctaPrimaryText || d.hero.ctaPrimaryText).trim().slice(0, 50),
      ctaPrimaryHref: String(heroRaw.ctaPrimaryHref || d.hero.ctaPrimaryHref).trim().slice(0, 200),
      ctaSecondaryText: String(heroRaw.ctaSecondaryText || d.hero.ctaSecondaryText).trim().slice(0, 50),
      ctaSecondaryHref: String(heroRaw.ctaSecondaryHref || d.hero.ctaSecondaryHref).trim().slice(0, 200),
      mediaType: heroRaw.mediaType === "image" ? "image" : "video",
      mediaUrl: String(heroRaw.mediaUrl || d.hero.mediaUrl).trim().slice(0, 500),
      nowPlayingTitle: String(heroRaw.nowPlayingTitle || d.hero.nowPlayingTitle).trim().slice(0, 100),
      nowPlayingSub: String(heroRaw.nowPlayingSub || d.hero.nowPlayingSub).trim().slice(0, 100),
      stickerText: String(heroRaw.stickerText || d.hero.stickerText).trim().slice(0, 50),
      stats: Array.isArray(heroRaw.stats)
        ? heroRaw.stats.slice(0, 5).map(s => ({ label: String(s?.label || "").trim().slice(0, 50), value: String(s?.value || "").trim().slice(0, 50) }))
        : d.hero.stats
    };

    const marquee = {
      text: String(marqueeRaw.text || d.marquee.text).trim().slice(0, 500)
    };

    const manifesto = {
      show: manifestoRaw.show !== false,
      chip: String(manifestoRaw.chip || d.manifesto.chip).trim().slice(0, 100),
      badge: String(manifestoRaw.badge || d.manifesto.badge).trim().slice(0, 50),
      title: String(manifestoRaw.title || d.manifesto.title).trim().slice(0, 100),
      highlight: String(manifestoRaw.highlight || d.manifesto.highlight).trim().slice(0, 100),
      description: String(manifestoRaw.description || d.manifesto.description).trim().slice(0, 500),
      stats: Array.isArray(manifestoRaw.stats)
        ? manifestoRaw.stats.slice(0, 5).map(s => ({ label: String(s?.label || "").trim().slice(0, 50), value: String(s?.value || "").trim().slice(0, 50) }))
        : d.manifesto.stats
    };

    const rawAlbums = Array.isArray(data.albums) ? data.albums : d.albums;
    const albums = rawAlbums.slice(0, 30).map((a, i) => {
      if (!a || typeof a !== "object") return null;
      return {
        id: String(a.id || `alb_${Date.now()}_${i}`).trim().slice(0, 50),
        name: String(a.name || "").trim().slice(0, 100),
        nameEn: String(a.nameEn || "").trim().slice(0, 100),
        year: String(a.year || "").trim().slice(0, 50),
        color1: String(a.color1 || "#57e6ff").trim().slice(0, 30),
        color2: String(a.color2 || "#a855f7").trim().slice(0, 30),
        coverUrl: String(a.coverUrl || "").trim().slice(0, 500),
        trackIds: Array.isArray(a.trackIds) ? a.trackIds.slice(0, 50) : []
      };
    }).filter(Boolean);

    const rawGenres = Array.isArray(data.genres) ? data.genres : d.genres;
    const genres = rawGenres.slice(0, 30).map((g, i) => {
      if (!g || typeof g !== "object") return null;
      return {
        id: String(g.id || `gen_${Date.now()}_${i}`).trim().slice(0, 50),
        name: String(g.name || "").trim().slice(0, 100),
        nameEn: String(g.nameEn || "").trim().slice(0, 100),
        color: String(g.color || "#57e6ff").trim().slice(0, 30),
        tags: Array.isArray(g.tags) ? g.tags.map(String).map(s => s.trim().slice(0, 50)).filter(Boolean).slice(0, 20) : []
      };
    }).filter(Boolean);

    const rawTours = Array.isArray(data.tours) ? data.tours : d.tours;
    const tours = rawTours.slice(0, 50).map((t, i) => {
      if (!t || typeof t !== "object") return null;
      return {
        id: String(t.id || `tour_${Date.now()}_${i}`).trim().slice(0, 50),
        date: String(t.date || "").trim().slice(0, 50),
        city: String(t.city || "").trim().slice(0, 50),
        venue: String(t.venue || "").trim().slice(0, 100),
        status: ["hot", "sold", "soon"].includes(t.status) ? t.status : "hot",
        statusLabel: String(t.statusLabel || "余票").trim().slice(0, 20)
      };
    }).filter(Boolean);

    const about = {
      title: String(aboutRaw.title || d.about.title).trim().slice(0, 100),
      text1: String(aboutRaw.text1 || d.about.text1).trim().slice(0, 500),
      text2: String(aboutRaw.text2 || d.about.text2).trim().slice(0, 500),
      stats: Array.isArray(aboutRaw.stats)
        ? aboutRaw.stats.slice(0, 5).map(s => ({ label: String(s?.label || "").trim().slice(0, 50), value: String(s?.value || "").trim().slice(0, 50) }))
        : d.about.stats
    };

    const footer = {
      title: String(footerRaw.title || d.footer.title).trim().slice(0, 100),
      subtitle: String(footerRaw.subtitle || d.footer.subtitle).trim().slice(0, 200),
      subscribeText: String(footerRaw.subscribeText || d.footer.subscribeText).trim().slice(0, 50),
      subscribeHref: String(footerRaw.subscribeHref || d.footer.subscribeHref).trim().slice(0, 200),
      replayText: String(footerRaw.replayText || d.footer.replayText).trim().slice(0, 50),
      socialLinks: Array.isArray(footerRaw.socialLinks)
        ? footerRaw.socialLinks.slice(0, 10).map(l => ({ label: String(l?.label || "").trim().slice(0, 50), href: String(l?.href || "").trim().slice(0, 200) }))
        : d.footer.socialLinks,
      copyright: String(footerRaw.copyright || d.footer.copyright).trim().slice(0, 200)
    };

    return { hero, marquee, manifesto, albums, genres, tours, about, footer };
  }
};
