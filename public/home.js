let currentCatalog = null;
let currentPromotions = null;
let activeMatrixCategory = "all";

const CACHE_KEY = "software_center_catalog_cache_v3";

function renderHomeViews(cat, promotions = null) {
  applySiteText(cat.site || {});
  renderNavigation(cat);
  renderFlagship(cat);
  renderSoftwareMatrix(cat);
  renderHomeArticles(cat);
  renderPortalCarousel(promotions || currentPromotions, cat);
}

// 主入口：加载后台 Catalog 数据与推广位配置，并初始化各动态联动区域
loadHomeData();

async function loadHomeData() {
  let hasRendered = false;

  // 1. 同步读取缓存秒开
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      currentCatalog = JSON.parse(raw);
      if (currentCatalog && Array.isArray(currentCatalog.software)) {
        renderHomeViews(currentCatalog);
        hasRendered = true;
      }
    }
  } catch (e) {}

  // 2. 异步网络刷新 (并行加载 catalog 与 promotions 配置)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const [catRes, promoRes] = await Promise.all([
      fetch("/api/catalog", { signal: controller.signal }).catch(() => null),
      fetch("/api/config/promotions", { cache: "no-store" }).catch(() => null)
    ]);
    clearTimeout(timeoutId);

    if (promoRes && promoRes.ok) {
      currentPromotions = await promoRes.json();
    } else {
      currentPromotions = { items: [] };
    }

    if (catRes && catRes.ok) {
      currentCatalog = await catRes.json();
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(currentCatalog));
      } catch (e) {}
      renderHomeViews(currentCatalog, currentPromotions);
    } else if (!hasRendered) {
      currentCatalog = getFallbackCatalog();
      renderHomeViews(currentCatalog, currentPromotions);
    }
  } catch (e) {
    if (!hasRendered) {
      console.warn("未能读取 /api/catalog，采用内置兜底配置:", e);
      currentCatalog = getFallbackCatalog();
      renderHomeViews(currentCatalog, currentPromotions);
    }
  }

  // 3. 初始化交互组件
  initFaqAccordion();
  initBackToTop();
}

function applySiteText(site) {
  for (const element of document.querySelectorAll("[data-site-text]")) {
    const key = element.dataset.siteText;
    let val = site[key];
    if (val) {
      val = val.replace(/像\s*Raycast\s*一样快[，,]?\s*但内容全部换成天才猫自己的业务[：:]\s*/g, "专为 Windows 打造的灵动桌面与运营中枢：")
               .replace(/如\s*Apple\s*工具般优雅灵动[。.]\s*/g, "");
      element.textContent = val;
    }
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
    if (/^\/(desktop\.html)/.test(item.href)) {
      link.classList.add("is-highlight");
    }
    if (item.external) {
      link.target = "_blank";
      link.rel = "noopener";
    }
    nav.append(link);
  }
}

function renderFlagship(catalog) {
  const softwareList = catalog.software || [];
  if (!softwareList.length) return;

  // 按照 sortOrder 升序排列，取最小值对应的软件作为官方旗舰
  const sorted = [...softwareList].sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
  const flagship = sorted[0];
  if (!flagship) return;

  const titleEl = document.getElementById("flagshipTitle");
  const taglineEl = document.getElementById("flagshipTagline");
  const bulletsEl = document.getElementById("flagshipBullets");
  const primaryBtn = document.getElementById("flagshipPrimaryBtn");
  const downloadBtn = document.getElementById("flagshipDownloadBtn");
  const imgEl = document.getElementById("flagshipImage");

  if (titleEl) {
    titleEl.textContent = flagship.name || "天才猫桌面 2.0";
  }

  // 优先展示 tagline，其次是 description
  if (taglineEl) {
    taglineEl.textContent = flagship.tagline || flagship.description || "专为 Windows 打造的灵动桌面与运营中枢。";
  }

  const isDesktop = flagship.slug === "desktop" || /桌面/i.test(flagship.name);
  const detailUrl = flagship.landingUrl || (isDesktop ? "/desktop.html" : `/download.html?app=${encodeURIComponent(flagship.slug || flagship.id)}`);

  if (primaryBtn) {
    primaryBtn.href = detailUrl;
  }

  const latest = (flagship.releases || []).find(r => r.isLatest) || flagship.releases?.[0];
  if (downloadBtn) {
    downloadBtn.href = `/download/latest/${encodeURIComponent(flagship.slug || flagship.id)}`;
    const sizeStr = latest?.fileSize ? ` (${(latest.fileSize / (1024 * 1024)).toFixed(0)}MB)` : "";
    downloadBtn.innerHTML = `<span>下载最新版安装包${sizeStr}</span> <i>↓</i>`;
  }

  // 封面图：如果软件配置了 iconUrl 则使用，否则保留默认
  if (imgEl && flagship.iconUrl) {
    imgEl.src = flagship.iconUrl;
  }

  // 渲染 highlights
  if (bulletsEl) {
    const highlights = Array.isArray(flagship.highlights) && flagship.highlights.length > 0
      ? flagship.highlights
      : [
          { title: "抽屉式侧边吸附把手", text: "拖动收纳盒靠边自动缩减为 30px 超薄把手，悬停顺滑弹出，避让任务栏。" },
          { title: "Alt+1~9 快捷盲操矩阵", text: "常用应用拖入即可绑定快捷键，按一下快速调出，再按一下静默隐退。" },
          { title: "NovaDisk 2.0 C盘无损搬家", text: "采用 NTFS Junction 软链接技术，微信QQ等大文件安全换盘，原路径无感读写。" }
        ];

    bulletsEl.replaceChildren();
    const icons = ["#i-tidy", "#i-keyboard", "#i-drive", "#i-shield"];
    highlights.slice(0, 3).forEach((hl, idx) => {
      const iconId = icons[idx % icons.length];
      const item = document.createElement("div");
      item.className = "flagship-bullet";
      item.innerHTML = `
        <div class="b-icon"><svg class="ico"><use href="${iconId}"/></svg></div>
        <div>
          <h4>${escapeHtml(hl.title)}</h4>
          <p>${escapeHtml(hl.text)}</p>
        </div>
      `;
      bulletsEl.append(item);
    });
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

  // 过滤软件
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

  // 严格限制最多展示 6 个卡片
  const displayList = filtered.slice(0, 6);

  displayList.forEach(item => {
    const category = categories.find(c => c.id === item.categoryId);
    const latest = (item.releases || []).find(r => r.isLatest) || item.releases?.[0];
    const isDesktop = item.slug === "desktop" || /桌面/i.test(item.name);

    const card = document.createElement("article");
    card.className = "apple-card apple-card--span-4";

    const desc = item.tagline || item.description || "全功能桌面效能工具，由天才猫官方团队提供长期更新保障。";

    card.innerHTML = `
      <div class="apple-card__top">
        <span class="apple-badge-pill">${escapeHtml(category?.name || "精选软件")}</span>
        <span class="apple-card__version">${escapeHtml(latest?.version ? `v${latest.version}` : "最新版")}</span>
      </div>
      <h3 class="apple-card__title">${escapeHtml(item.name)}</h3>
      <p class="apple-card__desc">${escapeHtml(desc)}</p>
      <div class="apple-card__actions">
        ${isDesktop ? `
          <a class="apple-btn apple-btn--primary apple-btn--sm" href="/desktop.html" style="flex:1;">
            <span>桌面 2.0 专属</span> <i>→</i>
          </a>
        ` : `
          <a class="apple-btn apple-btn--primary apple-btn--sm" href="${latest ? `/download/latest/${encodeURIComponent(item.slug || item.id)}` : `/download.html`}" style="flex:1;">
            <span>${latest ? "下载最新版" : "前往下载"}</span> <i>↓</i>
          </a>
          <a class="apple-btn apple-btn--secondary apple-btn--sm" href="/download.html?app=${encodeURIComponent(item.slug || item.id)}">详情</a>
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
        title: "极简工作流实践：把高频运营入口变成快捷命令",
        summary: "探索快速调起工具的沉浸式极客体验，让每次打开都有惊喜。",
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
  card.className = "apple-card apple-card--span-4 apple-article-card";
  card.href = `/article.html?slug=${encodeURIComponent(a.slug)}`;
  card.innerHTML = `
    <span class="apple-card__eyebrow">${formatDate(a.createdAt)} · 官方文章</span>
    <h3 class="apple-card__title">${escapeHtml(a.title)}</h3>
    <p class="apple-card__desc">${escapeHtml(a.summary || "点击阅读完整教程和说明...")}</p>
  `;
  container.append(card);
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

function initBackToTop() {
  const btn = document.getElementById("dockScrollTop");
  if (!btn) return;

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      btn.classList.add("is-visible");
    } else {
      btn.classList.remove("is-visible");
    }
  }, { passive: true });
}

let portalCarouselTimer = null;
let currentPortalSlideIdx = 0;

function renderPortalCarousel(promotions, catalog) {
  const carouselEl = document.getElementById("portalCarousel");
  const trackEl = document.getElementById("portalCarouselTrack");
  const prevBtn = document.getElementById("portalCarouselPrev");
  const nextBtn = document.getElementById("portalCarouselNext");
  const dotsEl = document.getElementById("portalCarouselDots");
  const defaultImg = document.getElementById("defaultHeroImg");
  if (!carouselEl || !trackEl) return;

  // 1. 优先读取 placement="portal" 的统一推广位
  let slides = [];
  if (window.NsyPromotions?.resolvePromotions) {
    slides = window.NsyPromotions.resolvePromotions(promotions, catalog, "portal");
  }

  // 2. 没有时回退到旧的 siteCarousel
  if (!slides || slides.length === 0) {
    const rawSiteCarousel = Array.isArray(catalog?.siteCarousel) ? catalog.siteCarousel : [];
    const activeCarousel = rawSiteCarousel.filter(item => item && item.status !== "disabled");
    slides = activeCarousel.map((item, idx) => ({
      id: item.id || `carousel_${idx}`,
      type: "custom",
      title: item.title || "官方推荐",
      subtitle: item.description || "",
      image: item.imageUrl,
      ctaText: "了解详情",
      ctaHref: item.suggestion || "/download.html",
      badge: "推荐",
      order: item.sortOrder ?? idx
    })).filter(s => Boolean(s.image));
  }

  // 3. 如果依然没有任何可用轮播，显示默认静态首屏图
  if (!slides || slides.length === 0) {
    carouselEl.hidden = true;
    if (defaultImg) defaultImg.hidden = false;
    if (portalCarouselTimer) clearInterval(portalCarouselTimer);
    return;
  }

  // 隐藏静态底图，展示交互轮播
  if (defaultImg) defaultImg.hidden = true;
  carouselEl.hidden = false;

  // 4. 渲染轮播幻灯片
  trackEl.innerHTML = slides.map((slide, idx) => `
    <div class="portal-carousel__slide ${idx === 0 ? "is-active" : ""}" data-slide-idx="${idx}">
      <img src="${escapeAttr(slide.image)}" alt="${escapeAttr(slide.title)}" loading="${idx === 0 ? "eager" : "lazy"}" />
      <div class="portal-carousel__overlay">
        ${slide.badge ? `<span class="portal-carousel__badge">✦ ${escapeHtml(slide.badge)}</span>` : ""}
        <h2 class="portal-carousel__title">${escapeHtml(slide.title)}</h2>
        ${slide.subtitle ? `<p class="portal-carousel__subtitle">${escapeHtml(slide.subtitle)}</p>` : ""}
        ${slide.ctaHref ? `<a class="portal-carousel__btn" href="${escapeAttr(slide.ctaHref)}"><span>${escapeHtml(slide.ctaText || "了解更多")}</span><i>→</i></a>` : ""}
      </div>
    </div>
  `).join("");

  // 5. 渲染圆点指示器
  if (dotsEl) {
    dotsEl.innerHTML = slides.map((_, idx) => `
      <button type="button" class="portal-carousel__dot ${idx === 0 ? "is-active" : ""}" data-dot-idx="${idx}" aria-label="第 ${idx + 1} 张"></button>
    `).join("");
  }

  currentPortalSlideIdx = 0;

  function goToSlide(newIdx) {
    if (newIdx < 0) newIdx = slides.length - 1;
    if (newIdx >= slides.length) newIdx = 0;
    currentPortalSlideIdx = newIdx;

    trackEl.querySelectorAll(".portal-carousel__slide").forEach((el, idx) => {
      el.classList.toggle("is-active", idx === currentPortalSlideIdx);
    });

    if (dotsEl) {
      dotsEl.querySelectorAll(".portal-carousel__dot").forEach((el, idx) => {
        el.classList.toggle("is-active", idx === currentPortalSlideIdx);
      });
    }
  }

  // 绑定左右箭头
  if (prevBtn) {
    prevBtn.onclick = () => {
      goToSlide(currentPortalSlideIdx - 1);
      resetTimer();
    };
  }
  if (nextBtn) {
    nextBtn.onclick = () => {
      goToSlide(currentPortalSlideIdx + 1);
      resetTimer();
    };
  }

  // 绑定指示圆点
  if (dotsEl) {
    dotsEl.querySelectorAll(".portal-carousel__dot").forEach(dot => {
      dot.onclick = () => {
        const idx = Number(dot.getAttribute("data-dot-idx"));
        goToSlide(idx);
        resetTimer();
      };
    });
  }

  // 自动循环播放 (5秒)
  function resetTimer() {
    if (portalCarouselTimer) clearInterval(portalCarouselTimer);
    if (slides.length > 1) {
      portalCarouselTimer = setInterval(() => {
        goToSlide(currentPortalSlideIdx + 1);
      }, 5000);
    }
  }

  carouselEl.onmouseenter = () => {
    if (portalCarouselTimer) clearInterval(portalCarouselTimer);
  };
  carouselEl.onmouseleave = () => {
    resetTimer();
  };

  resetTimer();
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

function escapeAttr(str) {
  return escapeHtml(str).replace(/`/g, "&#96;");
}

function getFallbackCatalog() {
  return {
    product: "天才猫软件中心",
    site: {
      homeHeroKicker: "TIANCAIMAO COMMAND CENTER",
      homeHeroTitle: "把直播运营与常用工具，收进更轻快的灵动桌面",
      homeHeroDescription: "专为 Windows 打造的灵动桌面与运营中枢。抽屉收纳、Alt快捷盲操、C盘无损搬家与治愈桌宠，开箱即用零依赖。",
      readyKicker: "Ready to Elevate Your Workflow?",
      readyTitle: "进入天才猫灵动生态",
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
        sortOrder: 0,
        tagline: "专为 Windows 打造的灵动桌面与运营中枢。抽屉收纳、Alt快捷盲操、C盘无损搬家与治愈桌宠，开箱即用零依赖。",
        description: "灵动抽屉式侧边收纳、C盘无损搬家管家、Alt快捷键矩阵与6款高定皮肤。"
      },
      {
        id: "dy-assistant",
        slug: "dy-assistant",
        name: "天才猫DY辅助工具",
        categoryId: "assistant",
        sortOrder: 1,
        tagline: "面向直播团队的自动化场控与互动辅助，全功能稳定交付。",
        description: "面向直播团队的自动化场控与互动辅助，全功能稳定交付。"
      },
      {
        id: "datacenter",
        slug: "datacenter",
        name: "数据中心版",
        categoryId: "data",
        sortOrder: 2,
        tagline: "多店铺订单与场控数据集中化监控，支持实时统计。",
        description: "多店铺订单与场控数据集中化监控，支持实时统计。"
      }
    ]
  };
}
