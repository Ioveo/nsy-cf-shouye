// 天才猫文章频道核心脚本 (articles.js)
// 纯原生 ESM · 多排版引擎 (Grid / List / Docs) · 兼容老数据中文分类 · 无刷新 URL 状态同步

let allArticles = [];
let allSoftware = [];
let taxonomy = { categories: [] };

let currentCategorySlug = new URLSearchParams(location.search).get("cat") || "all";
let articleSearch = "";
let articleTag = "all";
let selectedDocArticleSlug = null;

const $ = id => document.getElementById(id);
const esc = val => String(val ?? "").replace(/[&<>"']/g, ch => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[ch]);

init();

async function init() {
  initFilterControls();
  await loadData();
}

async function loadData() {
  try {
    const [catRes, taxRes] = await Promise.allSettled([
      fetch("/api/catalog?_t=" + Date.now()),
      fetch("/api/config/article-taxonomy?_t=" + Date.now())
    ]);

    if (catRes.status === "fulfilled" && catRes.value.ok) {
      const catData = await catRes.value.json();
      allArticles = (catData.articles || []).filter(a => a.status === "published");
      allSoftware = catData.software || [];
      renderNavigation(catData.navigation || []);
    }

    if (taxRes.status === "fulfilled" && taxRes.value.ok) {
      try { taxonomy = await taxRes.value.json(); } catch {}
    }

    if (!taxonomy?.categories?.length) {
      taxonomy = {
        categories: [
          { slug: "tutorial", name: "上手教程", icon: "book-open", color: "#06B6D4", layout: "list", order: 10, showInNav: true },
          { slug: "news", name: "版本动态", icon: "sparkles", color: "#3B82F6", layout: "grid", order: 20, showInNav: true },
          { slug: "guide", name: "使用手册", icon: "file-text", color: "#8B5CF6", layout: "docs", order: 30, showInNav: true }
        ]
      };
    }

    preprocessArticles();
    renderNavTabs();
    renderFilterSelects();
    renderView();
  } catch (err) {
    console.warn("加载文章或分类配置失败:", err);
    if ($("articleViewContainer")) {
      $("articleViewContainer").innerHTML = '<article class="article-card article-card--empty"><div><h2>内容加载异常</h2><p>请刷新页面或稍后再试。</p></div></article>';
    }
  }
}

// 规范与匹配文章分类：先 slug 匹配，再 name 匹配（兼容老中文名），都不匹配归入“其他”
function preprocessArticles() {
  const cats = taxonomy.categories || [];
  for (const art of allArticles) {
    const rawCat = String(art.category || "").trim();
    const matched = cats.find(c => c.slug.toLowerCase() === rawCat.toLowerCase()) ||
                    cats.find(c => c.name.toLowerCase() === rawCat.toLowerCase());

    if (matched) {
      art._categorySlug = matched.slug;
      art._categoryName = matched.name;
      art._categoryColor = matched.color || "#06B6D4";
      art._categoryIcon = matched.icon || "book-open";
    } else {
      art._categorySlug = "other";
      art._categoryName = rawCat || "其他";
      art._categoryColor = "#94A3B8";
      art._categoryIcon = "file-text";
    }
  }
}

function renderNavTabs() {
  const navWrap = $("articlesNavWrap");
  if (!navWrap) return;

  const showCats = (taxonomy.categories || []).filter(c => c.showInNav !== false);
  let tabsHtml = `
    <div class="articles-nav-tabs">
      <button type="button" class="articles-nav-tab ${currentCategorySlug === "all" ? "articles-nav-tab--active" : ""}" data-cat-slug="all">
        <span class="articles-nav-tab__icon"><i data-lucide="layers" style="width: 14px; height: 14px;"></i></span>
        <span>全部文章</span>
        <span class="articles-nav-tab__count">${allArticles.length}</span>
      </button>
  `;

  for (const cat of showCats) {
    const isActive = currentCategorySlug === cat.slug;
    const count = allArticles.filter(a => a._categorySlug === cat.slug).length;
    const color = cat.color || "#06B6D4";
    tabsHtml += `
      <button type="button" class="articles-nav-tab ${isActive ? "articles-nav-tab--active" : ""}" data-cat-slug="${esc(cat.slug)}" style="${isActive ? `border-color: ${esc(color)}; box-shadow: 0 4px 16px ${esc(color)}33;` : ""}">
        <span class="articles-nav-tab__dot" style="background-color: ${esc(color)};"></span>
        <span class="articles-nav-tab__icon"><i data-lucide="${esc(cat.icon || 'book-open')}" style="width: 14px; height: 14px; color: ${esc(color)};"></i></span>
        <span>${esc(cat.name)}</span>
        <span class="articles-nav-tab__count">${count}</span>
      </button>
    `;
  }

  const otherCount = allArticles.filter(a => a._categorySlug === "other").length;
  if (otherCount > 0) {
    const isActive = currentCategorySlug === "other";
    tabsHtml += `
      <button type="button" class="articles-nav-tab ${isActive ? "articles-nav-tab--active" : ""}" data-cat-slug="other">
        <span class="articles-nav-tab__dot" style="background-color: #94A3B8;"></span>
        <span>其他</span>
        <span class="articles-nav-tab__count">${otherCount}</span>
      </button>
    `;
  }

  tabsHtml += `</div>`;
  navWrap.innerHTML = tabsHtml;

  navWrap.querySelectorAll(".articles-nav-tab").forEach(btn => {
    btn.addEventListener("click", () => switchCategory(btn.getAttribute("data-cat-slug")));
  });

  safeIcons();
}

function switchCategory(slug) {
  currentCategorySlug = slug || "all";
  selectedDocArticleSlug = null;

  const params = new URLSearchParams(window.location.search);
  if (currentCategorySlug && currentCategorySlug !== "all") {
    params.set("cat", currentCategorySlug);
  } else {
    params.delete("cat");
  }
  const newUrl = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
  window.history.pushState(null, "", newUrl);

  renderNavTabs();
  if ($("articleCategoryFilter")) $("articleCategoryFilter").value = currentCategorySlug;
  renderView();
}

function filteredArticles() {
  return allArticles
    .filter(item => currentCategorySlug === "all" || item._categorySlug === currentCategorySlug)
    .filter(item => articleTag === "all" || (item.tags || []).includes(articleTag))
    .filter(item => {
      if (!articleSearch) return true;
      const haystack = [item.title, item.summary, item.category, ...(item.tags || [])].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(articleSearch.toLowerCase());
    })
    .sort((a, b) => {
      const curCat = (taxonomy.categories || []).find(c => c.slug === currentCategorySlug);
      if (curCat?.layout === "docs") return (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0);
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
             Number(b.publishedAt || b.createdAt || 0) - Number(a.publishedAt || a.createdAt || 0);
    });
}

function renderView() {
  const container = $("articleViewContainer");
  const meta = $("articleListMeta");
  const titleElem = $("currentCategoryTitle");
  if (!container) return;

  const published = filteredArticles();
  const currentCatObj = (taxonomy.categories || []).find(c => c.slug === currentCategorySlug);

  if (titleElem) {
    titleElem.textContent = currentCategorySlug === "all" ? "全部文章矩阵" : (currentCatObj?.name || "其他历史文章");
  }

  if (meta) {
    meta.textContent = published.length ? `显示 ${published.length} 篇 / 共 ${allArticles.length} 篇已发布内容` : "暂无匹配内容";
  }

  if (!published.length) {
    container.innerHTML = '<article class="article-card article-card--empty"><div><span>Articles</span><h2>暂无匹配文章</h2><p>当前分类下暂无文章，或没有匹配当前搜索条件的内容。</p></div></article>';
    return;
  }

  const layout = (currentCategorySlug !== "all" && currentCatObj?.layout) ? currentCatObj.layout : "grid";
  if ($("articleControls")) $("articleControls").style.display = layout === "docs" ? "none" : "flex";

  if (layout === "grid") renderGridLayout(container, published);
  else if (layout === "list") renderListLayout(container, published);
  else if (layout === "docs") renderDocsLayout(container, published);

  safeIcons();
}

// 排版 1：Grid
function renderGridLayout(container, items) {
  container.innerHTML = `<div class="article-grid" id="articleGrid">${items.map((art, idx) => {
    const isLead = idx === 0 && items.length > 2;
    const tagsHtml = (art.tags || []).slice(0, 3).map(t => `<em>${esc(t)}</em>`).join("");
    const dateText = formatDate(art.publishedAt || art.createdAt);
    return `
      <article class="${isLead ? 'article-card article-card--lead' : 'article-card'}">
        ${art.coverUrl ? `<img src="${esc(art.coverUrl)}" alt="${esc(art.title)}" loading="lazy" />` : ""}
        <div>
          <span style="color: ${esc(art._categoryColor || '#06B6D4')};">● ${esc(art._categoryName || "文章")} · ${esc(dateText)}</span>
          <h2>${esc(art.title)}</h2>
          <p>${esc(art.summary || "点击查看深度文章与详细说明。")}</p>
          ${tagsHtml ? `<div class="article-card__tags">${tagsHtml}</div>` : ""}
          <a class="button button--primary" href="/article.html?slug=${encodeURIComponent(art.slug)}">阅读全文</a>
        </div>
      </article>
    `;
  }).join("")}</div>`;
}

// 排版 2：List
function renderListLayout(container, items) {
  container.innerHTML = `<div class="article-list-container">${items.map(art => {
    const dateText = formatDate(art.publishedAt || art.createdAt);
    const color = art._categoryColor || "#06B6D4";
    return `
      <a class="article-list-item" href="/article.html?slug=${encodeURIComponent(art.slug)}">
        <div class="article-list-item__thumb-wrap">
          ${art.coverUrl ? `<img src="${esc(art.coverUrl)}" alt="${esc(art.title)}" class="article-list-item__thumb" loading="lazy" />` : `
            <div class="article-list-item__thumb-fallback"><i data-lucide="${esc(art._categoryIcon || 'book-open')}" style="width: 32px; height: 32px;"></i></div>
          `}
        </div>
        <div class="article-list-item__content">
          <div class="article-list-item__header">
            <span class="article-list-item__badge" style="color: ${esc(color)}; border-color: ${esc(color)}40;">
              <span style="width: 5px; height: 5px; border-radius: 999px; background: ${esc(color)};"></span>${esc(art._categoryName)}
            </span>
            <h3 class="article-list-item__title">${esc(art.title)}</h3>
            <p class="article-list-item__summary">${esc(art.summary || "点击阅读全文查看具体功能指南与说明。")}</p>
          </div>
          <div class="article-list-item__footer">
            <div class="article-list-item__meta">
              <span>${esc(dateText)}</span><span>·</span><span>${countWords(art.content)} 字阅读</span>
              ${(art.tags || []).slice(0, 2).map(t => `<span>· #${esc(t)}</span>`).join("")}
            </div>
            <div class="article-list-item__read-btn"><span>阅读全文</span><i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i></div>
          </div>
        </div>
      </a>
    `;
  }).join("")}</div>`;
}

// 排版 3：Docs
function renderDocsLayout(container, items) {
  if (!selectedDocArticleSlug || !items.some(a => a.slug === selectedDocArticleSlug)) {
    selectedDocArticleSlug = items[0].slug;
  }
  const selectedArt = items.find(a => a.slug === selectedDocArticleSlug) || items[0];
  const dateText = formatDate(selectedArt.publishedAt || selectedArt.createdAt);
  const relatedSofts = resolveRelatedSoftware(selectedArt);

  const mobileOptions = items.map(a => `<option value="${esc(a.slug)}" ${a.slug === selectedDocArticleSlug ? "selected" : ""}>${esc(a.title)}</option>`).join("");
  const treeItems = items.map((a, i) => {
    const isActive = a.slug === selectedDocArticleSlug;
    return `<div class="article-docs__item ${isActive ? "article-docs__item--active" : ""}" data-doc-slug="${esc(a.slug)}"><span class="truncate">${i + 1}. ${esc(a.title)}</span><i data-lucide="chevron-right" style="width: 14px; height: 14px; opacity: ${isActive ? '1' : '0.3'};"></i></div>`;
  }).join("");

  const widgetHtml = relatedSofts.length > 0 ? renderSoftwareWidget(relatedSofts[0]) : "";

  container.innerHTML = `
    <div class="article-docs__mobile-nav"><select class="article-docs__mobile-select" id="docsMobileSelect">${mobileOptions}</select></div>
    <div class="article-docs-layout">
      <aside class="article-docs__sidebar">
        <div class="article-docs__sidebar-head"><span style="font-weight: 700; font-size: 14px;">手册目录</span><span class="articles-nav-tab__count">${items.length} 篇</span></div>
        <div class="article-docs__tree">${treeItems}</div>
      </aside>
      <main class="article-docs__main">
        <div style="margin-bottom: 12px;"><span class="article-list-item__badge" style="color: ${esc(selectedArt._categoryColor)};"><span style="width: 5px; height: 5px; border-radius: 999px; background: ${esc(selectedArt._categoryColor)};"></span>${esc(selectedArt._categoryName)}</span></div>
        <h1 class="article-docs__title">${esc(selectedArt.title)}</h1>
        <div class="article-docs__meta">
          <span>发布于 ${esc(dateText)}</span><span>·</span><span>${countWords(selectedArt.content)} 字正文</span>
          <a href="/article.html?slug=${encodeURIComponent(selectedArt.slug)}" style="color: #06b6d4; margin-left: auto; text-decoration: none; font-weight: 600;">独立页面打开 ↗</a>
        </div>
        <div class="article-docs__body">${renderMarkdownContent(selectedArt.content)}</div>
        ${widgetHtml}
      </main>
    </div>
  `;

  container.querySelectorAll(".article-docs__item").forEach(el => {
    el.addEventListener("click", () => {
      selectedDocArticleSlug = el.getAttribute("data-doc-slug");
      renderView();
    });
  });

  if ($("docsMobileSelect")) {
    $("docsMobileSelect").addEventListener("change", e => {
      selectedDocArticleSlug = e.target.value;
      renderView();
    });
  }
}

function renderSoftwareWidget(soft) {
  if (!soft) return "";
  const iconUrl = soft.iconUrl || soft.icon || "/logo.png";
  const latestVer = soft.latest?.version || "v1.0.0";
  return `
    <div class="article-software-widget">
      <div class="article-software-widget__info">
        <img src="${esc(iconUrl)}" alt="${esc(soft.name)}" class="article-software-widget__icon" />
        <div>
          <h3 class="article-software-widget__name"><span>${esc(soft.name)}</span><span class="article-software-widget__version">${esc(latestVer)}</span></h3>
          <p class="article-software-widget__desc">${esc(soft.tagline || soft.description || "官方安全下载，极速安装体验。")}</p>
        </div>
      </div>
      <a href="/download/latest/${encodeURIComponent(soft.slug || soft.id)}" class="article-software-widget__btn">
        <i data-lucide="download" style="width: 16px; height: 16px;"></i><span>立即下载体验</span>
      </a>
    </div>
  `;
}

function resolveRelatedSoftware(article) {
  const ids = Array.isArray(article?.softwareIds) ? article.softwareIds : [];
  if (!ids.length) return [];
  return allSoftware.filter(s => ids.includes(s.id) || ids.includes(s.slug));
}

function renderFilterSelects() {
  const categorySelect = $("articleCategoryFilter");
  const tagSelect = $("articleTagFilter");
  if (!categorySelect || !tagSelect) return;

  const cats = taxonomy.categories || [];
  categorySelect.innerHTML = `<option value="all">全部分类</option>${cats.map(c => `<option value="${esc(c.slug)}">${esc(c.name)}</option>`).join("")}<option value="other">其他分类</option>`;
  categorySelect.value = currentCategorySlug;

  const tags = Array.from(new Set(allArticles.flatMap(item => item.tags || []))).sort((a, b) => a.localeCompare(b, "zh-CN"));
  tagSelect.innerHTML = `<option value="all">全部标签</option>${tags.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join("")}`;
}

function initFilterControls() {
  const search = $("articleSearch");
  const category = $("articleCategoryFilter");
  const tag = $("articleTagFilter");
  const clear = $("clearArticleFilters");

  if (search) search.addEventListener("input", e => { articleSearch = e.target.value.trim(); renderView(); });
  if (category) category.addEventListener("change", e => switchCategory(e.target.value));
  if (tag) tag.addEventListener("change", e => { articleTag = e.target.value; renderView(); });
  if (clear) {
    clear.addEventListener("click", () => {
      articleSearch = "";
      articleTag = "all";
      if (search) search.value = "";
      if (tag) tag.value = "all";
      switchCategory("all");
    });
  }
}

function renderNavigation(items) {
  const nav = document.querySelector("[data-nav]");
  if (!nav || !items.length) return;
  nav.replaceChildren();
  for (const item of items.filter(entry => entry.status !== "disabled" && !/^\/(lvtuang|admin\.html)/.test(String(entry.href || "")))) {
    const link = document.createElement("a");
    link.href = item.href;
    link.textContent = item.label;
    if (item.external) { link.target = "_blank"; link.rel = "noopener"; }
    nav.append(link);
  }
}

function formatDate(ts) {
  if (!ts) return "-";
  const d = new Date(typeof ts === "number" ? ts : String(ts));
  if (isNaN(d.getTime())) return String(ts).slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function countWords(content) {
  return String(content || "").replace(/<[^>]*>/g, "").replace(/\s+/g, "").length;
}

function safeIcons() {
  try {
    if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
  } catch (e) {}
}

function renderMarkdownContent(content) {
  const raw = String(content || "").trim();
  if (!raw) return "<p>暂无正文。</p>";
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
  return raw.split("\n\n").map(p => {
    const trimmed = p.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("### ")) return `<h3>${esc(trimmed.slice(4))}</h3>`;
    if (trimmed.startsWith("## ")) return `<h2>${esc(trimmed.slice(3))}</h2>`;
    if (trimmed.startsWith("# ")) return `<h1>${esc(trimmed.slice(2))}</h1>`;
    if (trimmed.startsWith("- ")) {
      return `<ul>${trimmed.split("\n").map(l => `<li>${esc(l.replace(/^[-\*]\s+/, ""))}</li>`).join("")}</ul>`;
    }
    return `<p>${esc(trimmed).replace(/\n/g, "<br>")}</p>`;
  }).join("");
}
