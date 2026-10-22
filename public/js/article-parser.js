/**
 * article-parser.js
 * 天才猫文章解析与渲染核心模块
 * 统一支持 Markdown 图片、语法高亮代码块、标题锚点、音频播放与 HTML 安全过滤
 */

export function slugifyHeading(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);
}

export function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

export function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/!\[([^\]]*)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g, `<img src="$2" alt="$1" loading="lazy">`)
    .replace(/(?<!\!)\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g, `<a href="$2" target="_blank" rel="noopener">$1</a>`);
}

export function markdownToHtml(value) {
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
    if (inCode) {
      code.push(line);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = /^(#{2,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      blocks.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    const quote = /^>\s+(.+)$/.exec(line);
    if (quote) {
      flushParagraph();
      flushList();
      blocks.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`);
      continue;
    }
    const bullet = /^[-*]\s+(.+)$/.exec(line);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1]);
      continue;
    }
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  if (inCode) blocks.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
  return blocks.join("");
}

export function formatHybridParagraphs(html) {
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

export function sanitizeArticleHtml(html) {
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
    if ((node.tagName === "IMG" || node.tagName === "AUDIO" || node.tagName === "VIDEO" || node.tagName === "SOURCE") && !/^(https?:\/\/|\/)/.test(node.getAttribute("src") || "")) {
      node.removeAttribute("src");
    }
    for (const child of Array.from(node.childNodes)) cleanNode(child);
  };

  for (const child of Array.from(template.content.childNodes)) cleanNode(child);
  return template.innerHTML;
}

export function renderContent(content) {
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

export function enhanceArticleContent(html) {
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

export function bindCodeBlocks(container = document, onToast) {
  const preElements = container.querySelectorAll(".article-viewer pre");
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
        if (typeof onToast === "function") onToast("代码已复制到剪贴板");
        setTimeout(() => {
          copyBtn.classList.remove("is-copied");
          copyBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>复制</span>
          `;
        }, 1800);
      } catch {
        if (typeof onToast === "function") onToast("复制失败，请手动选取复制");
      }
    });

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);
  });
}

export function bindArticleAudio(container = document) {
  container.querySelectorAll(".article-embed-music").forEach(card => {
    const audio = card.querySelector("audio");
    const playBtn = card.querySelector(".article-embed-music__play-btn");
    const icon = card.querySelector(".article-embed-music__play-icon");
    if (!playBtn) return;

    playBtn.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      const isCurrentlyPlaying = card.classList.contains("is-playing");
      if (!isCurrentlyPlaying) {
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
