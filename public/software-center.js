// 软件中心（download.html）：所有内容来自后台 /api/catalog
// 后台新增软件 / 上传版本后，这个页面自动出现，无需改代码。
(function () {
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
  const PLATFORM = {
    windows: { name: "Windows 安装版", icon: "monitor", desc: "适用于 Windows 10 / 11，一键安装。" },
    portable: { name: "绿色便携版", icon: "package", desc: "免安装，解压即用，可放在 U 盘随身携带。" },
    macos: { name: "macOS", icon: "apple", desc: "适用于 macOS。" },
    linux: { name: "Linux", icon: "terminal", desc: "适用于主流 Linux 发行版。" },
    android: { name: "Android", icon: "smartphone", desc: "适用于安卓手机和平板。" },
    other: { name: "下载包", icon: "file-down", desc: "官方原版下载包。" }
  };
  const PLATFORM_ORDER = ["windows", "portable", "macos", "linux", "android", "other"];
  const BTN_PRIMARY = "btn-shimmer h-[52px] min-w-[210px] px-7 rounded-[14px] bg-gradient-to-r from-accent-cyan to-[#06B6D4] text-[#04101A] font-bold text-[15px] flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-[0_0_35px_rgba(0,242,254,0.45)] hover:-translate-y-0.5";
  const BTN_GHOST = "h-[52px] min-w-[210px] px-7 rounded-[14px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.16] hover:border-white/30 text-white font-semibold text-[15px] flex items-center justify-center gap-3 transition-all duration-300 backdrop-blur-xl";

  let catalog = null;
  let items = [];
  let activeCategory = "all";

  const downloadable = r => r && r.status === "published" && (r.fileKey || r.publicUrl) && r.version && r.version !== "待上传";
  const pkgName = r => r.label || (PLATFORM[r.platform] || PLATFORM.other).name;
  const dateText = ts => ts ? new Date(Number(ts)).toLocaleDateString("zh-CN") : "";
  const icons = () => { try { window.lucide?.createIcons(); } catch {} };

  function prepare(software) {
    const releases = (software.releases || []).filter(downloadable).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const latest = releases.find(r => r.isLatest) || releases[0] || null;
    const packages = latest ? releases.filter(r => r.version === latest.version)
      .sort((a, b) => PLATFORM_ORDER.indexOf(a.platform) - PLATFORM_ORDER.indexOf(b.platform) || (b.isLatest - a.isLatest)) : [];
    if (latest && packages[0] !== latest && packages.includes(latest) && latest.platform === packages[0].platform) {
      packages.splice(packages.indexOf(latest), 1);
      packages.unshift(latest);
    }
    return { ...software, releasesReady: releases, latest, packages };
  }

  async function init() {
    try {
      const res = await fetch("/api/catalog", { cache: "no-store" });
      if (!res.ok) throw new Error("catalog");
      catalog = await res.json();
    } catch {
      $("softwareList").innerHTML = `<p class="col-span-full text-center text-slate-400 text-sm">软件列表加载失败，请刷新重试。</p>`;
      return;
    }
    items = (catalog.software || [])
      .filter(s => s.status !== "disabled")
      .map(prepare)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    renderTabs();
    renderList();
    const wanted = new URLSearchParams(location.search).get("app");
    const first = items.find(s => s.slug === wanted) || items.find(s => s.latest) || items[0];
    if (first) select(first.slug, false);
    else renderEmpty();
  }

  function renderEmpty() {
    $("heroTitle").textContent = "软件中心";
    $("heroDesc").textContent = "暂时还没有上架的软件。";
    $("heroVersion").textContent = "敬请期待";
    $("downloadNow").innerHTML = "";
    $("heroMeta").innerHTML = "";
    ["features", "platforms", "changelog"].forEach(id => { const el = $(id); if (el) el.hidden = true; });
  }

  function renderTabs() {
    const used = new Set(items.map(s => s.categoryId));
    const categories = (catalog.categories || []).filter(c => used.has(c.id));
    const box = $("softwareTabs");
    if (categories.length < 2) { box.innerHTML = ""; return; }
    box.innerHTML = [{ id: "all", name: "全部" }, ...categories].map(c =>
      `<button type="button" data-cat="${esc(c.id)}" class="px-4 py-1.5 rounded-full text-[13px] border transition-colors ${c.id === activeCategory ? "bg-white/[0.08] border-white/[0.2] text-white" : "border-white/[0.08] text-slate-400 hover:text-white"}">${esc(c.name)}</button>`
    ).join("");
    box.querySelectorAll("[data-cat]").forEach(btn => btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      renderTabs();
      renderList();
    }));
  }

  function renderList() {
    const list = items.filter(s => activeCategory === "all" || s.categoryId === activeCategory);
    const box = $("softwareList");
    if (!list.length) { box.innerHTML = `<p class="col-span-full text-center text-slate-400 text-sm">该分类下暂无软件。</p>`; return; }
    box.innerHTML = list.map(s => {
      const primary = s.packages[0];
      const cover = s.coverUrl
        ? `<img src="${esc(s.coverUrl)}" alt="" loading="lazy" class="w-full h-full object-cover">`
        : `<div class="w-full h-full flex items-center justify-center text-slate-500"><i data-lucide="box" class="w-8 h-8"></i></div>`;
      return `<article class="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col" data-slug="${esc(s.slug)}">
        <div class="aspect-[16/9] bg-white/[0.03] border-b border-white/[0.06] overflow-hidden">${cover}</div>
        <div class="p-6 flex flex-col flex-1">
          <div class="flex items-center justify-between gap-3 mb-2">
            <h3 class="text-lg font-bold text-white">${esc(s.name)}</h3>
            ${s.latest ? `<span class="text-[11px] font-mono text-accent-cyan">v${esc(s.latest.version)}</span>` : `<span class="text-[11px] text-slate-500">即将发布</span>`}
          </div>
          <p class="text-sm text-slate-400 leading-relaxed mb-5 line-clamp-2">${esc(s.tagline || s.description || "")}</p>
          <div class="mt-auto flex gap-3">
            <button type="button" data-select="${esc(s.slug)}" class="flex-1 h-10 rounded-xl border border-white/[0.14] text-white text-sm font-semibold hover:bg-white/[0.06] transition-colors">查看详情</button>
            ${primary ? `<a href="/download/${encodeURIComponent(primary.id)}" class="flex-1 h-10 rounded-xl bg-gradient-to-r from-accent-cyan to-[#06B6D4] text-[#04101A] text-sm font-bold flex items-center justify-center gap-1.5"><i data-lucide="download" class="w-4 h-4"></i>下载</a>` : ""}
          </div>
        </div>
      </article>`;
    }).join("");
    box.querySelectorAll("[data-select]").forEach(btn => btn.addEventListener("click", () => select(btn.dataset.select, true)));
    icons();
  }

  function select(slug, scroll) {
    const s = items.find(item => item.slug === slug);
    if (!s) return;
    const url = new URL(location.href);
    url.searchParams.set("app", slug);
    history.replaceState(null, "", url);
    document.title = `${s.name} 下载 - ${catalog.product || "天才猫软件中心"}`;
    document.querySelectorAll("#softwareList [data-slug]").forEach(card => card.classList.toggle("ring-1", card.dataset.slug === slug));
    renderHero(s);
    renderFeatures(s);
    renderPackages(s);
    renderChangelog(s);
    icons();
    if (scroll) $("overview")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderHero(s) {
    const category = (catalog.categories || []).find(c => c.id === s.categoryId);
    $("heroTagline").textContent = category?.name || "官方下载";
    $("heroVersion").textContent = s.latest ? `v${s.latest.version} 现已就绪` : "即将发布";
    $("navVersion").textContent = s.latest ? `v${s.latest.version}` : "敬请期待";
    $("heroTitle").innerHTML = `${esc(s.name)}${s.tagline ? `<br><span class="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">${esc(s.tagline)}</span>` : ""}`;
    $("heroDesc").textContent = s.description || "";

    const buttons = s.packages.slice(0, 2).map((r, i) =>
      `<a href="/download/${encodeURIComponent(r.id)}" class="${i === 0 ? BTN_PRIMARY : BTN_GHOST}"><i data-lucide="${i === 0 ? "download" : (PLATFORM[r.platform] || PLATFORM.other).icon}" class="w-4 h-4"></i><span>下载 ${esc(pkgName(r))}</span></a>`
    );
    if (buttons.length < 2 && s.landingUrl) buttons.push(`<a href="${esc(s.landingUrl)}" class="${BTN_GHOST}"><span>了解详情</span><i data-lucide="arrow-up-right" class="w-4 h-4"></i></a>`);
    if (!buttons.length) buttons.push(`<span class="${BTN_GHOST} opacity-60 cursor-not-allowed">暂未发布安装包</span>`);
    $("downloadNow").innerHTML = buttons.join("");

    const main = s.packages[0];
    const meta = [];
    if (main) meta.push(`<span class="flex items-center gap-1.5 text-slate-300"><i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-400"></i>${esc(main.size || "")} · ${esc(main.fileName || "")}</span>`);
    if (s.requirements) meta.push(`<span>${esc(s.requirements)}</span>`);
    if (main?.sha256) meta.push(`<button type="button" data-sha="${esc(main.sha256)}" class="inline-flex items-center gap-1.5 hover:text-white transition-colors"><span>SHA-256: ${esc(main.sha256.slice(0, 6))}...${esc(main.sha256.slice(-4))}</span><i data-lucide="copy" class="w-3.5 h-3.5"></i></button>`);
    $("heroMeta").innerHTML = meta.join(`<span>·</span>`);
    $("heroMeta").querySelector("[data-sha]")?.addEventListener("click", event => copy(event.currentTarget.dataset.sha, "校验码已复制"));

    const visual = $("heroVisual");
    if (!visual.dataset.original) visual.dataset.original = visual.innerHTML;
    visual.innerHTML = s.coverUrl
      ? `<div class="glass-card rounded-2xl p-3 border border-white/[0.18] shadow-[0_30px_90px_rgba(0,0,0,0.85)] overflow-hidden"><img src="${esc(s.coverUrl)}" alt="${esc(s.name)} 界面截图" class="w-full rounded-xl object-cover"></div>`
      : visual.dataset.original;
  }

  function renderFeatures(s) {
    const section = $("features");
    if (!s.highlights?.length) { section.hidden = true; return; }
    section.hidden = false;
    $("featuresEyebrow").textContent = "Highlights";
    $("featuresTitle").textContent = `${s.name} 核心特性`;
    $("featuresDesc").textContent = s.tagline || "";
    const span = s.highlights.length % 3 === 0 ? "md:col-span-4" : "md:col-span-6";
    $("featuresGrid").innerHTML = s.highlights.map((h, i) =>
      `<div class="${span} glass-card glass-card-hover rounded-2xl p-6 sm:p-7 spotlight-card">
        <span class="text-xs font-mono text-accent-cyan">${String(i + 1).padStart(2, "0")}</span>
        <h3 class="text-lg font-bold text-white mt-3 mb-2">${esc(h.title)}</h3>
        <p class="text-sm text-slate-400 leading-relaxed">${esc(h.text || "")}</p>
      </div>`
    ).join("");
  }

  function renderPackages(s) {
    const section = $("platforms");
    if (!s.packages.length) { section.hidden = true; return; }
    section.hidden = false;
    $("platformsTitle").textContent = `下载 ${s.name}`;
    $("platformsDesc").textContent = `当前版本 v${s.latest.version} · 更新于 ${dateText(s.latest.createdAt)}，所有安装包均来自官方服务器。`;
    const cols = s.packages.length >= 3 ? "md:grid-cols-3" : s.packages.length === 2 ? "md:grid-cols-2" : "md:grid-cols-1 max-w-md mx-auto";
    const grid = $("platformGrid");
    grid.className = `grid grid-cols-1 ${cols} gap-6`;
    grid.innerHTML = s.packages.map((r, i) => {
      const p = PLATFORM[r.platform] || PLATFORM.other;
      return `<div class="glass-card glass-card-hover rounded-2xl p-7 flex flex-col justify-between spotlight-card">
        <div>
          <div class="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center mb-5 text-accent-cyan"><i data-lucide="${p.icon}" class="w-6 h-6"></i></div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-xl font-bold text-white">${esc(pkgName(r))}</h3>
            ${i === 0 ? `<span class="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">推荐</span>` : ""}
          </div>
          <p class="text-sm text-slate-400 leading-relaxed mb-6">${esc(r.description || p.desc)}</p>
          <div class="space-y-2 text-xs text-slate-400 font-mono mb-8 border-t border-white/[0.06] pt-4">
            <div class="flex justify-between gap-3"><span>版本号</span><span class="text-white">v${esc(r.version)}</span></div>
            <div class="flex justify-between gap-3"><span>文件</span><span class="text-white truncate">${esc(r.fileName || "")}</span></div>
            <div class="flex justify-between gap-3"><span>大小</span><span class="text-white">${esc(r.size || "")}</span></div>
            ${r.arch ? `<div class="flex justify-between gap-3"><span>架构</span><span class="text-white">${esc(r.arch)}</span></div>` : ""}
          </div>
        </div>
        <a href="/download/${encodeURIComponent(r.id)}" class="${i === 0 ? "btn-shimmer h-[52px] w-full rounded-[14px] bg-gradient-to-r from-accent-cyan to-[#06B6D4] text-[#04101A] font-bold" : "h-[52px] w-full rounded-[14px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.16] text-white font-semibold"} text-[15px] flex items-center justify-center gap-2.5 transition-all duration-300"><i data-lucide="download" class="w-4 h-4"></i><span>下载 ${esc(pkgName(r))}（${esc(r.size || "")}）</span></a>
      </div>`;
    }).join("");
  }

  function renderChangelog(s) {
    const section = $("changelog");
    const versions = new Map();
    for (const r of s.releasesReady) {
      if (!versions.has(r.version)) versions.set(r.version, []);
      versions.get(r.version).push(r);
    }
    if (!versions.size) { section.hidden = true; return; }
    section.hidden = false;
    const list = [...versions.entries()].slice(0, 15);
    $("changelogList").innerHTML = list.map(([version, rels], index) => {
      const notes = (rels.find(r => r.changelog)?.changelog || "").split(/\r?\n/).map(t => t.replace(/^\s*[-*•\d.、]+\s*/, "").trim()).filter(Boolean);
      const open = index === 0;
      return `<div class="glass-card rounded-xl overflow-hidden changelog-item">
        <button type="button" class="w-full px-5 py-4 flex items-center justify-between text-left text-sm font-semibold text-white hover:bg-white/[0.02]" data-toggle>
          <div class="flex items-center gap-3">
            <span class="w-2 h-2 rounded-full ${index === 0 ? "bg-emerald-400" : "bg-slate-500"}"></span>
            <span>v${esc(version)}${index === 0 ? " 最新版" : ""}</span>
            <span class="text-[11px] font-normal text-slate-400 font-mono">${esc(dateText(rels[0].createdAt))}</span>
          </div>
          <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}"></i>
        </button>
        <div class="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 space-y-2 border-t border-white/[0.06] ${open ? "" : "hidden"}" data-content>
          ${notes.length ? notes.map(n => `<div class="flex items-start gap-2.5"><span class="text-accent-cyan">·</span><span>${esc(n)}</span></div>`).join("") : `<p class="text-slate-500">本版本暂无更新说明。</p>`}
          <div class="flex flex-wrap gap-2 pt-3">${rels.map(r => `<a href="/download/${encodeURIComponent(r.id)}" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.1] text-slate-300 hover:text-white hover:border-white/30 text-xs"><i data-lucide="download" class="w-3.5 h-3.5"></i>${esc(pkgName(r))} · ${esc(r.size || "")}</a>`).join("")}</div>
        </div>
      </div>`;
    }).join("");
    $("changelogList").querySelectorAll("[data-toggle]").forEach(btn => btn.addEventListener("click", () => {
      const content = btn.nextElementSibling;
      const willOpen = content.classList.contains("hidden");
      content.classList.toggle("hidden", !willOpen);
      btn.querySelector("[data-lucide], svg")?.classList.toggle("rotate-180", willOpen);
    }));
  }

  async function copy(text, okText) {
    try {
      await navigator.clipboard.writeText(text);
      flash(okText);
    } catch {
      flash("复制失败，请手动复制");
    }
  }

  function flash(text) {
    const tip = document.createElement("div");
    tip.textContent = text;
    tip.className = "fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-xl bg-black/80 border border-white/10 text-sm text-white";
    document.body.append(tip);
    setTimeout(() => tip.remove(), 1800);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
