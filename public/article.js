loadArticle();
initReadingTools();

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
    root.innerHTML = "<section class='page-hero'><h1>文章不存在。</h1></section>";
    return;
  }
  const apiUrl = isPreview
    ? `/api/article/${encodeURIComponent(slug)}?preview=1`
    : `/api/article/${encodeURIComponent(slug)}`;
  const response = await fetch(apiUrl, { cache: "no-store" });
  if (!response.ok) {
    root.innerHTML = "<section class='page-hero'><h1>文章不存在。</h1></section>";
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
  const tags = (article.tags || []).map(tag => `<span>${escapeHtml(tag)}</span>`).join("");
  const rendered = enhanceArticleContent(renderContent(article.content));
  const bottomWidget = renderArticleBottomWidget(software);
  root.innerHTML = `<section class="article-cover article-cover--pro">${article.coverUrl ? `<img src="${escapeAttr(article.coverUrl)}" alt="">` : ""}<div><p class="eyebrow">${escapeHtml(article.category || "Article")}</p><h1>${escapeHtml(article.title)}</h1><p>${escapeHtml(article.summary || "")}</p><div class="article-meta"><span>${formatDate(article.publishedAt || article.createdAt)}</span><span>${countWords(article.content)} 字阅读</span>${tags}</div></div></section><section class="article-body article-body--pro"><article>${rendered.html}${bottomWidget}</article>${renderAside(rendered.headings, software)}</section>`;
  bindArticleImages();
  bindArticleAudio();
}

function initReadingTools() {
  document.getElementById("copyArticleLink")?.addEventListener("click", copyArticleLink);
  document.getElementById("backToTop")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  document.getElementById("closeImageLightbox")?.addEventListener("click", closeImageLightbox);
  document.getElementById("imageLightbox")?.addEventListener("click", event => {
    if (event.target.id === "imageLightbox") closeImageLightbox();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeImageLightbox();
  });
}

function bindArticleImages() {
  document.querySelectorAll(".article-body article img").forEach(img => {
    img.tabIndex = 0;
    img.role = "button";
    img.title = "点击放大图片";
    img.addEventListener("click", () => openImageLightbox(img.src));
    img.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") openImageLightbox(img.src);
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
  try {
    await navigator.clipboard.writeText(location.href);
    flashTool("copyArticleLink", "已复制");
  } catch {
    flashTool("copyArticleLink", "复制失败");
  }
}

function flashTool(id, text) {
  const button = document.getElementById(id);
  if (!button) return;
  const original = button.textContent;
  button.textContent = text;
  window.setTimeout(() => { button.textContent = original; }, 1400);
}

function openImageLightbox(src) {
  const lightbox = document.getElementById("imageLightbox");
  const image = document.getElementById("imageLightboxImg");
  if (!lightbox || !image) return;
  image.src = src;
  lightbox.hidden = false;
  document.body.classList.add("is-lightbox-open");
}

function closeImageLightbox() {
  const lightbox = document.getElementById("imageLightbox");
  const image = document.getElementById("imageLightboxImg");
  if (!lightbox || !image) return;
  lightbox.hidden = true;
  image.removeAttribute("src");
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
  if (!headings.length && !software.length) return "";
  return `<aside class="article-related article-related--download">${renderToc(headings)}${renderRelated(software)}</aside>`;
}

function renderToc(headings) {
  if (!headings.length) return "";
  return `<div class="article-toc"><p class="eyebrow">Contents</p><h2>文章目录</h2>${headings.map(item => `<a class="article-toc__item article-toc__item--${item.level}" href="#${escapeAttr(item.id)}">${escapeHtml(item.text)}</a>`).join("")}</div>`;
}

function renderRelated(software) {
  if (!software.length) return "";
  return `<div class="article-related__downloads"><p class="eyebrow">Download</p><h2>相关软件</h2>${software.map(item => `<a class="related-download" href="/download/latest/${encodeURIComponent(item.slug || item.id)}"><span class="related-download__icon">↓</span><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.description || "下载最新版安装包")}</small></span><em>点击下载</em></a>`).join("")}</div>`;
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
  }
  return { html: template.innerHTML, headings };
}

function slugifyHeading(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-").replace(/^-+|-+$/g, "");
}

function renderContent(content) {
  const value = String(content || "").trim();
  if (!value) return "<p>暂无正文。</p>";

  // 1. 将 Markdown 图片语法统一转为标准的响应式 Figure/Img 结构，确保无论是纯文本还是 HTML 模板混排都能正确渲染
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
    "UL", "OL", "LI", "BLOCKQUOTE", "H1", "H2", "H3", "H4", "IMG", "FIGURE", "FIGCAPTION",
    "AUDIO", "SOURCE", "TABLE", "THEAD", "TBODY", "TR", "TH", "TD", "PRE", "CODE",
    "DIV", "SPAN", "SECTION", "BUTTON"
  ]);
  const allowedAttrs = {
    A: new Set(["href", "target", "rel", "class"]),
    IMG: new Set(["src", "alt", "loading", "class", "style"]),
    AUDIO: new Set(["src", "controls", "preload", "class"]),
    SOURCE: new Set(["src", "type"]),
    FIGURE: new Set(["class", "style"]),
    FIGCAPTION: new Set(["class", "style"]),
    CODE: new Set(["class"]),
    PRE: new Set(["class"]),
    TABLE: new Set(["class"]),
    THEAD: new Set(["class"]),
    TBODY: new Set(["class"]),
    TR: new Set(["class"]),
    TH: new Set(["class"]),
    TD: new Set(["class"]),
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
    UL: new Set(["class"]),
    OL: new Set(["class"]),
    LI: new Set(["class"])
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
    if ((node.tagName === "IMG" || node.tagName === "AUDIO" || node.tagName === "SOURCE") && !/^(https?:\/\/|\/)/.test(node.getAttribute("src") || "")) node.removeAttribute("src");
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
