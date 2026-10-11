let currentCatalog = null;
let activeMatrixCategory = "all";

const tabs = [...document.querySelectorAll("[data-extension-tab]")];
const cards = [...document.querySelectorAll("[data-extension-card]")];
const row = document.querySelector("[data-extension-row]");

const aiPrompts = [...document.querySelectorAll("[data-ai-slide]")];
const aiStage = document.querySelector("[data-ai-stage]");
const aiMedia = document.querySelector("[data-ai-media]");
const aiDots = document.querySelector("[data-ai-dots]");
const aiNext = document.querySelector("[data-ai-next]");
const aiCommandList = document.querySelector("[data-ai-command-list]");
const aiKicker = document.querySelector("[data-ai-kicker]");
const aiTitle = document.querySelector("[data-ai-title]");
const aiDescription = document.querySelector("[data-ai-description]");
const aiSuggestion = document.querySelector("[data-ai-suggestion]");

let aiSlides = [];
let activeAiSlide = 0;
let aiTimer = null;

if (tabs.length && cards.length && row) {
  tabs.forEach(tab => {
    tab.addEventListener("click", () => focusExtension(tab.dataset.extensionTab));
  });
}

// 主入口：加载后台 Catalog 数据并初始化各动态联动区域
loadHomeData();

async function loadHomeData() {
  try {
    const response = await fetch("/api/catalog", { cache: "no-store" });
    if (!response.ok) throw new Error("catalog request failed");
    currentCatalog = await response.json();
  } catch (e) {
    console.warn("未能读取 /api/catalog，采用内置兜底配置:", e);
    currentCatalog = getFallbackCatalog();
  }

  // 1. 动态填充后台配置的首页文案
  applySiteText(currentCatalog.site || {});

  // 2. 动态同步主导航
  renderNavigation(currentCatalog);

  // 3. 动态渲染全系软件矩阵 (Software Matrix)
  renderSoftwareMatrix(currentCatalog);

  // 4. 动态渲染最新文章教程 (Articles)
  renderHomeArticles(currentCatalog);

  // 5. 初始化交互式命令搜索面板
  initLauncherSearch(currentCatalog);

  // 6. 初始化 AI 运营看板与图片轮播
  initAiCarousel(currentCatalog);

  // 7. 初始化 FAQ 常见问题折叠交互
  initFaqAccordion();

  // 8. 初始化桌面 2.0 核心特性交互切换器
  initDesktopFeatureSwitcher();

  // 9. 初始化底部灵动快捷胶囊
  initFloatingDock();
}

function applySiteText(site) {
  for (const element of document.querySelectorAll("[data-site-text]")) {
    const key = element.dataset.siteText;
    if (site[key]) element.textContent = site[key];
  }
}

function renderNavigation(catalog) {
  const nav = document.querySelector("[data-nav]");
  if (!nav || !Array.isArray(catalog.navigation)) return;
  nav.replaceChildren();
  for (const item of catalog.navigation.filter(entry => entry.status !== "disabled" && !/^\/(lvtuang|admin\.html)/.test(entry.href))) {
    const link = document.createElement("a");
    link.href = item.href;
    link.textContent = item.label;
    if (item.external) {
      link.target = "_blank";
      link.rel = "noopener";
    }
    nav.append(link);
  }
}

function renderSoftwareMatrix(catalog) {
  const tabsContainer = document.getElementById("matrixTabs");
  const gridContainer = document.getElementById("matrixGrid");
  if (!tabsContainer || !gridContainer) return;

  const softwareList = catalog.software || [];
  const categories = catalog.categories || [];

  // 渲染分类 Tab 按钮
  const allCategories = [
    { id: "all", name: "全部软件", count: softwareList.length },
    ...categories.map(c => ({
      ...c,
      count: softwareList.filter(s => s.categoryId === c.id).length
    }))
  ];

  tabsContainer.replaceChildren();
  allCategories.forEach(cat => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `apple-segmented__btn ${cat.id === activeMatrixCategory ? "is-active" : ""}`;
    btn.textContent = `${cat.name} (${cat.count || 0})`;
    btn.addEventListener("click", () => {
      activeMatrixCategory = cat.id;
      renderSoftwareMatrix(catalog);
    });
    tabsContainer.append(btn);
  });

  // 过滤并渲染软件卡片
  const filtered = softwareList.filter(s => {
    if (activeMatrixCategory === "all") return true;
    return s.categoryId === activeMatrixCategory;
  });

  gridContainer.replaceChildren();

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "apple-card apple-card--span-12";
    empty.style.textAlign = "center";
    empty.innerHTML = `<p style="margin:20px 0; color:var(--apple-text-tertiary);">当前分类暂未上架软件，请在管理后台上传添加。</p>`;
    gridContainer.append(empty);
    return;
  }

  filtered.forEach(item => {
    const category = categories.find(c => c.id === item.categoryId);
    const latest = (item.releases || []).find(r => r.isLatest) || item.releases?.[0];
    const isDesktop = item.slug === "desktop" || /桌面/i.test(item.name);

    const card = document.createElement("article");
    card.className = "apple-card apple-card--span-4";

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <span class="apple-badge-pill" style="margin-bottom:0;">${escapeHtml(category?.name || "精选软件")}</span>
        <span style="font-size:12px; color:var(--apple-text-tertiary); font-family:monospace;">${escapeHtml(latest?.version ? `v${latest.version}` : "最新发行版")}</span>
      </div>
      <h3 class="apple-card__title" style="font-size:22px; margin-bottom:8px;">${escapeHtml(item.name)}</h3>
      <p class="apple-card__desc" style="flex-grow:1; font-size:14px; margin-bottom:20px;">${escapeHtml(item.description || "全功能桌面效能工具，由天才猫官方团队提供长期更新保障。")}</p>
      <div style="display:flex; gap:10px; align-items:center; padding-top:14px; border-top:1px solid rgba(255,255,255,0.08);">
        ${isDesktop ? `
          <a class="apple-btn apple-btn--primary" href="/desktop.html" style="flex:1; padding:8px 16px; font-size:13px;">
            <span>🌟 桌面 2.0 落地页</span> <i>→</i>
          </a>
        ` : `
          <a class="apple-btn apple-btn--primary" href="${latest ? `/download/latest/${encodeURIComponent(item.slug || item.id)}` : `/download.html`}" style="flex:1; padding:8px 16px; font-size:13px;">
            <span>${latest ? "下载最新版" : "前往下载"}</span> <i>↓</i>
          </a>
          <a class="apple-btn apple-btn--secondary" href="/software.html?slug=${encodeURIComponent(item.slug || item.id)}" style="padding:8px 14px; font-size:13px;">详情</a>
        `}
      </div>
    `;

    gridContainer.append(card);
  });
}

function renderHomeArticles(catalog) {
  const container = document.getElementById("homeArticlesGrid");
  if (!container) return;

  const articles = (catalog.articles || [])
    .filter(a => a.status === "published")
    .slice(0, 3);

  container.replaceChildren();

  if (!articles.length) {
    const fallbackArticles = [
      {
        slug: "desktop-v2-release",
        title: "天才猫桌面 2.0 正式发布：抽屉收纳盒与 C 盘无损搬家",
        summary: "全新 2.0 版本带来抽屉式侧边吸附、Alt+1~9 快捷键矩阵、空间管家与 6 款高定皮肤。",
        createdAt: Date.now()
      },
      {
        slug: "r2-guide",
        title: "如何通过 Cloudflare R2 管理多软件版本与全量资产",
        summary: "详解天才猫软件中心背后的对象存储分发与版本控制机制，让交付更稳定。",
        createdAt: Date.now() - 86400000
      },
      {
        slug: "live-ops-command",
        title: "Apple 极简工作流：把高频运营入口变成快捷命令",
        summary: "探索像 Apple 体验一样快速调起工具的沉浸式极客体验，让每次打开都有惊喜。",
        createdAt: Date.now() - 172800000
      }
    ];
    fallbackArticles.forEach(a => renderArticleCard(container, a));
    return;
  }

  articles.forEach(a => renderArticleCard(container, a));
}

function renderArticleCard(container, a) {
  const card = document.createElement("a");
  card.className = "apple-card apple-card--span-4";
  card.href = `/article.html?slug=${encodeURIComponent(a.slug)}`;
  card.style.textDecoration = "none";
  card.innerHTML = `
    <span class="apple-card__eyebrow">${formatDate(a.createdAt)} · 官方文章</span>
    <h3 class="apple-card__title" style="font-size:19px; line-height:1.3; margin-bottom:10px;">${escapeHtml(a.title)}</h3>
    <p class="apple-card__desc" style="font-size:14px; margin-bottom:0;">${escapeHtml(a.summary || "点击阅读完整教程和说明...")}</p>
  `;
  container.append(card);
}

function initLauncherSearch(catalog) {
  const input = document.getElementById("launcherSearchInput");
  const list = document.getElementById("launcherList");
  if (!input || !list) return;

  const defaultItems = [
    {
      title: "🔥 体验天才猫桌面 2.0 (全景3D落地页)",
      desc: "包含抽屉收纳盒、时钟、NovaDisk 交互体验器",
      href: "/desktop.html",
      icon: "🌟",
      kbd: "↵"
    },
    {
      title: "下载天才猫 DY 辅助工具",
      desc: "直播场控、数据中心与自动化辅助安装包",
      href: "/download.html",
      icon: "↓",
      kbd: "D"
    },
    {
      title: "打开图片素材画廊",
      desc: "R2 图片素材、沉浸预览、多图批量管理",
      href: "/gallery.html",
      icon: "▧",
      kbd: "G"
    },
    {
      title: "进入直播音乐频道",
      desc: "网易云歌曲 ID、R2 音频、暖场歌单管理",
      href: "/music.html",
      icon: "♪",
      kbd: "M"
    },
    {
      title: "查看文章教程与公告",
      desc: "更新说明、使用教程、运营经验沉淀",
      href: "/articles.html",
      icon: "✦",
      kbd: "A"
    },
    {
      title: "购买正版绑定授权",
      desc: "正版授权、团队使用、长期升级服务",
      href: "/license.html",
      icon: "✓",
      kbd: "L"
    }
  ];

  function renderList(items) {
    list.replaceChildren();
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "launcher-item";
      empty.innerHTML = `<i>🔍</i><div><strong>未找到匹配项</strong><small>尝试搜索“桌面”、“下载”、“画廊”或“音乐”</small></div>`;
      list.append(empty);
      return;
    }
    items.forEach((item, index) => {
      const a = document.createElement("a");
      a.className = `launcher-item ${index === 0 ? "is-active" : ""}`;
      a.href = item.href;
      a.innerHTML = `
        <i>${item.icon || "✦"}</i>
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <small>${escapeHtml(item.desc)}</small>
        </div>
        <kbd>${item.kbd || "↵"}</kbd>
      `;
      list.append(a);
    });
  }

  renderList(defaultItems);

  input.addEventListener("input", e => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) {
      renderList(defaultItems);
      return;
    }
    const matched = defaultItems.filter(item =>
      item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)
    );

    // 如果搜索与后台各软件匹配，也加进搜索结果
    (catalog.software || []).forEach(s => {
      if (s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q))) {
        matched.push({
          title: `下载 ${s.name}`,
          desc: s.description || "前往软件下载中心获取最新安装包",
          href: `/download.html`,
          icon: "📦",
          kbd: "↵"
        });
      }
    });

    renderList(matched);
  });

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const first = list.querySelector(".launcher-item");
      if (first && first.href) window.location.href = first.href;
    }
  });

  // 全局 ⌘K / Ctrl+K 或 / 键快速聚焦搜索中枢
  window.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      input.focus();
      input.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (e.key === "/" && document.activeElement !== input && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
      e.preventDefault();
      input.focus();
      input.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
}

function initFaqAccordion() {
  const faqButtons = document.querySelectorAll(".apple-faq-question");
  faqButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".apple-faq-item");
      if (!item) return;
      const isOpen = item.classList.contains("is-open");
      document.querySelectorAll(".apple-faq-item").forEach(i => i.classList.remove("is-open"));
      if (!isOpen) {
        item.classList.add("is-open");
      }
    });
  });
}

function initDesktopFeatureSwitcher() {
  const featureBtns = document.querySelectorAll("[data-feature-tab]");
  const detailTitle = document.getElementById("featureDetailTitle");
  const detailDesc = document.getElementById("featureDetailDesc");
  const detailBadge = document.getElementById("featureDetailBadge");

  const featureData = {
    drawer: {
      badge: "核心专利交互",
      title: "抽屉式侧边吸附把手",
      desc: "拖动收纳盒到屏幕左、右或上边缘松手，即可弹性收起为 30px 超薄磨砂把手。鼠标靠近顺滑弹出展开，移开静默缩回，多把手垂直智能避让不遮挡壁纸与任务栏。"
    },
    novadisk: {
      badge: "系统深度瘦身",
      title: "NovaDisk 2.0 C盘无损搬家",
      desc: "独创 Fluent 2.0 圆角 Treemap 树图，内置文件夹语义身份证。通过 Windows 原生 NTFS Junction 软链接技术将微信、QQ 等大文件安全搬至 D 盘，原路径无感兼容，空间瞬间释放数十 GB！"
    },
    hotkeys: {
      badge: "极速盲操",
      title: "Alt+1~9 快捷键矩阵与快速启动盒",
      desc: "桌面图标直接拖入绑定，按一下打开常用软件，再按一下隐退收起。前4个自动同步至桌面主控盒，支持软件、文件夹、网址与终端命令。"
    },
    dock: {
      badge: "顶部盲操中枢",
      title: "TopPeekDock 顶部无感速览",
      desc: "吸附在屏幕正上方的极简微光胶囊。鼠标轻碰顶部即刻展开，悬停后台窗口标签即可零延迟临时'偷看'预览，支持键盘 1~9 与左右方向键极速盲操切换。"
    },
    pet: {
      badge: "治愈效率兼具",
      title: "GeniusPet 灵动陪伴桌宠",
      desc: "完全本地化轻量级小猫桌宠，支持拎起后颈、扒边观察、发呆打盹。单击弹出暖心问候与今日待办提醒，双击秒开番茄专注时钟与一键桌面整理。"
    }
  };

  if (!featureBtns.length || !detailTitle || !detailDesc) return;

  featureBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      featureBtns.forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      const key = btn.dataset.featureTab;
      const data = featureData[key];
      if (data) {
        if (detailBadge) detailBadge.textContent = data.badge;
        detailTitle.textContent = data.title;
        detailDesc.textContent = data.desc;
      }
    });
  });
}

function initFloatingDock() {
  const searchBtn = document.getElementById("dockSearchBtn");
  const scrollTopBtn = document.getElementById("dockScrollTop");
  const searchInput = document.getElementById("launcherSearchInput");

  if (searchBtn && searchInput) {
    searchBtn.addEventListener("click", () => {
      searchInput.focus();
      searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
}

function focusExtension(key) {
  const card = cards.find(item => item.dataset.extensionCard === key);
  if (!card) return;

  tabs.forEach(tab => tab.classList.toggle("is-active", tab.dataset.extensionTab === key));
  cards.forEach(item => item.classList.toggle("is-focused", item === card));

  row.scrollTo({
    left: card.offsetLeft - row.offsetLeft,
    behavior: "smooth"
  });
}

async function initAiCarousel(catalog) {
  if (!aiStage || !aiMedia) return;
  aiSlides = loadAiSlidesFromCatalog(catalog);
  renderAiImages();
  renderAiCommands();
  renderAiDots();
  setAiSlide(0);
  startAiCarousel();

  aiPrompts.forEach(prompt => {
    prompt.addEventListener("click", () => {
      setAiSlide(Number(prompt.dataset.aiSlide || 0));
      startAiCarousel();
    });
  });

  aiNext?.addEventListener("click", () => {
    setAiSlide(activeAiSlide + 1);
    startAiCarousel();
  });

  aiStage.addEventListener("mouseenter", stopAiCarousel);
  aiStage.addEventListener("mouseleave", startAiCarousel);
}

function loadAiSlidesFromCatalog(catalog) {
  const carousel = (catalog?.siteCarousel || [])
    .filter(item => item.imageUrl)
    .slice(0, 6)
    .map((item, index) => slideFromCarousel(item, index));

  if (carousel.length) return carousel;
  return fallbackAiSlides();
}

function slideFromCarousel(item, index) {
  const templates = [
    { kicker: "素材洞察", suggestion: "这张素材适合作为画廊主推，建议同步放入首页动态区域提高点击率。" },
    { kicker: "直播话术", suggestion: "围绕画面主体生成开场话术，并关联下载中心入口形成转化路径。" },
    { kicker: "标签整理", suggestion: "根据图片说明和标签自动归类，方便用户在画廊里按场景筛选。" }
  ];
  const template = templates[index % templates.length];
  return {
    imageUrl: item.thumbUrl || item.imageUrl,
    title: item.title || `后台素材 ${index + 1}`,
    description: item.description || (item.tags || []).join(" / ") || "来自后台系统管理的图片素材。",
    kicker: template.kicker,
    suggestion: item.suggestion || template.suggestion
  };
}

function fallbackAiSlides() {
  return [
    {
      title: "等待后台图片",
      description: "在后台系统管理里添加图片后，这里会自动替换为真实素材轮播。",
      kicker: "素材洞察",
      suggestion: "先上传产品截图、直播现场或素材封面，AI 区域会自动形成动态展示。"
    },
    {
      title: "生成直播话术",
      description: "围绕软件、音乐、图库和授权入口生成运营说明。",
      kicker: "直播话术",
      suggestion: "把主推素材和下载入口组合成一句清晰的直播引导。"
    },
    {
      title: "整理素材标签",
      description: "把图片、文章、音乐素材归纳成用户能理解的入口。",
      kicker: "标签整理",
      suggestion: "建议使用场景标签：直播、下载、教程、授权、音乐。"
    }
  ];
}

function renderAiImages() {
  const fallback = aiMedia.querySelector(".ai-fallback-card");
  aiSlides.forEach((slide, index) => {
    if (!slide.imageUrl) return;
    const image = document.createElement("img");
    image.src = slide.imageUrl;
    image.alt = slide.title;
    image.decoding = "async";
    image.loading = index ? "lazy" : "eager";
    aiMedia.append(image);
  });
  if (fallback && aiSlides.some(slide => slide.imageUrl)) fallback.remove();
}

function renderAiDots() {
  if (!aiDots) return;
  aiDots.replaceChildren();
  aiSlides.forEach((_, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.ariaLabel = `查看第 ${index + 1} 张 AI 素材`;
    const fill = document.createElement("span");
    button.append(fill);
    button.addEventListener("click", () => {
      setAiSlide(index);
      startAiCarousel();
    });
    aiDots.append(button);
  });
}

function renderAiCommands() {
  if (!aiCommandList) return;
  aiCommandList.replaceChildren();
  const label = document.createElement("span");
  label.textContent = "Tiancaimao AI";
  aiCommandList.append(label);
  aiSlides.forEach((slide, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = slide.title;
    button.addEventListener("click", () => {
      setAiSlide(index);
      startAiCarousel();
    });
    aiCommandList.append(button);
  });
}

function setAiSlide(nextIndex) {
  if (!aiSlides.length) return;
  activeAiSlide = (nextIndex + aiSlides.length) % aiSlides.length;
  const slide = aiSlides[activeAiSlide];

  const images = [...aiMedia.querySelectorAll("img")];
  images.forEach((image, index) => {
    image.classList.toggle("is-active", index === activeAiSlide);
  });

  const commands = [...(aiCommandList?.querySelectorAll("button") || [])];
  commands.forEach((command, index) => {
    command.classList.toggle("is-active", index === activeAiSlide);
  });

  const dots = [...(aiDots?.querySelectorAll("button") || [])];
  dots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === activeAiSlide);
  });

  aiPrompts.forEach((prompt, index) => {
    prompt.classList.toggle("is-active", index === (activeAiSlide % aiPrompts.length));
  });

  if (aiKicker) aiKicker.textContent = slide.kicker || "素材洞察";
  if (aiTitle) aiTitle.textContent = slide.title || "素材标题";
  if (aiDescription) aiDescription.textContent = slide.description || "素材描述";
  if (aiSuggestion) aiSuggestion.textContent = slide.suggestion || "运营建议";
}

function startAiCarousel() {
  stopAiCarousel();
  aiTimer = setInterval(() => {
    setAiSlide(activeAiSlide + 1);
  }, 5000);
}

function stopAiCarousel() {
  if (aiTimer) {
    clearInterval(aiTimer);
    aiTimer = null;
  }
}

function formatDate(timestamp) {
  if (!timestamp) return "";
  const d = new Date(Number(timestamp));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function getFallbackCatalog() {
  return {
    product: "天才猫软件中心",
    site: {
      homeHeroKicker: "Tiancaimao Command Center",
      homeHeroTitle: "把直播运营入口，压缩成一次打开。",
      homeHeroDescription: "如 Apple 工具般优雅灵动。把天才猫桌面 2.0、软件下载中心、NovaDisk 空间管家、3D 图库与正版授权整合成高度一体化的官方工作台。",
      shortcutsKicker: "Tiancaimao Ecosystem",
      shortcutsTitle: "不仅是工具。更是一整套灵动空间。",
      aiKicker: "AI Workspace",
      aiTitle: "让后台素材，变成智能运营看板。",
      aiDescription: "后台系统管理中维护的图片与媒体会自动轮播呈现在这里，配合模拟的 AI 深度分析、标签归纳与发布建议。",
      aiPromptOne: "分析素材",
      aiPromptTwo: "生成话术",
      aiPromptThree: "整理标签",
      readyKicker: "Ready to Elevate Your Workflow?",
      readyTitle: "进入天才猫灵动生态。",
      footerWordmark: "TIANCAIMAO"
    },
    categories: [
      { id: "desktop", name: "桌面效能" },
      { id: "assistant", name: "直播辅助" },
      { id: "data", name: "数据中心" }
    ],
    software: [
      {
        id: "desktop",
        slug: "desktop",
        name: "天才猫桌面 2.0",
        categoryId: "desktop",
        description: "灵动抽屉式侧边收纳、C盘无损搬家管家、顶部偷看Dock、Alt快捷键矩阵与6款高定皮肤。"
      },
      {
        id: "dy-assistant",
        slug: "dy-assistant",
        name: "天才猫DY辅助工具",
        categoryId: "assistant",
        description: "面向直播团队的自动化场控与互动辅助，全功能稳定交付。"
      },
      {
        id: "datacenter",
        slug: "datacenter",
        name: "数据中心版",
        categoryId: "data",
        description: "多店铺订单与场控数据集中化监控，支持实时统计。"
      }
    ]
  };
}
