// 天才猫软件详情页核心脚本 (software.js)
// 纯净语义化 DOM · 支持公开访问与 Studio iframe 无缝预览 (?preview=1 + postMessage) · 无 Tailwind 类名
(function () {
  "use strict";

  const $ = id => document.getElementById(id);
  const esc = val => String(val ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);

  const PLATFORM_MAP = {
    windows: { id: "windows", label: "Windows 安装版", icon: "monitor" },
    macos: { id: "macos", label: "macOS 通用包", icon: "apple" },
    portable: { id: "portable", label: "绿色便携版", icon: "package" },
    linux: { id: "linux", label: "Linux 运行包", icon: "terminal" },
    android: { id: "android", label: "Android APK", icon: "smartphone" },
    other: { id: "other", label: "下载包", icon: "file-down" }
  };

  const urlParams = new URLSearchParams(window.location.search);
  const isPreviewMode = urlParams.get("preview") === "1";
  const targetId = urlParams.get("id");
  const targetSlug = urlParams.get("slug");

  let catalog = null;
  let currentSoftware = null;
  let currentScreenshots = [];
  let lightboxIndex = 0;

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

  // 轻量安全 Markdown 解析器
  function renderMarkdown(md) {
    if (!md) return "";
    const lines = String(md).replace(/\r\n/g, "\n").split("\n");
    const blocks = [];
    let paragraph = [];
    let list = [];
    let inCode = false;
    let code = [];

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
        paragraph.push(trimmed);
      }
    }

    flushP();
    flushList();
    if (inCode) {
      blocks.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
    }

    return blocks.join("");
  }

  function inlineMarkdown(text) {
    return esc(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }

  // 复制提示
  function showToast(msg) {
    const toast = $("scToast");
    const label = $("scToastMsg");
    if (!toast) return;
    if (label) label.textContent = msg || "操作成功";
    toast.classList.add("sc-toast--show");
    setTimeout(() => {
      toast.classList.remove("sc-toast--show");
    }, 2400);
  }

  // 检测客户端操作系统
  function detectClientOS() {
    const ua = navigator.userAgent.toLowerCase();
    if (/macintosh|mac os x/.test(ua)) return "macos";
    if (/windows|win32|win64/.test(ua)) return "windows";
    if (/android/.test(ua)) return "android";
    if (/linux/.test(ua)) return "linux";
    return "windows";
  }

  // 渲染软件详情
  function renderSoftware(software) {
    if (!software) return;
    currentSoftware = software;

    document.title = `${software.name || "软件详情"} — 天才猫软件中心`;

    // 隐藏骨架屏，显示内容
    const skeleton = $("detailSkeleton");
    const content = $("detailContent");
    if (skeleton) skeleton.style.display = "none";
    if (content) content.style.display = "block";

    // 1. 基础信息
    const iconEl = $("appIcon");
    if (iconEl) iconEl.src = software.icon || "/logo.png";

    const nameEl = $("appName");
    if (nameEl) nameEl.textContent = software.name || "未命名软件";

    const tagEl = $("appTagline");
    if (tagEl) tagEl.textContent = software.tagline || "";

    const catBadge = $("appCategoryBadge");
    if (catBadge) catBadge.textContent = software.category || "应用工具";

    const priceBadge = $("appPriceBadge");
    if (priceBadge) {
      priceBadge.textContent = software.priceType === "paid" ? "付费正版" : (software.priceType === "freemium" ? "免费增值" : "官方免费");
      priceBadge.className = `sc-badge ${software.priceType === "paid" ? "sc-badge--cyan" : "sc-badge--emerald"}`;
    }

    const landingBadge = $("landingLinkBadge");
    if (landingBadge) {
      if (software.landingUrl) {
        landingBadge.href = software.landingUrl;
        landingBadge.style.display = "inline-flex";
      } else {
        landingBadge.style.display = "none";
      }
    }

    // 2. 发布版本计算
    const publishedReleases = (software.releases || [])
      .filter(r => r && r.status === "published" && (r.fileKey || r.publicUrl) && r.version && r.version !== "待上传")
      .sort((a, b) => {
        const timeA = typeof a.createdAt === "number" ? a.createdAt : new Date(a.createdAt || 0).getTime();
        const timeB = typeof b.createdAt === "number" ? b.createdAt : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

    const latest = publishedReleases.find(r => r.isLatest) || publishedReleases[0] || null;
    const latestVersion = latest ? latest.version : "";
    const latestPackages = publishedReleases.filter(r => r.version === latestVersion);

    // 平台徽标
    const platformsBadges = $("appPlatformsBadges");
    if (platformsBadges) {
      const uniquePlatforms = Array.from(new Set(publishedReleases.map(r => r.platform || "windows")));
      platformsBadges.innerHTML = uniquePlatforms.map(p => {
        const info = PLATFORM_MAP[p] || PLATFORM_MAP.other;
        return `
          <span class="sc-badge">
            <i data-lucide="${info.icon}" style="width: 12px; height: 12px;"></i>
            <span>${info.label}</span>
          </span>
        `;
      }).join("");
    }

    // 3. 智能主下载按钮识别
    const clientOS = detectClientOS();
    let recommendedPackage = latestPackages.find(p => p.platform === clientOS) || latestPackages[0] || latest;

    const primaryBtn = $("primaryDownloadBtn");
    const primaryLabel = $("primaryDownloadLabel");
    if (primaryBtn) {
      if (recommendedPackage) {
        primaryBtn.href = `/download/${encodeURIComponent(software.id)}?platform=${encodeURIComponent(recommendedPackage.platform || "windows")}`;
        const platLabel = (PLATFORM_MAP[recommendedPackage.platform] || PLATFORM_MAP.other).label;
        if (primaryLabel) {
          primaryLabel.textContent = `下载 ${platLabel} (v${recommendedPackage.version})`;
        }
      } else {
        primaryBtn.href = `/download/${encodeURIComponent(software.id)}`;
        if (primaryLabel) primaryLabel.textContent = "立即下载最新版";
      }
    }

    // 其它版本下拉菜单
    const otherWrap = $("otherPackagesWrap");
    const otherDropdown = $("otherPackagesDropdown");
    if (otherWrap && otherDropdown) {
      if (latestPackages.length > 1) {
        otherWrap.style.display = "block";
        otherDropdown.innerHTML = latestPackages.map(pkg => {
          const pInfo = PLATFORM_MAP[pkg.platform] || PLATFORM_MAP.other;
          const pkgSize = pkg.size ? formatBytes(pkg.size) : "";
          const dlLink = `/download/${encodeURIComponent(software.id)}?platform=${encodeURIComponent(pkg.platform || "")}`;
          return `
            <a href="${dlLink}" class="sc-rank__item" style="padding: 8px 12px; text-decoration: none;">
              <i data-lucide="${pInfo.icon}" style="width: 16px; height: 16px; color: var(--sc-cyan);"></i>
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 13px; font-weight: 600; color: #fff;">${pInfo.label}</div>
                <div style="font-size: 11px; color: var(--sc-text-dim);">${pkg.arch || "通用"} ${pkgSize ? "· " + pkgSize : ""}</div>
              </div>
              <i data-lucide="download" style="width: 14px; height: 14px; color: var(--sc-text-muted);"></i>
            </a>
          `;
        }).join("");
      } else {
        otherWrap.style.display = "none";
      }
    }

    // 4. 元信息排
    const metaVer = $("metaVersion");
    const metaSize = $("metaSize");
    const metaDate = $("metaDate");
    const metaDev = $("metaDeveloper");
    const metaDl = $("metaDownloads");
    const checksumBtn = $("metaChecksumBtn");
    const checksumDiv = $("metaChecksumDivider");
    const checksumText = $("metaChecksumText");

    if (metaVer) metaVer.textContent = latest ? `v${latest.version}` : "v1.0.0";
    if (metaSize) metaSize.textContent = latest && latest.size ? formatBytes(latest.size) : "纯净无捆绑";
    if (metaDate) metaDate.textContent = formatDate(latest ? latest.createdAt : software.updatedAt);
    if (metaDev) metaDev.textContent = software.developer || "官方团队";

    const totalDownloads = (software.releases || []).reduce((sum, r) => sum + (Number(r.downloadCount) || 0), 0);
    if (metaDl) metaDl.textContent = `${totalDownloads.toLocaleString()} 次下载`;

    if (checksumBtn && checksumText) {
      const sha = latest && (latest.sha256 || latest.checksum);
      if (sha) {
        checksumBtn.style.display = "inline-flex";
        if (checksumDiv) checksumDiv.style.display = "inline";
        checksumText.textContent = `SHA256: ${sha.slice(0, 8)}...${sha.slice(-6)}`;
        checksumBtn.onclick = () => {
          navigator.clipboard.writeText(sha).then(() => {
            showToast("SHA256 校验码已复制到剪贴板");
          });
        };
      } else {
        checksumBtn.style.display = "none";
        if (checksumDiv) checksumDiv.style.display = "none";
      }
    }

    // 5. 截图画廊
    currentScreenshots = software.screenshots || [];
    const gallerySection = $("gallerySection");
    const galleryTrack = $("galleryTrack");
    if (gallerySection && galleryTrack) {
      if (currentScreenshots.length) {
        gallerySection.style.display = "block";
        galleryTrack.innerHTML = currentScreenshots.map((imgUrl, idx) => `
          <div class="sc-gallery-thumb" data-screenshot-index="${idx}">
            <img src="${esc(imgUrl)}" alt="截图 ${idx + 1}" loading="lazy" />
          </div>
        `).join("");
      } else {
        gallerySection.style.display = "none";
      }
    }

    // 6. 详细介绍 Markdown
    const descSection = $("descSection");
    const descContent = $("descContent");
    if (descSection && descContent) {
      if (software.description) {
        descSection.style.display = "block";
        descContent.innerHTML = renderMarkdown(software.description);
      } else {
        descSection.style.display = "none";
      }
    }

    // 7. 特性亮点 (2-3 列玻璃卡)
    const featuresSection = $("featuresSection");
    const featuresGrid = $("featuresGrid");
    const highlights = software.highlights || [];
    if (featuresSection && featuresGrid) {
      if (highlights.length) {
        featuresSection.style.display = "block";
        featuresGrid.innerHTML = highlights.map(h => `
          <div class="sc-feature-card sc-glass sc-glass--hover sc-spotlight">
            <div class="sc-feature-card__icon">
              <i data-lucide="${h.icon || "sparkles"}" style="width: 22px; height: 22px;"></i>
            </div>
            <h3 class="sc-feature-card__title">${esc(h.title || "卓越特性")}</h3>
            <p class="sc-feature-card__desc">${esc(h.description || "")}</p>
          </div>
        `).join("");
      } else {
        featuresSection.style.display = "none";
      }
    }

    // 8. 各平台安装包卡片矩阵
    const packagesSection = $("packagesSection");
    const packagesGrid = $("packagesGrid");
    if (packagesSection && packagesGrid) {
      if (latestPackages.length) {
        packagesSection.style.display = "block";
        packagesGrid.innerHTML = latestPackages.map(pkg => {
          const pInfo = PLATFORM_MAP[pkg.platform] || PLATFORM_MAP.other;
          const pkgSize = pkg.size ? formatBytes(pkg.size) : "官方标准";
          const archText = pkg.arch ? `${pkg.arch.toUpperCase()} 架构` : "x64 通用架构";
          const dlUrl = `/download/${encodeURIComponent(software.id)}?platform=${encodeURIComponent(pkg.platform || "")}`;
          const sha = pkg.sha256 || pkg.checksum || "";

          return `
            <div class="sc-package-card sc-glass sc-glass--hover sc-spotlight">
              <div>
                <div class="sc-package-card__header">
                  <div class="sc-package-card__title">
                    <i data-lucide="${pInfo.icon}" style="width: 20px; height: 20px; color: var(--sc-cyan);"></i>
                    <span>${pInfo.label}</span>
                  </div>
                  <span class="sc-badge sc-badge--cyan" style="font-size: 11px;">v${esc(pkg.version)}</span>
                </div>
                <div class="sc-package-card__meta">
                  <div style="display: flex; justify-content: space-between;">
                    <span>体系架构</span>
                    <span style="color: #fff;">${esc(archText)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>文件大小</span>
                    <span style="color: #fff;">${pkgSize}</span>
                  </div>
                  ${sha ? `
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 6px; margin-top: 4px;">
                      <span>安全校验</span>
                      <button type="button" class="sc-btn-sha" data-sha="${esc(sha)}" style="color: var(--sc-cyan); cursor: pointer; display: flex; align-items: center; gap: 4px;" title="复制 SHA256">
                        <span>${sha.slice(0, 6)}...${sha.slice(-4)}</span>
                        <i data-lucide="copy" style="width: 12px; height: 12px;"></i>
                      </button>
                    </div>
                  ` : ""}
                </div>
              </div>
              <a href="${dlUrl}" class="sc-btn sc-btn--primary sc-btn-shimmer" style="width: 100%;">
                <i data-lucide="download" style="width: 16px; height: 16px;"></i>
                <span>高速下载安装包</span>
              </a>
            </div>
          `;
        }).join("");
      } else {
        packagesSection.style.display = "none";
      }
    }

    // 9. 历史版本更新折叠面板
    const historySection = $("historySection");
    const historyAccordion = $("historyAccordion");
    if (historySection && historyAccordion) {
      // 按版本分组已发布历史
      const versionGroups = {};
      publishedReleases.forEach(r => {
        if (!versionGroups[r.version]) {
          versionGroups[r.version] = [];
        }
        versionGroups[r.version].push(r);
      });

      const versions = Object.keys(versionGroups);
      if (versions.length) {
        historySection.style.display = "block";
        historyAccordion.innerHTML = versions.map((ver, idx) => {
          const pkgs = versionGroups[ver];
          const firstPkg = pkgs[0];
          const dateStr = formatDate(firstPkg.createdAt);
          const notes = firstPkg.changelog || "常规性能优化与已知问题修复。";
          const isOpen = idx === 0 ? "sc-accordion__item--open" : "";

          return `
            <div class="sc-accordion__item sc-glass ${isOpen}">
              <div class="sc-accordion__header">
                <div class="sc-accordion__title">
                  <span class="sc-badge--dot ${idx === 0 ? "sc-badge--dot-pulse" : ""}" style="color: ${idx === 0 ? "var(--sc-cyan)" : "var(--sc-text-dim)"};"></span>
                  <span>v${esc(ver)} 正式版发布</span>
                  <span style="font-size: 12px; color: var(--sc-text-dim); font-family: var(--sc-font-mono); font-weight: normal;">${dateStr}</span>
                </div>
                <i data-lucide="chevron-down" class="sc-accordion__icon" style="width: 18px; height: 18px; color: var(--sc-text-muted);"></i>
              </div>
              <div class="sc-accordion__body">
                <div style="margin-bottom: 14px;">${esc(notes)}</div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                  ${pkgs.map(p => {
                    const pInfo = PLATFORM_MAP[p.platform] || PLATFORM_MAP.other;
                    const pLink = `/download/${encodeURIComponent(software.id)}?platform=${encodeURIComponent(p.platform || "")}`;
                    return `
                      <a href="${pLink}" class="sc-btn sc-btn--ghost sc-btn--xs">
                        <i data-lucide="${pInfo.icon}" style="width: 12px; height: 12px;"></i>
                        <span>下载 ${pInfo.label}</span>
                      </a>
                    `;
                  }).join("")}
                </div>
              </div>
            </div>
          `;
        }).join("");
      } else {
        historySection.style.display = "none";
      }
    }

    // 10. 同分类推荐软件 (4 个卡片)
    const recSection = $("recommendSection");
    const recGrid = $("recommendGrid");
    if (recSection && recGrid && catalog && catalog.software) {
      const others = (catalog.software || [])
        .filter(s => s.id !== software.id && (s.status || "active") === "active")
        .sort((a, b) => {
          if (a.category === software.category && b.category !== software.category) return -1;
          if (a.category !== software.category && b.category === software.category) return 1;
          return 0;
        })
        .slice(0, 4);

      if (others.length) {
        recSection.style.display = "block";
        recGrid.innerHTML = others.map(s => {
          const coverUrl = s.coverUrl || s.coverImage || (s.screenshots && s.screenshots[0]) || "";
          const iconUrl = s.iconUrl || s.icon || "/logo.png";
          const detailUrl = `/software.html?id=${encodeURIComponent(s.id)}`;
          const dlUrl = `/download/${encodeURIComponent(s.id)}`;

          return `
            <article class="sc-card sc-glass sc-glass--hover sc-spotlight">
              <div class="sc-card__cover-wrap">
                ${coverUrl ? `
                  <img src="${esc(coverUrl)}" alt="${esc(s.name)}" class="sc-card__cover" loading="lazy" />
                ` : `
                  <div class="sc-card__cover-fallback">
                    <img src="${esc(iconUrl)}" alt="${esc(s.name)}" class="sc-card__cover-fallback-icon" />
                  </div>
                `}
                <img src="${esc(iconUrl)}" alt="${esc(s.name)}" class="sc-card__icon-floating" loading="lazy" />
              </div>
              <div class="sc-card__body">
                <div class="sc-card__header">
                  <h3 class="sc-card__name">${esc(s.name)}</h3>
                  <span class="sc-badge sc-badge--cyan" style="font-size: 11px;">${esc(s.category || "应用")}</span>
                </div>
                <p class="sc-card__tagline">${esc(s.tagline || "")}</p>
                <div class="sc-card__actions" style="margin-top: 14px;">
                  <a href="${dlUrl}" class="sc-btn sc-btn--primary sc-btn--xs sc-btn-shimmer">立即下载</a>
                  <a href="${detailUrl}" class="sc-btn sc-btn--ghost sc-btn--xs">详情</a>
                </div>
              </div>
            </article>
          `;
        }).join("");
      } else {
        recSection.style.display = "none";
      }
    }

    // 渲染关联文章列表（最多 6 篇，分“教程”和其他）
    const artSection = $("articlesSection");
    const artGrid = $("articlesGrid");
    if (artSection && artGrid) {
      const allArts = Array.isArray(catalog?.articles) ? catalog.articles : [];
      const swId = software.id;
      const swSlug = software.slug;

      const related = allArts
        .filter(a => a.status === "published" && Array.isArray(a.softwareIds) && (a.softwareIds.includes(swId) || (swSlug && a.softwareIds.includes(swSlug))))
        .sort((a, b) => {
          const isTutA = ["tutorial", "教程", "上手教程", "使用教程"].includes(a.category);
          const isTutB = ["tutorial", "教程", "上手教程", "使用教程"].includes(b.category);
          if (isTutA && !isTutB) return -1;
          if (!isTutA && isTutB) return 1;
          return (b.publishedAt || b.createdAt || 0) - (a.publishedAt || a.createdAt || 0);
        })
        .slice(0, 6);

      if (related.length > 0) {
        artSection.style.display = "block";
        artGrid.innerHTML = related.map(art => {
          const isTut = ["tutorial", "教程", "上手教程", "使用教程"].includes(art.category);
          const badgeText = isTut ? "使用教程" : (art.category || "文章");
          const dateText = formatDate(art.publishedAt || art.createdAt);
          const coverUrl = art.coverUrl || "/preview-desktop-widgets.png";
          const readUrl = `/article.html?slug=${encodeURIComponent(art.slug)}`;

          return `
            <article class="sc-card sc-glass sc-glass--hover sc-spotlight">
              <div class="sc-card__cover-wrap">
                <img src="${esc(coverUrl)}" alt="${esc(art.title)}" class="sc-card__cover" loading="lazy" />
              </div>
              <div class="sc-card__body">
                <div class="sc-card__header">
                  <h3 class="sc-card__name" style="font-size: 15px;">${esc(art.title)}</h3>
                  <span class="sc-badge ${isTut ? 'sc-badge--cyan' : 'sc-badge--emerald'}" style="font-size: 11px;">
                    ${esc(badgeText)}
                  </span>
                </div>
                <p class="sc-card__tagline" style="-webkit-line-clamp: 2;">${esc(art.summary || "点击阅读完整介绍与使用细节。")}</p>
                <div class="sc-card__actions" style="margin-top: 14px; justify-content: space-between; align-items: center;">
                  <span style="font-size: 11px; color: var(--sc-text-muted);">${esc(dateText)}</span>
                  <a href="${esc(readUrl)}" class="sc-btn sc-btn--ghost sc-btn--xs">
                    <span>阅读文章</span>
                    <i data-lucide="arrow-right" style="width: 12px; height: 12px;"></i>
                  </a>
                </div>
              </div>
            </article>
          `;
        }).join("");
      } else {
        artSection.style.display = "none";
      }
    }

    safeIcons();
  }

  // 灯箱展示
  function openLightbox(index) {
    if (!currentScreenshots.length) return;
    lightboxIndex = (index + currentScreenshots.length) % currentScreenshots.length;
    const modal = $("lightboxModal");
    const img = $("lightboxImg");
    if (modal && img) {
      img.src = currentScreenshots[lightboxIndex];
      modal.classList.add("sc-lightbox--open");
    }
  }

  function closeLightbox() {
    const modal = $("lightboxModal");
    if (modal) modal.classList.remove("sc-lightbox--open");
  }

  // 绑定交互事件
  function bindEvents() {
    // 聚光灯
    document.addEventListener("mousemove", e => {
      const target = e.target.closest(".sc-spotlight");
      if (target) {
        const rect = target.getBoundingClientRect();
        target.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
        target.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
      }
    });

    // 其它版本下拉菜单展开与关闭
    const otherBtn = $("otherPackagesBtn");
    const otherDropdown = $("otherPackagesDropdown");
    if (otherBtn && otherDropdown) {
      otherBtn.addEventListener("click", e => {
        e.stopPropagation();
        const isShow = otherDropdown.style.display === "block";
        otherDropdown.style.display = isShow ? "none" : "block";
      });

      document.addEventListener("click", () => {
        otherDropdown.style.display = "none";
      });
    }

    // 历史折叠面板点击
    const accordion = $("historyAccordion");
    if (accordion) {
      accordion.addEventListener("click", e => {
        const header = e.target.closest(".sc-accordion__header");
        if (header) {
          const item = header.closest(".sc-accordion__item");
          if (item) {
            item.classList.toggle("sc-accordion__item--open");
          }
        }
      });
    }

    // 截图画廊点击打开灯箱
    const galleryTrack = $("galleryTrack");
    if (galleryTrack) {
      galleryTrack.addEventListener("click", e => {
        const thumb = e.target.closest(".sc-gallery-thumb");
        if (thumb) {
          const idx = parseInt(thumb.getAttribute("data-screenshot-index"), 10);
          if (!isNaN(idx)) openLightbox(idx);
        }
      });
    }

    // 灯箱切换
    const lbClose = $("lightboxClose");
    const lbPrev = $("lightboxPrev");
    const lbNext = $("lightboxNext");
    const lbModal = $("lightboxModal");

    if (lbClose) lbClose.addEventListener("click", closeLightbox);
    if (lbPrev) lbPrev.addEventListener("click", () => openLightbox(lightboxIndex - 1));
    if (lbNext) lbNext.addEventListener("click", () => openLightbox(lightboxIndex + 1));
    if (lbModal) {
      lbModal.addEventListener("click", e => {
        if (e.target === lbModal) closeLightbox();
      });
    }

    // 键盘支持
    window.addEventListener("keydown", e => {
      if (!lbModal || !lbModal.classList.contains("sc-lightbox--open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") openLightbox(lightboxIndex - 1);
      if (e.key === "ArrowRight") openLightbox(lightboxIndex + 1);
    });

    // 复制各平台 SHA 校验码
    document.addEventListener("click", e => {
      const copyBtn = e.target.closest(".sc-btn-sha");
      if (copyBtn) {
        const sha = copyBtn.getAttribute("data-sha");
        if (sha) {
          navigator.clipboard.writeText(sha).then(() => {
            showToast("SHA256 校验码已复制到剪贴板");
          });
        }
      }
    });
  }

  // 初始化入口
  async function init() {
    bindEvents();

    // Studio 实时预览模式
    if (isPreviewMode) {
      window.addEventListener("message", e => {
        if (e.data && e.data.type === "studio-preview" && e.data.software) {
          renderSoftware(e.data.software);
        }
      });

      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "studio-preview-ready" }, "*");
      }
    }

    const CACHE_KEY = "software_center_catalog_cache_v3";
    let hasRendered = false;

    function tryRenderFromCatalog(cat) {
      if (!cat || !Array.isArray(cat.software)) return false;
      const list = cat.software || [];
      let m = null;
      if (targetId) m = list.find(s => String(s.id) === String(targetId));
      if (!m && targetSlug) m = list.find(s => s.slug === targetSlug);
      if (!m && list.length) m = list[0];
      if (m) {
        renderSoftware(m);
        return true;
      }
      return false;
    }

    // 1. 同步秒开：读取本地缓存
    if (!isPreviewMode) {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          if (tryRenderFromCatalog(cached)) {
            hasRendered = true;
          }
        }
      } catch (e) {}
    }

    const fallbackSoftware = {
      id: "desktop",
      slug: "desktop",
      name: "天才猫桌面 2.0",
      category: "桌面效能",
      priceLabel: "免费版",
      developer: "天才猫工作室",
      tagline: "专为 Windows 打造的灵动桌面与运营中枢",
      description: "灵动抽屉式侧边收纳、C盘无损搬家管家、顶部偷看Dock与离线多语 OCR 翻译。专为追求极致效能的桌面用户打造。",
      iconUrl: "/logo.png",
      coverUrl: "/preview-desktop-widgets.png",
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
    };

    // 2. 首次访问兜底秒开：未命中本地缓存时立即使用内置数据，消除加载停顿
    if (!hasRendered && !isPreviewMode) {
      renderSoftware(fallbackSoftware);
      hasRendered = true;
    }

    // 3. 异步网络刷新
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch("/api/catalog?_t=" + Date.now(), { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        catalog = await res.json();
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(catalog));
        } catch (e) {}
        tryRenderFromCatalog(catalog);
      }
    } catch (err) {
      console.warn("加载 catalog 异常/超时:", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
