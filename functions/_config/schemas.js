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
    pageTitle: "天才猫软件中心 · 官方生态与跨平台应用",
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
    pageTitle: "天才猫音乐 · 白夜十五境 Cinema 音乐频道",
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
  },
  "articles-portal": {
    pageTitle: "白卷 WHITE FOLIO · 用眼睛阅读的杂志 · 天才猫专栏",
    brand: {
      logo: "白卷",
      issue: "VOL.1"
    },
    hero: {
      eyebrow: "本期特稿 · FEATURED",
      title: "用眼睛\n读",
      highlight: "世界",
      lede: "十五位撰稿人，十五个现场。从霓虹雨夜到云海日出——白卷把远方折成可以翻阅的形状。",
      ctaPrimaryText: "开始阅读 →",
      ctaPrimaryHref: "#sec-picks",
      ctaSecondaryText: "浏览全部",
      ctaSecondaryHref: "#sec-grid",
      mediaType: "video",
      mediaUrl: "https://muse.ai/files/1331075203424773/1432998841610842/xq500iv9v5g5t769vpxqq7gw/noir.mp4",
      badgeText: "本期\n特稿",
      floatCard: {
        tag: "城市",
        title: "霓虹雨夜",
        subtitle: "Neon Noir · 陈默",
        reads: "▶ 12.8万"
      },
      stats: [
        { value: "15", label: "深度特稿" },
        { value: "06", label: "驻站作者" },
        { value: "32万", label: "本月读者" }
      ]
    },
    bento: {
      title: "编辑精选",
      subtitle: "EDITORS' PICKS",
      picks: [
        {
          tag: "城市",
          title: "霓虹雨夜",
          author: "陈默",
          reads: "12.8万",
          mediaType: "video",
          mediaUrl: "https://muse.ai/files/1331075203424773/1432998841610842/xq500iv9v5g5t769vpxqq7gw/noir.mp4",
          articleIndex: 0
        },
        {
          tag: "自然",
          title: "火山口",
          author: "顾晓",
          reads: "15.2万",
          color1: "#ff5c38",
          color2: "#ff9a5c",
          articleIndex: 3
        },
        {
          tag: "文化",
          title: "樱落时分",
          author: "林晚",
          reads: "18.9万",
          color1: "#e86a9a",
          color2: "#ffd3e0",
          articleIndex: 7
        },
        {
          tag: "文化",
          title: "龙",
          author: "陈默",
          reads: "10.2万",
          color1: "#1fae62",
          color2: "#a9f0c9",
          articleIndex: 12
        }
      ]
    },
    cinema: {
      title: "影像特稿",
      subtitle: "FILM STORIES",
      slides: [
        {
          videoUrl: "https://muse.ai/files/1331075203424773/1432998841610842/xq500iv9v5g5t769vpxqq7gw/noir.mp4",
          watermark: "NEON",
          tag: "城市 · 特稿",
          title: "霓虹雨夜",
          desc: "雨把城市洗成一块巨大的霓虹底片。我们在凌晨三点的便利店门口，读懂了不夜城的语法。",
          articleIndex: 0
        },
        {
          videoUrl: "https://muse.ai/files/1331075203424773/1496429802541049/32ptj5b41589vx3gqksl88my/volcano.mp4",
          watermark: "CRATER",
          tag: "自然 · 特稿",
          title: "火山口",
          desc: "站在火山口边缘往下看，看到的是大地的心脏——一颗跳动了四十亿年的心脏。",
          articleIndex: 3
        },
        {
          videoUrl: "https://muse.ai/files/1331075203424773/4033096033492611/kxyw991u5ma9zpmr4mryf34f/cloudsea.mp4",
          watermark: "SUNRISE",
          tag: "旅行 · 特稿",
          title: "云海日出",
          desc: "凌晨四点登顶，在云海之上等一场日出。当第一缕金光刺破云层，值得所有的夜行。",
          articleIndex: 11
        }
      ]
    },
    theWire: {
      title: "24 小时",
      subtitle: "THE WIRE",
      items: [
        { title: "霓虹雨夜入选本月最佳特稿", tag: "城市", time: "2 小时前", articleIndex: 0 },
        { title: "樱落时分》印刷版加印第三次", tag: "文化", time: "5 小时前", articleIndex: 7 },
        { title: "云海日出摄影展周末开展", tag: "旅行", time: "8 小时前", articleIndex: 11 },
        { title: "火山口科考队发回最新影像", tag: "自然", time: "12 小时前", articleIndex: 3 },
        { title: "虚空》获年度哲学图书提名", tag: "哲学", time: "1 天前", articleIndex: 13 }
      ]
    },
    trending: {
      title: "热榜",
      subtitle: "TRENDING",
      items: [
        { rank: "01", title: "樱落时分", tag: "文化", reads: "18.9万", color1: "#e86a9a", articleIndex: 7 },
        { rank: "02", title: "火山口", tag: "自然", reads: "15.2万", color1: "#ff5c38", articleIndex: 3 },
        { rank: "03", title: "霓虹雨夜", tag: "城市", reads: "12.8万", color1: "#3b5bff", articleIndex: 0 },
        { rank: "04", title: "云海日出", tag: "旅行", reads: "3.8万", color1: "#e8a83d", articleIndex: 11 },
        { rank: "05", title: "龙", tag: "文化", reads: "10.2万", color1: "#1fae62", articleIndex: 12 }
      ]
    },
    authors: {
      title: "驻站作者",
      subtitle: "AUTHORS",
      items: [
        { name: "陈默", role: "特稿记者", color: "#d97857", bio: "把远方折成可以翻阅的形状，常年行走在城市与荒野之间。", count: "3 篇特稿" },
        { name: "林晚", role: "自然撰稿", color: "#5da87a", bio: "相信每一片叶子都有名字，山野是她永远的编辑部。", count: "2 篇特稿" },
        { name: "沈括", role: "科学编辑", color: "#527fd4", bio: "把论文翻译成人话，让宇宙变得可以触摸。", count: "3 篇特稿" },
        { name: "顾晓", role: "文化评论", color: "#a263a7", bio: "在传统与潮流之间摆渡，打捞时间的碎片。", count: "3 篇特稿" },
        { name: "江离", role: "旅行作家", color: "#e8a33d", bio: "一年有两百天在路上，剩下的一百天在写路上的事。", count: "2 篇特稿" },
        { name: "陆深", role: "专栏作者", color: "#7a4ff0", bio: "关心\"无\"与\"有\"之间的一切，哲学是他的望远镜。", count: "2 篇特稿" }
      ]
    },
    knowledgeGraph: {
      title: "知识网络",
      subtitle: "KNOWLEDGE GRAPH",
      eyebrow: "知识网络 / KNOWLEDGE GRAPH",
      headline: "每一篇特稿，都是网络上的一个节点。",
      desc: "十五个现场，十大主题。从任意一篇出发，沿着这条粉色的线，走到下一篇——阅读在这里有了方向。"
    },
    newsletter: {
      title: "每周一封，把世界折好寄给你。",
      subtitle: "订阅白卷周刊 · 每周五早上 8 点 · 5 分钟读完",
      placeholder: "你的邮箱地址",
      buttonText: "订阅"
    },
    footer: {
      brandDesc: "用眼睛读的杂志。十五位撰稿人，十五个现场，每周五更新。",
      columns: [
        {
          title: "栏目",
          links: [
            { label: "旅行", href: "#sec-grid" },
            { label: "自然", href: "#sec-grid" },
            { label: "文化", href: "#sec-grid" },
            { label: "科学", href: "#sec-grid" }
          ]
        },
        {
          title: "关于",
          links: [
            { label: "关于白卷", href: "#" },
            { label: "加入我们", href: "#" },
            { label: "联系方式", href: "#" },
            { label: "隐私政策", href: "#" }
          ]
        },
        {
          title: "关注",
          links: [
            { label: "微信公众号", href: "#" },
            { label: "小红书", href: "#" },
            { label: "Bilibili", href: "#" },
            { label: "RSS 订阅", href: "#" }
          ]
        }
      ],
      copyright: "© 2026 白卷 WHITE FOLIO · 演示站"
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
      pageTitle: String(data.pageTitle || DEFAULTS["software-center"].pageTitle || "").trim().slice(0, 150),
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

    const pageTitle = String(data.pageTitle || d.pageTitle || "").trim().slice(0, 150);
    return { pageTitle, hero, marquee, manifesto, albums, genres, tours, about, footer };
  },
  "articles-portal": function validateArticlesPortal(raw) {
    const data = raw && typeof raw === "object" ? raw : {};
    const d = DEFAULTS["articles-portal"];

    const brandRaw = data.brand && typeof data.brand === "object" ? data.brand : {};
    const brand = {
      logo: String(brandRaw.logo || d.brand.logo).trim().slice(0, 50),
      issue: String(brandRaw.issue || d.brand.issue).trim().slice(0, 50)
    };

    const heroRaw = data.hero && typeof data.hero === "object" ? data.hero : {};
    const floatRaw = heroRaw.floatCard && typeof heroRaw.floatCard === "object" ? heroRaw.floatCard : {};
    const hero = {
      eyebrow: String(heroRaw.eyebrow || d.hero.eyebrow).trim().slice(0, 100),
      title: String(heroRaw.title || d.hero.title).trim().slice(0, 100),
      highlight: String(heroRaw.highlight || d.hero.highlight).trim().slice(0, 100),
      lede: String(heroRaw.lede || d.hero.lede).trim().slice(0, 500),
      ctaPrimaryText: String(heroRaw.ctaPrimaryText || d.hero.ctaPrimaryText).trim().slice(0, 50),
      ctaPrimaryHref: String(heroRaw.ctaPrimaryHref || d.hero.ctaPrimaryHref).trim().slice(0, 200),
      ctaSecondaryText: String(heroRaw.ctaSecondaryText || d.hero.ctaSecondaryText).trim().slice(0, 50),
      ctaSecondaryHref: String(heroRaw.ctaSecondaryHref || d.hero.ctaSecondaryHref).trim().slice(0, 200),
      mediaType: heroRaw.mediaType === "image" ? "image" : "video",
      mediaUrl: String(heroRaw.mediaUrl || d.hero.mediaUrl).trim().slice(0, 500),
      badgeText: String(heroRaw.badgeText || d.hero.badgeText).trim().slice(0, 50),
      floatCard: {
        tag: String(floatRaw.tag || d.hero.floatCard.tag).trim().slice(0, 50),
        title: String(floatRaw.title || d.hero.floatCard.title).trim().slice(0, 100),
        subtitle: String(floatRaw.subtitle || d.hero.floatCard.subtitle).trim().slice(0, 100),
        reads: String(floatRaw.reads || d.hero.floatCard.reads).trim().slice(0, 50)
      },
      stats: Array.isArray(heroRaw.stats)
        ? heroRaw.stats.slice(0, 5).map(s => ({
            value: String(s?.value || "").trim().slice(0, 50),
            label: String(s?.label || "").trim().slice(0, 50)
          }))
        : d.hero.stats
    };

    const bentoRaw = data.bento && typeof data.bento === "object" ? data.bento : {};
    const bento = {
      title: String(bentoRaw.title || d.bento.title).trim().slice(0, 100),
      subtitle: String(bentoRaw.subtitle || d.bento.subtitle).trim().slice(0, 100),
      picks: Array.isArray(bentoRaw.picks)
        ? bentoRaw.picks.slice(0, 4).map((p, i) => {
            if (!p || typeof p !== "object") return null;
            const defPick = d.bento.picks[i] || {};
            return {
              tag: String(p.tag || defPick.tag || "").trim().slice(0, 50),
              title: String(p.title || defPick.title || "").trim().slice(0, 100),
              author: String(p.author || defPick.author || "").trim().slice(0, 50),
              reads: String(p.reads || defPick.reads || "").trim().slice(0, 50),
              mediaType: p.mediaType === "image" ? "image" : (p.mediaType === "video" ? "video" : undefined),
              mediaUrl: p.mediaUrl ? String(p.mediaUrl).trim().slice(0, 500) : undefined,
              color1: p.color1 ? String(p.color1).trim().slice(0, 30) : undefined,
              color2: p.color2 ? String(p.color2).trim().slice(0, 30) : undefined,
              articleIndex: typeof p.articleIndex === "number" ? p.articleIndex : (defPick.articleIndex ?? 0)
            };
          }).filter(Boolean)
        : d.bento.picks
    };

    const cinemaRaw = data.cinema && typeof data.cinema === "object" ? data.cinema : {};
    const cinema = {
      title: String(cinemaRaw.title || d.cinema.title).trim().slice(0, 100),
      subtitle: String(cinemaRaw.subtitle || d.cinema.subtitle).trim().slice(0, 100),
      slides: Array.isArray(cinemaRaw.slides)
        ? cinemaRaw.slides.slice(0, 10).map((s, i) => {
            if (!s || typeof s !== "object") return null;
            return {
              videoUrl: String(s.videoUrl || "").trim().slice(0, 500),
              watermark: String(s.watermark || "").trim().slice(0, 50),
              tag: String(s.tag || "").trim().slice(0, 50),
              title: String(s.title || "").trim().slice(0, 100),
              desc: String(s.desc || "").trim().slice(0, 500),
              articleIndex: typeof s.articleIndex === "number" ? s.articleIndex : 0
            };
          }).filter(Boolean)
        : d.cinema.slides
    };

    const wireRaw = data.theWire && typeof data.theWire === "object" ? data.theWire : {};
    const theWire = {
      title: String(wireRaw.title || d.theWire.title).trim().slice(0, 100),
      subtitle: String(wireRaw.subtitle || d.theWire.subtitle).trim().slice(0, 100),
      items: Array.isArray(wireRaw.items)
        ? wireRaw.items.slice(0, 20).map(it => ({
            title: String(it?.title || "").trim().slice(0, 200),
            tag: String(it?.tag || "").trim().slice(0, 50),
            time: String(it?.time || "").trim().slice(0, 50),
            articleIndex: typeof it?.articleIndex === "number" ? it.articleIndex : 0
          }))
        : d.theWire.items
    };

    const trendRaw = data.trending && typeof data.trending === "object" ? data.trending : {};
    const trending = {
      title: String(trendRaw.title || d.trending.title).trim().slice(0, 100),
      subtitle: String(trendRaw.subtitle || d.trending.subtitle).trim().slice(0, 100),
      items: Array.isArray(trendRaw.items)
        ? trendRaw.items.slice(0, 10).map((it, i) => ({
            rank: String(it?.rank || `0${i + 1}`).trim().slice(0, 10),
            title: String(it?.title || "").trim().slice(0, 150),
            tag: String(it?.tag || "").trim().slice(0, 50),
            reads: String(it?.reads || "").trim().slice(0, 50),
            color1: String(it?.color1 || "#3b5bff").trim().slice(0, 30),
            articleIndex: typeof it?.articleIndex === "number" ? it.articleIndex : 0
          }))
        : d.trending.items
    };

    const authorsRaw = data.authors && typeof data.authors === "object" ? data.authors : {};
    const authors = {
      title: String(authorsRaw.title || d.authors.title).trim().slice(0, 100),
      subtitle: String(authorsRaw.subtitle || d.authors.subtitle).trim().slice(0, 100),
      items: Array.isArray(authorsRaw.items)
        ? authorsRaw.items.slice(0, 20).map(a => ({
            name: String(a?.name || "").trim().slice(0, 50),
            role: String(a?.role || "").trim().slice(0, 50),
            color: String(a?.color || "#d97857").trim().slice(0, 30),
            bio: String(a?.bio || "").trim().slice(0, 300),
            count: String(a?.count || "").trim().slice(0, 50)
          }))
        : d.authors.items
    };

    const graphRaw = data.knowledgeGraph && typeof data.knowledgeGraph === "object" ? data.knowledgeGraph : {};
    const knowledgeGraph = {
      title: String(graphRaw.title || d.knowledgeGraph.title).trim().slice(0, 100),
      subtitle: String(graphRaw.subtitle || d.knowledgeGraph.subtitle).trim().slice(0, 100),
      eyebrow: String(graphRaw.eyebrow || d.knowledgeGraph.eyebrow).trim().slice(0, 100),
      headline: String(graphRaw.headline || d.knowledgeGraph.headline).trim().slice(0, 150),
      desc: String(graphRaw.desc || d.knowledgeGraph.desc).trim().slice(0, 500)
    };

    const nlRaw = data.newsletter && typeof data.newsletter === "object" ? data.newsletter : {};
    const newsletter = {
      title: String(nlRaw.title || d.newsletter.title).trim().slice(0, 100),
      subtitle: String(nlRaw.subtitle || d.newsletter.subtitle).trim().slice(0, 200),
      placeholder: String(nlRaw.placeholder || d.newsletter.placeholder).trim().slice(0, 100),
      buttonText: String(nlRaw.buttonText || d.newsletter.buttonText).trim().slice(0, 50)
    };

    const footerRaw = data.footer && typeof data.footer === "object" ? data.footer : {};
    const footer = {
      brandDesc: String(footerRaw.brandDesc || d.footer.brandDesc).trim().slice(0, 300),
      columns: Array.isArray(footerRaw.columns)
        ? footerRaw.columns.slice(0, 6).map(c => ({
            title: String(c?.title || "").trim().slice(0, 50),
            links: Array.isArray(c?.links)
              ? c.links.slice(0, 10).map(l => ({
                  label: String(l?.label || "").trim().slice(0, 50),
                  href: String(l?.href || "#").trim().slice(0, 200)
                }))
              : []
          }))
        : d.footer.columns,
      copyright: String(footerRaw.copyright || d.footer.copyright).trim().slice(0, 200)
    };

    const pageTitle = String(data.pageTitle || d.pageTitle || "").trim().slice(0, 150);
    return { pageTitle, brand, hero, bento, cinema, theWire, trending, authors, knowledgeGraph, newsletter, footer };
  }
};
