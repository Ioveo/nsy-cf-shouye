loadArticle();
initReadingTools();
initReadingProgress();

async function loadArticle() {
  const params = new URLSearchParams(location.search);
  const isPreview = params.get("preview") === "1";
  const slug = params.get("slug") || params.get("id");
  const root = document.getElementById("articleDetail");

  if (isPreview) {
    window.addEventListener("message", event => {
      if (event.origin !== location.origin) return;
      if (event.data && event.data.type === "studio-preview" && event.data.article) {
        document.title = `${event.data.article.title || "文章预览"} - 天才猫软件中心`;
        renderArticle(event.data.article, event.data.relatedSoftware || []);
      }
    });
    try { window.parent?.postMessage({ type: "preview-ready" }, location.origin); } catch {}
    if (!slug) return;
  }

  if (!slug) {
    root.innerHTML = "<section class='page-hero' style='text-align:center;padding:120px 24px;'><h1>文章不存在。</h1><p style='color:var(--detail-muted);margin-top:12px;'><a href='/articles.html' style='color:var(--detail-acc);'>返回文章专栏</a></p></section>";
    return;
  }
  const apiUrl = isPreview
    ? `/api/article/${encodeURIComponent(slug)}?preview=1`
    : `/api/article/${encodeURIComponent(slug)}`;
  const response = await fetch(apiUrl, { cache: "no-store" });
  if (!response.ok) {
    root.innerHTML = "<section class='page-hero' style='text-align:center;padding:120px 24px;'><h1>文章不存在。</h1><p style='color:var(--detail-muted);margin-top:12px;'><a href='/articles.html' style='color:var(--detail-acc);'>返回文章专栏</a></p></section>";
    return;
  }
  const data = await response.json();
  renderNavigation(data.navigation || []);
  document.title = `${data.article.seoTitle || data.article.title} - 天才猫软件中心`;
  const description = data.article.seoDescription || data.article.summary || data.article.title;
  setMetaDescription(description);
  setSocialMeta({
    title: data.article.seoTitle || data.article.title,
    description,
    image: data.article.coverUrl,
    type: "article"
  });
  setJsonLd(articleJsonLd(data.article));
  renderArticle(data.article, data.relatedSoftware || []);
}

function renderArticle(article, software) {
  const root = document.getElementById("articleDetail");
  const rendered = enhanceArticleContent(renderContent(article.content));
  const bottomWidget = renderArticleBottomWidget(software);

  const words = countWords(article.content);
  const readMinutes = Math.max(1, Math.ceil(words / 400));
  const category = article.category || "技术教程";
  const authorName = article.author || "天才猫官方";
  const dateStr = formatDate(article.publishedAt || article.createdAt || Date.now());
  const tagList = Array.isArray(article.tags) ? article.tags : [];
  const tagsHtml = tagList.map(tag => `<span class="meta-chip meta-tag">#${escapeHtml(tag)}</span>`).join("");

  // 同步顶栏吸顶标题
  const navTitle = document.getElementById("navArticleTitle");
  if (navTitle) {
    navTitle.textContent = article.title || "";
    navTitle.title = article.title || "";
  }

  // 大图封面
  const coverHtml = article.coverUrl
    ? `<div class="article-hero-cover"><img src="${escapeAttr(article.coverUrl)}" alt="${escapeAttr(article.title)}" loading="eager" /></div>`
    : "";

  // 摘要 / 导语
  const leadHtml = article.summary
    ? `<p class="article-lead">${escapeHtml(article.summary)}</p>`
    : "";

  // 杂志级大 Hero 头部
  const heroHtml = `
    <header class="article-hero">
      <div class="article-hero__inner">
        <nav class="article-breadcrumb" aria-label="面包屑导航">
          <a href="/">首页</a>
          <span class="sep">/</span>
          <a href="/articles.html">文章专栏</a>
          <span class="sep">/</span>
          <span class="cat-tag">${escapeHtml(category)}</span>
        </nav>
        <h1 class="article-title">${escapeHtml(article.title)}</h1>
        ${leadHtml}
        <div class="article-byline">
          <div class="article-byline__author">
            <div class="author-avatar">${escapeHtml(authorName.slice(0, 1))}</div>
            <div class="author-meta">
              <span class="author-name">${escapeHtml(authorName)}</span>
              <span class="author-role">专栏创作者 · Verified</span>
            </div>
          </div>
          <div class="article-byline__chips">
            <span class="meta-chip" title="预计阅读时间">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              约 ${readMinutes} 分钟
            </span>
            <span class="meta-chip" title="正文字数">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
              ${words} 字
            </span>
            <span class="meta-chip" title="发布日期">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              ${dateStr}
            </span>
            ${tagsHtml}
          </div>
        </div>
        ${coverHtml}
      </div>
    </header>
  `;

  // 1440px 黄金双栏网格
  const layoutHtml = `
    <div class="article-layout">
      <main class="article-main">
        <article class="article-viewer">
          ${rendered.html}
          ${bottomWidget}
        </article>
      </main>
      ${renderAside(rendered.headings, software)}
    </div>
  `;

  root.innerHTML = heroHtml + layoutHtml;
  bindArticleImages();
  bindArticleAudio();
  bindCodeBlocks();
  bindHeadingAnchors();
  initTocScrollSpy();
  initMobileToc(rendered.headings);
}

function initReadingProgress() {
  const progBar = document.getElementById("prog");
  const navTitle = document.getElementById("navArticleTitle");

  let ticking = false;
  const onScroll = () => {
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (progBar) {
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      progBar.style.width = Math.min(100, Math.max(0, scrolled)) + "%";
    }

    if (navTitle) {
      if (winScroll > 240) {
        navTitle.classList.add("is-visible");
      } else {
        navTitle.classList.remove("is-visible");
      }
    }
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
}

function initTocScrollSpy() {
  const tocLinks = Array.from(document.querySelectorAll(".article-toc__item"));
  if (!tocLinks.length) return;

  // 点击平滑滚动，并考虑吸顶导航高度偏移
  tocLinks.forEach(link => {
    link.addEventListener("click", e => {
      const href = link.getAttribute("href") || "";
      if (href.startsWith("#")) {
        const targetId = href.slice(1);
        const targetElem = document.getElementById(targetId);
        if (targetElem) {
          e.preventDefault();
          const navOffset = 84;
          const targetTop = targetElem.getBoundingClientRect().top + window.pageYOffset - navOffset;
          window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
          history.replaceState(null, "", `#${targetId}`);
        }
      }
    });
  });

  // 滚动时高亮当前可视区对应的标题
  const headingElements = Array.from(document.querySelectorAll(".article-viewer h2, .article-viewer h3"));
  if (!headingElements.length) return;

  let ticking = false;
  const updateActiveToc = () => {
    const scrollPos = window.scrollY + 120;
    let currentId = "";
    for (let i = 0; i < headingElements.length; i++) {
      const h = headingElements[i];
      if (h.offsetTop <= scrollPos) {
        currentId = h.id;
      } else {
        break;
      }
    }
    if (!currentId && headingElements.length > 0 && window.scrollY < 400) {
      currentId = headingElements[0].id;
    }

    tocLinks.forEach(link => {
      const target = (link.getAttribute("href") || "").replace(/^#/, "");
      if (target && target === currentId) {
        link.classList.add("is-active");
      } else {
        link.classList.remove("is-active");
      }
    });
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(updateActiveToc);
      ticking = true;
    }
  }, { passive: true });

  updateActiveToc();
}

function initReadingTools() {
  document.getElementById("copyArticleLink")?.addEventListener("click", copyArticleLink);
  document.getElementById("backToTop")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  document.getElementById("closeImageLightbox")?.addEventListener("click", closeImageLightbox);
  document.getElementById("imageLightbox")?.addEventListener("click", event => {
    if (event.target.id === "imageLightbox" || event.target.id === "closeImageLightbox") closeImageLightbox();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeImageLightbox();
      const mobileDrawer = document.getElementById("mobileTocDrawer");
      if (mobileDrawer && !mobileDrawer.hidden) {
        mobileDrawer.hidden = true;
        document.body.style.overflow = "";
      }
    }
  });
}

function bindArticleImages() {
  document.querySelectorAll(".article-viewer img").forEach(img => {
    img.tabIndex = 0;
    img.role = "button";
    img.title = "点击放大预览";

    const figure = img.closest("figure");
    const figcaption = figure ? figure.querySelector("figcaption") : null;
    const captionText = figcaption ? figcaption.textContent.trim() : (img.alt || "");

    const triggerOpen = () => openImageLightbox(img.src, captionText);
    img.addEventListener("click", triggerOpen);
    img.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        triggerOpen();
      }
    });
  });
}

function bindArticleAudio() {
  document.querySelectorAll(".article-embed-music").forEach(card => {
    const audio = card.querySelector("audio");
    const playBtn = card.querySelector(".article-embed-music__play-btn");
    const icon = card.querySelector(".article-embed-music__play-icon");
    if (!playBtn) return;

    playBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isCurrentlyPlaying = card.classList.contains("is-playing");
      if (!isCurrentlyPlaying) {
        // 暂停其它正在播放的嵌入音乐
        document.querySelectorAll(".article-embed-music").forEach(other => {
          if (other !== card && other.classList.contains("is-playing")) {
            const oAudio = other.querySelector("audio");
            try { oAudio?.pause(); } catch {}
            other.classList.remove("is-playing");
            const oIcon = other.querySelector(".article-embed-music__play-icon");
            if (oIcon) oIcon.textContent = "▶";
          }
        });
        card.classList.add("is-playing");
        if (icon) icon.textContent = "⏸";
        if (audio) {
          try { audio.play().catch(() => {}); } catch {}
        }
      } else {
        card.classList.remove("is-playing");
        if (icon) icon.textContent = "▶";
        if (audio) {
          try { audio.pause(); } catch {}
        }
      }
    });

    if (audio) {
      audio.addEventListener("ended", () => {
        card.classList.remove("is-playing");
        if (icon) icon.textContent = "▶";
      });
      audio.addEventListener("pause", () => {
        card.classList.remove("is-playing");
        if (icon) icon.textContent = "▶";
      });
      audio.addEventListener("play", () => {
        card.classList.add("is-playing");
        if (icon) icon.textContent = "⏸";
      });
    }
  });
}

async function copyArticleLink() {
  const button = document.getElementById("copyArticleLink");
  try {
    await navigator.clipboard.writeText(location.href);
    if (button) {
      const oldHtml = button.innerHTML;
      button.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:#38bdf8;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      button.setAttribute("title", "已复制到剪贴板");
      setTimeout(() => {
        button.innerHTML = oldHtml;
        button.setAttribute("title", "复制文章链接");
      }, 1600);
    }
  } catch {
    if (button) {
      const oldHtml = button.innerHTML;
      button.innerHTML = "✕";
      setTimeout(() => {
        button.innerHTML = oldHtml;
      }, 1600);
    }
  }
}

function openImageLightbox(src, caption = "") {
  const lightbox = document.getElementById("imageLightbox");
  const image = document.getElementById("imageLightboxImg");
  const captionElem = document.getElementById("imageLightboxCaption");
  if (!lightbox || !image) return;
  image.src = src;
  if (captionElem) {
    captionElem.textContent = caption;
    captionElem.style.display = caption ? "block" : "none";
  }
  lightbox.hidden = false;
  document.body.classList.add("is-lightbox-open");
}

function closeImageLightbox() {
  const lightbox = document.getElementById("imageLightbox");
  const image = document.getElementById("imageLightboxImg");
  const captionElem = document.getElementById("imageLightboxCaption");
  if (!lightbox || !image) return;
  lightbox.hidden = true;
  image.removeAttribute("src");
  if (captionElem) captionElem.textContent = "";
  document.body.classList.remove("is-lightbox-open");
}

function setMetaDescription(value) {
  let meta = document.querySelector("meta[name='description']");
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "description";
    document.head.append(meta);
  }
  meta.content = String(value || "").slice(0, 160);
}

function setSocialMeta({ title, description, image, type = "website" }) {
  const fullTitle = `${title} - 天才猫软件中心`;
  setMetaProperty("og:type", type);
  setMetaProperty("og:title", fullTitle);
  setMetaProperty("og:description", description);
  setMetaProperty("og:url", location.href);
  if (image) setMetaProperty("og:image", absoluteUrl(image));
  setMetaName("twitter:card", image ? "summary_large_image" : "summary");
  setMetaName("twitter:title", fullTitle);
  setMetaName("twitter:description", description);
  if (image) setMetaName("twitter:image", absoluteUrl(image));
}

function setJsonLd(data) {
  let script = document.getElementById("structuredData");
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "structuredData";
    document.head.append(script);
  }
  script.textContent = JSON.stringify(data);
}

function articleJsonLd(article) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.seoTitle || article.title,
    description: article.seoDescription || article.summary || article.title,
    image: article.coverUrl ? [absoluteUrl(article.coverUrl)] : undefined,
    datePublished: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined,
    dateModified: article.updatedAt ? new Date(article.updatedAt).toISOString() : undefined,
    author: { "@type": "Organization", name: "天才猫软件中心" },
    publisher: { "@type": "Organization", name: "天才猫软件中心", logo: { "@type": "ImageObject", url: absoluteUrl("/logo.png") } },
    mainEntityOfPage: location.href,
    keywords: (article.tags || []).join(",") || undefined
  };
}

function setMetaProperty(property, content) {
  if (!content) return;
  let meta = document.querySelector(`meta[property='${property}']`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("property", property);
    document.head.append(meta);
  }
  meta.content = content;
}

function setMetaName(name, content) {
  if (!content) return;
  let meta = document.querySelector(`meta[name='${name}']`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.append(meta);
  }
  meta.content = content;
}

function absoluteUrl(value) {
  return new URL(value || "/", location.origin).href;
}

function renderAside(headings, software) {
  const hasHeadings = headings && headings.length > 0;
  const hasSoftware = software && software.length > 0;
  if (!hasHeadings && !hasSoftware) return "";

  return `
    <aside class="article-sidebar">
      <div class="article-sidebar__sticky">
        ${renderToc(headings)}
        ${renderRelated(software)}
      </div>
    </aside>
  `;
}

function renderToc(headings) {
  if (!headings || !headings.length) return "";
  return `
    <section class="article-toc" aria-label="目录索引">
      <div class="article-toc__header">
        <h3>目录导航</h3>
        <span style="font-size: 11.5px; color: var(--detail-muted);">${headings.length} 节</span>
      </div>
      <nav class="article-toc__list">
        ${headings.map(item => `
          <a class="article-toc__item article-toc__item--${escapeAttr(item.level)}" href="#${escapeAttr(item.id)}" data-toc-target="${escapeAttr(item.id)}">
            ${escapeHtml(item.text)}
          </a>
        `).join("")}
      </nav>
    </section>
  `;
}

function renderRelated(software) {
  if (!software || !software.length) return "";
  return `
    <section class="article-sidebar-download" aria-label="配套软件推荐">
      <div class="article-sidebar-download__title">配套软件推荐</div>
      <div class="article-sidebar-download__list">
        ${software.map(item => {
          const iconUrl = item.iconUrl || item.icon || "/logo.png";
          const dlUrl = `/download/latest/${encodeURIComponent(item.slug || item.id)}`;
          return `
            <a class="sidebar-software-card" href="${escapeAttr(dlUrl)}">
              <img src="${escapeAttr(iconUrl)}" alt="${escapeAttr(item.name)}" loading="lazy" />
              <div>
                <h4>${escapeHtml(item.name)}</h4>
                <p>${escapeHtml(item.tagline || item.description || "点击直接下载最新稳定版")}</p>
              </div>
            </a>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderArticleBottomWidget(software) {
  if (!software || !software.length) return "";
  return software.map(item => {
    const iconUrl = item.iconUrl || item.icon || "/logo.png";
    const ver = item.latest?.version ? `v${escapeHtml(item.latest.version)}` : "官方最新版";
    const dlUrl = `/download/latest/${encodeURIComponent(item.slug || item.id)}`;
    const detailUrl = `/software.html?slug=${encodeURIComponent(item.slug || item.id)}`;

    return `
      <div class="article-software-widget">
        <div class="article-software-widget__info">
          <img src="${escapeAttr(iconUrl)}" alt="${escapeAttr(item.name)}" class="article-software-widget__icon" />
          <div>
            <h3 class="article-software-widget__name">
              <span>${escapeHtml(item.name)}</span>
              <span class="article-software-widget__version">${ver}</span>
            </h3>
            <p class="article-software-widget__desc">${escapeHtml(item.tagline || item.description || "官方正版安全下载，享受极致灵动桌面与高效体验。")}</p>
          </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <a href="${escapeAttr(dlUrl)}" class="article-software-widget__btn">
            ↓ 立即下载
          </a>
          <a href="${escapeAttr(detailUrl)}" class="button button--ghost" style="font-size: 13px; text-decoration: none;">
            了解详情
          </a>
        </div>
      </div>
    `;
  }).join("");
}

function enhanceArticleContent(html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  const headings = [];
  const used = new Set();
  for (const heading of Array.from(template.content.querySelectorAll("h2, h3"))) {
    const text = heading.textContent.trim();
    if (!text) continue;
    const base = slugifyHeading(text) || `section-${headings.length + 1}`;
    let id = base;
    let index = 2;
    while (used.has(id)) id = `${base}-${index++}`;
    used.add(id);
    heading.id = id;
    headings.push({ id, text, level: heading.tagName.toLowerCase() });

    // 添加可复制标题直达锚点
    const anchor = document.createElement("a");
    anchor.className = "heading-anchor";
    anchor.href = `#${id}`;
    anchor.title = "复制小节直达链接";
    anchor.setAttribute("aria-label", "复制小节直达链接");
    anchor.textContent = "#";
    heading.appendChild(anchor);
  }
  return { html: template.innerHTML, headings };
}

function bindCodeBlocks() {
  const preElements = document.querySelectorAll(".article-viewer pre");
  preElements.forEach(pre => {
    if (pre.closest(".code-block-wrapper")) return;

    const code = pre.querySelector("code");
    const rawCode = code ? (code.innerText || code.textContent || "") : (pre.innerText || pre.textContent || "");

    // 探测代码语言
    let lang = "CODE";
    if (code && code.className) {
      const match = code.className.match(/(?:language-|lang-)([a-z0-9_-]+)/i);
      if (match && match[1]) {
        lang = match[1].toUpperCase();
      }
    }
    if (lang === "CODE") {
      const trimmed = rawCode.trim();
      if (/^(?:npm|pnpm|yarn|bun|curl|git|sudo|cd|ls|mkdir|docker|cat|bash|sh)\s/m.test(trimmed)) {
        lang = "BASH";
      } else if (/^\{[\s\S]*\}$|^\[[\s\S]*\]$/m.test(trimmed)) {
        lang = "JSON";
      } else if (/^<(?:html|div|span|p|section|article|svg|template|table)/i.test(trimmed)) {
        lang = "HTML";
      } else if (/(?:const|let|var|function|export|import|=>|\.addEventListener)\b/.test(trimmed)) {
        lang = "JAVASCRIPT";
      } else if (/(?:def\s+\w+|import\s+\w+|from\s+\w+\s+import|if\s+__name__\s*==)/.test(trimmed)) {
        lang = "PYTHON";
      } else if (/(?:SELECT|INSERT|UPDATE|DELETE|CREATE TABLE)\b/i.test(trimmed)) {
        lang = "SQL";
      }
    }

    const wrapper = document.createElement("div");
    wrapper.className = "code-block-wrapper";

    const header = document.createElement("div");
    header.className = "code-block-header";
    header.innerHTML = `
      <div class="code-block-dots">
        <span class="code-block-dot code-block-dot--red"></span>
        <span class="code-block-dot code-block-dot--yellow"></span>
        <span class="code-block-dot code-block-dot--green"></span>
      </div>
      <span class="code-block-lang">${escapeHtml(lang)}</span>
      <button type="button" class="code-copy-btn" title="复制代码" aria-label="复制代码">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        <span>复制</span>
      </button>
    `;

    const copyBtn = header.querySelector(".code-copy-btn");
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(rawCode);
        copyBtn.classList.add("is-copied");
        copyBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>已复制</span>
        `;
        showToast("代码已复制到剪贴板");
        setTimeout(() => {
          copyBtn.classList.remove("is-copied");
          copyBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>复制</span>
          `;
        }, 1800);
      } catch (err) {
        showToast("复制失败，请手动选取复制");
      }
    });

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);
  });
}

function bindHeadingAnchors() {
  document.querySelectorAll(".article-viewer .heading-anchor").forEach(anchor => {
    anchor.addEventListener("click", async (e) => {
      e.preventDefault();
      const href = anchor.getAttribute("href") || "";
      const targetId = href.replace(/^#/, "");
      const targetElem = document.getElementById(targetId);
      if (targetElem) {
        const fullUrl = new URL(href, location.href).href;
        try {
          await navigator.clipboard.writeText(fullUrl);
          showToast("已复制小节直达链接");
        } catch {
          // fallback
        }
        const navOffset = 84;
        const targetTop = targetElem.getBoundingClientRect().top + window.pageYOffset - navOffset;
        window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
        history.replaceState(null, "", `#${targetId}`);
      }
    });
  });
}

let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById("detailToast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("is-show");
  }, 2200);
}

function initMobileToc(headings) {
  const drawer = document.getElementById("mobileTocDrawer");
  const list = document.getElementById("mobileTocList");
  const openBtn = document.getElementById("mobileTocBtn");
  const closeBtn = document.getElementById("closeMobileToc");
  const backdrop = document.getElementById("mobileTocBackdrop");

  if (!drawer || !list) return;

  if (!headings || !headings.length) {
    if (openBtn) openBtn.style.display = "none";
    return;
  }
  if (openBtn) openBtn.style.display = "";

  list.innerHTML = headings.map(item => `
    <a class="mobile-toc-item mobile-toc-item--${escapeAttr(item.level)}" href="#${escapeAttr(item.id)}" data-toc-target="${escapeAttr(item.id)}">
      ${escapeHtml(item.text)}
    </a>
  `).join("");

  const closeDrawer = () => {
    drawer.hidden = true;
    document.body.style.overflow = "";
  };

  const openDrawer = () => {
    drawer.hidden = false;
    document.body.style.overflow = "hidden";
  };

  openBtn?.addEventListener("click", openDrawer);
  closeBtn?.addEventListener("click", closeDrawer);
  backdrop?.addEventListener("click", closeDrawer);

  list.querySelectorAll(".mobile-toc-item").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      closeDrawer();
      const targetId = (link.getAttribute("href") || "").replace(/^#/, "");
      const targetElem = document.getElementById(targetId);
      if (targetElem) {
        const navOffset = 84;
        const targetTop = targetElem.getBoundingClientRect().top + window.pageYOffset - navOffset;
        window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
        history.replaceState(null, "", `#${targetId}`);
      }
    });
  });
}

function slugifyHeading(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-").replace(/^-+|-+$/g, "");
}

function renderContent(content) {
  const value = String(content || "").trim();
  if (!value) return "<p>暂无正文。</p>";

  // 1. 将 Markdown 图片语法统一转为标准的响应式 Figure/Img 结构
  let html = value.replace(/!\[([^\]]*)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g, (match, alt, src) => {
    const cleanAlt = escapeHtml(alt.trim());
    const captionHtml = cleanAlt ? `<figcaption class="article-image-caption">${cleanAlt}</figcaption>` : "";
    return `<figure class="article-image-box"><img src="${escapeAttr(src)}" alt="${cleanAlt}" loading="lazy" class="article-img" />${captionHtml}</figure>`;
  });

  // 2. 将 Markdown 链接语法转为 <a>
  html = html.replace(/(?<!\!)\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g, (match, text, href) => {
    return `<a href="${escapeAttr(href)}" target="_blank" rel="noopener">${escapeHtml(text)}</a>`;
  });

  // 3. 将 Markdown 粗体与行内代码转化
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // 4. 将独立行的标题与引用转化
  html = html.replace(/^###\s+(.*$)/gim, '<h3>$1</h3>')
             .replace(/^##\s+(.*$)/gim, '<h2>$1</h2>')
             .replace(/^#\s+(.*$)/gim, '<h1>$1</h1>')
             .replace(/^>\s+(.*$)/gim, '<blockquote>$1</blockquote>');

  // 5. 判断是否含有常见块级 HTML 标签
  const hasHtmlBlock = /<(?:div|p|section|blockquote|table|ul|ol|h[1-6]|figure|article|hr|pre)[\s>]/i.test(html);
  if (!hasHtmlBlock) {
    return sanitizeArticleHtml(markdownToHtml(value));
  }

  // 6. 混合排版：对未被 HTML 块级标签包裹的松散文字段落自动包裹 <p>
  html = formatHybridParagraphs(html);

  return sanitizeArticleHtml(html);
}

function formatHybridParagraphs(html) {
  const chunks = html.split(/\n{2,}/);
  return chunks.map(chunk => {
    const trimmed = chunk.trim();
    if (!trimmed) return "";
    if (/^<(?:div|p|section|blockquote|table|ul|ol|h[1-6]|figure|article|hr|pre)[\s>]/i.test(trimmed)) {
      return trimmed;
    }
    return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
  }).filter(Boolean).join("\n\n");
}

function sanitizeArticleHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = String(html || "");
  const allowedTags = new Set([
    "A", "P", "BR", "STRONG", "B", "EM", "I", "U", "S", "DEL", "MARK", "HR",
    "UL", "OL", "LI", "BLOCKQUOTE", "H1", "H2", "H3", "H4", "H5", "IMG", "FIGURE", "FIGCAPTION",
    "AUDIO", "VIDEO", "SOURCE", "TABLE", "THEAD", "TBODY", "TR", "TH", "TD", "PRE", "CODE",
    "DIV", "SPAN", "SECTION", "BUTTON"
  ]);
  const allowedAttrs = {
    A: new Set(["href", "target", "rel", "class"]),
    IMG: new Set(["src", "alt", "loading", "class", "style", "width", "height", "data-href"]),
    AUDIO: new Set(["src", "controls", "preload", "class"]),
    VIDEO: new Set(["src", "controls", "preload", "width", "height", "class", "style", "poster", "autoplay", "loop"]),
    SOURCE: new Set(["src", "type"]),
    FIGURE: new Set(["class", "style"]),
    FIGCAPTION: new Set(["class", "style"]),
    CODE: new Set(["class"]),
    PRE: new Set(["class"]),
    TABLE: new Set(["class", "style", "width", "border", "cellpadding", "cellspacing"]),
    THEAD: new Set(["class", "style"]),
    TBODY: new Set(["class", "style"]),
    TR: new Set(["class", "style"]),
    TH: new Set(["class", "style", "colspan", "rowspan", "colSpan", "rowSpan", "width"]),
    TD: new Set(["class", "style", "colspan", "rowspan", "colSpan", "rowSpan", "width"]),
    DIV: new Set(["class", "style"]),
    SPAN: new Set(["class", "style"]),
    SECTION: new Set(["class", "style"]),
    BUTTON: new Set(["class", "type", "style", "aria-label", "aria-hidden"]),
    P: new Set(["class", "style"]),
    BLOCKQUOTE: new Set(["class", "style"]),
    MARK: new Set(["class", "style"]),
    HR: new Set(["class"]),
    H1: new Set(["class", "style"]),
    H2: new Set(["class", "style"]),
    H3: new Set(["class", "style"]),
    H4: new Set(["class", "style"]),
    H5: new Set(["class", "style"]),
    UL: new Set(["class", "style"]),
    OL: new Set(["class", "style"]),
    LI: new Set(["class", "style"])
  };
  const cleanNode = node => {
    if (node.nodeType === Node.COMMENT_NODE) { node.remove(); return; }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (!allowedTags.has(node.tagName)) { node.replaceWith(...Array.from(node.childNodes)); return; }
    for (const attr of Array.from(node.attributes)) {
      const allowed = allowedAttrs[node.tagName]?.has(attr.name) || attr.name.startsWith("data-") || attr.name.startsWith("aria-");
      if (!allowed || attr.name.startsWith("on") || attr.value.startsWith("javascript:")) node.removeAttribute(attr.name);
    }
    if (node.tagName === "A") {
      const href = node.getAttribute("href") || "";
      if (!/^(https?:\/\/|\/)/.test(href)) node.removeAttribute("href");
      node.setAttribute("rel", "noopener");
      if (/^https?:\/\//.test(href)) node.setAttribute("target", "_blank");
    }
    if ((node.tagName === "IMG" || node.tagName === "AUDIO" || node.tagName === "VIDEO" || node.tagName === "SOURCE") && !/^(https?:\/\/|\/)/.test(node.getAttribute("src") || "")) node.removeAttribute("src");
    for (const child of Array.from(node.childNodes)) cleanNode(child);
  };
  for (const child of Array.from(template.content.childNodes)) cleanNode(child);
  return template.innerHTML;
}

function markdownToHtml(value) {
  const blocks = [];
  const lines = String(value || "").replace(/\r\n/g, "\n").split("\n");
  let paragraph = [];
  let list = [];
  let code = [];
  let inCode = false;
  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(`<p>${inlineMarkdown(paragraph.join("\n")).replace(/\n/g, "<br>")}</p>`);
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
        blocks.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        code = [];
        inCode = false;
      } else {
        flushParagraph();
        flushList();
        inCode = true;
      }
      continue;
    }
    if (inCode) { code.push(line); continue; }
    if (!line.trim()) { flushParagraph(); flushList(); continue; }
    const heading = /^(#{2,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      blocks.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    const quote = /^>\s+(.+)$/.exec(line);
    if (quote) { flushParagraph(); flushList(); blocks.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`); continue; }
    const bullet = /^[-*]\s+(.+)$/.exec(line);
    if (bullet) { flushParagraph(); list.push(bullet[1]); continue; }
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  if (inCode) blocks.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
  return blocks.join("");
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/!\[([^\]]*)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g, `<img src="$2" alt="$1" loading="lazy">`)
    .replace(/(?<!\!)\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g, `<a href="$2" target="_blank" rel="noopener">$1</a>`);
}

function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function countWords(content) {
  const text = String(content || "").replace(/<[^>]+>/g, " ").trim();
  return text ? text.length : 0;
}

function renderNavigation(items) {
  const nav = document.querySelector("[data-nav]");
  if (!nav || !items.length) return;
  nav.replaceChildren();
  for (const item of items.filter(entry => entry.status !== "disabled" && !isAdminHref(entry.href))) {
    const link = document.createElement("a");
    link.href = item.href;
    link.textContent = item.label;
    if (item.external) { link.target = "_blank"; link.rel = "noopener"; }
    nav.append(link);
  }
}

function isAdminHref(href) {
  return /^\/(lvtuang|admin\.html)(?:$|[?#])/.test(String(href || ""));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
