// 天才猫软件中心核心脚本 (software-center.js)
// 纯净语义化 DOM 操作 · 一次请求 /api/catalog · 仅重渲染列表区 · URL 状态同步 · 无 Tailwind 类名
(function () {
  "use strict";

  // 1. 兼容旧版参数：/download.html?app=xxx -> /software.html?slug=xxx
  const urlParams = new URLSearchParams(window.location.search);
  const legacyApp = urlParams.get("app");
  if (legacyApp) {
    window.location.replace("/software.html?slug=" + encodeURIComponent(legacyApp));
    return;
  }

  const $ = id => document.getElementById(id);
  const esc = val => String(val ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);

  const PLATFORM_MAP = {
    windows: { id: "windows", label: "Windows", icon: "monitor" },
    macos: { id: "macos", label: "macOS", icon: "apple" },
    portable: { id: "portable", label: "绿色版", icon: "package" },
    linux: { id: "linux", label: "Linux", icon: "terminal" },
    android: { id: "android", label: "Android", icon: "smartphone" },
    other: { id: "other", label: "其他", icon: "file-down" }
  };

  // 全局数据状态
  let catalog = null;
  let allSoftware = [];
  let featuredSoftware = [];
  let newArrivals = [];
  let activeRankTab = "downloads"; // 'downloads' | 'updates'

  // 过滤与排序状态
  let currentCategory = urlParams.get("cat") || "all";
  let currentPlatform = urlParams.get("platform") || "all";
  let currentSort = urlParams.get("sort") || "recommend";
  let currentQuery = urlParams.get("q") || "";
  let currentPageSize = 12;

  // 轮播状态
  let carouselIndex = 0;
  let carouselTimer = null;
  let isCarouselHovered = false;

  function safeIcons() {
    try {
      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
      }
    } catch (e) {
      console.warn("Lucide icon creation warning:", e);
    }
  }

  function formatBytes(bytes) {
    const num = Number(bytes);
    if (!num || num <= 0) return "";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(num) / Math.log(k));
    return (num / Math.pow(k, i)).toFixed(1) + " " + (sizes[i] || "MB");
  }

  function formatDate(ts) {
    if (!ts) return "-";
    const d = new Date(typeof ts === "number" ? ts : String(ts));
    if (isNaN(d.getTime())) return String(ts).slice(0, 10);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function formatRelativeTime(ts) {
    if (!ts) return "刚刚";
    const time = typeof ts === "number" ? ts : new Date(ts).getTime();
    if (isNaN(time)) return "近期";
    const diff = Math.max(0, Date.now() - time);
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const month = 30 * day;

    if (diff < 5 * minute) return "刚刚";
    if (diff < hour) return Math.floor(diff / minute) + " 分钟前";
    if (diff < day) return Math.floor(diff / hour) + " 小时前";
    if (diff < month) return Math.floor(diff / day) + " 天前";
    return Math.floor(diff / month) + " 个月前";
  }

  function isDownloadable(r) {
    return Boolean(
      r &&
      r.status === "published" &&
      (r.fileKey || r.publicUrl) &&
      r.version &&
      r.version !== "待上传"
    );
  }

  // 派生数据计算 (按 1.3 节规范)
  function processSoftware(raw) {
    const publishedReleases = (raw.releases || [])
      .filter(isDownloadable)
      .sort((a, b) => {
        const timeA = typeof a.createdAt === "number" ? a.createdAt : new Date(a.createdAt || 0).getTime();
        const timeB = typeof b.createdAt === "number" ? b.createdAt : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

    const latest = publishedReleases.find(r => r.isLatest) || publishedReleases[0] || null;
    const latestVersion = latest ? latest.version : "";
    const packages = publishedReleases.filter(r => r.version === latestVersion);
    const platforms = Array.from(new Set(publishedReleases.map(r => r.platform || "other")));
    const downloads = (raw.releases || []).reduce((sum, r) => sum + (Number(r.downloadCount) || 0), 0);

    const releaseTimes = publishedReleases.map(r => {
      return typeof r.createdAt === "number" ? r.createdAt : new Date(r.createdAt || 0).getTime();
    }).filter(t => !isNaN(t) && t > 0);

    const firstReleasedAt = releaseTimes.length ? Math.min(...releaseTimes) : (Number(raw.createdAt) || Date.now());
    const updatedAt = latest
      ? (typeof latest.createdAt === "number" ? latest.createdAt : new Date(latest.createdAt || 0).getTime())
      : (typeof raw.updatedAt === "number" ? raw.updatedAt : Date.now());

    return {
      ...raw,
      publishedReleases,
      latest,
      packages,
      platforms,
      downloads,
      firstReleasedAt,
      updatedAt
    };
  }

  // 同步 URL 参数（无刷新）
  function syncUrlParams() {
    const params = new URLSearchParams();
    if (currentCategory && currentCategory !== "all") params.set("cat", currentCategory);
    if (currentPlatform && currentPlatform !== "all") params.set("platform", currentPlatform);
    if (currentSort && currentSort !== "recommend") params.set("sort", currentSort);
    if (currentQuery) params.set("q", currentQuery);

    const newSearch = params.toString();
    const newUrl = window.location.pathname + (newSearch ? "?" + newSearch : "");
    window.history.replaceState(null, "", newUrl);
  }

  // 渲染头部轮播
  function renderHero() {
    const track = $("heroTrack");
    const dotsContainer = $("heroDots");
    const controls = $("heroControls");
    if (!track) return;

    if (!featuredSoftware.length) {
      track.innerHTML = `
        <div class="sc-hero__slide sc-hero__slide--active">
          <div class="sc-hero__info">
            <h1 class="sc-hero__title">天才猫软件中心</h1>
            <p class="sc-hero__desc">新一代数字化生产力与桌面效能工具矩阵。</p>
          </div>
        </div>
      `;
      if (controls) controls.style.display = "none";
      return;
    }

    track.innerHTML = featuredSoftware.map((s, idx) => {
      const activeCls = idx === carouselIndex ? "sc-hero__slide--active" : "";
      const latestVer = s.latest ? `v${esc(s.latest.version)}` : "v1.0.0";
      const catLabel = esc(s.category || "应用工具");
      const coverUrl = s.coverImage || (s.screenshots && s.screenshots[0]) || "";
      const iconUrl = s.icon || "/logo.png";
      const sizeText = s.latest && s.latest.size ? formatBytes(s.latest.size) : "纯净版";
      const dateText = formatDate(s.updatedAt);
      const primaryDlUrl = `/download/${encodeURIComponent(s.id)}`;
      const detailUrl = `/software.html?id=${encodeURIComponent(s.id)}`;

      return `
        <div class="sc-hero__slide ${activeCls}" data-slide-index="${idx}">
          <div class="sc-hero__info">
            <div class="sc-badge sc-badge--cyan" style="margin-bottom: 14px;">
              <span class="sc-badge--dot sc-badge--dot-pulse"></span>
              <span>${catLabel} · ${latestVer} 现已发布</span>
            </div>
            <h1 class="sc-hero__title">${esc(s.name)}</h1>
            <div class="sc-hero__tagline">${esc(s.tagline || "新一代效率桌面与数字化创作引擎")}</div>
            <p class="sc-hero__desc">${esc(s.description || "全平台高性能底层架构，极致流畅体验，即装即用零冗余。")}</p>
            <div class="sc-hero__cta-group">
              <a href="${primaryDlUrl}" class="sc-btn sc-btn--primary sc-btn-shimmer">
                <i data-lucide="download" style="width: 18px; height: 18px;"></i>
                <span>立即下载 ${esc(s.name)}</span>
              </a>
              <a href="${detailUrl}" class="sc-btn sc-btn--ghost">
                <i data-lucide="info" style="width: 16px; height: 16px;"></i>
                <span>了解详情</span>
              </a>
            </div>
            <div class="sc-hero__meta">
              <span class="sc-hero__meta-item">
                <i data-lucide="check-circle" style="width: 14px; height: 14px; color: var(--sc-emerald);"></i>
                <span>${sizeText}</span>
              </span>
              <span>·</span>
              <span class="sc-hero__meta-item">
                <i data-lucide="download" style="width: 14px; height: 14px;"></i>
                <span>${s.downloads.toLocaleString()} 次下载</span>
              </span>
              <span>·</span>
              <span class="sc-hero__meta-item">
                <i data-lucide="calendar" style="width: 14px; height: 14px;"></i>
                <span>更新于 ${dateText}</span>
              </span>
            </div>
          </div>
          <div class="sc-hero__visual">
            <div class="sc-mockup-3d-window sc-glass sc-spotlight">
              <div class="sc-mockup__bar">
                <div class="sc-mockup__dots">
                  <span class="sc-mockup__dot sc-mockup__dot--red"></span>
                  <span class="sc-mockup__dot sc-mockup__dot--yellow"></span>
                  <span class="sc-mockup__dot sc-mockup__dot--green"></span>
                </div>
                <span class="sc-mockup__badge">${esc(s.slug || s.name)} · 官方发布版</span>
                <div style="display: flex; gap: 6px; color: var(--sc-text-dim);">
                  <i data-lucide="sparkles" style="width: 13px; height: 13px;"></i>
                </div>
              </div>
              <div class="sc-mockup__body">
                ${coverUrl ? `
                  <img src="${esc(coverUrl)}" alt="${esc(s.name)} 预览" class="sc-mockup__img" loading="lazy" />
                ` : `
                  <div class="sc-mockup__fallback">
                    <img src="${esc(iconUrl)}" alt="${esc(s.name)}" class="sc-mockup__fallback-icon" />
                    <span style="font-size: 13px; font-weight: 600; color: #ffffff;">${esc(s.name)}</span>
                  </div>
                `}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    // 轮播圆点与控制器显示
    if (controls) {
      if (featuredSoftware.length > 1) {
        controls.style.display = "flex";
        if (dotsContainer) {
          dotsContainer.innerHTML = featuredSoftware.map((_, i) => `
            <button type="button" class="sc-hero__dot ${i === carouselIndex ? "sc-hero__dot--active" : ""}" data-dot-index="${i}" aria-label="第 ${i + 1} 页"></button>
          `).join("");
        }
      } else {
        controls.style.display = "none";
      }
    }

    safeIcons();
  }

  function setCarouselIndex(newIndex) {
    if (!featuredSoftware.length) return;
    const count = featuredSoftware.length;
    carouselIndex = (newIndex + count) % count;

    const slides = document.querySelectorAll(".sc-hero__slide");
    slides.forEach((slide, i) => {
      if (i === carouselIndex) {
        slide.classList.add("sc-hero__slide--active");
      } else {
        slide.classList.remove("sc-hero__slide--active");
      }
    });

    const dots = document.querySelectorAll(".sc-hero__dot");
    dots.forEach((dot, i) => {
      if (i === carouselIndex) {
        dot.classList.add("sc-hero__dot--active");
      } else {
        dot.classList.remove("sc-hero__dot--active");
      }
    });
  }

  function startCarouselTimer() {
    stopCarouselTimer();
    if (featuredSoftware.length <= 1) return;
    // 尊重 prefers-reduced-motion
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    carouselTimer = setInterval(() => {
      if (!isCarouselHovered) {
        setCarouselIndex(carouselIndex + 1);
      }
    }, 6000);
  }

  function stopCarouselTimer() {
    if (carouselTimer) {
      clearInterval(carouselTimer);
      carouselTimer = null;
    }
  }

  // 渲染统计数据
  function renderStats() {
    const swCount = $("statSoftwareCount");
    const dlCount = $("statDownloadCount");
    const upCount = $("statUpdateCount");
    const pfCount = $("statPlatformCount");

    if (swCount) swCount.textContent = allSoftware.length.toString();

    const totalDownloads = allSoftware.reduce((sum, s) => sum + s.downloads, 0);
    if (dlCount) {
      dlCount.textContent = totalDownloads > 10000
        ? (totalDownloads / 10000).toFixed(1) + " 万+"
        : totalDownloads.toLocaleString();
    }

    // 本月更新数
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const thisMonthUpdates = allSoftware.filter(s => {
      if (!s.updatedAt) return false;
      const d = new Date(s.updatedAt);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }).length;
    if (upCount) upCount.textContent = Math.max(1, thisMonthUpdates).toString();

    // 支持平台数
    const uniquePlatforms = new Set();
    allSoftware.forEach(s => s.platforms.forEach(p => uniquePlatforms.add(p)));
    if (pfCount) pfCount.textContent = Math.max(4, uniquePlatforms.size).toString();
  }

  // 渲染分类胶囊
  function renderCategories() {
    const container = $("categoryChips");
    if (!container) return;

    const catCounts = { all: allSoftware.length };
    allSoftware.forEach(s => {
      const c = s.category || "应用工具";
      catCounts[c] = (catCounts[c] || 0) + 1;
    });

    const categories = Object.keys(catCounts).filter(c => c !== "all");

    let html = `
      <button type="button" class="sc-chip ${currentCategory === "all" ? "sc-chip--active" : ""}" data-cat="all">
        <span>全部软件</span>
        <span class="sc-chip__count">${allSoftware.length}</span>
      </button>
    `;

    categories.forEach(cat => {
      const active = currentCategory === cat ? "sc-chip--active" : "";
      html += `
        <button type="button" class="sc-chip ${active}" data-cat="${esc(cat)}">
          <span>${esc(cat)}</span>
          <span class="sc-chip__count">${catCounts[cat]}</span>
        </button>
      `;
    });

    container.innerHTML = html;
  }

  // 渲染新品卡片横滑行
  function renderNewArrivals() {
    const track = $("newArrivalsTrack");
    if (!track) return;

    if (!newArrivals.length) {
      const section = $("newArrivalsSection");
      if (section) section.style.display = "none";
      return;
    }

    track.innerHTML = newArrivals.map(s => {
      const iconUrl = s.icon || "/logo.png";
      const verText = s.latest ? `v${esc(s.latest.version)}` : "v1.0.0";
      const dateText = formatDate(s.firstReleasedAt || s.updatedAt);
      const dlUrl = `/download/${encodeURIComponent(s.id)}`;

      return `
        <div class="sc-card--new sc-glass sc-glass--hover sc-spotlight">
          <span class="sc-card__new-corner">NEW</span>
          <div>
            <div class="sc-card--new__top">
              <img src="${esc(iconUrl)}" alt="${esc(s.name)}" class="sc-card--new__icon" loading="lazy" />
              <div>
                <h3 class="sc-card--new__name">${esc(s.name)}</h3>
                <span class="sc-badge sc-badge--cyan" style="font-size: 11px; padding: 2px 8px;">${verText}</span>
              </div>
            </div>
            <p class="sc-card--new__tagline">${esc(s.tagline || "新发布数字化创作与效能工具")}</p>
          </div>
          <div>
            <div class="sc-card--new__meta">
              <span>上线: ${dateText}</span>
              <span>${s.downloads.toLocaleString()} 次下载</span>
            </div>
            <a href="${dlUrl}" class="sc-btn sc-btn--primary sc-btn--sm sc-btn-shimmer" style="width: 100%;">
              <i data-lucide="download" style="width: 14px; height: 14px;"></i>
              <span>立即下载</span>
            </a>
          </div>
        </div>
      `;
    }).join("");

    safeIcons();
  }

  // 核心：筛选与排序计算
  function getFilteredSoftware() {
    let list = allSoftware.slice();

    // 1. 分类筛选
    if (currentCategory && currentCategory !== "all") {
      list = list.filter(s => (s.category || "应用工具") === currentCategory);
    }

    // 2. 平台分段筛选
    if (currentPlatform && currentPlatform !== "all") {
      list = list.filter(s => s.platforms.includes(currentPlatform));
    }

    // 3. 关键词搜索
    if (currentQuery.trim()) {
      const q = currentQuery.trim().toLowerCase();
      list = list.filter(s => {
        return (
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.tagline && s.tagline.toLowerCase().includes(q)) ||
          (s.description && s.description.toLowerCase().includes(q)) ||
          (s.category && s.category.toLowerCase().includes(q)) ||
          (s.slug && s.slug.toLowerCase().includes(q))
        );
      });
    }

    // 4. 排序规则
    if (currentSort === "updated") {
      list.sort((a, b) => b.updatedAt - a.updatedAt);
    } else if (currentSort === "downloads") {
      list.sort((a, b) => b.downloads - a.downloads);
    } else if (currentSort === "name") {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || "", "zh-CN"));
    } else {
      // recommend: 主推优先，其次下载量，再次更新时间
      list.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        if (a.featured && b.featured) {
          const ordA = a.featuredOrder ?? 999;
          const ordB = b.featuredOrder ?? 999;
          if (ordA !== ordB) return ordA - ordB;
        }
        if (b.downloads !== a.downloads) return b.downloads - a.downloads;
        return b.updatedAt - a.updatedAt;
      });
    }

    return list;
  }

  // 渲染全部软件网格 (仅重渲染列表区，满足性能与 <100ms 约束)
  function renderSoftwareGrid() {
    const grid = $("softwareGrid");
    const countLabel = $("listResultCount");
    const loadMoreWrap = $("loadMoreWrap");
    if (!grid) return;

    const filtered = getFilteredSoftware();

    if (countLabel) {
      countLabel.textContent = `共 ${filtered.length} 款应用`;
    }

    if (!filtered.length) {
      grid.innerHTML = `
        <div class="sc-empty sc-glass">
          <i data-lucide="package-search" class="sc-empty__icon"></i>
          <h3 class="sc-empty__title">未找到匹配的软件</h3>
          <p class="sc-empty__desc">尝试清除搜索条件或选择其他分类平台查看</p>
          <button type="button" class="sc-btn sc-btn--ghost sc-btn--sm" id="resetFilterBtn">
            <i data-lucide="rotate-ccw" style="width: 14px; height: 14px;"></i>
            <span>清除所有筛选条件</span>
          </button>
        </div>
      `;
      if (loadMoreWrap) loadMoreWrap.style.display = "none";
      safeIcons();

      const resetBtn = $("resetFilterBtn");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          currentCategory = "all";
          currentPlatform = "all";
          currentQuery = "";
          const sInput = $("searchInput");
          if (sInput) sInput.value = "";
          renderCategories();
          updateSegmentActive();
          syncUrlParams();
          renderSoftwareGrid();
        });
      }
      return;
    }

    const visibleItems = filtered.slice(0, currentPageSize);

    grid.innerHTML = visibleItems.map(s => {
      const coverUrl = s.coverImage || (s.screenshots && s.screenshots[0]) || "";
      const iconUrl = s.icon || "/logo.png";
      const verText = s.latest ? `v${esc(s.latest.version)}` : "v1.0.0";
      const sizeText = s.latest && s.latest.size ? formatBytes(s.latest.size) : "";
      const priceText = s.priceType === "paid" ? "付费正版" : (s.priceType === "freemium" ? "免费增值" : "官方免费");
      const dlUrl = `/download/${encodeURIComponent(s.id)}`;
      const detailUrl = `/software.html?id=${encodeURIComponent(s.id)}`;

      // 平台图标组
      const platformIconsHtml = (s.platforms || ["windows"]).map(p => {
        const info = PLATFORM_MAP[p] || PLATFORM_MAP.other;
        return `<i data-lucide="${info.icon}" class="sc-card__platform-icon" title="${info.label}"></i>`;
      }).join("");

      return `
        <article class="sc-card sc-glass sc-glass--hover sc-spotlight">
          <!-- 16:9 封面容器 -->
          <div class="sc-card__cover-wrap">
            ${coverUrl ? `
              <img src="${esc(coverUrl)}" alt="${esc(s.name)} 封面" class="sc-card__cover" loading="lazy" />
            ` : `
              <div class="sc-card__cover-fallback">
                <img src="${esc(iconUrl)}" alt="${esc(s.name)}" class="sc-card__cover-fallback-icon" />
              </div>
            `}
            <img src="${esc(iconUrl)}" alt="${esc(s.name)}" class="sc-card__icon-floating" loading="lazy" />
          </div>

          <!-- 卡片内容体 -->
          <div class="sc-card__body">
            <div class="sc-card__header">
              <h3 class="sc-card__name">${esc(s.name)}</h3>
              <span class="sc-badge ${s.priceType === "paid" ? "sc-badge--cyan" : "sc-badge--emerald"}" style="font-size: 11px;">
                ${priceText}
              </span>
            </div>
            <p class="sc-card__tagline">${esc(s.tagline || "官方正版桌面生产力工具")}</p>

            <div class="sc-card__platforms">
              ${platformIconsHtml}
            </div>

            <div class="sc-card__meta-bar">
              <span>${verText}${sizeText ? " · " + sizeText : ""}</span>
              <span><i data-lucide="download" style="width: 12px; height: 12px; display: inline-block; vertical-align: -1px;"></i> ${s.downloads.toLocaleString()}</span>
            </div>

            <div class="sc-card__actions">
              <a href="${dlUrl}" class="sc-btn sc-btn--primary sc-btn--sm sc-btn-shimmer">
                <i data-lucide="download" style="width: 14px; height: 14px;"></i>
                <span>立即下载</span>
              </a>
              <a href="${detailUrl}" class="sc-btn sc-btn--ghost sc-btn--sm">
                <span>详情</span>
              </a>
            </div>
          </div>
        </article>
      `;
    }).join("");

    if (loadMoreWrap) {
      if (filtered.length > currentPageSize) {
        loadMoreWrap.style.display = "flex";
      } else {
        loadMoreWrap.style.display = "none";
      }
    }

    safeIcons();
  }

  // 渲染右侧排行榜
  function renderRankings() {
    const listContainer = $("rankList");
    if (!listContainer) return;

    let rankList = allSoftware.slice();
    if (activeRankTab === "downloads") {
      rankList.sort((a, b) => b.downloads - a.downloads);
    } else {
      rankList.sort((a, b) => b.updatedAt - a.updatedAt);
    }

    const top10 = rankList.slice(0, 10);

    listContainer.innerHTML = top10.map((s, idx) => {
      const rankNum = idx + 1;
      const numCls = rankNum <= 3 ? `sc-rank__num--top${rankNum}` : "";
      const iconUrl = s.icon || "/logo.png";
      const subInfo = activeRankTab === "downloads"
        ? `${s.downloads.toLocaleString()} 次下载`
        : `更新于 ${formatDate(s.updatedAt)}`;
      const dlUrl = `/download/${encodeURIComponent(s.id)}`;
      const detailUrl = `/software.html?id=${encodeURIComponent(s.id)}`;

      return `
        <div class="sc-rank__item">
          <div class="sc-rank__num ${numCls}">${rankNum}</div>
          <a href="${detailUrl}">
            <img src="${esc(iconUrl)}" alt="${esc(s.name)}" class="sc-rank__icon" loading="lazy" />
          </a>
          <div class="sc-rank__info">
            <a href="${detailUrl}" class="sc-rank__name">${esc(s.name)}</a>
            <div class="sc-rank__sub">${subInfo}</div>
          </div>
          <a href="${dlUrl}" class="sc-rank__quick-download" title="极速下载 ${esc(s.name)}">
            <i data-lucide="download" style="width: 14px; height: 14px;"></i>
          </a>
        </div>
      `;
    }).join("");

    safeIcons();
  }

  // 渲染最近更新 (5 条)
  function renderRecentUpdates() {
    const container = $("recentList");
    if (!container) return;

    const sortedByUpdate = allSoftware.slice().sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);

    container.innerHTML = sortedByUpdate.map(s => {
      const verText = s.latest ? `v${esc(s.latest.version)}` : "v1.0.0";
      const relTime = formatRelativeTime(s.updatedAt);
      const mainPlat = s.platforms[0] || "windows";
      const platLabel = (PLATFORM_MAP[mainPlat] || PLATFORM_MAP.other).label;
      const detailUrl = `/software.html?id=${encodeURIComponent(s.id)}`;

      return `
        <div class="sc-recent__item">
          <div class="sc-recent__top">
            <a href="${detailUrl}" class="sc-recent__name">${esc(s.name)}</a>
            <span class="sc-recent__time">${relTime}</span>
          </div>
          <div class="sc-recent__sub">
            <span class="sc-badge sc-badge--cyan" style="font-size: 10.5px; padding: 1px 6px;">${verText}</span>
            <span>${platLabel}</span>
          </div>
        </div>
      `;
    }).join("");

    safeIcons();
  }

  // 更新分段控件选中态
  function updateSegmentActive() {
    const buttons = document.querySelectorAll(".sc-segment__btn");
    buttons.forEach(btn => {
      if (btn.getAttribute("data-platform") === currentPlatform) {
        btn.classList.add("sc-segment__btn--active");
      } else {
        btn.classList.remove("sc-segment__btn--active");
      }
    });
  }

  // 绑定交互事件
  let hasBoundEvents = false;
  function bindEvents() {
    if (hasBoundEvents) return;
    hasBoundEvents = true;

    // 1. 聚光灯鼠标跟踪
    document.addEventListener("mousemove", e => {
      const target = e.target.closest(".sc-spotlight");
      if (target) {
        const rect = target.getBoundingClientRect();
        target.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
        target.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
      }
    });

    // 2. 轮播控制器事件
    const heroPrev = $("heroPrevBtn");
    const heroNext = $("heroNextBtn");
    const heroBox = $("heroCarousel");

    if (heroPrev) heroPrev.addEventListener("click", () => setCarouselIndex(carouselIndex - 1));
    if (heroNext) heroNext.addEventListener("click", () => setCarouselIndex(carouselIndex + 1));

    if (heroBox) {
      heroBox.addEventListener("mouseenter", () => { isCarouselHovered = true; });
      heroBox.addEventListener("mouseleave", () => { isCarouselHovered = false; });
    }

    const dotsContainer = $("heroDots");
    if (dotsContainer) {
      dotsContainer.addEventListener("click", e => {
        const dot = e.target.closest(".sc-hero__dot");
        if (dot) {
          const idx = parseInt(dot.getAttribute("data-dot-index"), 10);
          if (!isNaN(idx)) setCarouselIndex(idx);
        }
      });
    }

    // 键盘左右切换轮播
    window.addEventListener("keydown", e => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowLeft") setCarouselIndex(carouselIndex - 1);
      if (e.key === "ArrowRight") setCarouselIndex(carouselIndex + 1);
    });

    // 触屏滑动轮播
    let touchStartX = 0;
    if (heroBox) {
      heroBox.addEventListener("touchstart", e => {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });
      heroBox.addEventListener("touchend", e => {
        const diffX = e.changedTouches[0].clientX - touchStartX;
        if (diffX > 50) setCarouselIndex(carouselIndex - 1);
        else if (diffX < -50) setCarouselIndex(carouselIndex + 1);
      }, { passive: true });
    }

    // 3. 分类胶囊点击
    const chipsBox = $("categoryChips");
    if (chipsBox) {
      chipsBox.addEventListener("click", e => {
        const chip = e.target.closest(".sc-chip");
        if (chip) {
          const cat = chip.getAttribute("data-cat");
          if (cat) {
            currentCategory = cat;
            currentPageSize = 12;
            renderCategories();
            syncUrlParams();
            renderSoftwareGrid();
          }
        }
      });
    }

    // 4. 平台分段控件点击
    const segBox = $("platformSegment");
    if (segBox) {
      segBox.addEventListener("click", e => {
        const btn = e.target.closest(".sc-segment__btn");
        if (btn) {
          const plat = btn.getAttribute("data-platform");
          if (plat) {
            currentPlatform = plat;
            currentPageSize = 12;
            updateSegmentActive();
            syncUrlParams();
            renderSoftwareGrid();
          }
        }
      });
    }

    // 5. 排序选择切换
    const sortSel = $("sortSelect");
    if (sortSel) {
      sortSel.value = currentSort;
      sortSel.addEventListener("change", e => {
        currentSort = e.target.value;
        currentPageSize = 12;
        syncUrlParams();
        renderSoftwareGrid();
      });
    }

    // 6. 搜索输入与清除
    const searchInput = $("searchInput");
    const clearBtn = $("searchClearBtn");
    let searchDebounce = null;

    if (searchInput) {
      searchInput.value = currentQuery;
      if (currentQuery && clearBtn) clearBtn.style.display = "block";

      searchInput.addEventListener("input", e => {
        currentQuery = e.target.value;
        if (clearBtn) clearBtn.style.display = currentQuery ? "block" : "none";
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
          currentPageSize = 12;
          syncUrlParams();
          renderSoftwareGrid();
        }, 200);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        currentQuery = "";
        if (searchInput) searchInput.value = "";
        clearBtn.style.display = "none";
        currentPageSize = 12;
        syncUrlParams();
        renderSoftwareGrid();
      });
    }

    // 顶部搜索按钮聚焦搜索框
    const navSearchTrigger = $("navSearchTrigger");
    if (navSearchTrigger && searchInput) {
      navSearchTrigger.addEventListener("click", () => {
        searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => searchInput.focus(), 300);
      });
    }

    // 7. 新品卡片横滑按钮
    const newPrev = $("newTrackPrev");
    const newNext = $("newTrackNext");
    const newTrack = $("newArrivalsTrack");
    if (newPrev && newTrack) {
      newPrev.addEventListener("click", () => {
        newTrack.scrollBy({ left: -300, behavior: "smooth" });
      });
    }
    if (newNext && newTrack) {
      newNext.addEventListener("click", () => {
        newTrack.scrollBy({ left: 300, behavior: "smooth" });
      });
    }

    // 8. 加载更多按钮
    const loadMoreBtn = $("loadMoreBtn");
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", () => {
        currentPageSize += 12;
        renderSoftwareGrid();
      });
    }

    // 9. 排行榜 Tab 切换
    const rankTabDl = $("rankTabDownloads");
    const rankTabUp = $("rankTabUpdates");
    if (rankTabDl) {
      rankTabDl.addEventListener("click", () => {
        activeRankTab = "downloads";
        rankTabDl.classList.add("sc-rank__tab--active");
        if (rankTabUp) rankTabUp.classList.remove("sc-rank__tab--active");
        renderRankings();
      });
    }
    if (rankTabUp) {
      rankTabUp.addEventListener("click", () => {
        activeRankTab = "updates";
        rankTabUp.classList.add("sc-rank__tab--active");
        if (rankTabDl) rankTabDl.classList.remove("sc-rank__tab--active");
        renderRankings();
      });
    }
  }

  const CACHE_KEY = "software_center_catalog_cache_v3";

  function getFallbackCatalog() {
    return {
      product: "天才猫软件中心",
      site: {
        homeHeroKicker: "TIANCAIMAO COMMAND CENTER",
        homeHeroTitle: "把直播运营与常用工具，收进更轻快的灵动桌面",
        homeHeroDescription: "专为 Windows 打造的灵动桌面与运营中枢。抽屉收纳、Alt快捷盲操、C盘无损搬家与治愈桌宠，开箱即用零依赖。",
        footerWordmark: "NSY"
      },
      categories: [
        { id: "desktop", name: "桌面效能", slug: "desktop", sortOrder: 5, status: "active" },
        { id: "assistant", name: "直播辅助", slug: "assistant", sortOrder: 20, status: "active" },
        { id: "data", name: "数据中心", slug: "data", sortOrder: 10, status: "active" },
        { id: "tools", name: "工具插件", slug: "tools", sortOrder: 30, status: "active" }
      ],
      software: [
        {
          id: "desktop",
          slug: "desktop",
          name: "天才猫桌面 2.0",
          categoryId: "desktop",
          category: "桌面效能",
          tagline: "新一代效率桌面与数字化创作引擎",
          description: "灵动抽屉式侧边收纳、C盘无损搬家管家、顶部偷看Dock与离线多语 OCR 翻译。",
          coverImage: "/preview-desktop-widgets.png",
          icon: "/logo.png",
          priceLabel: "免费版",
          featured: true,
          featuredOrder: 0,
          status: "active",
          createdAt: Date.now() - 5 * 86400000,
          updatedAt: Date.now() - 86400000,
          releases: [
            {
              id: "rel-desktop-v200",
              version: "2.0.0",
              platform: "windows",
              status: "published",
              isLatest: true,
              size: "85.2 MB",
              fileSize: 89338675,
              downloadCount: 128,
              publicUrl: "/download/latest/desktop",
              createdAt: Date.now() - 86400000
            }
          ]
        }
      ]
    };
  }

  function applyCatalog(data) {
    if (!data || !Array.isArray(data.software)) return;
    catalog = data;

    // 过滤上架软件并计算派生字段
    allSoftware = (catalog.software || [])
      .filter(s => (s.status || "active") === "active")
      .map(processSoftware);

    // 主推软件计算：featured === true，按 featuredOrder 升序；没有则用下载量第一的软件
    featuredSoftware = allSoftware.filter(s => s.featured === true);
    if (!featuredSoftware.length) {
      const topDl = allSoftware.slice().sort((a, b) => b.downloads - a.downloads)[0];
      if (topDl) featuredSoftware = [topDl];
    } else {
      featuredSoftware.sort((a, b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999));
    }

    // 新品计算：firstReleasedAt 在 30 天内；不足 4 个时按 firstReleasedAt 倒序补足到 4–8 个
    const thirtyDaysAgo = Date.now() - 30 * 24 * 3600 * 1000;
    const recentReleased = allSoftware.filter(s => s.firstReleasedAt >= thirtyDaysAgo);
    if (recentReleased.length >= 4) {
      newArrivals = recentReleased.sort((a, b) => b.firstReleasedAt - a.firstReleasedAt).slice(0, 8);
    } else {
      newArrivals = allSoftware.slice().sort((a, b) => b.firstReleasedAt - a.firstReleasedAt).slice(0, 6);
    }

    // 渲染各区块
    renderHero();
    startCarouselTimer();
    renderStats();
    renderCategories();
    updateSegmentActive();
    renderNewArrivals();
    renderSoftwareGrid();
    renderRankings();
    renderRecentUpdates();
    bindEvents();
    safeIcons();
  }

  // 初始化入口 (SWR 毫秒级秒开：本地缓存立即渲染 -> 后台异步静默同步)
  async function init() {
    let hasRendered = false;

    // 1. 同步秒开：读取本地缓存（0 毫秒渲染，消除骨架屏闪烁与加载停顿）
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached && Array.isArray(cached.software) && cached.software.length) {
          applyCatalog(cached);
          hasRendered = true;
        }
      }
    } catch (e) {
      console.warn("读取 catalog 缓存失败:", e);
    }

    // 2. 异步网络刷新：拉取最新数据（超时 5 秒兜底）
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch("/api/catalog", { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const remoteData = await res.json();
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(remoteData));
        } catch (e) {}
        applyCatalog(remoteData);
        return;
      }
    } catch (err) {
      console.warn("网络拉取 catalog 失败/超时:", err);
    }

    // 3. 兜底保护：若本地无缓存且网络失败，使用内置兜底，绝对不让骨架屏无限循环
    if (!hasRendered) {
      applyCatalog(getFallbackCatalog());
    }
  }

  // 页面就绪后启动
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
