// 天才猫软件详情页核心逻辑 (software.html)
// 支持公开线上展示与 Studio iframe 实时无缝草稿预览 (?preview=1 + postMessage)
(function () {
  const $ = id => document.getElementById(id);
  const esc = val => String(val ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);

  const PLATFORMS = {
    windows: { id: "windows", label: "Windows 安装版", icon: "monitor" },
    portable: { id: "portable", label: "绿色便携版", icon: "package" },
    macos: { id: "macos", label: "macOS", icon: "apple" },
    linux: { id: "linux", label: "Linux", icon: "terminal" },
    android: { id: "android", label: "Android", icon: "smartphone" },
    other: { id: "other", label: "下载包", icon: "file-down" }
  };

  let currentScreenshots = [];
  let currentLightboxIdx = 0;

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

  // 安全轻量 Markdown 渲染器（只允许段落、标题、粗体、斜体、列表、引用、代码块与链接）
  function markdownToHtml(md) {
    if (!md) return "";
    const lines = String(md).replace(/\r\n/g, "\n").split("\n");
    const blocks = [];
    let paragraph = [];
    let list = [];
    let code = [];
    let inCode = false;

    const flushP = () => {
      if (!paragraph.length) return;
      blocks.push(`<p>${inlineMarkdown(paragraph.join("<br>"))}</p>`);
      paragraph = [];
    };
    const flushList = () => {
      if (!list.length) return;
      blocks.push(`<ul>${list.map(item => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
      list = [];
    };

    for (const line of lines) {
      if (/^```/.test(line.trim())) {
        if (inCode) {
          blocks.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
          code = [];
          inCode = false;
        } else {
          flushP();
          flushList();
          inCode = true;
        }
        continue;
      }
      if (inCode) {
        code.push(line);
        continue;
      }

      const trimmed = line.trim();
      if (!trimmed) {
        flushP();
        flushList();
        continue;
      }

      if (/^###\s+/.test(trimmed)) {
        flushP();
        flushList();
        blocks.push(`<h3>${inlineMarkdown(trimmed.replace(/^###\s+/, ""))}</h3>`);
      } else if (/^##\s+/.test(trimmed)) {
        flushP();
        flushList();
        blocks.push(`<h2>${inlineMarkdown(trimmed.replace(/^##\s+/, ""))}</h2>`);
      } else if (/^[-*]\s+/.test(trimmed)) {
        flushP();
        list.push(trimmed.replace(/^[-*]\s+/, ""));
      } else if (/^>\s+/.test(trimmed)) {
        flushP();
        flushList();
        blocks.push(`<blockquote>${inlineMarkdown(trimmed.replace(/^>\s+/, ""))}</blockquote>`);
      } else {
        flushList();
        paragraph.push(trimmed);
      }
    }
    flushP();
    flushList();
    if (inCode && code.length) {
      blocks.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
    }
    return blocks.join("");
  }

  function inlineMarkdown(text) {
    return String(text || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>")
      .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  }

  // 渲染主体函数
  function renderSoftware(software, category, articles = []) {
    const root = $("softwareDetailRoot");
    if (!root) return;

    const publishedReleases = (software.releases || [])
      .filter(r => r && (r.status === "published" || !r.status) && (r.fileKey || r.publicUrl) && r.version && r.version !== "待上传")
      .sort((a, b) => {
        const timeA = typeof a.createdAt === "number" ? a.createdAt : new Date(a.createdAt || 0).getTime();
        const timeB = typeof b.createdAt === "number" ? b.createdAt : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

    const latest = publishedReleases.find(r => r.isLatest) || publishedReleases[0] || null;
    const sameVersionPackages = latest ? publishedReleases.filter(r => r.version === latest.version) : [];
    const olderReleases = latest ? publishedReleases.filter(r => r.version !== latest.version) : [];

    // SEO 与页面标题
    document.title = `${software.name || "软件详情"} — 天才猫软件中心`;
    const desc = software.tagline || software.description || "天才猫官方软件发布与更新日志。";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = desc;

    // 截图列表
    currentScreenshots = Array.isArray(software.screenshots)
      ? software.screenshots.filter(Boolean)
      : (typeof software.screenshots === "string" ? software.screenshots.split(/\r?\n/).map(s => s.trim()).filter(Boolean) : []);

    const iconHtml = software.iconUrl
      ? `<img src="${esc(software.iconUrl)}" alt="${esc(software.name)}" class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-white/[0.12] shadow-2xl shrink-0" />`
      : `<div class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-accent-indigo via-accent-cyan to-accent-violet p-[2px] shadow-2xl shrink-0"><div class="w-full h-full bg-[#07090e] rounded-2xl flex items-center justify-center text-white text-2xl font-bold">${esc((software.name || "软")[0])}</div></div>`;

    const platforms = Array.from(new Set(publishedReleases.map(r => r.platform || "other")));
    const platformPills = platforms.map(p => {
      const pItem = PLATFORMS[p] || PLATFORMS.other;
      return `<span class="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-slate-300">
        <i data-lucide="${pItem.icon}" class="w-3.5 h-3.5"></i>
        <span>${pItem.label}</span>
      </span>`;
    }).join("");

    // 特性亮点
    const highlights = Array.isArray(software.highlights) ? software.highlights.filter(h => h && h.title) : [];

    root.innerHTML = `
      <!-- 1. 软件核心 Hero -->
      <section class="glass-card rounded-3xl p-6 sm:p-10 mb-8 border border-white/[0.1] shadow-2xl relative overflow-hidden">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-6 min-w-0 flex-1">
            ${iconHtml}
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2 mb-2">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/[0.06] text-slate-400 border border-white/[0.08]">${esc(category?.name || "通用软件")}</span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">${esc(software.priceLabel || "免费")}</span>
                ${software.featured ? `<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">✦ 官方主推</span>` : ""}
              </div>
              <h1 class="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">${esc(software.name)}</h1>
              <p class="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">${esc(software.tagline || "极具高级感与生产力体验的官方应用。")}</p>

              <div class="flex flex-wrap items-center gap-2 mt-4">
                ${platformPills}
              </div>
            </div>
          </div>

          <!-- 右侧主下载按钮组 -->
          <div class="flex flex-col items-stretch sm:items-end gap-3 w-full sm:w-auto shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/[0.08]">
            ${latest ? `
              <a href="/download/${encodeURIComponent(latest.id)}" class="btn-shimmer h-[52px] min-w-[220px] px-8 rounded-xl bg-gradient-to-r from-accent-cyan to-[#06B6D4] text-[#04101A] font-bold text-sm flex items-center justify-center gap-2.5 shadow-[0_0_35px_rgba(0,242,254,0.4)] hover:-translate-y-0.5 transition-transform">
                <i data-lucide="download" class="w-4 h-4"></i>
                <span>立即下载 v${esc(latest.version)}</span>
              </a>
              <span class="text-xs text-slate-400 font-mono text-center sm:text-right">
                ${esc(latest.label || (PLATFORMS[latest.platform] || PLATFORMS.other).label)} · ${esc(latest.size || formatBytes(latest.fileSize))}
              </span>
            ` : `
              <div class="h-[52px] min-w-[220px] px-8 rounded-xl bg-white/[0.04] text-slate-500 font-bold text-sm flex items-center justify-center border border-white/[0.08] cursor-not-allowed">
                版本正在准备中
              </div>
            `}

            ${software.landingUrl ? `
              <a href="${esc(software.landingUrl)}" class="h-[42px] px-5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.14] text-accent-cyan font-semibold text-xs flex items-center justify-center gap-2 transition-all">
                <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                <span>访问 3D 专属落地页</span>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
              </a>
            ` : ""}
          </div>
        </div>

        <!-- 详细规格栏 -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/[0.08] text-xs">
          <div>
            <span class="text-slate-500 block mb-1">开发者 / 团队</span>
            <span class="text-slate-200 font-medium">${esc(software.developer || "天才猫官方团队")}</span>
          </div>
          <div>
            <span class="text-slate-500 block mb-1">系统要求</span>
            <span class="text-slate-200 font-medium">${esc(software.requirements || "Windows 10 / 11 64位 或 macOS")}</span>
          </div>
          <div>
            <span class="text-slate-500 block mb-1">官方网站</span>
            ${software.website ? `<a href="${esc(software.website)}" target="_blank" rel="noreferrer" class="text-accent-cyan hover:underline flex items-center gap-1">${esc(software.website.replace(/^https?:\/\//, '').slice(0, 22))} <i data-lucide="external-link" class="w-3 h-3"></i></a>` : `<span class="text-slate-400">nsyoo.com</span>`}
          </div>
          <div>
            <span class="text-slate-500 block mb-1">更新时间</span>
            <span class="text-slate-200 font-mono">${formatDate(latest?.createdAt || software.updatedAt)}</span>
          </div>
        </div>
      </section>

      <!-- 2. 截图画廊 (Screenshots Rail) -->
      ${currentScreenshots.length > 0 ? `
        <section class="mb-10">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <i data-lucide="image" class="w-5 h-5 text-accent-cyan"></i>
              <span>软件截图预览</span>
            </h2>
            <span class="text-xs text-slate-500">点击查看高清大图（支持键盘左右切换）</span>
          </div>
          <div class="gallery-rail">
            ${currentScreenshots.map((src, idx) => `
              <div class="shrink-0 w-72 sm:w-80 aspect-[16/10] rounded-2xl overflow-hidden glass-card border border-white/[0.1] hover:border-accent-cyan/50 transition-all cursor-pointer group shadow-lg" data-shot-idx="${idx}">
                <img src="${esc(src)}" alt="截图 ${idx+1}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
            `).join("")}
          </div>
        </section>
      ` : ""}

      <!-- 3. 两栏主体：简介 + 亮点 & 要求 -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10 items-start">
        <!-- 左侧：简介 (Markdown) -->
        <section class="lg:col-span-7 glass-card rounded-3xl p-6 sm:p-8 border border-white/[0.1] shadow-xl">
          <h2 class="text-lg font-bold text-white mb-4 pb-3 border-b border-white/[0.08] flex items-center gap-2">
            <i data-lucide="file-text" class="w-5 h-5 text-accent-cyan"></i>
            <span>软件介绍</span>
          </h2>
          <div class="prose-dark">
            ${markdownToHtml(software.description || "暂无详细介绍。")}
          </div>
        </section>

        <!-- 右侧：亮点与系统规格 -->
        <section class="lg:col-span-5 flex flex-col gap-6">
          ${highlights.length > 0 ? `
            <div class="glass-card rounded-3xl p-6 sm:p-8 border border-white/[0.1] shadow-xl">
              <h2 class="text-lg font-bold text-white mb-4 pb-3 border-b border-white/[0.08] flex items-center gap-2">
                <i data-lucide="zap" class="w-5 h-5 text-[#e8a33d]"></i>
                <span>特性亮点</span>
              </h2>
              <div class="space-y-4">
                ${highlights.map(h => `
                  <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <h4 class="text-sm font-bold text-white mb-1 flex items-center gap-2">
                      <span class="w-1.5 h-1.5 rounded-full bg-accent-cyan"></span>
                      <span>${esc(h.title)}</span>
                    </h4>
                    <p class="text-xs text-slate-300 leading-relaxed">${esc(h.text)}</p>
                  </div>
                `).join("")}
              </div>
            </div>
          ` : ""}

          <!-- 同版本全平台下载矩阵 -->
          ${sameVersionPackages.length > 1 ? `
            <div class="glass-card rounded-3xl p-6 border border-white/[0.1] shadow-xl">
              <h3 class="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <i data-lucide="boxes" class="w-4 h-4 text-accent-cyan"></i>
                <span>当前版本多平台安装包</span>
              </h3>
              <div class="space-y-2.5">
                ${sameVersionPackages.map(pkg => {
                  const pItem = PLATFORMS[pkg.platform] || PLATFORMS.other;
                  return `
                    <div class="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs">
                      <div class="flex items-center gap-2.5">
                        <i data-lucide="${pItem.icon}" class="w-4 h-4 text-slate-300"></i>
                        <div>
                          <div class="font-semibold text-white">${esc(pkg.label || pItem.label)}</div>
                          <div class="text-[11px] text-slate-400 font-mono">${esc(pkg.fileName || '安装包')} · ${esc(pkg.size || formatBytes(pkg.fileSize))}</div>
                        </div>
                      </div>
                      <a href="/download/${encodeURIComponent(pkg.id)}" class="px-3.5 py-1.5 rounded-lg bg-accent-cyan/15 hover:bg-accent-cyan/25 text-accent-cyan border border-accent-cyan/30 font-semibold transition-all">
                        下载
                      </a>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>
          ` : ""}
        </section>
      </div>

      <!-- 4. 历史版本与更新日志折叠面板 (Accordion) -->
      <section class="glass-card rounded-3xl p-6 sm:p-8 border border-white/[0.1] shadow-xl mb-10">
        <h2 class="text-lg font-bold text-white mb-6 pb-3 border-b border-white/[0.08] flex items-center gap-2">
          <i data-lucide="history" class="w-5 h-5 text-accent-cyan"></i>
          <span>历史版本与更新说明</span>
        </h2>

        ${publishedReleases.length === 0 ? `
          <div class="py-8 text-center text-xs text-slate-500">暂无版本记录</div>
        ` : `
          <div class="space-y-3">
            ${publishedReleases.map((rel, rIdx) => {
              const changelogLines = String(rel.changelog || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);
              const pItem = PLATFORMS[rel.platform] || PLATFORMS.other;
              return `
                <div class="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                  <button type="button" class="release-accordion-btn w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/[0.04] transition-colors" data-rel-idx="${rIdx}">
                    <div class="flex items-center gap-3">
                      <span class="font-bold text-sm text-white font-mono">v${esc(rel.version)}</span>
                      <span class="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400 border border-white/[0.08]">${esc(rel.label || pItem.label)}</span>
                      ${rel.isLatest ? `<span class="text-[11px] px-2 py-0.5 rounded-full bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">最新</span>` : ""}
                      <span class="text-xs text-slate-500 font-mono hidden sm:inline">${formatDate(rel.createdAt)}</span>
                    </div>
                    <div class="flex items-center gap-4">
                      <span class="text-xs text-slate-400 font-mono">${esc(rel.size || formatBytes(rel.fileSize))}</span>
                      <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 transition-transform ${rIdx === 0 ? 'rotate-180' : ''}"></i>
                    </div>
                  </button>

                  <div class="release-accordion-content ${rIdx === 0 ? '' : 'hidden'} px-5 pb-5 pt-1 border-t border-white/[0.04]">
                    <div class="text-xs text-slate-300 space-y-1.5 py-3">
                      ${changelogLines.length > 0 ? changelogLines.map(line => `<div class="flex items-start gap-2"><span class="text-accent-cyan">•</span><span>${esc(line)}</span></div>`).join("") : `<div class="text-slate-500">常规性能优化与体验改进。</div>`}
                    </div>
                    <div class="flex items-center justify-between pt-3 border-t border-white/[0.04] text-xs">
                      <span class="text-slate-500 font-mono">文件：${esc(rel.fileName || "setup.exe")}</span>
                      <a href="/download/${encodeURIComponent(rel.id)}" class="px-4 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.14] text-white font-medium flex items-center gap-1.5 transition-all">
                        <i data-lucide="download" class="w-3.5 h-3.5"></i>
                        <span>下载此版本</span>
                      </a>
                    </div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `}
      </section>

      <!-- 5. 相关文章 (Articles, max 3) -->
      ${articles.length > 0 ? `
        <section class="mb-10">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <i data-lucide="book-open" class="w-5 h-5 text-accent-cyan"></i>
              <span>相关使用教程与说明</span>
            </h2>
            <a href="/articles.html" class="text-xs text-slate-400 hover:text-white transition-colors">查看全部文章 →</a>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
            ${articles.slice(0, 3).map(art => `
              <a href="/article.html?slug=${encodeURIComponent(art.slug || art.id)}" class="glass-card glass-card-hover rounded-2xl p-5 flex flex-col justify-between group transition-all">
                <div>
                  ${art.coverUrl ? `<div class="aspect-[16/9] rounded-xl overflow-hidden mb-3 bg-white/[0.04]"><img src="${esc(art.coverUrl)}" alt="" class="w-full h-full object-cover group-hover:scale-105 transition-transform" /></div>` : ""}
                  <h4 class="text-sm font-bold text-white group-hover:text-accent-cyan transition-colors mb-2 line-clamp-2">${esc(art.title)}</h4>
                  <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">${esc(art.summary || "")}</p>
                </div>
                <div class="text-[11px] text-slate-500 font-mono pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <span>${esc(art.category || "教程")}</span>
                  <span>阅读全文 →</span>
                </div>
              </a>
            `).join("")}
          </div>
        </section>
      ` : ""}
    `;

    setupInteractions();
    safeIcons();
  }

  function renderMissing() {
    const root = $("softwareDetailRoot");
    if (!root) return;
    root.innerHTML = `
      <div class="glass-card rounded-3xl p-16 text-center max-w-lg mx-auto">
        <div class="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400 mx-auto mb-4">
          <i data-lucide="package-search" class="w-8 h-8 text-accent-cyan"></i>
        </div>
        <h2 class="text-xl font-bold text-white mb-2">未找到该软件</h2>
        <p class="text-xs text-slate-400 mb-6">该软件可能已下架或标识有误，请前往软件中心查看更多软件。</p>
        <a href="/download.html" class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 text-xs font-semibold hover:bg-accent-cyan/30 transition-all">
          <i data-lucide="arrow-left" class="w-4 h-4"></i>
          <span>返回软件中心</span>
        </a>
      </div>
    `;
    safeIcons();
  }

  // 绑定交互：折叠面板与灯箱
  function setupInteractions() {
    // 1. 折叠面板
    document.querySelectorAll(".release-accordion-btn").forEach(btn => {
      btn.onclick = () => {
        const content = btn.nextElementSibling;
        const icon = btn.querySelector("i[data-lucide='chevron-down']");
        const isOpen = !content.classList.contains("hidden");
        if (isOpen) {
          content.classList.add("hidden");
          if (icon) icon.classList.remove("rotate-180");
        } else {
          content.classList.remove("hidden");
          if (icon) icon.classList.add("rotate-180");
        }
      };
    });

    // 2. 截图画廊灯箱点击
    document.querySelectorAll("[data-shot-idx]").forEach(card => {
      card.onclick = () => {
        const idx = Number(card.dataset.shotIdx);
        openLightbox(idx);
      };
    });
  }

  // 灯箱控制
  function openLightbox(idx) {
    if (!currentScreenshots.length) return;
    currentLightboxIdx = (idx + currentScreenshots.length) % currentScreenshots.length;
    const modal = $("lightboxModal");
    const img = $("lightboxImg");
    const counter = $("lightboxIndex");
    if (!modal || !img) return;

    img.src = currentScreenshots[currentLightboxIdx];
    if (counter) counter.textContent = `${currentLightboxIdx + 1} / ${currentScreenshots.length}`;
    modal.classList.remove("hidden");
  }

  function closeLightbox() {
    const modal = $("lightboxModal");
    if (modal) modal.classList.add("hidden");
  }

  function setupLightboxHandlers() {
    const closeBtn = $("lightboxClose");
    const prevBtn = $("lightboxPrev");
    const nextBtn = $("lightboxNext");
    const modal = $("lightboxModal");

    if (closeBtn) closeBtn.onclick = closeLightbox;
    if (prevBtn) prevBtn.onclick = () => openLightbox(currentLightboxIdx - 1);
    if (nextBtn) nextBtn.onclick = () => openLightbox(currentLightboxIdx + 1);

    if (modal) {
      modal.onclick = e => {
        if (e.target === modal) closeLightbox();
      };
    }

    window.addEventListener("keydown", e => {
      const modal = $("lightboxModal");
      if (!modal || modal.classList.contains("hidden")) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") openLightbox(currentLightboxIdx - 1);
      else if (e.key === "ArrowRight") openLightbox(currentLightboxIdx + 1);
    });
  }

  // 主加载流程
  async function loadSoftware() {
    setupLightboxHandlers();

    const params = new URLSearchParams(location.search);
    const isPreview = params.get("preview") === "1";
    const slug = params.get("slug") || params.get("app");

    // 模式 A：Studio 实时无缝预览模式
    if (isPreview) {
      // 监听 Studio 发来的 postMessage
      window.addEventListener("message", event => {
        if (event.origin !== location.origin) return;
        if (event.data && event.data.type === "studio-preview") {
          const sw = event.data.software;
          const cat = event.data.category || { id: sw?.categoryId, name: "预览分类" };
          const arts = event.data.articles || [];
          if (sw) renderSoftware(sw, cat, arts);
        }
      });

      // 告知父窗口已就绪
      try {
        window.parent?.postMessage({ type: "preview-ready" }, location.origin);
      } catch {}

      // 如果有 slug 也可尝试先读一次
      if (!slug) return;
    }

    if (!slug) {
      renderMissing();
      return;
    }

    try {
      const res = await fetch("/api/catalog", { cache: "no-store" });
      if (!res.ok) throw new Error("加载失败");
      const catalog = await res.json();

      const software = (catalog.software || []).find(item => item.slug === slug || item.id === slug);
      if (!software) {
        renderMissing();
        return;
      }

      const category = (catalog.categories || []).find(item => item.id === software.categoryId);
      const articles = (catalog.articles || []).filter(item => (item.softwareIds || []).includes(software.id));

      renderSoftware(software, category, articles);
    } catch (err) {
      renderMissing();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadSoftware);
  } else {
    loadSoftware();
  }
})();
