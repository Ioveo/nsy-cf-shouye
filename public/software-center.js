// 天才猫软件中心列表页核心逻辑 (download.html)
// 数据全部对接后台 /api/catalog 动态生成，支持主推轮播、平台分段筛选、多维排序、搜索与 Top 10 下载榜
(function () {
  // 1. 兼容旧版链接：/download.html?app=xxx -> /software.html?slug=xxx
  const urlParams = new URLSearchParams(location.search);
  const legacyApp = urlParams.get("app");
  if (legacyApp) {
    location.replace("/software.html?slug=" + encodeURIComponent(legacyApp));
    return;
  }

  const $ = id => document.getElementById(id);
  const esc = val => String(val ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);

  const PLATFORMS = {
    windows: { id: "windows", label: "Windows", icon: "monitor" },
    portable: { id: "portable", label: "绿色便携", icon: "package" },
    macos: { id: "macos", label: "macOS", icon: "apple" },
    linux: { id: "linux", label: "Linux", icon: "terminal" },
    android: { id: "android", label: "Android", icon: "smartphone" },
    other: { id: "other", label: "其他", icon: "file-down" }
  };
  const PLATFORM_ORDER = ["windows", "macos", "portable", "linux", "android", "other"];

  let catalog = null;
  let allSoftware = [];
  let availablePlatforms = [];
  let carouselItems = [];
  let currentCarouselIndex = 0;
  let carouselTimer = null;

  // 状态
  let currentPlatform = urlParams.get("platform") || "all";
  let currentCategory = urlParams.get("cat") || "all";
  let currentSort = urlParams.get("sort") || "recommend";
  let currentQuery = urlParams.get("q") || "";

  function safeIcons() {
    try { window.lucide?.createIcons(); } catch {}
  }

  function formatDate(ts) {
    if (!ts) return "-";
    const d = new Date(Number(ts));
    if (isNaN(d.getTime())) return String(ts).slice(0, 10);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return "";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
  }

  function prepareSoftware(raw) {
    const publishedReleases = (raw.releases || [])
      .filter(r => r && r.status === "published" && (r.fileKey || r.publicUrl) && r.version && r.version !== "待上传")
      .sort((a, b) => {
        const timeA = typeof a.createdAt === "number" ? a.createdAt : new Date(a.createdAt || 0).getTime();
        const timeB = typeof b.createdAt === "number" ? b.createdAt : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

    const latest = publishedReleases.find(r => r.isLatest) || publishedReleases[0] || null;
    const platforms = Array.from(new Set(publishedReleases.map(r => r.platform || "other")));
    const totalDownloads = publishedReleases.reduce((sum, r) => sum + (Number(r.downloadCount) || 0), 0);

    const latestTimestamp = latest
      ? (typeof latest.createdAt === "number" ? latest.createdAt : new Date(latest.createdAt || 0).getTime())
      : (typeof raw.updatedAt === "number" ? raw.updatedAt : 0);

    return {
      ...raw,
      releases: publishedReleases,
      latest,
      platforms,
      totalDownloads,
      latestTimestamp,
    };
  }

  async function init() {
    try {
      const res = await fetch("/api/catalog", { cache: "no-store" });
      if (!res.ok) throw new Error("加载目录失败");
      catalog = await res.json();
    } catch (err) {
      const grid = $("softwareGrid");
      if (grid) grid.innerHTML = `<div class="col-span-full py-16 text-center text-slate-400">软件目录加载异常，请刷新重试。</div>`;
      return;
    }

    // 过滤上架软件并预处理
    allSoftware = (catalog.software || [])
      .filter(s => (s.status || "active") === "active")
      .map(prepareSoftware);

    // 计算实际存在的平台
    const pSet = new Set();
    allSoftware.forEach(s => s.platforms.forEach(p => pSet.add(p)));
    availablePlatforms = PLATFORM_ORDER.filter(p => pSet.has(p));

    // 如果 URL 记录的平台已经不存在，则回退到 all
    if (currentPlatform !== "all" && !pSet.has(currentPlatform)) {
      currentPlatform = "all";
    }

    renderFeaturedCarousel();
    renderFilterBar();
    applyFiltersAndRender();
    renderSidebarRankings();

    // 绑定搜索与排序事件
    bindFilterEvents();
  }

  // 1. 主推轮播 (Featured Carousel)
  function renderFeaturedCarousel() {
    const sec = $("featuredCarouselSection");
    if (!sec) return;

    carouselItems = allSoftware
      .filter(s => s.featured === true || s.featured === "true" || s.featured === "1")
      .sort((a, b) => (Number(a.featuredOrder) || 0) - (Number(b.featuredOrder) || 0))
      .slice(0, 5);

    if (carouselItems.length === 0) {
      sec.classList.add("hidden");
      return;
    }
    sec.classList.remove("hidden");

    const track = $("carouselTrack");
    const dotsBox = $("carouselDots");
    if (!track) return;

    track.innerHTML = carouselItems.map((s, idx) => {
      const cover = s.coverUrl || (s.screenshots && s.screenshots[0]) || "";
      const cat = (catalog.categories || []).find(c => c.id === s.categoryId)?.name || "官方精选";
      const detailHref = s.landingUrl || `/software.html?slug=${encodeURIComponent(s.slug || s.id)}`;
      const downloadHref = s.latest ? `/download/${encodeURIComponent(s.latest.id)}` : detailHref;

      const platformIcons = s.platforms.map(p => {
        const item = PLATFORMS[p] || PLATFORMS.other;
        return `<span class="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white/[0.08] text-slate-300 border border-white/[0.1]">
          <i data-lucide="${item.icon}" class="w-3.5 h-3.5"></i>
          <span>${item.label}</span>
        </span>`;
      }).join("");

      return `
        <div class="carousel-slide w-full shrink-0 transition-opacity duration-700 ${idx === 0 ? 'opacity-100 relative z-10' : 'opacity-0 absolute inset-0 pointer-events-none'}" data-slide="${idx}">
          <div class="glass-card rounded-3xl overflow-hidden border border-white/[0.12] shadow-2xl grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
            <div class="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <div class="flex flex-wrap items-center gap-2.5 mb-4">
                  <span class="px-3 py-1 rounded-full text-xs font-semibold bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse"></span>
                    <span>精选主推</span>
                  </span>
                  <span class="px-2.5 py-1 rounded-full text-xs text-slate-400 bg-white/[0.04] border border-white/[0.08]">${esc(cat)}</span>
                  <span class="px-2.5 py-1 rounded-full text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 font-medium">${esc(s.priceLabel || "免费")}</span>
                </div>
                <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">${esc(s.name)}</h2>
                <p class="text-slate-300 text-sm sm:text-base leading-relaxed line-clamp-3 mb-6">${esc(s.tagline || s.description || "体验极速效能与现代灵动设计。")}</p>
                <div class="flex flex-wrap items-center gap-2 mb-6">
                  ${platformIcons}
                  ${s.latest ? `<span class="text-xs font-mono text-slate-400 ml-2">v${esc(s.latest.version)} (${esc(s.latest.size || formatBytes(s.latest.fileSize))})</span>` : ""}
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-4 pt-4 border-t border-white/[0.08]">
                ${s.latest ? `
                  <a href="${downloadHref}" class="btn-shimmer h-[50px] px-8 rounded-xl bg-gradient-to-r from-accent-cyan to-[#06B6D4] text-[#04101A] font-bold text-sm flex items-center gap-2.5 shadow-[0_0_30px_rgba(0,242,254,0.35)] hover:-translate-y-0.5 transition-transform">
                    <i data-lucide="download" class="w-4 h-4"></i>
                    <span>立即下载</span>
                  </a>
                ` : `
                  <a href="${detailHref}" class="btn-shimmer h-[50px] px-8 rounded-xl bg-gradient-to-r from-accent-cyan to-[#06B6D4] text-[#04101A] font-bold text-sm flex items-center gap-2.5 shadow-[0_0_30px_rgba(0,242,254,0.35)] hover:-translate-y-0.5 transition-transform">
                    <span>了解详情</span>
                  </a>
                `}
                <a href="${detailHref}" class="h-[50px] px-6 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.14] text-white font-semibold text-sm flex items-center gap-2 transition-all">
                  <span>查看详情</span>
                  <i data-lucide="arrow-right" class="w-4 h-4 text-slate-400"></i>
                </a>
              </div>
            </div>

            <div class="lg:col-span-5 bg-gradient-to-br from-white/[0.04] to-transparent relative min-h-[240px] flex items-center justify-center p-6 overflow-hidden">
              ${cover ? `
                <img src="${esc(cover)}" alt="${esc(s.name)}" class="w-full h-full max-h-[340px] object-cover rounded-2xl border border-white/[0.1] shadow-2xl transition-transform duration-700 hover:scale-[1.02]" />
              ` : `
                <div class="flex flex-col items-center justify-center text-slate-500 gap-3">
                  <i data-lucide="sparkles" class="w-16 h-16 text-accent-cyan/40"></i>
                  <span class="text-xs tracking-widest text-slate-400 font-mono">TIANCAIMAO FLAGSHIP</span>
                </div>
              `}
            </div>
          </div>
        </div>
      `;
    }).join("");

    if (dotsBox) {
      dotsBox.innerHTML = carouselItems.map((_, i) =>
        `<button type="button" data-dot="${i}" class="carousel-dot transition-all duration-300 rounded-full ${i === 0 ? 'w-8 h-2 bg-accent-cyan' : 'w-2 h-2 bg-white/20 hover:bg-white/40'}" aria-label="Slide ${i+1}"></button>`
      ).join("");
    }

    setupCarouselControls();
    safeIcons();
  }

  function setupCarouselControls() {
    const prevBtn = $("carouselPrev");
    const nextBtn = $("carouselNext");
    const container = $("featuredCarouselSection");

    function goTo(idx) {
      if (carouselItems.length <= 1) return;
      currentCarouselIndex = (idx + carouselItems.length) % carouselItems.length;

      document.querySelectorAll(".carousel-slide").forEach((el, i) => {
        if (i === currentCarouselIndex) {
          el.classList.remove("opacity-0", "pointer-events-none", "absolute");
          el.classList.add("opacity-100", "relative", "z-10");
        } else {
          el.classList.add("opacity-0", "pointer-events-none", "absolute");
          el.classList.remove("opacity-100", "relative", "z-10");
        }
      });

      document.querySelectorAll(".carousel-dot").forEach((dot, i) => {
        if (i === currentCarouselIndex) {
          dot.className = "carousel-dot transition-all duration-300 rounded-full w-8 h-2 bg-accent-cyan";
        } else {
          dot.className = "carousel-dot transition-all duration-300 rounded-full w-2 h-2 bg-white/20 hover:bg-white/40";
        }
      });
      safeIcons();
    }

    if (prevBtn) prevBtn.onclick = () => goTo(currentCarouselIndex - 1);
    if (nextBtn) nextBtn.onclick = () => goTo(currentCarouselIndex + 1);

    document.querySelectorAll(".carousel-dot").forEach(btn => {
      btn.onclick = () => goTo(Number(btn.dataset.dot));
    });

    function startAuto() {
      stopAuto();
      if (carouselItems.length > 1) {
        carouselTimer = setInterval(() => goTo(currentCarouselIndex + 1), 6000);
      }
    }
    function stopAuto() {
      if (carouselTimer) { clearInterval(carouselTimer); carouselTimer = null; }
    }

    if (container) {
      container.onmouseenter = stopAuto;
      container.onmouseleave = startAuto;
    }
    startAuto();
  }

  // 2. 筛选条 (Filter Bar)
  function renderFilterBar() {
    // 2.1 平台分段按钮
    const seg = $("platformSegmented");
    if (seg) {
      const segItems = [
        { id: "all", label: "全部平台", icon: "layout-grid" },
        ...availablePlatforms.map(p => PLATFORMS[p] || { id: p, label: p, icon: "package" })
      ];

      seg.innerHTML = segItems.map(p => {
        const active = currentPlatform === p.id;
        return `
          <button type="button" data-platform="${esc(p.id)}" class="platform-tab px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${active ? 'bg-white/[0.14] text-white border border-white/20 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}">
            <i data-lucide="${esc(p.icon)}" class="w-3.5 h-3.5"></i>
            <span>${esc(p.label)}</span>
          </button>
        `;
      }).join("");

      seg.querySelectorAll("[data-platform]").forEach(btn => {
        btn.addEventListener("click", () => {
          currentPlatform = btn.dataset.platform;
          syncUrl();
          renderFilterBar();
          applyFiltersAndRender();
        });
      });
    }

    // 2.2 分类标签
    const catBox = $("categoryTabs");
    if (catBox) {
      const usedCats = new Set(allSoftware.map(s => s.categoryId));
      const cats = [{ id: "all", name: "全部分类" }, ...(catalog.categories || []).filter(c => usedCats.has(c.id))];

      catBox.innerHTML = cats.map(c => {
        const active = currentCategory === c.id;
        return `
          <button type="button" data-cat="${esc(c.id)}" class="px-3 py-1 rounded-full text-xs font-medium border transition-colors ${active ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40' : 'bg-transparent text-slate-400 border-white/[0.08] hover:text-white hover:border-white/20'}">
            ${esc(c.name)}
          </button>
        `;
      }).join("");

      catBox.querySelectorAll("[data-cat]").forEach(btn => {
        btn.addEventListener("click", () => {
          currentCategory = btn.dataset.cat;
          syncUrl();
          renderFilterBar();
          applyFiltersAndRender();
        });
      });
    }

    // 2.3 状态同步回输入框
    const qInput = $("searchInput");
    if (qInput && qInput.value !== currentQuery) {
      qInput.value = currentQuery;
    }
    const sortSel = $("sortSelect");
    if (sortSel && sortSel.value !== currentSort) {
      sortSel.value = currentSort;
    }

    safeIcons();
  }

  function bindFilterEvents() {
    const qInput = $("searchInput");
    if (qInput) {
      let debounceTimer = null;
      qInput.addEventListener("input", e => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          currentQuery = e.target.value.trim();
          syncUrl();
          applyFiltersAndRender();
        }, 250);
      });
    }

    const sortSel = $("sortSelect");
    if (sortSel) {
      sortSel.addEventListener("change", e => {
        currentSort = e.target.value;
        syncUrl();
        applyFiltersAndRender();
      });
    }

    const resetBtn = $("resetFiltersBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        currentPlatform = "all";
        currentCategory = "all";
        currentQuery = "";
        currentSort = "recommend";
        syncUrl();
        renderFilterBar();
        applyFiltersAndRender();
      });
    }
  }

  function syncUrl() {
    const p = new URLSearchParams();
    if (currentPlatform && currentPlatform !== "all") p.set("platform", currentPlatform);
    if (currentCategory && currentCategory !== "all") p.set("cat", currentCategory);
    if (currentSort && currentSort !== "recommend") p.set("sort", currentSort);
    if (currentQuery) p.set("q", currentQuery);

    const qs = p.toString();
    const newUrl = location.pathname + (qs ? "?" + qs : "");
    history.replaceState(null, "", newUrl);
  }

  // 3. 过滤并渲染主体卡片网格
  function applyFiltersAndRender() {
    let filtered = [...allSoftware];

    // 平台筛选：软件必须有该平台的安装包
    if (currentPlatform !== "all") {
      filtered = filtered.filter(s => s.platforms.includes(currentPlatform));
    }

    // 分类筛选
    if (currentCategory !== "all") {
      filtered = filtered.filter(s => s.categoryId === currentCategory);
    }

    // 搜索词过滤（名称、tagline、description）
    if (currentQuery) {
      const q = currentQuery.toLowerCase();
      filtered = filtered.filter(s =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.tagline && s.tagline.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.slug && s.slug.toLowerCase().includes(q))
      );
    }

    // 排序
    if (currentSort === "downloads") {
      filtered.sort((a, b) => b.totalDownloads - a.totalDownloads);
    } else if (currentSort === "updated") {
      filtered.sort((a, b) => b.latestTimestamp - a.latestTimestamp);
    } else {
      filtered.sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
    }

    const grid = $("softwareGrid");
    const empty = $("emptyState");
    const countEl = $("filteredCount");

    if (countEl) {
      countEl.textContent = `共 ${filtered.length} 款软件`;
    }

    if (filtered.length === 0) {
      if (grid) grid.innerHTML = "";
      if (empty) empty.classList.remove("hidden");
      return;
    }

    if (empty) empty.classList.add("hidden");
    if (!grid) return;

    grid.innerHTML = filtered.map(s => {
      const cat = (catalog.categories || []).find(c => c.id === s.categoryId)?.name || "工具";
      const icon = s.iconUrl
        ? `<img src="${esc(s.iconUrl)}" alt="" class="w-12 h-12 rounded-xl object-cover border border-white/[0.1] shrink-0" />`
        : `<div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-accent-indigo/40 to-accent-cyan/30 border border-white/[0.12] flex items-center justify-center text-white font-bold text-lg shrink-0">${esc((s.name || "软")[0])}</div>`;

      const platformIcons = s.platforms.map(p => {
        const item = PLATFORMS[p] || PLATFORMS.other;
        return `<span title="${item.label}" class="text-slate-400 hover:text-white transition-colors"><i data-lucide="${item.icon}" class="w-4 h-4"></i></span>`;
      }).join("");

      const detailHref = s.landingUrl || `/software.html?slug=${encodeURIComponent(s.slug || s.id)}`;
      const downloadHref = s.latest ? `/download/${encodeURIComponent(s.latest.id)}` : detailHref;

      return `
        <article class="glass-card glass-card-hover rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all group">
          <div>
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="flex items-center gap-3 min-w-0">
                ${icon}
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <h3 class="text-base sm:text-lg font-bold text-white group-hover:text-accent-cyan transition-colors truncate">
                      <a href="${detailHref}">${esc(s.name)}</a>
                    </h3>
                  </div>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400 border border-white/[0.08]">${esc(cat)}</span>
                    <span class="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-medium border border-amber-500/20">${esc(s.priceLabel || "免费")}</span>
                  </div>
                </div>
              </div>
            </div>

            <p class="text-slate-400 text-xs sm:text-sm leading-relaxed line-clamp-2 min-h-[38px] mb-4">
              ${esc(s.tagline || s.description || "暂无描述")}
            </p>

            <div class="flex items-center justify-between text-xs text-slate-400 py-3 border-t border-white/[0.06] mb-4">
              <div class="flex items-center gap-2">
                ${platformIcons || '<span class="text-[11px] text-slate-500">即将发布</span>'}
              </div>
              <div class="flex items-center gap-2 font-mono text-[11px]">
                ${s.latest ? `<span>v${esc(s.latest.version)}</span>` : ""}
                ${s.latest?.size ? `<span>· ${esc(s.latest.size)}</span>` : ""}
                <span>· ${s.totalDownloads} 次下载</span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2.5 pt-2">
            ${s.latest ? `
              <a href="${downloadHref}" class="btn-shimmer h-[42px] rounded-xl bg-gradient-to-r from-accent-cyan to-[#06B6D4] text-[#04101A] font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(0,242,254,0.25)] hover:-translate-y-0.5 transition-transform">
                <i data-lucide="download" class="w-3.5 h-3.5"></i>
                <span>立即下载</span>
              </a>
            ` : `
              <span class="h-[42px] rounded-xl bg-white/[0.04] text-slate-500 font-medium text-xs flex items-center justify-center cursor-not-allowed border border-white/[0.06]">
                即将发布
              </span>
            `}
            <a href="${detailHref}" class="h-[42px] rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.12] text-white font-medium text-xs flex items-center justify-center gap-1 transition-all">
              <span>查看详情</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-slate-400"></i>
            </a>
          </div>
        </article>
      `;
    }).join("");

    safeIcons();
  }

  // 4. 右侧边栏：下载榜 Top 10 与 最近更新
  function renderSidebarRankings() {
    // 4.1 下载榜 Top 10
    const topRankBox = $("rankingTop10");
    if (topRankBox) {
      const topList = [...allSoftware]
        .sort((a, b) => b.totalDownloads - a.totalDownloads)
        .slice(0, 10);

      if (topList.length === 0) {
        topRankBox.innerHTML = `<div class="p-4 text-center text-xs text-slate-500">暂无下载排行数据</div>`;
      } else {
        topRankBox.innerHTML = topList.map((s, idx) => {
          const rank = idx + 1;
          const isGold = rank <= 3;
          const detailHref = s.landingUrl || `/software.html?slug=${encodeURIComponent(s.slug || s.id)}`;
          const icon = s.iconUrl
            ? `<img src="${esc(s.iconUrl)}" class="w-7 h-7 rounded-lg object-cover" alt="" />`
            : `<div class="w-7 h-7 rounded-lg bg-white/[0.08] flex items-center justify-center text-xs font-bold text-white">${esc((s.name || "软")[0])}</div>`;

          return `
            <a href="${detailHref}" class="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.05] transition-colors group">
              <div class="flex items-center gap-3 min-w-0">
                <span class="w-5 text-center font-bold font-mono text-sm ${isGold ? 'text-[#e8a33d]' : 'text-slate-500'}">${rank}</span>
                ${icon}
                <div class="min-w-0">
                  <div class="text-xs font-semibold text-white group-hover:text-accent-cyan truncate transition-colors">${esc(s.name)}</div>
                  <div class="text-[10px] text-slate-500 font-mono">${s.latest ? 'v' + esc(s.latest.version) : '即将发布'}</div>
                </div>
              </div>
              <div class="text-[11px] font-mono text-slate-400 shrink-0 ml-2">
                ${s.totalDownloads.toLocaleString()} 次
              </div>
            </a>
          `;
        }).join("");
      }
    }

    // 4.2 最近更新 (Top 5 发版)
    const recentBox = $("recentUpdates");
    if (recentBox) {
      const allReleases = [];
      allSoftware.forEach(s => {
        s.releases.forEach(r => {
          allReleases.push({
            softwareName: s.name,
            slug: s.slug || s.id,
            landingUrl: s.landingUrl,
            version: r.version,
            platform: r.platform,
            createdAt: r.createdAt,
            downloadId: r.id
          });
        });
      });

      allReleases.sort((a, b) => {
        const timeA = typeof a.createdAt === "number" ? a.createdAt : new Date(a.createdAt || 0).getTime();
        const timeB = typeof b.createdAt === "number" ? b.createdAt : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      const topRecent = allReleases.slice(0, 5);

      if (topRecent.length === 0) {
        recentBox.innerHTML = `<div class="p-4 text-center text-xs text-slate-500">暂无版本发布记录</div>`;
      } else {
        recentBox.innerHTML = topRecent.map(r => {
          const detailHref = r.landingUrl || `/software.html?slug=${encodeURIComponent(r.slug)}`;
          const pItem = PLATFORMS[r.platform] || PLATFORMS.other;
          return `
            <a href="${detailHref}" class="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.05] transition-colors group">
              <div class="min-w-0 flex items-center gap-2">
                <i data-lucide="${pItem.icon}" class="w-3.5 h-3.5 text-slate-400 group-hover:text-accent-cyan shrink-0 transition-colors"></i>
                <div class="min-w-0">
                  <div class="text-xs font-semibold text-white group-hover:text-accent-cyan truncate transition-colors">${esc(r.softwareName)}</div>
                  <div class="text-[10px] text-slate-500 font-mono">v${esc(r.version)} · ${pItem.label}</div>
                </div>
              </div>
              <span class="text-[10px] text-slate-500 font-mono shrink-0 ml-2">${formatDate(r.createdAt)}</span>
            </a>
          `;
        }).join("");
      }
    }

    safeIcons();
  }

  // 页面加载完成后启动
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
