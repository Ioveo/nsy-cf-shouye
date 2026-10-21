let token = sessionStorage.getItem("downloadAdminToken") || "";
let catalog = null;
let articleSoftwareCategory = "all";
let articleSoftwareSelection = new Set();
const ARTICLE_DRAFT_KEY = "downloadAdminArticleDraft";
const ADMIN_MODULES = {
  software: {
    title: "软件管理",
    description: "维护软件资料、分类和版本发布。",
    items: [
      { panel: "softwarePanel", view: "softwareEdit", label: "添加软件", action: "资料编辑" },
      { panel: "softwarePanel", view: "softwareList", label: "软件列表", action: "列表管理" },
      { panel: "hotUpdatePanel", view: "hotUpdateEdit", label: "热更控制台", action: "在线热更" },
      { panel: "categoryPanel", label: "分类管理", action: "分类维护" },
      { panel: "releasePanel", view: "releaseUpload", label: "上传版本", action: "发布安装包" },
      { panel: "releasePanel", view: "releaseList", label: "版本列表", action: "文件管理" }
    ]
  },
  hotupdate: {
    title: "热更管理",
    description: "Cloudflare R2 客户端增量热更与全量安装包版本分发控制台。",
    items: [
      { panel: "hotUpdatePanel", view: "hotUpdateEdit", label: "在线热更", action: "版本发布" },
      { panel: "hotUpdatePanel", view: "hotUpdateHistory", label: "发版审计", action: "历史回滚", anchor: "hotHistorySection" },
      { panel: "releasePanel", view: "releaseUpload", label: "上传安装包", action: "版本存储" },
      { panel: "softwarePanel", view: "softwareList", label: "软件列表", action: "软件矩阵" }
    ]
  },
  music: {
    title: "音乐管理",
    description: "管理音乐频道、曲库、封面和试听。",
    items: [
      { panel: "musicPanel", view: "musicEdit", label: "添加音乐", action: "编辑曲目" },
      { panel: "musicPanel", view: "musicList", label: "音乐列表", action: "列表管理" },
      { panel: "mediaPanel", label: "媒体库", action: "音频/图片" }
    ]
  },
  gallery: {
    title: "画廊管理",
    description: "管理前台画廊图片、R2 素材和展示状态。",
    items: [
      { panel: "galleryPanel", view: "galleryEdit", label: "添加图片", action: "图片编辑" },
      { panel: "galleryPanel", view: "galleryList", label: "画廊列表", action: "列表管理" },
      { panel: "assetPanel", view: "assetList", label: "资源列表", action: "R2 图片" }
    ]
  },
  article: {
    title: "\u6587\u7ae0\u7ba1\u7406",
    description: "\u53d1\u8868\u6587\u7ae0\u3001\u7ba1\u7406\u5c01\u9762\u548c\u5173\u8054\u8f6f\u4ef6\u3002",
    items: [
      { panel: "articlePanel", view: "articleEdit", label: "\u53d1\u8868\u6587\u7ae0", action: "\u65b0\u5efa/\u7f16\u8f91" },
      { panel: "articlePanel", view: "articleList", label: "\u6587\u7ae0\u5217\u8868", action: "\u5217\u8868\u7ba1\u7406" },
      { panel: "mediaPanel", label: "\u5a92\u4f53\u5e93", action: "\u63d2\u5165\u7d20\u6750" }
    ]
  },
  asset: {
    title: "\u8d44\u6e90\u7ba1\u7406",
    description: "\u7ba1\u7406 R2 \u4e2d\u7684\u56fe\u7247\u3001\u97f3\u9891\u3001\u8f6f\u4ef6\u5305\u548c\u7ad9\u70b9\u8d44\u6e90\u3002",
    items: [
      { panel: "assetPanel", view: "assetUpload", label: "\u8d44\u6e90\u4e0a\u4f20", action: "\u4e0a\u4f20\u6587\u4ef6" },
      { panel: "assetPanel", view: "assetList", label: "\u8d44\u6e90\u5217\u8868", action: "\u626b\u63cf R2" },
      { panel: "mediaPanel", label: "\u5a92\u4f53\u5e93", action: "\u6587\u7ae0\u5a92\u4f53" }
    ]
  },
  site: {
    title: "\u7ad9\u70b9\u8bbe\u7f6e",
    description: "配置首页文案、AI 轮播入口和前台导航。",
    items: [
      { panel: "siteHomePanel", label: "首页文案", action: "主页内容" },
      { panel: "siteCarouselPanel", view: "siteCarouselEdit", label: "添加轮播图", action: "首页专用" },
      { panel: "siteCarouselPanel", view: "siteCarouselList", label: "轮播图列表", action: "编辑/删除" },
      { panel: "photoWallPanel", view: "photoWallEdit", label: "添加照片墙", action: "首页专用" },
      { panel: "photoWallPanel", view: "photoWallList", label: "照片墙列表", action: "编辑/删除" },
      { panel: "navigationPanel", label: "导航设置", action: "菜单配置" },
      { panel: "healthPanel", label: "系统状态", action: "部署检查" }
    ]
  },
  system: {
    title: "\u7cfb\u7edf\u914d\u7f6e",
    description: "\u68c0\u67e5 R2\u3001D1\u3001\u5b58\u50a8\u6388\u6743\u548c\u7cfb\u7edf\u5065\u5eb7\u3002",
    items: [
      { panel: "storagePanel", label: "\u5b58\u50a8\u6388\u6743", action: "R2 \u8d26\u53f7" },
      { panel: "healthPanel", label: "\u7cfb\u7edf\u72b6\u6001", action: "\u5065\u5eb7\u68c0\u67e5" }
    ]
  }
};
const DIRECT_UPLOAD_LIMIT = 95 * 1024 * 1024;
const CHUNK_SIZE = 5 * 1024 * 1024;
const CHUNK_UPLOAD_THRESHOLD = 5 * 1024 * 1024;
const MAX_CHUNKED_SIZE = 10 * 1024 * 1024 * 1024;
const UPLOAD_CONCURRENCY = 8;
const TOKEN_REFRESH_INTERVAL = 20 * 60 * 1000;
const SITE_HOME_FIELDS = [
  "siteTitle",
  "homeHeroKicker",
  "homeHeroTitle",
  "homeHeroDescription",
  "shortcutsKicker",
  "shortcutsTitle",
  "aiKicker",
  "aiTitle",
  "aiDescription",
  "aiPromptOne",
  "aiPromptTwo",
  "aiPromptThree",
  "readyKicker",
  "readyTitle",
  "footerWordmark"
];
let articleDraftTimer = null;

const loginView = byId("loginView");
const appView = byId("appView");

byId("loginButton").addEventListener("click", login);
byId("adminPassword").addEventListener("keydown", event => {
  if (event.key === "Enter") login();
});
byId("logoutButton").addEventListener("click", logout);
byId("softwareForm").addEventListener("submit", saveSoftware);
byId("categoryForm").addEventListener("submit", saveCategory);
byId("storageForm").addEventListener("submit", saveStorage);
byId("navigationForm").addEventListener("submit", saveNavigation);
byId("siteHomeForm").addEventListener("submit", saveSiteHome);
byId("siteCarouselForm").addEventListener("submit", saveSiteCarousel);
byId("photoWallForm").addEventListener("submit", savePhotoWall);
byId("articleForm").addEventListener("submit", saveArticle);
byId("musicForm").addEventListener("submit", saveMusic);
byId("galleryForm").addEventListener("submit", saveGallery);
byId("releaseForm").addEventListener("submit", uploadRelease);
byId("releaseEditForm")?.addEventListener("submit", saveReleaseEdit);
byId("cancelReleaseEdit")?.addEventListener("click", closeReleaseEdit);
byId("releaseFilterSoftware")?.addEventListener("change", renderReleaseRows);
byId("releaseFilterSearch")?.addEventListener("input", debounce(renderReleaseRows, 200));
document.querySelectorAll("[data-site-mode]").forEach(button => button.addEventListener("click", () => setSiteMode(button.dataset.siteMode)));
byId("releaseRegisterForm").addEventListener("submit", registerUploadedRelease);
byId("uploadSoftwareCover").addEventListener("click", uploadSoftwareCover);
byId("useSoftwareCoverAsset").addEventListener("click", useSoftwareCoverAsset);
byId("uploadMusicAudio").addEventListener("click", uploadMusicAudio);
byId("uploadMusicCover").addEventListener("click", uploadMusicCover);
byId("useMusicCoverAsset").addEventListener("click", useMusicCoverAsset);
byId("previewMusic").addEventListener("click", previewMusicFromForm);
byId("loadGalleryAssets").addEventListener("click", loadGalleryAssets);
byId("useGalleryAsset").addEventListener("click", useGalleryAsset);
byId("uploadGalleryImage").addEventListener("click", uploadGalleryImage);
byId("previewGalleryImage").addEventListener("click", previewGalleryImage);
byId("galleryStorage").addEventListener("change", loadGalleryAssets);
byId("resetSoftware").addEventListener("click", resetSoftwareForm);
byId("resetMusic").addEventListener("click", resetMusicForm);
byId("resetGallery").addEventListener("click", resetGalleryForm);
byId("resetSiteCarousel").addEventListener("click", resetSiteCarouselForm);
byId("loadSiteCarouselAssets").addEventListener("click", loadSiteCarouselAssets);
byId("useSiteCarouselAsset").addEventListener("click", useSiteCarouselAsset);
byId("uploadSiteCarouselImage").addEventListener("click", uploadSiteCarouselImage);
byId("previewSiteCarouselImage").addEventListener("click", previewSiteCarouselImage);
byId("resetPhotoWall").addEventListener("click", resetPhotoWallForm);
byId("loadPhotoWallAssets").addEventListener("click", loadPhotoWallAssets);
byId("usePhotoWallAsset").addEventListener("click", usePhotoWallAsset);
byId("uploadPhotoWallImage").addEventListener("click", uploadPhotoWallImage);
byId("previewPhotoWallImage").addEventListener("click", previewPhotoWallImage);
byId("resetCategory").addEventListener("click", resetCategoryForm);
byId("resetStorage").addEventListener("click", resetStorageForm);
byId("resetNavigation").addEventListener("click", resetNavigationForm);
byId("resetArticle").addEventListener("click", resetArticleForm);
byId("restoreArticleDraft").addEventListener("click", restoreArticleDraft);
byId("clearArticleDraft").addEventListener("click", clearArticleDraft);
byId("testStorage").addEventListener("click", testStorage);
byId("runHealthCheck").addEventListener("click", loadHealth);
byId("loadMediaAll").addEventListener("click", () => loadMedia("all"));
byId("loadMediaImage").addEventListener("click", () => loadMedia("image"));
byId("loadMediaAudio").addEventListener("click", () => loadMedia("audio"));
byId("refreshAssets").addEventListener("click", loadAssets);
byId("assetUploadForm").addEventListener("submit", uploadAsset);
byId("assetKindFilter").addEventListener("change", loadAssets);
byId("assetStatusFilter").addEventListener("change", loadAssets);
byId("assetSearch").addEventListener("input", debounce(loadAssets, 250));
byId("insertArticleH2").addEventListener("click", () => insertArticleSnippet("\n## 小标题\n\n这里填写正文。\n"));
byId("insertArticleList").addEventListener("click", () => insertArticleSnippet("\n- 要点一\n- 要点二\n- 要点三\n"));
byId("insertArticleCode").addEventListener("click", () => insertArticleSnippet("\n```text\n这里粘贴代码或日志\n```\n"));
byId("uploadArticleImage").addEventListener("click", () => uploadArticleImage("cover"));
byId("insertArticleImage").addEventListener("click", () => uploadArticleImage("content"));
byId("insertArticleAudio").addEventListener("click", () => uploadArticleImage("audio"));
byId("insertArticleTable").addEventListener("click", insertArticleTable);
byId("insertArticleQuote").addEventListener("click", insertArticleQuote);
byId("articleTitle").addEventListener("input", updateArticleEditorMeta);
byId("articleSummary").addEventListener("input", updateArticleEditorMeta);
byId("articleContent").addEventListener("input", updateArticleEditorMeta);
byId("articleCover").addEventListener("input", updateArticleEditorMeta);
byId("articleForm").addEventListener("input", scheduleArticleDraftSave);
byId("articleSoftwareCategory").addEventListener("change", event => {
  articleSoftwareCategory = event.target.value;
  renderArticleOptions();
});
byId("clearArticleSoftware").addEventListener("click", () => {
  articleSoftwareSelection.clear();
  renderArticleOptions();
});

byId("hotUpdateForm")?.addEventListener("submit", submitHotUpdate);
byId("hotAppSelect")?.addEventListener("change", event => switchHotApp(event.target.value));
document.querySelectorAll(".app-preset-btn").forEach(button => {
  button.addEventListener("click", () => switchHotApp(button.dataset.hotApp));
});
byId("bumpPatchBtn")?.addEventListener("click", () => bumpHotVersion("patch"));
byId("bumpMinorBtn")?.addEventListener("click", () => bumpHotVersion("minor"));
byId("bumpMajorBtn")?.addEventListener("click", () => bumpHotVersion("major"));
byId("uploadPatchLocalBtn")?.addEventListener("click", () => byId("localPatchFileInput")?.click());
byId("uploadSetupLocalBtn")?.addEventListener("click", () => byId("localSetupFileInput")?.click());
byId("localPatchFileInput")?.addEventListener("change", handleLocalPatchFile);
byId("localSetupFileInput")?.addEventListener("change", handleLocalSetupFile);
byId("pickPatchR2Btn")?.addEventListener("click", () => pickR2FileForHotUpdate("hotPatchUrl"));
byId("pickSetupR2Btn")?.addEventListener("click", () => pickR2FileForHotUpdate("hotFullSetupUrl"));
byId("syncSetupFromReleasesBtn")?.addEventListener("click", syncSetupFromCatalogReleases);
byId("hotPatchSize")?.addEventListener("input", updateHotPatchSizeDisplay);
byId("hotVersion")?.addEventListener("input", event => updateUrlsForVersion(event.target.value.trim().replace(/^v/i, "")));

document.querySelectorAll(".sidebar nav button").forEach(button => {
  button.addEventListener("click", () => showPanel(button.dataset.panel, { moduleId: button.dataset.module }));
});

if (token) loadCatalog();
updateArticleDraftStatus();

async function login() {
  const password = byId("adminPassword").value.trim();
  if (!password) return toast("请输入管理员密码", true);
  const result = await loginApi(password);
  if (!result.success) {
    token = "";
    return toast(result.msg || "登录失败", true);
  }
  token = result.token || "";
  sessionStorage.setItem("downloadAdminToken", token);
  await loadCatalog();
  toast("登录成功");
}

function logout() {
  sessionStorage.removeItem("downloadAdminToken");
  location.reload();
}

function showApp() {
  loginView.hidden = true;
  appView.hidden = false;
  document.body.classList.add("is-admin-ready");
  document.body.classList.add("admin-overview");
  document.body.dataset.adminView = "softwareEdit";
  renderModuleNav("software", "softwarePanel");
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

async function loadCatalog() {
  const result = await api("/api/admin/catalog");
  if (result.success) {
    showApp();
    render(result.catalog);
  } else {
    token = "";
    sessionStorage.removeItem("downloadAdminToken");
    hideApp();
    toast(result.msg || "读取失败", true);
  }
}

function hideApp() {
  loginView.hidden = false;
  appView.hidden = true;
  document.body.classList.remove("is-admin-ready");
}

function render(nextCatalog) {
  catalog = nextCatalog;
  fillSiteHomeForm(catalog.site || {});
  renderStats();
  renderCategoryOptions();
  renderSoftwareRows();
  renderCategoryRows();
  renderStorageRows();
  renderNavigationRows();
  renderArticleOptions();
  renderArticleRows();
  renderMusicRows();
  renderGalleryRows();
  renderSiteCarouselRows();
  renderPhotoWallRows();
  renderReleaseFilterOptions();
  renderReleaseRows();
  renderSiteMode();
  syncHotAppSelect();
}

const RELEASE_PLATFORM_LABELS = { windows: "Windows", portable: "绿色版", macos: "macOS", linux: "Linux", android: "Android", other: "其他" };

const SITE_MODE_LABELS = { software: "软件站", portal: "综合门户", blog: "博客" };

function renderSiteMode() {
  const mode = catalog?.site?.siteMode || "portal";
  document.querySelectorAll("[data-site-mode]").forEach(button => {
    button.classList.toggle("is-active", button.dataset.siteMode === mode);
  });
}

// 一键切换网站模式（首页内容和导航栏目随之变化）
async function setSiteMode(mode) {
  if (!mode || mode === (catalog?.site?.siteMode || "portal")) return;
  if (!confirm(`切换为「${SITE_MODE_LABELS[mode]}」模式？前台首页和导航会立即变化，可随时切回。`)) return;
  const buttons = document.querySelectorAll("[data-site-mode]");
  buttons.forEach(button => { button.disabled = true; });
  try {
    const result = await api("/api/admin/site-mode", { mode });
    if (!result.success) return toast(result.msg || "切换失败", true);
    render(result.catalog);
    toast(`已切换为「${SITE_MODE_LABELS[mode]}」模式`);
  } catch (error) {
    toast(`切换失败：${error.message || "网络异常"}`, true);
  } finally {
    buttons.forEach(button => { button.disabled = false; });
  }
}

function renderReleaseFilterOptions() {
  const select = byId("releaseFilterSoftware");
  if (!select) return;
  const current = select.value || "all";
  select.innerHTML = `<option value="all">全部软件</option>${catalog.software.map(item => `<option value="${escapeAttr(item.id)}">${escapeHtml(item.name)}</option>`).join("")}`;
  select.value = [...select.options].some(option => option.value === current) ? current : "all";
}

function openReleaseEdit(software, release) {
  byId("editReleaseId").value = release.id;
  byId("editReleaseSoftware").textContent = `${software.name} · ${release.fileName || ""}`;
  byId("editReleaseVersion").value = release.version || "";
  byId("editReleaseStatus").value = ["published", "draft", "disabled"].includes(release.status) ? release.status : "published";
  byId("editReleaseFileName").value = release.fileName || "";
  byId("editReleaseChangelog").value = release.changelog || "";
  byId("editReleaseLatest").checked = Boolean(release.isLatest);
  byId("editReleasePlatform").value = release.platform || "other";
  byId("editReleaseLabel").value = release.label || "";
  const form = byId("releaseEditForm");
  form.hidden = false;
  form.scrollIntoView({ block: "center", behavior: "smooth" });
}

function closeReleaseEdit() {
  byId("releaseEditForm").hidden = true;
}

async function saveReleaseEdit(event) {
  event.preventDefault();
  const payload = {
    releaseId: byId("editReleaseId").value,
    action: "edit",
    version: byId("editReleaseVersion").value.trim(),
    status: byId("editReleaseStatus").value,
    fileName: byId("editReleaseFileName").value.trim(),
    changelog: byId("editReleaseChangelog").value.trim(),
    isLatest: byId("editReleaseLatest").checked,
    platform: byId("editReleasePlatform").value,
    label: byId("editReleaseLabel").value.trim()
  };
  if (!payload.version) return toast("版本号不能为空", true);
  const result = await api("/api/admin/releases/update", payload);
  if (!result.success) return toast(result.msg || "保存失败", true);
  closeReleaseEdit();
  render(result.catalog);
  toast("版本已更新");
}

function renderSiteCarouselRows() {
  const rows = byId("siteCarouselRows");
  if (!rows) return;
  rows.innerHTML = "";
  for (const item of catalog.siteCarousel || []) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${item.imageUrl ? `<img class="thumb" src="${escapeAttr(item.thumbUrl || item.imageUrl)}" alt="">` : "-"} <strong>${escapeHtml(item.title)}</strong><br><small>${escapeHtml(item.imageUrl || "")}</small></td><td>${escapeHtml(item.description || "")}</td><td>${item.sortOrder}</td><td class="status-${item.status === "published" ? "active" : item.status === "draft" ? "draft" : "disabled"}">${item.status === "published" ? "已发布" : item.status === "draft" ? "草稿" : "隐藏"}</td><td class="row-actions"></td>`;
    tr.lastElementChild.append(
      actionButton("预览", () => window.open(item.imageUrl, "_blank")),
      actionButton("编辑", () => fillSiteCarouselForm(item)),
      actionButton("删除", () => deleteSiteCarousel(item.id), "danger")
    );
    rows.append(tr);
  }
}

function renderPhotoWallRows() {
  const rows = byId("photoWallRows");
  if (!rows) return;
  rows.innerHTML = "";
  for (const item of catalog.photoWall || []) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${item.imageUrl ? `<img class="thumb" src="${escapeAttr(item.thumbUrl || item.imageUrl)}" alt="">` : "-"} <strong>${escapeHtml(item.title)}</strong><br><small>${escapeHtml(item.imageUrl || "")}</small></td><td>${escapeHtml(item.description || "")}</td><td><small>${escapeHtml(item.linkUrl || "-")}</small></td><td>${item.sortOrder}</td><td class="status-${item.status === "published" ? "active" : item.status === "draft" ? "draft" : "disabled"}">${item.status === "published" ? "已发布" : item.status === "draft" ? "草稿" : "隐藏"}</td><td class="row-actions"></td>`;
    tr.lastElementChild.append(
      actionButton("预览", () => window.open(item.imageUrl, "_blank")),
      actionButton("编辑", () => fillPhotoWallForm(item)),
      actionButton("删除", () => deletePhotoWall(item.id), "danger")
    );
    rows.append(tr);
  }
}

function renderStats() {
  const softwareCount = catalog.software.length;
  const releaseCount = catalog.software.reduce((sum, item) => sum + item.releases.length, 0);
  const downloadCount = catalog.software.reduce((sum, item) => sum + item.releases.reduce((inner, release) => inner + (release.downloadCount || 0), 0), 0);
  byId("stats").innerHTML = [
    ["软件数量", softwareCount],
    ["版本数量", releaseCount],
    ["总下载", downloadCount],
    ["分类数量", catalog.categories.length]
  ].map(([label, value]) => `<article class="stat"><span>${escapeHtml(label)}</span><strong>${value}</strong></article>`).join("");
}

function renderCategoryOptions() {
  const options = catalog.categories.map(category => `<option value="${escapeAttr(category.id)}">${escapeHtml(category.name)}</option>`).join("");
  byId("softwareCategory").innerHTML = options;
  byId("releaseSoftware").innerHTML = catalog.software.map(item => `<option value="${escapeAttr(item.id)}">${escapeHtml(item.name)}</option>`).join("");
  byId("registerSoftware").innerHTML = byId("releaseSoftware").innerHTML;
  const assetStorage = byId("assetStorage");
  if (assetStorage) {
    const selectedStorage = assetStorage.value || "default";
    assetStorage.innerHTML = `<option value="default">默认 R2：dy-ldms-downloads</option>${(catalog.storageAccounts || []).filter(item => item.status !== "disabled").map(item => `<option value="${escapeAttr(item.id)}">${escapeHtml(item.name)} / ${escapeHtml(item.bucket)}</option>`).join("")}`;
    assetStorage.value = [...assetStorage.options].some(option => option.value === selectedStorage) ? selectedStorage : "default";
  }
  byId("releaseStorage").innerHTML = `<option value="default">默认 R2：dy-ldms-downloads</option>${(catalog.storageAccounts || []).filter(item => item.status !== "disabled").map(item => `<option value="${escapeAttr(item.id)}">${escapeHtml(item.name)} / ${escapeHtml(item.bucket)}</option>`).join("")}`;
  const galleryStorage = byId("galleryStorage");
  if (galleryStorage) galleryStorage.innerHTML = `<option value="default">默认 R2</option><option value="cloudflare-images">Cloudflare Images 图像托管</option>${(catalog.storageAccounts || []).filter(item => item.status !== "disabled").map(item => `<option value="${escapeAttr(item.id)}">${escapeHtml(item.name)} / ${escapeHtml(item.bucket)}</option>`).join("")}`;
  loadSoftwareCoverAssets();
  loadMusicCoverAssets();
  loadGalleryAssets();
  loadSiteCarouselAssets();
  loadPhotoWallAssets();
  syncHotAppSelect();
}

function renderArticleOptions() {
  const root = byId("articleSoftware");
  const categorySelect = byId("articleSoftwareCategory");
  if (!root || !categorySelect) return;
  const existingIds = new Set((catalog.software || []).map(item => item.id));
  articleSoftwareSelection = new Set(Array.from(articleSoftwareSelection).filter(id => existingIds.has(id)));

  const categories = [{ id: "all", name: "全部分类", count: catalog.software.length }, ...(catalog.categories || []).map(category => ({
    ...category,
    count: (catalog.software || []).filter(item => item.categoryId === category.id).length
  }))];
  if (!categories.some(category => category.id === articleSoftwareCategory)) articleSoftwareCategory = "all";
  categorySelect.innerHTML = categories.map(category => `<option value="${escapeAttr(category.id)}">${escapeHtml(category.name)}（${category.count || 0}）</option>`).join("");
  categorySelect.value = articleSoftwareCategory;

  const software = (catalog.software || []).filter(item => articleSoftwareCategory === "all" || item.categoryId === articleSoftwareCategory);
  if (!catalog.software.length) {
    root.innerHTML = `<p class="muted">还没有上传软件，先到“软件管理”添加软件。文章可以不关联软件直接保存。</p>`;
    updateArticleSoftwareHint();
    return;
  }
  if (!software.length) {
    root.innerHTML = `<p class="muted">当前分类没有软件，可以切换分类或不关联软件。</p>`;
    updateArticleSoftwareHint();
    return;
  }
  root.innerHTML = software.map(item => {
    const category = catalog.categories.find(entry => entry.id === item.categoryId);
    const checked = articleSoftwareSelection.has(item.id) ? "checked" : "";
    return `<label class="software-choice"><input type="checkbox" value="${escapeAttr(item.id)}" ${checked}> <span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(category?.name || "未分类")}${item.status === "disabled" ? " · 已下架" : ""}</small></span></label>`;
  }).join("");
  Array.from(root.querySelectorAll("input[type='checkbox']")).forEach(input => {
    input.addEventListener("change", () => {
      if (input.checked) articleSoftwareSelection.add(input.value);
      else articleSoftwareSelection.delete(input.value);
      updateArticleSoftwareHint();
    });
  });
  updateArticleSoftwareHint();
}

function renderSoftwareRows() {
  const rows = byId("softwareRows");
  rows.innerHTML = "";
  for (const item of catalog.software) {
    const category = catalog.categories.find(entry => entry.id === item.categoryId);
    const latest = item.releases.find(release => release.isLatest) || item.releases[0];
    const tr = document.createElement("tr");
    tr.innerHTML = `<td><strong>${escapeHtml(item.name)}</strong><br><small>${escapeHtml(item.slug)}</small></td><td>${escapeHtml(category?.name || "-")}</td><td>${escapeHtml(latest?.version || "-")}</td><td class="status-${item.status === "disabled" ? "disabled" : "active"}">${item.status === "disabled" ? "下架" : "上架"}</td><td class="row-actions"></td>`;
    const edit = actionButton("编辑", () => fillSoftwareForm(item));
    const hotUpdate = actionButton("热更", () => {
      showPanel("hotUpdatePanel");
      switchHotApp(item.slug);
    });
    const remove = actionButton("删除", () => deleteSoftware(item.id), "danger");
    tr.lastElementChild.append(edit, hotUpdate, remove);
    rows.append(tr);
  }
}

function renderCategoryRows() {
  const rows = byId("categoryRows");
  rows.innerHTML = "";
  for (const item of catalog.categories) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${escapeHtml(item.name)}</td><td class="code">${escapeHtml(item.slug)}</td><td>${item.sortOrder}</td><td class="status-${item.status === "disabled" ? "disabled" : "active"}">${item.status === "disabled" ? "隐藏" : "启用"}</td><td class="row-actions"></td>`;
    const edit = actionButton("编辑", () => fillCategoryForm(item));
    const remove = actionButton("删除", () => deleteCategory(item.id), "danger");
    tr.lastElementChild.append(edit, remove);
    rows.append(tr);
  }
}

function renderMusicRows() {
  const rows = byId("musicRows");
  if (!rows) return;
  rows.innerHTML = "";
  for (const item of catalog.music || []) {
    const tr = document.createElement("tr");
    const source = item.audioUrl ? "R2/链接" : item.neteaseId ? `网易云 ${item.neteaseId}` : "-";
    tr.innerHTML = `<td><strong>${escapeHtml(item.title)}</strong><br><small>${escapeHtml(item.artist)}${item.album ? ` · ${escapeHtml(item.album)}` : ""}</small></td><td class="code">${escapeHtml(source)}</td><td>${item.coverUrl ? `<img class="thumb" src="${escapeAttr(item.coverUrl)}" alt="">` : "-"}</td><td class="status-${item.status === "published" ? "active" : "disabled"}">${item.status === "published" ? "已发布" : item.status === "disabled" ? "隐藏" : "草稿"}</td><td class="row-actions"></td>`;
    tr.lastElementChild.append(
      actionButton("试听", () => previewMusic(item)),
      actionButton("编辑", () => fillMusicForm(item)),
      actionButton("删除", () => deleteMusic(item.id), "danger")
    );
    rows.append(tr);
  }
}

function renderGalleryRows() {
  const rows = byId("galleryRows");
  if (!rows) return;
  rows.innerHTML = "";
  for (const item of catalog.gallery || []) {
    const tr = document.createElement("tr");
    const source = item.source === "network" ? "网络图片" : item.storageId ? item.storageId : "-";
    tr.innerHTML = `<td>${item.imageUrl ? `<img class="thumb" src="${escapeAttr(item.thumbUrl || item.imageUrl)}" alt="">` : "-"} <strong>${escapeHtml(item.title)}</strong><br><small>${escapeHtml(item.description || "")}</small></td><td class="code">${escapeHtml(source)}<br><small>${escapeHtml(item.assetKey || item.imageUrl)}</small></td><td>${escapeHtml((item.tags || []).join(", "))}</td><td class="status-${item.status === "published" ? "active" : item.status === "draft" ? "draft" : "disabled"}">${item.status === "published" ? "已发布" : item.status === "draft" ? "草稿" : "隐藏"}</td><td class="row-actions"></td>`;
    tr.lastElementChild.append(
      actionButton("预览", () => window.open(item.imageUrl, "_blank")),
      actionButton("编辑", () => fillGalleryForm(item, currentAdminModule())),
      actionButton("删除", () => deleteGallery(item.id), "danger")
    );
    rows.append(tr);
  }
}

function renderStorageRows() {
  const rows = byId("storageRows");
  rows.innerHTML = "";
  for (const item of catalog.storageAccounts || []) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td><strong>${escapeHtml(item.name)}</strong><br><small>${escapeHtml(item.provider)}</small></td><td class="code">${escapeHtml(item.accountId)}</td><td>${escapeHtml(item.bucket)}</td><td>${item.hasSecret ? "已保存" : "未保存"}</td><td class="status-${item.status === "disabled" ? "disabled" : "active"}">${item.status === "disabled" ? "停用" : "启用"}</td><td class="row-actions"></td>`;
    const edit = actionButton("编辑", () => fillStorageForm(item));
    const remove = actionButton("删除", () => deleteStorage(item.id), "danger");
    tr.lastElementChild.append(edit, remove);
    rows.append(tr);
  }
}

function renderNavigationRows() {
  const rows = byId("navigationRows");
  rows.innerHTML = "";
  for (const item of catalog.navigation || []) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${escapeHtml(item.label)}</td><td class="code">${escapeHtml(item.href)}</td><td>${item.sortOrder}</td><td>${item.external ? "新窗口" : "当前窗口"}</td><td class="status-${item.status === "disabled" ? "disabled" : "active"}">${item.status === "disabled" ? "隐藏" : "显示"}</td><td class="row-actions"></td>`;
    const edit = actionButton("编辑", () => fillNavigationForm(item));
    const remove = actionButton("删除", () => deleteNavigation(item.id), "danger");
    tr.lastElementChild.append(edit, remove);
    rows.append(tr);
  }
}

function renderArticleRows() {
  const rows = byId("articleRows");
  const articles = catalog.articles || [];
  byId("articleCount").textContent = `${articles.length} 篇`;
  rows.replaceChildren();
  if (!articles.length) {
    rows.innerHTML = `<article class="article-admin-empty"><h4>还没有文章</h4><p>在左侧写一篇产品介绍、使用教程或更新说明。</p></article>`;
    return;
  }
  for (const item of articles) {
    const related = (item.softwareIds || []).map(id => catalog.software.find(software => software.id === id)?.name).filter(Boolean).join("、") || "-";
    const card = document.createElement("article");
    card.className = `article-admin-card ${item.id === byId("articleId").value ? "is-editing" : ""}`;
    card.innerHTML = `${item.coverUrl ? `<img src="${escapeAttr(item.coverUrl)}" alt="">` : `<div class="article-admin-card__placeholder">Article</div>`}<div class="article-admin-card__body"><div class="article-admin-card__meta"><span class="status-${articleStatusClass(item.status)}">${articleStatusLabel(item.status)}</span><small>${formatDateTime(item.updatedAt)}</small></div><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.summary || "暂无摘要")}</p><small>${escapeHtml(item.slug)} · ${escapeHtml(related)}</small><div class="row-actions"></div></div>`;
    const edit = actionButton("编辑", () => fillArticleForm(item));
    const view = actionButton("预览", () => window.open(`/article.html?slug=${encodeURIComponent(item.slug)}`, "_blank"));
    const remove = actionButton("删除", () => deleteArticle(item.id), "danger");
    card.querySelector(".row-actions").append(edit, view, remove);
    rows.append(card);
  }
}

function renderReleaseRows() {
  const rows = byId("releaseRows");
  rows.innerHTML = "";
  const filterSoftware = byId("releaseFilterSoftware")?.value || "all";
  const keyword = (byId("releaseFilterSearch")?.value || "").trim().toLowerCase();
  const statusText = { published: "已发布", draft: "草稿", disabled: "已隐藏" };
  for (const item of catalog.software) {
    if (filterSoftware !== "all" && item.id !== filterSoftware) continue;
    for (const release of item.releases) {
      if (keyword && !`${release.version} ${release.fileName || ""} ${release.fileKey || ""}`.toLowerCase().includes(keyword)) continue;
      const tr = document.createElement("tr");
      const statusClass = release.status === "disabled" ? "disabled" : release.status === "draft" ? "draft" : "active";
      tr.innerHTML = `<td>${escapeHtml(item.name)}</td><td>${escapeHtml(release.version)} <small>${escapeHtml(RELEASE_PLATFORM_LABELS[release.platform] || "")}${release.label ? " · " + escapeHtml(release.label) : ""}</small><br><small class="status-${statusClass}">${statusText[release.status] || "已发布"}</small></td><td class="code">${escapeHtml(release.fileName || "-")}<br><small>${escapeHtml(release.storageId || "default")}</small></td><td>${escapeHtml(release.size || "-")}</td><td>${release.isLatest ? "是" : "否"}</td><td>${release.downloadCount || 0}</td><td class="row-actions"></td>`;
      const link = `/download/${encodeURIComponent(release.id)}`;
      const replaceInput = document.createElement("input");
      replaceInput.type = "file";
      replaceInput.accept = ".zip,.7z,.rar,.exe,.msi";
      replaceInput.hidden = true;
      replaceInput.addEventListener("change", () => replaceReleaseFile(release.id, replaceInput));
      tr.lastElementChild.append(
        actionButton("编辑", () => openReleaseEdit(item, release)),
        actionButton("设最新", () => updateRelease(release.id, "latest")),
        actionButton(release.status === "disabled" ? "恢复" : "隐藏", () => updateRelease(release.id, "toggle")),
        actionButton("替换文件", () => replaceInput.click()),
        actionButton("复制链接", () => copyText(new URL(link, location.origin).href)),
        actionButton("删除", () => deleteRelease(release.id), "danger"),
        replaceInput
      );
      rows.append(tr);
    }
  }
}

async function loadHealth() {
  const root = byId("healthRows");
  root.innerHTML = `<article class="admin-info-card"><h4>正在检测...</h4><p>请稍候</p></article>`;
  const result = await api("/api/admin/health");
  if (!result.success) {
    root.innerHTML = `<article class="admin-info-card admin-info-card--bad"><h4>检测失败</h4><p>${escapeHtml(result.msg || "未知错误")}</p></article>`;
    return;
  }
  const health = result.health;
  root.innerHTML = `<article class="admin-info-card"><h4>${escapeHtml(health.product)}</h4><p>${escapeHtml(health.mode)} · ${formatDateTime(health.checkedAt)} · ${health.elapsedMs}ms</p></article>${health.checks.map(check => `<article class="admin-info-card ${check.ok ? "" : "admin-info-card--bad"}"><h4>${check.ok ? "正常" : "异常"} · ${escapeHtml(check.name)}</h4><p>${escapeHtml(check.detail)}</p></article>`).join("")}`;
}

async function loadMedia(type = "all") {
  const root = byId("mediaRows");
  root.innerHTML = `<article class="admin-info-card"><h4>正在读取媒体...</h4></article>`;
  const result = await api("/api/admin/media/list", { type });
  if (!result.success) {
    root.innerHTML = `<article class="admin-info-card admin-info-card--bad"><h4>读取失败</h4><p>${escapeHtml(result.msg || "媒体库不可用")}</p></article>`;
    return;
  }
  if (!result.media.length) {
    root.innerHTML = `<article class="admin-info-card"><h4>暂无媒体</h4><p>上传文章图片或音频后会显示在这里。</p></article>`;
    return;
  }
  root.replaceChildren();
  for (const item of result.media) {
    const card = document.createElement("article");
    card.className = "media-card";
    card.innerHTML = `${item.type === "audio" ? `<audio controls src="${escapeAttr(item.url)}"></audio>` : `<img src="${escapeAttr(item.url)}" alt="" loading="lazy">`}<div><strong>${escapeHtml(item.key)}</strong><small>${formatBytes(item.size)} · ${formatDateTime(item.uploaded)}</small><div class="row-actions"></div></div>`;
    const actions = card.querySelector(".row-actions");
    actions.append(
      actionButton("复制", () => copyText(item.url)),
      actionButton("设封面", () => setArticleCoverFromMedia(item.url)),
      actionButton("插入正文", () => insertMediaIntoArticle(item)),
      actionButton("删除", () => deleteMedia(item.key), "danger")
    );
    root.append(card);
  }
}

async function loadAssets() {
  const root = byId("assetRows");
  root.innerHTML = `<article class="admin-info-card"><h4>正在读取资源...</h4></article>`;
  const result = await api("/api/admin/assets/list", {
    kind: byId("assetKindFilter").value,
    status: byId("assetStatusFilter").value,
    search: byId("assetSearch").value.trim(),
    pageSize: 80
  });
  if (!result.success) {
    root.innerHTML = `<article class="admin-info-card admin-info-card--bad"><h4>读取失败</h4><p>${escapeHtml(result.msg || "资源管理不可用")}</p></article>`;
    return;
  }
  if (!result.assets.length) {
    root.innerHTML = `<article class="admin-info-card"><h4>暂无资源</h4><p>上传资源后会显示在这里。</p></article>`;
    return;
  }
  root.replaceChildren();
  for (const asset of result.assets) {
    const card = document.createElement("article");
    card.className = "asset-card";
    const preview = asset.kind === "image" || asset.kind === "site"
      ? `<img src="${escapeAttr(asset.url)}" alt="" loading="lazy">`
      : asset.kind === "audio"
        ? `<audio controls src="${escapeAttr(asset.url)}"></audio>`
        : `<div class="asset-file-icon">${escapeHtml(asset.kind)}</div>`;
    card.innerHTML = `${preview}<div><strong>${escapeHtml(asset.fileName || asset.key)}</strong><small>${escapeHtml(asset.kind)} · ${formatBytes(asset.fileSize)} · ${formatDateTime(asset.updatedAt)}</small><code>${escapeHtml(asset.key)}</code><div class="row-actions"></div></div>`;
    card.querySelector(".row-actions").append(
      actionButton("复制链接", () => copyText(asset.url)),
      actionButton("复制Key", () => copyText(asset.key)),
      actionButton("删除", () => deleteAsset(asset.id), "danger")
    );
    root.append(card);
  }
}

async function loadSoftwareCoverAssets() {
  const select = byId("softwareCoverAsset");
  if (!select) return;
  select.innerHTML = `<option value="">选择 R2 图片</option>`;
  const results = await Promise.all([
    api("/api/admin/assets/list", { kind: "image", status: "active", pageSize: 100 }),
    api("/api/admin/assets/list", { kind: "site", status: "active", pageSize: 100 })
  ]);
  const assets = results
    .filter(result => result.success)
    .flatMap(result => result.assets || [])
    .filter(asset => asset.kind === "image" || asset.kind === "site");
  for (const asset of assets) {
    const option = document.createElement("option");
    option.value = asset.url || mediaUrlForKey(asset.key);
    option.textContent = `${asset.fileName || asset.key} (${formatBytes(asset.fileSize)})`;
    select.append(option);
  }
}

function useSoftwareCoverAsset() {
  const value = byId("softwareCoverAsset").value;
  if (!value) return toast("请先选择一张 R2 图片", true);
  byId("softwareCover").value = value;
  toast("已使用选中的 R2 图片");
}

async function uploadSoftwareCover() {
  const file = byId("softwareCoverFile").files[0];
  if (!file) return toast("请选择本地封面图片", true);
  const mediaType = mediaTypeFor(file);
  if (mediaType === "svg") return toast("不支持上传 SVG，请使用 PNG/JPG/WebP", true);
  if (mediaType !== "image") return toast("请选择图片文件", true);
  if (file.size > 8 * 1024 * 1024) return toast("封面图片不能超过 8MB", true);

  toast("正在上传封面");
  const result = await uploadArticleMedia(file, "image");
  if (!result.success) return toast(result.msg || "封面上传失败", true);
  byId("softwareCover").value = result.url;
  byId("softwareCoverFile").value = "";
  await loadSoftwareCoverAssets();
  toast("封面已上传并填入地址");
}

async function loadMusicCoverAssets() {
  const select = byId("musicCoverAsset");
  if (!select) return;
  select.innerHTML = `<option value="">选择 R2 图片</option>`;
  const results = await Promise.all([
    api("/api/admin/assets/list", { kind: "image", status: "active", pageSize: 100 }),
    api("/api/admin/assets/list", { kind: "site", status: "active", pageSize: 100 })
  ]);
  const assets = results.filter(result => result.success).flatMap(result => result.assets || []);
  for (const asset of assets) {
    const option = document.createElement("option");
    option.value = asset.url || mediaUrlForKey(asset.key);
    option.textContent = `${asset.fileName || asset.key} (${formatBytes(asset.fileSize)})`;
    select.append(option);
  }
}

async function loadGalleryAssets() {
  const select = byId("galleryAsset");
  if (!select) return;
  select.innerHTML = `<option value="">选择图片</option>`;
  const storageId = byId("galleryStorage")?.value || "default";
  if (storageId === "cloudflare-images") {
    select.innerHTML = `<option value="">Cloudflare Images 请上传或粘贴图片 URL</option>`;
    return;
  }
  const result = await api("/api/admin/assets/list", { storageId, kind: "image", status: "active", pageSize: 100 });
  if (!result.success) {
    toast(result.msg || "读取 R2 图片失败", true);
    return;
  }
  for (const asset of result.assets || []) {
    if (asset.kind !== "image" && asset.kind !== "site") continue;
    const url = asset.url || asset.publicUrl || (asset.storageId === "default" && asset.key ? mediaUrlForKey(asset.key) : "");
    if (!url) continue;
    const option = document.createElement("option");
    option.value = JSON.stringify({
      url,
      key: asset.key || "",
      storageId: asset.storageId || storageId
    });
    option.textContent = `${asset.fileName || asset.key} (${formatBytes(asset.fileSize)})`;
    select.append(option);
  }
}

function useGalleryAsset() {
  const value = byId("galleryAsset").value;
  if (!value) return toast("请先选择一张 R2 图片", true);
  const asset = JSON.parse(value);
  byId("galleryImageUrl").value = asset.url || "";
  byId("galleryThumbUrl").value = asset.url || "";
  byId("galleryAssetKey").value = asset.key || "";
  byId("galleryStorage").value = asset.storageId || "default";
  toast("已使用选中的图片");
}

async function loadSiteCarouselAssets() {
  const select = byId("siteCarouselAsset");
  if (!select) return;
  select.innerHTML = `<option value="">选择图片</option>`;
  const result = await api("/api/admin/assets/list", { kind: "image", status: "active", pageSize: 100 });
  if (!result.success) return toast(result.msg || "读取 R2 图片失败", true);
  for (const asset of result.assets || []) {
    if (asset.kind !== "image" && asset.kind !== "site") continue;
    const url = asset.url || asset.publicUrl || (asset.key ? mediaUrlForKey(asset.key) : "");
    if (!url) continue;
    const option = document.createElement("option");
    option.value = url;
    option.textContent = `${asset.fileName || asset.key} (${formatBytes(asset.fileSize)})`;
    select.append(option);
  }
}

function useSiteCarouselAsset() {
  const value = byId("siteCarouselAsset").value;
  if (!value) return toast("请先选择一张 R2 图片", true);
  byId("siteCarouselImageUrl").value = value;
  byId("siteCarouselThumbUrl").value = value;
  toast("已使用选中的轮播图");
}

async function uploadSiteCarouselImage() {
  const file = byId("siteCarouselFile").files[0];
  if (!file) return toast("请选择本地图片", true);
  const error = validateGalleryFile(file);
  if (error) return toast(error, true);
  toast("正在上传首页轮播图");
  const result = await uploadAssetMedia(file, "image", "site-carousel", "site-carousel");
  if (!result.success || !result.url) return toast(result.msg || "轮播图上传失败", true);
  byId("siteCarouselImageUrl").value = result.url;
  byId("siteCarouselThumbUrl").value = result.url;
  byId("siteCarouselFile").value = "";
  await loadSiteCarouselAssets();
  toast("首页轮播图已上传");
}

function previewSiteCarouselImage() {
  const url = byId("siteCarouselImageUrl").value.trim();
  if (!url) return toast("请先填写或选择图片地址", true);
  window.open(url, "_blank");
}

async function loadPhotoWallAssets() {
  const select = byId("photoWallAsset");
  if (!select) return;
  select.innerHTML = `<option value="">选择图片</option>`;
  const result = await api("/api/admin/assets/list", { kind: "image", status: "active", pageSize: 100 });
  if (!result.success) return toast(result.msg || "读取 R2 图片失败", true);
  for (const asset of result.assets || []) {
    if (asset.kind !== "image" && asset.kind !== "site") continue;
    const url = asset.url || asset.publicUrl || (asset.key ? mediaUrlForKey(asset.key) : "");
    if (!url) continue;
    const option = document.createElement("option");
    option.value = JSON.stringify({
      url,
      key: asset.key || "",
      storageId: asset.storageId || "default"
    });
    option.textContent = `${asset.fileName || asset.key} (${formatBytes(asset.fileSize)})`;
    select.append(option);
  }
}

function usePhotoWallAsset() {
  const value = byId("photoWallAsset").value;
  if (!value) return toast("请先选择一张 R2 图片", true);
  const asset = JSON.parse(value);
  byId("photoWallImageUrl").value = asset.url || "";
  byId("photoWallThumbUrl").value = asset.url || "";
  byId("photoWallAssetKey").value = asset.key || "";
  toast("已使用选中的照片墙图片");
}

async function uploadPhotoWallImage() {
  const file = byId("photoWallFile").files[0];
  if (!file) return toast("请选择本地图片", true);
  const error = validateGalleryFile(file);
  if (error) return toast(error, true);
  toast("正在上传照片墙图片");
  const result = await uploadAssetMedia(file, "image", "photo-wall", "photo-wall");
  if (!result.success || !result.url) return toast(result.msg || "照片墙图片上传失败", true);
  byId("photoWallImageUrl").value = result.url;
  byId("photoWallThumbUrl").value = result.url;
  byId("photoWallAssetKey").value = result.asset?.key || result.key || "";
  byId("photoWallFile").value = "";
  await loadPhotoWallAssets();
  toast("照片墙图片已上传");
}

function previewPhotoWallImage() {
  const url = byId("photoWallImageUrl").value.trim();
  if (!url) return toast("请先填写或选择图片地址", true);
  window.open(url, "_blank");
}

async function uploadGalleryImage() {
  const file = byId("galleryFile").files[0];
  if (!file) return toast("请选择本地图片", true);
  const error = validateGalleryFile(file);
  if (error) return toast(error, true);
  toast("正在上传画廊图片");
  const result = await uploadGalleryFile(file);
  if (!result.success) return toast(result.msg || "图片上传失败", true);
  if (!result.url) return toast("图片已上传，但没有返回可用地址", true);
  byId("galleryImageUrl").value = result.url;
  byId("galleryThumbUrl").value = result.url;
  byId("galleryAssetKey").value = result.asset?.key || "";
  byId("galleryStorage").value = result.asset?.storageId || byId("galleryStorage").value;
  byId("galleryFile").value = "";
  await loadGalleryAssets();
  toast("画廊图片已上传");
}

function validateGalleryFile(file) {
  const mediaType = mediaTypeFor(file);
  if (mediaType === "svg") return `不支持上传 SVG：${file.name || "未命名图片"}`;
  if (mediaType !== "image") return `请选择图片文件：${file.name || "未命名文件"}`;
  if (file.size > 8 * 1024 * 1024) return `图片不能超过 8MB：${file.name || "未命名图片"}`;
  return "";
}

async function uploadGalleryFile(file) {
  const storageId = byId("galleryStorage").value;
  return storageId === "cloudflare-images"
    ? uploadCloudflareImage(file)
    : uploadAssetMedia(file, "image", "gallery", "gallery", storageId);
}

async function uploadCloudflareImage(file) {
  try {
    const ticket = await api("/api/admin/images/direct-upload", {
      fileName: file.name || "gallery-image",
      contentType: file.type || ""
    });
    if (!ticket.success) return ticket;
    if (!ticket.uploadURL || !ticket.imageId) return { success: false, msg: "Cloudflare Images 没有返回上传地址" };
    const form = new FormData();
    form.append("file", file, file.name || "gallery-image");
    const response = await fetch(ticket.uploadURL, { method: "POST", body: form });
    const text = await response.text();
    const result = parseUploadResponse(text);
    if (!response.ok || result.success === false) {
      return { success: false, msg: result.errors?.[0]?.message || result.msg || `Cloudflare Images 上传失败：HTTP ${response.status}` };
    }
    return {
      success: true,
      url: ticket.url,
      asset: { key: ticket.imageId, storageId: "cloudflare-images", url: ticket.url }
    };
  } catch (error) {
    return { success: false, msg: `Cloudflare Images 上传失败：${error.message || "网络异常"}` };
  }
}

function previewGalleryImage() {
  const url = byId("galleryImageUrl").value.trim();
  if (!url) return toast("请先填写或选择图片地址", true);
  window.open(url, "_blank");
}

function useMusicCoverAsset() {
  const value = byId("musicCoverAsset").value;
  if (!value) return toast("请先选择一张 R2 图片", true);
  byId("musicCoverUrl").value = value;
  toast("已使用选中的 R2 封面");
}

async function uploadMusicCover() {
  const file = byId("musicCoverFile").files[0];
  if (!file) return toast("请选择本地封面图片", true);
  const mediaType = mediaTypeFor(file);
  if (mediaType === "svg") return toast("不支持上传 SVG，请使用 PNG/JPG/WebP", true);
  if (mediaType !== "image") return toast("请选择图片文件", true);
  if (file.size > 8 * 1024 * 1024) return toast("封面图片不能超过 8MB", true);
  toast("正在上传音乐封面");
  const result = await uploadAssetMedia(file, "image", "music-cover", "music-cover");
  if (!result.success) return toast(result.msg || "封面上传失败", true);
  if (!result.url) return toast("封面已上传，但没有返回可用地址", true);
  byId("musicCoverUrl").value = result.url;
  byId("musicCoverFile").value = "";
  await loadMusicCoverAssets();
  toast("音乐封面已上传");
}

async function uploadAssetMedia(file, kind, folder = "", refType = "", storageId = "default") {
  try {
    const data = await fileToBase64(file);
    const response = await fetch("/api/admin/assets/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({
        token,
        storageId,
        kind,
        folder,
        refType,
        fileName: file.name || "asset.bin",
        contentType: file.type || "",
        data
      })
    });
    const text = await response.text();
    const result = parseUploadResponse(text);
    if (!response.ok) return { success: false, msg: result.msg || `上传失败：HTTP ${response.status}` };
    const asset = result.asset || {};
    return {
      ...result,
      url: asset.url || asset.publicUrl || (asset.key ? mediaUrlForKey(asset.key) : "")
    };
  } catch (error) {
    return { success: false, msg: `上传失败：${error.message || "网络或接口异常"}` };
  }
}

async function uploadMusicAudio() {
  const file = byId("musicAudioFile").files[0];
  if (!file) return toast("请选择本地音频", true);
  const mediaType = mediaTypeFor(file);
  if (mediaType !== "audio") return toast("请选择音频文件", true);
  if (file.size > 30 * 1024 * 1024) return toast("音频不能超过 30MB，请先压缩或使用外链", true);
  toast("正在上传音乐音频");
  const result = await uploadArticleMedia(file, "audio");
  if (!result.success) return toast(result.msg || "音频上传失败", true);
  byId("musicAudioUrl").value = result.url;
  byId("musicAudioFile").value = "";
  previewMusic({ title: byId("musicTitle").value || file.name, artist: byId("musicArtist").value || "试听", audioUrl: result.url, coverUrl: byId("musicCoverUrl").value });
  toast("音频已上传，可试听");
}

async function uploadAsset(event) {
  event.preventDefault();
  const file = byId("assetFile").files[0];
  if (!file) return toast("请选择资源文件", true);
  const kind = byId("assetKind").value;
  const folder = byId("assetFolder").value.trim();
  const storageId = byId("assetStorage")?.value || "default";
  if (file.size > MAX_CHUNKED_SIZE) return toast(`文件不能超过 ${formatBytes(MAX_CHUNKED_SIZE)}`, true);
  let result;
  if (file.size > CHUNK_UPLOAD_THRESHOLD) {
    // 大文件分片并行上传，突破单次请求 100MB 限制
    result = await uploadFileInParts(file, {
      title: "正在上传资源",
      initUrl: "/api/admin/assets/presign",
      initPayload: { kind, folder, storageId },
      completeUrl: "/api/admin/assets/complete-upload",
      completePayload: { kind, folder },
      doneText: "上传完成，资源已登记"
    });
  } else {
    const form = new FormData();
    form.append("token", token);
    form.append("kind", kind);
    form.append("folder", folder);
    form.append("storageId", storageId);
    form.append("file", file);
    toast("正在上传资源");
    result = await uploadMultipart("/api/admin/assets/upload", form);
  }
  if (!result.success) return toast(result.msg || "上传失败", true);
  byId("assetUploadForm").reset();
  await loadAssets();
  toast("资源已上传");
}

async function deleteAsset(assetId, force = false) {
  if (!confirm(force ? "确定强制删除这个资源和 R2 文件吗？" : "确定删除这个资源吗？")) return;
  const result = await api("/api/admin/assets/delete", { assetId, force });
  if (!result.success && result.references?.length) {
    const refs = result.references.map(ref => `${ref.type}: ${ref.title || ref.id}`).join("\n");
    if (confirm(`资源正在被使用：\n${refs}\n\n是否仍然强制删除？`)) return deleteAsset(assetId, true);
    return;
  }
  if (!result.success) return toast(result.msg || "删除失败", true);
  await loadAssets();
  toast("资源已删除");
}

async function saveStorage(event) {
  event.preventDefault();
  const result = await api("/api/admin/storage", storagePayload());
  if (!result.success) return toast(result.msg || "保存失败", true);
  resetStorageForm();
  render(result.catalog);
  toast("存储授权已保存");
}

async function saveNavigation(event) {
  event.preventDefault();
  const result = await api("/api/admin/navigation", navigationPayload());
  if (!result.success) return toast(result.msg || "保存失败", true);
  resetNavigationForm();
  render(result.catalog);
  toast("导航已保存");
}

async function saveSiteHome(event) {
  event.preventDefault();
  const result = await api("/api/admin/site", siteHomePayload());
  if (!result.success) return toast(result.msg || "保存失败", true);
  render(result.catalog);
  showPanel("siteHomePanel", { moduleId: "site" });
  toast("首页文案已保存");
}

async function saveSiteCarousel(event) {
  event.preventDefault();
  const imageUrl = byId("siteCarouselImageUrl").value.trim();
  const payload = {
    id: byId("siteCarouselId").value,
    title: byId("siteCarouselTitle").value.trim(),
    description: byId("siteCarouselDescription").value.trim(),
    imageUrl,
    thumbUrl: byId("siteCarouselThumbUrl").value.trim() || imageUrl,
    suggestion: byId("siteCarouselSuggestion").value.trim(),
    sortOrder: Number(byId("siteCarouselSort").value || 0),
    status: byId("siteCarouselStatus").value
  };
  if (!payload.title || !payload.imageUrl) return toast("请填写标题和图片地址", true);
  const result = await api("/api/admin/site-carousel", payload);
  if (!result.success) return toast(result.msg || "保存失败", true);
  resetSiteCarouselForm();
  render(result.catalog);
  showPanel("siteCarouselPanel", { moduleId: "site", view: "siteCarouselList" });
  toast("首页轮播图已保存");
}

async function savePhotoWall(event) {
  event.preventDefault();
  const file = byId("photoWallFile").files[0];
  if (file) {
    const error = validateGalleryFile(file);
    if (error) return toast(error, true);
    toast("正在上传照片墙图片");
    const uploaded = await uploadAssetMedia(file, "image", "photo-wall", "photo-wall");
    if (!uploaded.success || !uploaded.url) return toast(uploaded.msg || "照片墙图片上传失败", true);
    byId("photoWallImageUrl").value = uploaded.url;
    byId("photoWallThumbUrl").value = uploaded.url;
    byId("photoWallAssetKey").value = uploaded.asset?.key || uploaded.key || "";
    byId("photoWallFile").value = "";
  }
  const imageUrl = byId("photoWallImageUrl").value.trim();
  const payload = {
    id: byId("photoWallId").value,
    title: byId("photoWallTitle").value.trim(),
    description: byId("photoWallDescription").value.trim(),
    imageUrl,
    thumbUrl: byId("photoWallThumbUrl").value.trim() || imageUrl,
    linkUrl: byId("photoWallLinkUrl").value.trim(),
    linkText: byId("photoWallLinkText").value.trim(),
    assetKey: byId("photoWallAssetKey").value.trim(),
    sortOrder: Number(byId("photoWallSort").value || 0),
    status: byId("photoWallStatus").value
  };
  if (!payload.title || !payload.imageUrl) return toast("请填写文字和图片地址", true);
  const result = await api("/api/admin/photo-wall", payload);
  if (!result.success) return toast(result.msg || "保存失败", true);
  resetPhotoWallForm();
  render(result.catalog);
  showPanel("photoWallPanel", { moduleId: "site", view: "photoWallList" });
  toast("照片墙已保存");
}

function fillSiteHomeForm(site = {}) {
  for (const key of SITE_HOME_FIELDS) {
    const input = byId(key);
    if (input) input.value = site[key] || "";
  }
}

function siteHomePayload() {
  return Object.fromEntries(SITE_HOME_FIELDS.map(key => [key, byId(key).value.trim()]));
}

async function deleteSiteCarousel(id) {
  if (!confirm("确定删除这张首页轮播图吗？图片文件不会自动删除。")) return;
  const result = await api("/api/admin/site-carousel", { action: "delete", id });
  if (!result.success) return toast(result.msg || "删除失败", true);
  render(result.catalog);
  showPanel("siteCarouselPanel", { moduleId: "site", view: "siteCarouselList" });
  toast("首页轮播图已删除");
}

async function deletePhotoWall(id) {
  if (!confirm("确定删除这张照片墙图片吗？图片文件不会自动删除。")) return;
  const result = await api("/api/admin/photo-wall", { action: "delete", id });
  if (!result.success) return toast(result.msg || "删除失败", true);
  render(result.catalog);
  showPanel("photoWallPanel", { moduleId: "site", view: "photoWallList" });
  toast("照片墙图片已删除");
}

async function saveArticle(event) {
  event.preventDefault();
  const result = await api("/api/admin/articles", articlePayload());
  if (!result.success) return toast(result.msg || "保存失败", true);
  clearArticleDraft(false);
  resetArticleForm();
  render(result.catalog);
  toast("文章已保存");
}

async function uploadArticleImage(target) {
  const file = byId("articleImageFile").files[0];
  if (!file) return toast("请选择要上传的图片或音频", true);
  const isAudioTarget = target === "audio";
  const isImageTarget = target === "cover" || target === "content";
  const mediaType = mediaTypeFor(file);
  if (mediaType === "svg") return toast("不支持上传 SVG，请改用 PNG/JPG/WebP", true);
  if (isAudioTarget && mediaType !== "audio") return toast("请选择音频文件后再插入音频", true);
  if (isImageTarget && mediaType !== "image") return toast("请选择图片文件后再上传图片", true);
  if (mediaType === "image" && file.size > 8 * 1024 * 1024) return toast("图片不能超过 8MB，请压缩后再上传", true);
  if (mediaType === "audio" && file.size > 30 * 1024 * 1024) return toast("音频不能超过 30MB，请压缩后再上传", true);
  toast("正在上传媒体");
  const result = await uploadArticleMedia(file, isAudioTarget ? "audio" : "image");
  if (!result.success) return toast(result.msg || "媒体上传失败", true);
  if (target === "cover") {
    byId("articleCover").value = result.url;
  } else if (target === "audio") {
    insertAtCursor(byId("articleContent"), `\n<figure class="article-audio"><audio controls preload="metadata" src="${result.url}"></audio></figure>\n`);
  } else {
    insertAtCursor(byId("articleContent"), `\n<figure><img src="${result.url}" alt=""><figcaption>图片说明</figcaption></figure>\n`);
  }
  updateArticleEditorMeta();
  toast("媒体已插入");
}

async function uploadArticleMedia(file, kind) {
  try {
    const data = await fileToBase64(file);
    const response = await fetch("/api/admin/article-image", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({
        token,
        kind,
        fileName: file.name || "article-media.bin",
        contentType: file.type || "",
        data
      })
    });
    const text = await response.text();
    const result = parseUploadResponse(text);
    if (!response.ok) return { success: false, msg: result.msg || `上传失败：HTTP ${response.status}` };
    return result;
  } catch (error) {
    return { success: false, msg: `上传失败：${error.message || "网络或接口异常"}` };
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.onerror = () => reject(reader.error || new Error("读取文件失败"));
    reader.readAsDataURL(file);
  });
}

function parseUploadResponse(text) {
  const value = String(text || "").trim();
  if (!value) return {};
  if (value.startsWith("{")) return JSON.parse(value);
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(value)?.[1]?.replace(/\s+/g, " ").trim();
  return { success: false, msg: title ? `上传接口返回 HTML：${title}` : "上传接口返回 HTML，未命中上传 API" };
}

function mediaTypeFor(file) {
  const type = String(file?.type || "").toLowerCase();
  const name = String(file?.name || "").toLowerCase();
  if (type === "image/svg+xml" || /\.svg$/i.test(name)) return "svg";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("audio/")) return "audio";
  if (/\.(png|jpe?g|gif|webp|avif)$/i.test(name)) return "image";
  if (/\.(mp3|m4a|aac|wav|ogg|oga|webm|flac)$/i.test(name)) return "audio";
  return "";
}

function allowedPackageFile(file) {
  return /\.(zip|7z|rar|exe|msi)$/i.test(String(file?.name || ""));
}

function insertArticleTable() {
  insertAtCursor(byId("articleContent"), `\n<table>\n  <thead>\n    <tr><th>项目</th><th>说明</th><th>状态</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>示例</td><td>填写说明</td><td>完成</td></tr>\n  </tbody>\n</table>\n`);
  updateArticleEditorMeta();
}

function insertArticleQuote() {
  insertAtCursor(byId("articleContent"), `\n<blockquote>这里填写重点说明、提示或案例总结。</blockquote>\n`);
  updateArticleEditorMeta();
}

function insertArticleSnippet(snippet) {
  insertAtCursor(byId("articleContent"), snippet);
  updateArticleEditorMeta();
}

function insertAtCursor(textarea, snippet) {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? start;
  textarea.value = textarea.value.slice(0, start) + snippet + textarea.value.slice(end);
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + snippet.length;
}

async function testStorage() {
  const payload = storagePayload();
  toast("正在测试 R2 连接，请稍候");
  const result = await api("/api/admin/storage/test", payload);
  if (!result.success) return toast(result.msg || "连接测试失败", true);
  toast(result.msg || "连接测试成功");
}

async function saveSoftware(event) {
  event.preventDefault();
  const initialFile = byId("softwareInitialFile")?.files?.[0];
  const initialVersion = byId("softwareInitialVersion")?.value?.trim();
  const initialChangelog = byId("softwareInitialChangelog")?.value?.trim() || "首发版本发布";

  if (initialFile && !initialVersion) {
    return toast("已选择首发安装包，请填写首发版本号（例如 1.0.0）", true);
  }

  const payload = {
    id: byId("softwareId").value,
    name: byId("softwareName").value.trim(),
    slug: byId("softwareSlug").value.trim(),
    categoryId: byId("softwareCategory").value,
    coverUrl: byId("softwareCover").value.trim(),
    description: byId("softwareDescription").value.trim(),
    tagline: byId("softwareTagline").value.trim(),
    requirements: byId("softwareRequirements").value.trim(),
    landingUrl: byId("softwareLandingUrl").value.trim(),
    highlights: byId("softwareHighlights").value,
    sortOrder: Number(byId("softwareSort").value || 0),
    status: byId("softwareStatus").value
  };
  const result = await api("/api/admin/software", payload);
  if (!result.success) return toast(result.msg || "保存失败", true);

  if (initialFile && initialVersion) {
    const targetSw = (result.catalog?.software || []).find(s => s.slug === payload.slug || s.name === payload.name);
    if (targetSw) {
      toast("软件信息已保存，正在上传首发安装包...");
      const uploadRes = await uploadChunked(initialFile, {
        softwareId: targetSw.id,
        version: initialVersion,
        changelog: initialChangelog,
        isLatest: true
      });
      if (uploadRes.success) {
        toast(`🎉 软件与首发安装包 v${initialVersion} 已一站式发布成功！`);
      }
    }
  }

  resetSoftwareForm();
  render(result.catalog);
  toast("软件已保存");
}

async function saveMusic(event) {
  event.preventDefault();
  const payload = {
    id: byId("musicId").value,
    title: byId("musicTitle").value.trim(),
    artist: byId("musicArtist").value.trim(),
    album: byId("musicAlbum").value.trim(),
    neteaseId: byId("musicNeteaseId").value.trim(),
    audioUrl: byId("musicAudioUrl").value.trim(),
    coverUrl: byId("musicCoverUrl").value.trim(),
    lyric: byId("musicLyric").value.trim(),
    tags: byId("musicTags").value.split(/[,，\n]/).map(item => item.trim()).filter(Boolean),
    featured: byId("musicFeatured").checked,
    sortOrder: Number(byId("musicSort").value || 0),
    status: byId("musicStatus").value
  };
  const result = await api("/api/admin/music", payload);
  if (!result.success) return toast(result.msg || "保存失败", true);
  resetMusicForm();
  render(result.catalog);
  toast("音乐已保存");
}

async function deleteMusic(id) {
  if (!confirm("确定删除这首音乐吗？R2 文件不会自动删除。")) return;
  const result = await api("/api/admin/music", { action: "delete", id });
  if (!result.success) return toast(result.msg || "删除失败", true);
  render(result.catalog);
  toast("音乐已删除");
}

async function saveGallery(event) {
  event.preventDefault();
  const files = Array.from(byId("galleryFile").files || []);
  if (files.length) {
    await saveGalleryFiles(files);
    return;
  }

  const imageUrl = byId("galleryImageUrl").value.trim();
  const payload = galleryPayload({
    id: byId("galleryId").value,
    title: byId("galleryTitle").value.trim(),
    imageUrl,
    thumbUrl: byId("galleryThumbUrl").value.trim() || imageUrl,
    assetKey: byId("galleryAssetKey").value.trim()
  });
  if (!payload.title || !payload.imageUrl) return toast("请填写标题和图片地址，或选择本地图片后直接保存", true);
  const result = await api("/api/admin/gallery", payload);
  if (!result.success) return toast(result.msg || "保存失败", true);
  const moduleId = currentAdminModule();
  resetGalleryForm();
  render(result.catalog);
  showPanel("galleryPanel", { moduleId, view: "galleryList" });
  toast("画廊图片已保存");
}

async function saveGalleryFiles(files) {
  const editingId = byId("galleryId").value;
  if (editingId && files.length > 1) {
    return toast("编辑已有图片时只能选择 1 张；批量上传请先点清空", true);
  }

  for (const file of files) {
    const error = validateGalleryFile(file);
    if (error) return toast(error, true);
  }

  let nextCatalog = null;
  const total = files.length;
  const baseSort = Number(byId("gallerySort").value || 0);
  const baseTitle = byId("galleryTitle").value.trim();

  for (const [index, file] of files.entries()) {
    toast(`正在上传 ${index + 1}/${total}：${file.name || "图片"}`);
    const upload = await uploadGalleryFile(file);
    if (!upload.success || !upload.url) {
      return toast(`${file.name || "图片"} 上传失败：${upload.msg || "没有返回可用地址"}`, true);
    }

    const title = galleryTitleForFile(file, baseTitle, index, total);
    const payload = galleryPayload({
      id: editingId && total === 1 ? editingId : "",
      title,
      imageUrl: upload.url,
      thumbUrl: upload.url,
      assetKey: upload.asset?.key || ""
    });
    payload.storageId = upload.asset?.storageId || payload.storageId;
    payload.source = payload.storageId === "cloudflare-images" ? "cloudflare-images" : "r2";
    payload.sortOrder = baseSort + index;
    payload.featured = byId("galleryFeatured").checked && index === 0;

    const result = await api("/api/admin/gallery", payload);
    if (!result.success) return toast(`${file.name || "图片"} 保存失败：${result.msg || "未知错误"}`, true);
    nextCatalog = result.catalog;
  }

  byId("galleryFile").value = "";
  await loadGalleryAssets();
  resetGalleryForm();
  if (nextCatalog) {
    const moduleId = currentAdminModule();
    render(nextCatalog);
    showPanel("galleryPanel", { moduleId, view: "galleryList" });
  }
  toast(total > 1 ? `已上传并保存 ${total} 张图片` : "画廊图片已上传并保存");
}

function galleryPayload(overrides = {}) {
  const imageUrl = overrides.imageUrl ?? byId("galleryImageUrl").value.trim();
  const assetKey = overrides.assetKey ?? byId("galleryAssetKey").value.trim();
  const storageId = byId("galleryStorage").value;
  return {
    id: overrides.id ?? byId("galleryId").value,
    title: overrides.title ?? byId("galleryTitle").value.trim(),
    description: byId("galleryDescription").value.trim(),
    imageUrl,
    thumbUrl: overrides.thumbUrl ?? (byId("galleryThumbUrl").value.trim() || imageUrl),
    storageId,
    assetKey,
    source: storageId === "cloudflare-images" ? "cloudflare-images" : /^https?:\/\//i.test(imageUrl) && !assetKey ? "network" : "r2",
    tags: byId("galleryTags").value.split(/[,，\n]/).map(item => item.trim()).filter(Boolean),
    featured: byId("galleryFeatured").checked,
    sortOrder: Number(byId("gallerySort").value || 0),
    status: byId("galleryStatus").value
  };
}

function galleryTitleForFile(file, baseTitle, index, total) {
  if (baseTitle && total === 1) return baseTitle;
  if (baseTitle) return `${baseTitle} ${String(index + 1).padStart(2, "0")}`;
  return String(file.name || `图片 ${index + 1}`).replace(/\.[^.]+$/, "").trim() || `图片 ${index + 1}`;
}

async function deleteGallery(id) {
  if (!confirm("确定删除这张画廊图片吗？R2 文件不会自动删除。")) return;
  const result = await api("/api/admin/gallery", { action: "delete", id });
  if (!result.success) return toast(result.msg || "删除失败", true);
  render(result.catalog);
  toast("画廊图片已删除");
}

async function saveCategory(event) {
  event.preventDefault();
  const payload = {
    id: byId("categoryId").value,
    name: byId("categoryName").value.trim(),
    slug: byId("categorySlug").value.trim(),
    sortOrder: Number(byId("categorySort").value || 0),
    status: byId("categoryStatus").value
  };
  const result = await api("/api/admin/categories", payload);
  if (!result.success) return toast(result.msg || "保存失败", true);
  resetCategoryForm();
  render(result.catalog);
  toast("分类已保存");
}

async function uploadRelease(event) {
  event.preventDefault();
  const file = byId("releaseFile").files[0];
  if (!file) return toast("请选择安装包", true);
  if (!allowedPackageFile(file)) return toast("安装包格式不支持，请上传 zip、7z、rar、exe 或 msi 文件", true);
  if (file.size > MAX_CHUNKED_SIZE) return toast(`安装包不能超过 ${formatBytes(MAX_CHUNKED_SIZE)}`, true);

  const softwareId = byId("releaseSoftware").value;
  const version = byId("releaseVersion").value.trim();
  if (!softwareId || !version) return toast("请选择软件并填写版本号", true);

  const storageId = byId("releaseStorage").value;
  const changelog = byId("releaseChangelog").value.trim();
  const isLatest = byId("releaseLatest").checked;
  let result;

  if (file.size > CHUNK_UPLOAD_THRESHOLD) {
    result = await uploadChunked(file, { softwareId, version, changelog, isLatest, storageId });
  } else {
    const form = new FormData();
    form.append("token", token);
    form.append("softwareId", softwareId);
    form.append("storageId", storageId);
    form.append("version", version);
    form.append("changelog", changelog);
    form.append("isLatest", isLatest ? "1" : "0");
    form.append("file", file);
    result = await uploadMultipart("/api/admin/releases", form, { title: "正在发布版本", fileName: file.name });
  }

  if (!result.success) return toast(result.msg || "上传失败", true);
  byId("releaseForm").reset();
  byId("releaseLatest").checked = true;
  render(result.catalog);
  toast("版本已发布，列表已刷新");
}

async function registerUploadedRelease(event) {
  event.preventDefault();
  const payload = {
    softwareId: byId("registerSoftware").value,
    version: byId("registerVersion").value.trim(),
    fileKey: byId("registerFileKey").value.trim(),
    fileName: byId("registerFileName").value.trim(),
    sha256: byId("registerSha256").value.trim(),
    changelog: byId("registerChangelog").value.trim(),
    isLatest: byId("registerLatest").checked ? "1" : "0"
  };
  if (!payload.softwareId || !payload.version || !payload.fileKey) {
    return toast("请填写软件、版本号和 R2 文件路径", true);
  }
  const result = await api("/api/admin/releases/register", payload);
  if (!result.success) return toast(result.msg || "登记失败", true);
  byId("releaseRegisterForm").reset();
  byId("registerLatest").checked = true;
  render(result.catalog);
  toast("已登记 R2 文件并发布版本");
}

function uploadMultipart(url, form, progress = {}) {
  showUploadProgress(progress.title || "正在上传", progress.fileName || "");
  return new Promise(resolve => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.upload.onprogress = event => {
      if (!event.lengthComputable) {
        updateUploadProgress(0, "正在上传，等待服务器接收文件...");
        return;
      }

      const percent = Math.max(1, Math.min(99, Math.round((event.loaded / event.total) * 100)));
      updateUploadProgress(percent, `${formatBytes(event.loaded)} / ${formatBytes(event.total)}`);
    };

    xhr.onload = () => {
      const result = parseUploadResponse(xhr.responseText);
      if (xhr.status >= 200 && xhr.status < 300) {
        updateUploadProgress(100, "上传完成，正在刷新列表...");
        setTimeout(() => hideUploadProgress(), 500);
        resolve(result);
        return;
      }

      hideUploadProgress();
      resolve({ success: false, msg: result.msg || `上传失败：HTTP ${xhr.status}` });
    };

    xhr.onerror = () => {
      hideUploadProgress();
      resolve({ success: false, msg: "上传失败：网络或接口异常" });
    };

    xhr.onabort = () => {
      hideUploadProgress();
      resolve({ success: false, msg: "上传已取消" });
    };

    xhr.send(form);
  });
}

async function updateRelease(releaseId, action) {
  const result = await api("/api/admin/releases/update", { releaseId, action });
  if (!result.success) return toast(result.msg || "操作失败", true);
  render(result.catalog);
  toast("版本已更新");
}

async function replaceReleaseFile(releaseId, input) {
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  if (!allowedPackageFile(file)) return toast("安装包格式不支持，请上传 zip、7z、rar、exe 或 msi 文件", true);
  if (file.size > MAX_CHUNKED_SIZE) return toast(`安装包不能超过 ${formatBytes(MAX_CHUNKED_SIZE)}`, true);
  if (!confirm(`确定用 ${file.name} 覆盖这个版本的安装包吗？版本号和下载链接会保持不变。`)) return;

  // 大文件走分片上传（默认 R2 / 外部 R2 都支持），避免单次请求超过 Cloudflare 100MB 请求体 / Worker 内存限制
  if (file.size > CHUNK_UPLOAD_THRESHOLD) {
    const chunkResult = await uploadChunked(file, { releaseId });
    if (!chunkResult.success) return toast(chunkResult.msg || "替换失败", true);
    render(chunkResult.catalog);
    return toast("安装包已替换，列表已刷新");
  }

  const form = new FormData();
  form.append("token", token);
  form.append("releaseId", releaseId);
  form.append("file", file);

  const result = await uploadMultipart("/api/admin/releases/replace", form, { title: "正在替换安装包", fileName: file.name });
  if (!result.success) return toast(result.msg || "替换失败", true);
  render(result.catalog);
  toast("安装包已替换，列表已刷新");
}

async function deleteRelease(releaseId) {
  if (!confirm("确定删除这个版本记录吗？")) return;
  const deleteFile = confirm("是否同时删除 R2 里的安装包文件？\n\n确定 = 一起删除（不可恢复）\n取消 = 只删记录，保留文件");
  const result = await api("/api/admin/releases/delete", { releaseId, deleteFile });
  if (!result.success) return toast(result.msg || "删除失败", true);
  render(result.catalog);
  toast("版本已删除");
}

async function deleteMedia(key) {
  if (!confirm("确定删除这个媒体文件吗？文章中已使用的图片/音频会失效。")) return;
  const result = await api("/api/admin/media/delete", { key });
  if (!result.success) return toast(result.msg || "删除失败", true);
  await loadMedia("all");
  toast("媒体已删除");
}

function setArticleCoverFromMedia(url) {
  byId("articleCover").value = url;
  updateArticleEditorMeta();
  showPanel("articlePanel");
  toast("已设为文章封面");
}

function insertMediaIntoArticle(item) {
  const snippet = item.type === "audio"
    ? `\n<figure class="article-audio"><audio controls preload="metadata" src="${item.url}"></audio></figure>\n`
    : `\n<figure><img src="${item.url}" alt=""><figcaption>图片说明</figcaption></figure>\n`;
  insertAtCursor(byId("articleContent"), snippet);
  updateArticleEditorMeta();
  showPanel("articlePanel");
  toast("媒体已插入正文");
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    toast("已复制链接");
  } catch {
    toast(value, true);
  }
}

let adminMusicPreview = null;

function previewMusicFromForm() {
  previewMusic({
    title: byId("musicTitle").value || "未命名音乐",
    artist: byId("musicArtist").value || "未知歌手",
    audioUrl: byId("musicAudioUrl").value,
    neteaseId: byId("musicNeteaseId").value
  });
}

function previewMusic(item) {
  const url = musicPlayableUrl(item);
  if (!url) return toast("请先填写音频地址或网易云音乐 ID", true);
  if (!adminMusicPreview) adminMusicPreview = new Audio();
  adminMusicPreview.src = url;
  adminMusicPreview.play().then(() => toast(`正在试听：${item.title || "音乐"}`)).catch(() => toast("浏览器阻止了试听，请再次点击试听", true));
}

function musicPlayableUrl(item) {
  if (item.audioUrl) return item.audioUrl;
  if (item.neteaseId) return `https://music.163.com/song/media/outer/url?id=${encodeURIComponent(item.neteaseId)}.mp3`;
  return "";
}

async function deleteSoftware(id) {
  if (!confirm("确定删除这个软件吗？")) return;
  let result = await api("/api/admin/software/delete", { id });
  if (!result.success && result.needForce) {
    if (!confirm(`这个软件还有 ${result.releaseCount} 个版本记录，删除软件会一并删除这些记录（R2 文件保留）。确定继续？`)) return;
    result = await api("/api/admin/software/delete", { id, force: true });
  }
  if (!result.success) return toast(result.msg || "删除失败", true);
  render(result.catalog);
}

async function deleteCategory(id) {
  if (!confirm("确定删除这个分类吗？")) return;
  const result = await api("/api/admin/categories/delete", { id });
  if (!result.success) return toast(result.msg || "删除失败", true);
  render(result.catalog);
}

async function deleteStorage(id) {
  if (!confirm("确定删除这个存储授权吗？")) return;
  const result = await api("/api/admin/storage/delete", { id });
  if (!result.success) return toast(result.msg || "删除失败", true);
  render(result.catalog);
}

async function deleteNavigation(id) {
  if (!confirm("确定删除这个导航项吗？")) return;
  const result = await api("/api/admin/navigation/delete", { id });
  if (!result.success) return toast(result.msg || "删除失败", true);
  render(result.catalog);
}

async function deleteArticle(id) {
  if (!confirm("确定删除这篇文章吗？")) return;
  const result = await api("/api/admin/articles/delete", { id });
  if (!result.success) return toast(result.msg || "删除失败", true);
  render(result.catalog);
}

function fillSoftwareForm(item) {
  showPanel("softwarePanel");
  byId("softwareId").value = item.id;
  byId("softwareName").value = item.name;
  byId("softwareSlug").value = item.slug;
  byId("softwareCategory").value = item.categoryId;
  byId("softwareCover").value = item.coverUrl || "";
  byId("softwareDescription").value = item.description || "";
  byId("softwareTagline").value = item.tagline || "";
  byId("softwareRequirements").value = item.requirements || "";
  byId("softwareLandingUrl").value = item.landingUrl || "";
  byId("softwareHighlights").value = (item.highlights || []).map(h => h.text ? `${h.title}｜${h.text}` : h.title).join("\n");
  byId("softwareSort").value = item.sortOrder || 0;
  byId("softwareStatus").value = item.status || "active";
}

function fillCategoryForm(item) {
  showPanel("categoryPanel");
  byId("categoryId").value = item.id;
  byId("categoryName").value = item.name;
  byId("categorySlug").value = item.slug;
  byId("categorySort").value = item.sortOrder || 0;
  byId("categoryStatus").value = item.status || "active";
}

function fillMusicForm(item) {
  showPanel("musicPanel");
  byId("musicId").value = item.id;
  byId("musicTitle").value = item.title || "";
  byId("musicArtist").value = item.artist || "";
  byId("musicAlbum").value = item.album || "";
  byId("musicNeteaseId").value = item.neteaseId || "";
  byId("musicAudioUrl").value = item.audioUrl || "";
  byId("musicCoverUrl").value = item.coverUrl || "";
  byId("musicLyric").value = item.lyric || "";
  byId("musicTags").value = (item.tags || []).join(", ");
  byId("musicFeatured").checked = Boolean(item.featured);
  byId("musicSort").value = item.sortOrder || 0;
  byId("musicStatus").value = item.status || "draft";
}

function fillGalleryForm(item, moduleId = "gallery") {
  showPanel("galleryPanel", { moduleId, view: "galleryEdit" });
  byId("galleryId").value = item.id;
  byId("galleryTitle").value = item.title || "";
  byId("galleryDescription").value = item.description || "";
  byId("galleryImageUrl").value = item.imageUrl || "";
  byId("galleryThumbUrl").value = item.thumbUrl || "";
  byId("galleryStorage").value = item.storageId || "default";
  byId("galleryAssetKey").value = item.assetKey || "";
  byId("galleryTags").value = (item.tags || []).join(", ");
  byId("galleryFeatured").checked = Boolean(item.featured);
  byId("gallerySort").value = item.sortOrder || 0;
  byId("galleryStatus").value = item.status || "draft";
  loadGalleryAssets();
}

function fillSiteCarouselForm(item) {
  showPanel("siteCarouselPanel", { moduleId: "site", view: "siteCarouselEdit" });
  byId("siteCarouselId").value = item.id;
  byId("siteCarouselTitle").value = item.title || "";
  byId("siteCarouselDescription").value = item.description || "";
  byId("siteCarouselImageUrl").value = item.imageUrl || "";
  byId("siteCarouselThumbUrl").value = item.thumbUrl || "";
  byId("siteCarouselSuggestion").value = item.suggestion || "";
  byId("siteCarouselSort").value = item.sortOrder || 0;
  byId("siteCarouselStatus").value = item.status || "draft";
  loadSiteCarouselAssets();
}

function fillPhotoWallForm(item) {
  showPanel("photoWallPanel", { moduleId: "site", view: "photoWallEdit" });
  byId("photoWallId").value = item.id;
  byId("photoWallTitle").value = item.title || "";
  byId("photoWallDescription").value = item.description || "";
  byId("photoWallImageUrl").value = item.imageUrl || "";
  byId("photoWallThumbUrl").value = item.thumbUrl || "";
  byId("photoWallLinkUrl").value = item.linkUrl || "";
  byId("photoWallLinkText").value = item.linkText || "";
  byId("photoWallAssetKey").value = item.assetKey || "";
  byId("photoWallSort").value = item.sortOrder || 0;
  byId("photoWallStatus").value = item.status || "draft";
  loadPhotoWallAssets();
}

function currentAdminModule() {
  return document.querySelector(".module-sidebar button.is-active")?.dataset.module || "software";
}

function fillStorageForm(item) {
  showPanel("storagePanel");
  byId("storageId").value = item.id;
  byId("storageName").value = item.name;
  byId("storageAccountId").value = item.accountId;
  byId("storageBucket").value = item.bucket;
  byId("storageAccessKeyId").value = item.accessKeyId;
  byId("storageSecretAccessKey").value = "";
  byId("storageEndpoint").value = item.endpoint || "";
  byId("storagePublicBaseUrl").value = item.publicBaseUrl || "";
  byId("storageSort").value = item.sortOrder || 0;
  byId("storageStatus").value = item.status || "active";
}

function fillNavigationForm(item) {
  showPanel("navigationPanel");
  byId("navigationId").value = item.id;
  byId("navigationLabel").value = item.label;
  byId("navigationHref").value = item.href;
  byId("navigationSort").value = item.sortOrder || 0;
  byId("navigationStatus").value = item.status || "active";
  byId("navigationExternal").checked = Boolean(item.external);
}

function fillArticleForm(item) {
  showPanel("articlePanel");
  if (hasArticleDraft() && !confirm("本地有未清除的草稿。继续编辑线上文章会覆盖当前表单，是否继续？")) return;
  byId("articleId").value = item.id;
  byId("articleTitle").value = item.title;
  byId("articleSlug").value = item.slug;
  byId("articleSummary").value = item.summary || "";
  byId("articleCover").value = item.coverUrl || "";
  byId("articleContent").value = item.content || "";
  byId("articleCategory").value = item.category || "";
  byId("articleTags").value = (item.tags || []).join("，");
  byId("articleSeoTitle").value = item.seoTitle || "";
  byId("articleSeoDescription").value = item.seoDescription || "";
  byId("articleFeatured").checked = Boolean(item.featured);
  byId("articleSort").value = item.sortOrder || 0;
  byId("articleStatus").value = item.status || "draft";
  articleSoftwareSelection = new Set(item.softwareIds || []);
  renderArticleOptions();
  updateArticleEditorMeta();
  renderArticleRows();
  byId("articleTitle").focus();
}

function storagePayload() {
  return {
    id: byId("storageId").value,
    name: byId("storageName").value.trim(),
    accountId: byId("storageAccountId").value.trim(),
    bucket: byId("storageBucket").value.trim(),
    accessKeyId: byId("storageAccessKeyId").value.trim(),
    secretAccessKey: byId("storageSecretAccessKey").value.trim(),
    endpoint: byId("storageEndpoint").value.trim(),
    publicBaseUrl: byId("storagePublicBaseUrl").value.trim(),
    sortOrder: Number(byId("storageSort").value || 0),
    status: byId("storageStatus").value
  };
}

function navigationPayload() {
  return {
    id: byId("navigationId").value,
    label: byId("navigationLabel").value.trim(),
    href: byId("navigationHref").value.trim(),
    sortOrder: Number(byId("navigationSort").value || 0),
    status: byId("navigationStatus").value,
    external: byId("navigationExternal").checked
  };
}

function articlePayload() {
  return {
    id: byId("articleId").value,
    title: byId("articleTitle").value.trim(),
    slug: byId("articleSlug").value.trim(),
    summary: byId("articleSummary").value.trim(),
    coverUrl: byId("articleCover").value.trim(),
    content: byId("articleContent").value.trim(),
    category: byId("articleCategory").value.trim(),
    tags: byId("articleTags").value.split(/[,，\n]/).map(item => item.trim()).filter(Boolean),
    seoTitle: byId("articleSeoTitle").value.trim(),
    seoDescription: byId("articleSeoDescription").value.trim(),
    featured: byId("articleFeatured").checked,
    softwareIds: Array.from(articleSoftwareSelection),
    sortOrder: Number(byId("articleSort").value || 0),
    status: byId("articleStatus").value
  };
}

function resetSoftwareForm() {
  byId("softwareForm").reset();
  byId("softwareId").value = "";
  byId("softwareSort").value = "10";
}

function resetCategoryForm() {
  byId("categoryForm").reset();
  byId("categoryId").value = "";
  byId("categorySort").value = "10";
}

function resetMusicForm() {
  byId("musicForm").reset();
  byId("musicId").value = "";
  byId("musicSort").value = "10";
  byId("musicStatus").value = "published";
}

function resetGalleryForm() {
  byId("galleryForm").reset();
  byId("galleryId").value = "";
  byId("galleryAssetKey").value = "";
  byId("gallerySort").value = "10";
  byId("galleryStatus").value = "published";
  byId("galleryStorage").value = "default";
  loadGalleryAssets();
}

function resetSiteCarouselForm() {
  byId("siteCarouselForm").reset();
  byId("siteCarouselId").value = "";
  byId("siteCarouselSort").value = "10";
  byId("siteCarouselStatus").value = "published";
  loadSiteCarouselAssets();
}

function resetPhotoWallForm() {
  byId("photoWallForm").reset();
  byId("photoWallId").value = "";
  byId("photoWallAssetKey").value = "";
  byId("photoWallSort").value = "10";
  byId("photoWallStatus").value = "published";
  loadPhotoWallAssets();
}

function resetStorageForm() {
  byId("storageForm").reset();
  byId("storageId").value = "";
  byId("storageSort").value = "10";
}

function resetNavigationForm() {
  byId("navigationForm").reset();
  byId("navigationId").value = "";
  byId("navigationSort").value = "10";
}

function resetArticleForm() {
  if (hasArticleDraft() && !confirm("本地有未清除的草稿。新建文章会清空当前表单，是否继续？")) return;
  byId("articleForm").reset();
  byId("articleId").value = "";
  byId("articleSort").value = "10";
  articleSoftwareCategory = "all";
  articleSoftwareSelection.clear();
  renderArticleOptions();
  updateArticleEditorMeta();
  renderArticleRows();
}

function scheduleArticleDraftSave() {
  window.clearTimeout(articleDraftTimer);
  articleDraftTimer = window.setTimeout(saveArticleDraft, 350);
}

function saveArticleDraft() {
  const payload = articlePayload();
  const hasContent = [payload.title, payload.slug, payload.summary, payload.coverUrl, payload.content, payload.category, payload.seoTitle, payload.seoDescription].some(Boolean) || payload.tags.length || payload.softwareIds.length;
  if (!hasContent) {
    updateArticleDraftStatus();
    return;
  }
  localStorage.setItem(ARTICLE_DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), payload }));
  updateArticleDraftStatus();
}

function restoreArticleDraft() {
  const draft = readArticleDraft();
  if (!draft) return toast("没有可恢复的本地草稿", true);
  if (!confirm(`恢复 ${formatDateTime(draft.savedAt)} 保存的本地草稿？当前表单内容会被覆盖。`)) return;
  fillArticleDraft(draft.payload || {});
  toast("本地草稿已恢复");
}

function clearArticleDraft(showToast = true) {
  localStorage.removeItem(ARTICLE_DRAFT_KEY);
  updateArticleDraftStatus();
  if (showToast) toast("本地草稿已清除");
}

function fillArticleDraft(item) {
  byId("articleId").value = item.id || "";
  byId("articleTitle").value = item.title || "";
  byId("articleSlug").value = item.slug || "";
  byId("articleSummary").value = item.summary || "";
  byId("articleCover").value = item.coverUrl || "";
  byId("articleContent").value = item.content || "";
  byId("articleCategory").value = item.category || "";
  byId("articleTags").value = (item.tags || []).join("，");
  byId("articleSeoTitle").value = item.seoTitle || "";
  byId("articleSeoDescription").value = item.seoDescription || "";
  byId("articleFeatured").checked = Boolean(item.featured);
  byId("articleSort").value = item.sortOrder || 10;
  byId("articleStatus").value = item.status || "draft";
  articleSoftwareSelection = new Set(item.softwareIds || []);
  renderArticleOptions();
  updateArticleEditorMeta();
}

function hasArticleDraft() {
  return Boolean(readArticleDraft());
}

function readArticleDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(ARTICLE_DRAFT_KEY) || "null");
    return draft?.payload ? draft : null;
  } catch {
    return null;
  }
}

function updateArticleDraftStatus() {
  const status = byId("articleDraftStatus");
  if (!status) return;
  const draft = readArticleDraft();
  status.textContent = draft ? `本地草稿：${formatDateTime(draft.savedAt)} 已自动保存` : "本地草稿：暂无";
}

function updateArticleSoftwareHint() {
  const hint = byId("articleSoftwareHint");
  const count = articleSoftwareSelection.size;
  hint.textContent = count ? `已关联 ${count} 个软件。可以继续按分类选择，或点击“不关联软件”清空。` : "可以按分类选择相关软件，也可以不选。";
}

function updateArticleEditorMeta() {
  const isEditing = Boolean(byId("articleId").value);
  const title = byId("articleTitle").value.trim();
  const summary = byId("articleSummary").value.trim();
  const content = byId("articleContent").value.trim();
  const cover = byId("articleCover").value.trim();
  byId("articleEditorMode").textContent = isEditing ? `正在编辑：${title || "未命名文章"}` : "新建文章";
  byId("articleWordCount").textContent = `${countWords(content)} 字`;
  byId("articleSummaryCount").textContent = `摘要 ${summary.length}/180`;
  const preview = byId("articleCoverPreview");
  preview.innerHTML = cover ? `<img src="${escapeAttr(cover)}" alt=""><span>封面预览</span>` : "<span>封面预览</span>";
  const articlePreview = byId("articlePreview");
  if (articlePreview) articlePreview.innerHTML = renderArticleContent(content);
}

function countWords(value) {
  const text = String(value || "").replace(/<[^>]+>/g, " ").trim();
  return text ? text.length : 0;
}

function renderArticleContent(content) {
  const value = String(content || "").trim();
  if (!value) return "<p>正文预览会显示在这里。</p>";
  if (/<[a-z][\s\S]*>/i.test(value)) return sanitizeArticleHtml(value);
  return markdownToHtml(value);
}

function sanitizeArticleHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = String(html || "");
  const allowedTags = new Set(["A", "P", "BR", "STRONG", "B", "EM", "I", "UL", "OL", "LI", "BLOCKQUOTE", "H2", "H3", "IMG", "FIGURE", "FIGCAPTION", "AUDIO", "SOURCE", "TABLE", "THEAD", "TBODY", "TR", "TH", "TD", "PRE", "CODE"]);
  const allowedAttrs = {
    A: new Set(["href", "target", "rel"]),
    IMG: new Set(["src", "alt", "loading"]),
    AUDIO: new Set(["src", "controls", "preload"]),
    SOURCE: new Set(["src", "type"]),
    FIGURE: new Set(["class"]),
    CODE: new Set(["class"]),
    PRE: new Set(["class"]),
    TABLE: new Set(["class"])
  };

  const cleanNode = node => {
    if (node.nodeType === Node.COMMENT_NODE) {
      node.remove();
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(...Array.from(node.childNodes));
      return;
    }
    for (const attr of Array.from(node.attributes)) {
      const allowed = allowedAttrs[node.tagName]?.has(attr.name);
      if (!allowed || attr.name.startsWith("on") || attr.value.startsWith("javascript:")) node.removeAttribute(attr.name);
    }
    if (node.tagName === "A") {
      const href = node.getAttribute("href") || "";
      if (!/^(https?:\/\/|\/)/.test(href)) node.removeAttribute("href");
      node.setAttribute("rel", "noopener");
      if (/^https?:\/\//.test(href)) node.setAttribute("target", "_blank");
    }
    if ((node.tagName === "IMG" || node.tagName === "AUDIO" || node.tagName === "SOURCE") && !/^(https?:\/\/|\/)/.test(node.getAttribute("src") || "")) {
      node.removeAttribute("src");
    }
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

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g, `<a href="$2" target="_blank" rel="noopener">$1</a>`);
}

function articleStatusLabel(status) {
  return status === "published" ? "已发布" : status === "draft" ? "草稿" : "隐藏";
}

function articleStatusClass(status) {
  return status === "published" ? "active" : status === "draft" ? "draft" : "disabled";
}

function defaultViewFor(panelId, moduleId = moduleForPanel(panelId)) {
  const config = ADMIN_MODULES[moduleId] || ADMIN_MODULES.software;
  const item = config.items.find(entry => entry.panel === panelId);
  return item?.view || panelId;
}

function showPanel(id, options = {}) {
  document.querySelectorAll(".tab-panel").forEach(panel => panel.hidden = panel.id !== id);
  const moduleId = options.moduleId || moduleForPanel(id);
  const view = options.view || defaultViewFor(id, moduleId);
  document.body.dataset.adminView = view;
  document.body.classList.toggle("admin-overview", id === "softwarePanel" && view === "softwareEdit");
  document.querySelectorAll(".module-sidebar button").forEach(button => button.classList.toggle("is-active", button.dataset.module === moduleId));
  renderModuleNav(moduleId, id, view);
  const target = document.getElementById(id);
  if (target) target.scrollIntoView({ block: "start", behavior: "smooth" });
  if (id === "hotUpdatePanel") {
    loadHotUpdateData(byId("hotAppSelect")?.value || "desktop");
  }
}

function moduleForPanel(panelId) {
  for (const [moduleId, config] of Object.entries(ADMIN_MODULES)) {
    if (config.items.some(item => item.panel === panelId)) return moduleId;
  }
  return "software";
}

function renderModuleNav(moduleId, activePanel, activeView = defaultViewFor(activePanel, moduleId)) {
  const root = byId("moduleNav");
  const config = ADMIN_MODULES[moduleId] || ADMIN_MODULES.software;
  if (!root) return;
  root.innerHTML = `
    <div>
      <strong>${escapeHtml(config.title)}</strong>
      <span>${escapeHtml(config.description)}</span>
    </div>
    <nav>
      ${config.items.map(item => {
        const view = item.view || defaultViewFor(item.panel, moduleId);
        const isActive = item.panel === activePanel && view === activeView;
        return `<button type="button" class="${isActive ? "is-active" : ""}" data-module="${escapeAttr(moduleId)}" data-panel="${escapeAttr(item.panel)}" data-view="${escapeAttr(view)}" data-anchor="${escapeAttr(item.anchor || "")}"><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.action)}</small></button>`;
      }).join("")}
    </nav>
  `;
  root.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      showPanel(button.dataset.panel, { moduleId: button.dataset.module, view: button.dataset.view });
      if (button.dataset.anchor) {
        window.setTimeout(() => byId(button.dataset.anchor)?.scrollIntoView({ block: "center", behavior: "smooth" }), 80);
      }
    });
  });
}

async function api(url, payload = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  return response.json();
}

async function loginApi(password) {
  const response = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });
  return response.json();
}

function actionButton(text, handler, className = "ghost") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  button.addEventListener("click", handler);
  return button;
}

function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function byId(id) {
  return document.getElementById(id);
}

function toast(message, isError = false) {
  const toastEl = byId("toast");
  toastEl.textContent = message;
  toastEl.style.background = isError ? "#ef4444" : "#6366f1";
  toastEl.classList.add("is-visible");
  window.setTimeout(() => toastEl.classList.remove("is-visible"), 2600);
}

function showUploadProgress(title, fileName) {
  byId("uploadProgressTitle").textContent = title;
  byId("uploadProgressPercent").textContent = "0%";
  byId("uploadProgressBar").style.width = "0%";
  byId("uploadProgressText").textContent = fileName ? `正在上传：${fileName}` : "请保持页面打开，上传完成后会自动刷新。";
  byId("uploadProgress").hidden = false;
}

function updateUploadProgress(percent, text) {
  byId("uploadProgressPercent").textContent = `${percent}%`;
  byId("uploadProgressBar").style.width = `${percent}%`;
  if (text) byId("uploadProgressText").textContent = text;
}

function hideUploadProgress() {
  byId("uploadProgress").hidden = true;
}

function formatDateTime(timestamp) {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleString("zh-CN", { hour12: false });
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function mediaUrlForKey(key) {
  const path = String(key || "")
    .split("/")
    .filter(Boolean)
    .map(segment => encodeURIComponent(segment))
    .join("/");
  return path ? `/media/${path}` : "";
}


// 安装包分片上传：发布新版本，或传入 releaseId 替换已有版本；支持默认 R2 和外部 R2
function uploadChunked(file, options) {
  const { softwareId, version, changelog, isLatest, releaseId, storageId } = options;
  return uploadFileInParts(file, {
    title: releaseId ? "正在替换安装包" : "正在发布版本",
    initUrl: "/api/admin/releases/presign",
    initPayload: { releaseId, softwareId, version, storageId },
    completeUrl: "/api/admin/releases/complete-upload",
    completePayload: { releaseId, softwareId, version, changelog, isLatest },
    doneText: releaseId ? "上传完成，安装包已替换" : "上传完成，版本已发布"
  });
}

// 通用并行分片上传：多个分片同时上传（UPLOAD_CONCURRENCY），单个分片失败自动重试
async function uploadFileInParts(file, options) {
  showUploadProgress(options.title || "正在上传", file.name);

  let init;
  try {
    init = await api(options.initUrl, { ...options.initPayload, fileName: file.name, fileSize: file.size, contentType: file.type || "" });
  } catch (error) {
    init = { success: false, msg: `初始化上传失败：${error.message || "网络异常"}` };
  }
  if (!init.success) {
    hideUploadProgress();
    return init;
  }

  const { uploadId, fileKey, storageId } = init;
  const partSize = Math.max(CHUNK_SIZE, Math.ceil(file.size / 9000 / (1024 * 1024)) * 1024 * 1024);
  const totalParts = Math.max(1, Math.ceil(file.size / partSize));
  const loaded = new Array(totalParts).fill(0);
  const etags = new Array(totalParts);
  const startedAt = Date.now();
  let nextIndex = 0;
  let finishedParts = 0;
  let failure = "";

  const report = () => {
    const uploaded = loaded.reduce((sum, value) => sum + value, 0);
    const elapsed = (Date.now() - startedAt) / 1000;
    const speed = elapsed > 0 ? uploaded / elapsed : 0;
    const eta = speed > 0 ? Math.round((file.size - uploaded) / speed) : 0;
    const etaText = eta > 60 ? `${Math.floor(eta / 60)}分${eta % 60}秒` : `${eta}秒`;
    const percent = Math.max(1, Math.min(97, Math.round((uploaded / Math.max(file.size, 1)) * 97)));
    updateUploadProgress(percent, `${formatBytes(uploaded)} / ${formatBytes(file.size)} · ${formatBytes(speed)}/s · 分片 ${finishedParts}/${totalParts} · 预计 ${etaText}`);
  };
  const timer = setInterval(report, 500);
  // 长时间上传期间定期续期登录令牌
  const refreshTimer = setInterval(() => refreshAdminToken().catch(() => {}), TOKEN_REFRESH_INTERVAL);

  const worker = async () => {
    while (!failure && nextIndex < totalParts) {
      const index = nextIndex++;
      const start = index * partSize;
      const end = Math.min(start + partSize, file.size);
      let lastError = "";
      for (let attempt = 1; attempt <= 4 && !failure; attempt++) {
        try {
          const result = await sendUploadPart(file.slice(start, end), { uploadId, fileKey, storageId, partNumber: index + 1 }, bytes => {
            loaded[index] = bytes;
          });
          etags[index] = result.etag;
          loaded[index] = end - start;
          finishedParts++;
          lastError = "";
          break;
        } catch (error) {
          loaded[index] = 0;
          lastError = error.message || "网络异常";
          if (error.fatal) break;
          await sleep(1000 * attempt);
        }
      }
      if (lastError && !failure) failure = `分片 ${index + 1} 上传失败：${lastError}`;
    }
  };

  await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, totalParts) }, () => worker()));
  clearInterval(timer);
  clearInterval(refreshTimer);

  if (failure) {
    api("/api/admin/uploads/abort", { uploadId, fileKey, storageId }).catch(() => {});
    hideUploadProgress();
    return { success: false, msg: failure };
  }

  report();
  updateUploadProgress(98, "所有分片已上传，正在合并文件...");
  let result;
  try {
    result = await api(options.completeUrl, {
      ...options.completePayload,
      uploadId,
      fileKey,
      storageId,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type || "",
      parts: etags.map((etag, index) => ({ partNumber: index + 1, etag }))
    });
  } catch (error) {
    result = { success: false, msg: `完成上传失败：${error.message || "网络异常"}` };
  }

  if (result.success) {
    updateUploadProgress(100, options.doneText || "上传完成");
    setTimeout(() => hideUploadProgress(), 800);
  } else {
    hideUploadProgress();
  }
  return result;
}

async function isDownloadUrlReachable(value) {
  try {
    const url = new URL(value, location.origin);
    // 外部域名受跨域限制无法检测，视为可用
    if (url.origin !== location.origin) return true;
    const response = await fetch(url, { method: "HEAD", cache: "no-store" });
    const type = response.headers.get("Content-Type") || "";
    return response.ok && !type.includes("text/html");
  } catch {
    return true;
  }
}

async function refreshAdminToken() {
  const response = await fetch("/api/admin/refresh", {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` }
  });
  const result = await response.json();
  if (result.success && result.token) {
    token = result.token;
    sessionStorage.setItem("downloadAdminToken", token);
  }
  return result;
}

function sendUploadPart(blob, meta, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/uploads/part");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.setRequestHeader("X-Upload-Id", meta.uploadId);
    xhr.setRequestHeader("X-File-Key", encodeURIComponent(meta.fileKey));
    xhr.setRequestHeader("X-Storage-Id", meta.storageId || "default");
    xhr.setRequestHeader("X-Part-Number", String(meta.partNumber));
    xhr.timeout = 10 * 60 * 1000;
    xhr.upload.onprogress = event => {
      if (event.lengthComputable) onProgress(event.loaded);
    };
    xhr.onload = () => {
      let result = {};
      try {
        result = parseUploadResponse(xhr.responseText);
      } catch {
        result = {};
      }
      if (xhr.status >= 200 && xhr.status < 300 && result.success && result.etag) return resolve(result);
      const error = new Error(result.msg || `HTTP ${xhr.status}`);
      error.fatal = xhr.status === 401 || xhr.status === 403;
      reject(error);
    };
    xhr.onerror = () => reject(new Error("网络异常"));
    xhr.ontimeout = () => reject(new Error("请求超时"));
    xhr.send(blob);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==========================================
// Cloudflare R2 客户端热更新控制台 (Ported from Cloudflare-R2-puls)
// ==========================================

let currentHotApp = "desktop";
let currentHotLiveVersion = null;

function syncHotAppSelect() {
  const select = byId("hotAppSelect");
  if (!select || !catalog?.software) return;
  const existingValues = new Set(Array.from(select.options).map(opt => opt.value));
  for (const sw of catalog.software) {
    if (!existingValues.has(sw.slug)) {
      const opt = document.createElement("option");
      opt.value = sw.slug;
      opt.textContent = `📦 ${sw.name} (${sw.slug})`;
      select.appendChild(opt);
    }
  }
}

function switchHotApp(appSlug) {
  if (!appSlug) return;
  currentHotApp = appSlug;
  const select = byId("hotAppSelect");
  if (select && select.value !== appSlug) select.value = appSlug;

  document.querySelectorAll(".app-preset-btn").forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset.hotApp === appSlug);
  });

  const currentVer = byId("hotVersion")?.value?.trim().replace(/^v/i, "") || "2.0.0";
  updateUrlsForVersion(currentVer);
  loadHotUpdateData(appSlug);
}

async function loadHotUpdateData(app = currentHotApp) {
  currentHotApp = app;
  const liveBadge = byId("liveVersionText");
  const badgeWrap = byId("liveVersionBadge");
  if (liveBadge) liveBadge.textContent = `检测 ${app} 线上版本...`;

  try {
    const res = await fetch(`/api/update?app=${encodeURIComponent(app)}`, {
      cache: "no-store",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      currentHotLiveVersion = data.version || null;
      if (liveBadge) {
        liveBadge.textContent = `${app} 线上版本: v${data.version || "未知"}`;
      }
      if (badgeWrap) badgeWrap.classList.remove("is-offline");

      const versionInput = byId("hotVersion");
      if (!versionInput.value || versionInput.dataset.autoFilled === "true") {
        fillHotUpdateFormFromData(data, false);
      }
    } else {
      currentHotLiveVersion = null;
      if (liveBadge) liveBadge.textContent = `${app} 尚未发版 (无线上 version.json)`;
      if (badgeWrap) badgeWrap.classList.add("is-offline");
    }
  } catch (err) {
    if (liveBadge) liveBadge.textContent = `${app} 状态检测异常`;
  }

  await loadHotHistory(app);
}

function fillHotUpdateFormFromData(data, overwriteChangelog = true) {
  if (!data) return;
  const versionInput = byId("hotVersion");
  if (versionInput && data.version) {
    versionInput.value = data.version;
    versionInput.dataset.autoFilled = "true";
  }
  if (data.patchUrl) byId("hotPatchUrl").value = data.patchUrl;
  if (data.fullSetupUrl) byId("hotFullSetupUrl").value = data.fullSetupUrl;
  if (data.minSupportedVersion) byId("hotMinSupportedVersion").value = data.minSupportedVersion;
  if (data.patchMd5) byId("hotPatchMd5").value = data.patchMd5;
  if (data.patchSize) {
    byId("hotPatchSize").value = data.patchSize;
    updateHotPatchSizeDisplay();
  }
  if (data.forceUpdate !== undefined) byId("hotForceUpdate").checked = Boolean(data.forceUpdate);
  if (overwriteChangelog && data.changelog) {
    byId("hotChangelog").value = data.changelog;
  }
}

function bumpHotVersion(type) {
  let verStr = (byId("hotVersion").value || currentHotLiveVersion || "1.0.0").trim().replace(/^v/i, "");
  let parts = verStr.split(".").map(n => parseInt(n, 10) || 0);
  while (parts.length < 3) parts.push(0);

  if (type === "patch") {
    parts[2] = (parts[2] || 0) + 1;
  } else if (type === "minor") {
    parts[1] = (parts[1] || 0) + 1;
    parts[2] = 0;
  } else if (type === "major") {
    parts[0] = (parts[0] || 0) + 1;
    parts[1] = 0;
    parts[2] = 0;
  }
  const nextVer = parts.slice(0, 3).join(".");
  byId("hotVersion").value = nextVer;
  delete byId("hotVersion").dataset.autoFilled;
  toast(`已将版本自增至 v${nextVer}`);
  updateUrlsForVersion(nextVer);
}

function updateUrlsForVersion(version) {
  if (!version) return;
  const app = currentHotApp;
  const patchInput = byId("hotPatchUrl");
  if (patchInput && (!patchInput.value || patchInput.dataset.autoGenerated === "true")) {
    patchInput.value = `/apps/${app}/TianCaiMao.${app.charAt(0).toUpperCase() + app.slice(1)}.exe`;
    patchInput.dataset.autoGenerated = "true";
  }
  const setupInput = byId("hotFullSetupUrl");
  if (setupInput && (!setupInput.value || setupInput.dataset.autoGenerated === "true")) {
    const sw = (catalog?.software || []).find(s => s.slug === app || s.id === app || (app === "desktop" && /桌面/i.test(s.name)));
    const latestRelease = (sw?.releases || []).find(r => r.isLatest) || sw?.releases?.[0];
    const targetUrl = latestRelease?.downloadUrl || (latestRelease?.fileKey ? `/download/${encodeURIComponent(latestRelease.id)}` : latestRelease?.publicUrl);
    if (targetUrl) {
      setupInput.value = targetUrl;
    } else {
      setupInput.value = `/apps/${app}/${app}-Setup-v${version}.exe`;
    }
    setupInput.dataset.autoGenerated = "true";
  }
}

function syncSetupFromCatalogReleases() {
  const app = currentHotApp;
  const sw = (catalog?.software || []).find(s => s.slug === app || s.id === app || (app === "desktop" && /桌面/i.test(s.name)));
  if (!sw) return toast(`未找到 [${app}] 对应的软件资料`, true);
  const latestRelease = (sw.releases || []).find(r => r.isLatest) || sw.releases?.[0];
  if (!latestRelease) {
    return toast(`未找到 [${sw.name}] 在版本上传中已发布的独立安装包，可先在“版本上传”发布，或使用“从 R2 选取”`, true);
  }
  const input = byId("hotFullSetupUrl");
  const targetUrl = latestRelease.downloadUrl || (latestRelease.fileKey ? `/download/${encodeURIComponent(latestRelease.id)}` : latestRelease.publicUrl);
  if (targetUrl) {
    input.value = targetUrl;
    delete input.dataset.autoGenerated;
    toast(`已自动引用独立全量包 v${latestRelease.version}：${latestRelease.fileName || targetUrl}`);
  }
}

function updateHotPatchSizeDisplay() {
  const bytes = parseInt(byId("hotPatchSize")?.value, 10) || 0;
  const el = byId("hotPatchSizeMb");
  if (el) el.textContent = `${(bytes / (1024 * 1024)).toFixed(2)} MB (${formatBytes(bytes)})`;
}

// 热更新文件真实上传到 R2 的 apps/<应用>/ 目录（分片并行），完成后自动填好地址、大小和校验码
async function uploadHotUpdateFile(file) {
  return uploadFileInParts(file, {
    title: "正在上传热更新文件",
    initUrl: "/api/admin/assets/presign",
    initPayload: { kind: "hotupdate", folder: currentHotApp, storageId: "default" },
    completeUrl: "/api/admin/assets/complete-upload",
    completePayload: { kind: "hotupdate", folder: currentHotApp, refType: "hotupdate", refId: currentHotApp },
    doneText: "热更新文件已上传到 R2"
  });
}

async function handleLocalPatchFile(event) {
  const input = event.target;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  const result = await uploadHotUpdateFile(file);
  if (!result.success) return toast(result.msg || "补丁上传失败", true);
  byId("hotPatchSize").value = file.size;
  updateHotPatchSizeDisplay();
  const patchInput = byId("hotPatchUrl");
  patchInput.value = result.url || `/${result.fileKey}`;
  delete patchInput.dataset.autoGenerated;
  byId("hotPatchMd5").value = "";
  toast(`补丁已上传：${file.name}（${formatBytes(file.size)}），正在计算校验码...`);
  const hash = await computeFileHash(file);
  if (hash) byId("hotPatchMd5").value = hash;
  toast(hash ? "补丁已上传，SHA256 已填好" : "补丁已上传（文件过大，未自动计算校验码）");
}

async function handleLocalSetupFile(event) {
  const input = event.target;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  const result = await uploadHotUpdateFile(file);
  if (!result.success) return toast(result.msg || "全量包上传失败", true);
  const setupInput = byId("hotFullSetupUrl");
  setupInput.value = result.url || `/${result.fileKey}`;
  delete setupInput.dataset.autoGenerated;
  toast(`全量包已上传：${file.name}（${formatBytes(file.size)}）`);
}

// 计算整个文件的 SHA256（超过 512MB 跳过，避免浏览器内存不足）
async function computeFileHash(file) {
  if (!file || file.size > 512 * 1024 * 1024) return "";
  try {
    const hashBuffer = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return "";
  }
}

async function pickR2FileForHotUpdate(targetInputId) {
  const appSlug = currentHotApp;
  const sw = (catalog?.software || []).find(s => s.slug === appSlug || s.id === appSlug);
  const releases = sw?.releases || [];

  const options = [];
  releases.forEach(r => {
    if (r.fileKey) options.push({ label: `[版本记录] v${r.version}: ${r.fileName || r.fileKey}`, value: r.downloadUrl || `/${r.fileKey}` });
  });

  const assetRes = await api("/api/admin/assets/list", { pageSize: 50 }).catch(() => ({ success: false }));
  if (assetRes.success) {
    (assetRes.assets || []).forEach(a => {
      if (a.key?.includes(appSlug) || a.key?.endsWith(".exe") || a.key?.endsWith(".zip")) {
        options.push({ label: `[R2 资产] ${a.fileName || a.key} (${formatBytes(a.fileSize)})`, value: a.url || `/${a.key}` });
      }
    });
  }

  if (options.length === 0) {
    const val = prompt(`未在库中匹配到 ${appSlug} 的专属文件。\n请输入 R2 相对路径或下载 URL (例如 /apps/${appSlug}/patch_v2.0.1.zip):`, byId(targetInputId).value);
    if (val) {
      byId(targetInputId).value = val.trim();
      delete byId(targetInputId).dataset.autoGenerated;
    }
    return;
  }

  const promptText = `请从以下 R2 资源中选择或输入目标文件的相对路径/URL：\n\n` +
    options.slice(0, 8).map((opt, idx) => `${idx + 1}. ${opt.label}`).join("\n") +
    `\n\n输入序号 (1-${Math.min(8, options.length)})，或直接粘贴路径：`;
  const answer = prompt(promptText);
  if (!answer) return;
  const num = parseInt(answer.trim(), 10);
  if (!isNaN(num) && num >= 1 && num <= options.length) {
    byId(targetInputId).value = options[num - 1].value;
    delete byId(targetInputId).dataset.autoGenerated;
    toast(`已填入: ${options[num - 1].value}`);
  } else {
    byId(targetInputId).value = answer.trim();
    delete byId(targetInputId).dataset.autoGenerated;
    toast(`已填入: ${answer.trim()}`);
  }
}

async function submitHotUpdate(event) {
  event.preventDefault();
  const app = byId("hotAppSelect").value;
  const version = byId("hotVersion").value.trim().replace(/^v/i, "");
  const patchUrl = byId("hotPatchUrl").value.trim();
  const fullSetupUrl = byId("hotFullSetupUrl").value.trim();
  const minSupportedVersion = byId("hotMinSupportedVersion").value.trim().replace(/^v/i, "");
  const patchMd5 = byId("hotPatchMd5").value.trim();
  const patchSize = parseInt(byId("hotPatchSize").value, 10) || 0;
  const changelog = byId("hotChangelog").value.trim();
  const forceUpdate = byId("hotForceUpdate").checked;

  if (!app) return toast("请选择软件标识", true);
  if (!version) return toast("请填写发布版本号", true);
  if (!patchUrl && !fullSetupUrl) return toast("补丁 URL 和全量安装包 URL 至少需填写一项", true);

  // 发布前检查下载地址是否真的能下载，避免客户端拿到 404
  const missing = [];
  for (const [label, value] of [["补丁", patchUrl], ["全量安装包", fullSetupUrl]]) {
    if (value && !(await isDownloadUrlReachable(value))) missing.push(`${label}：${value}`);
  }
  if (missing.length && !confirm(`以下地址当前无法下载：\n${missing.join("\n")}\n\n请先用“本地上传”或“从 R2 选取”。仍然要发布吗？`)) return;

  const statusEl = byId("hotPublishStatus");
  const submitBtn = byId("submitHotUpdateBtn");
  if (statusEl) statusEl.textContent = "正在发布至 Cloudflare R2 并同步版本历史...";
  if (submitBtn) submitBtn.disabled = true;

  try {
    const payload = {
      app,
      version,
      patchUrl,
      patchMd5,
      patchSize,
      fullSetupUrl,
      minSupportedVersion,
      forceUpdate,
      changelog
    };

    const res = await fetch("/api/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      const message = result.msg || result.error || `HTTP ${res.status}`;
      if (statusEl) statusEl.textContent = "发布失败: " + message;
      return toast(message, true);
    }

    if (statusEl) statusEl.textContent = `发布成功！已写入 R2 (apps/${app}/version.json)${result.warning ? `；注意：${result.warning}` : ""}`;
    toast(result.warning ? `已发布，但${result.warning}` : `🚀 [${app}] v${version} 热更新配置已发布并写入 R2!`, Boolean(result.warning));

    // 热更新会同步官网版本库，刷新一次后台数据
    const fresh = await api("/api/admin/catalog").catch(() => null);
    if (fresh?.catalog) render(fresh.catalog);
    else if (result.catalog) render(result.catalog);
    await loadHotUpdateData(app);
  } catch (e) {
    if (statusEl) statusEl.textContent = "发布网络异常: " + e.message;
    toast("发布异常: " + e.message, true);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function loadHotHistory(app = currentHotApp) {
  const container = byId("hotHistoryRows");
  const countBadge = byId("historyCountBadge");
  if (!container) return;
  container.innerHTML = `<div style="grid-column: 1/-1; padding: 24px; text-align: center; color: var(--muted);">正在加载历史版本...</div>`;

  try {
    const res = await fetch(`/api/update?app=${encodeURIComponent(app)}&action=history`, {
      cache: "no-store",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const list = res.ok ? await res.json() : [];
    if (!Array.isArray(list) || list.length === 0) {
      if (countBadge) countBadge.textContent = "暂无发布记录";
      container.innerHTML = `<div style="grid-column: 1/-1; padding: 32px; text-align: center; color: var(--muted); background: var(--bg-surface); border-radius: 12px; border: 1px dashed var(--border);">暂无 ${app} 的历史发版记录。在上方填写配置后点击“立即发布”，记录将自动归档在此。</div>`;
      return;
    }
    if (countBadge) countBadge.textContent = `共 ${list.length} 个历史版本`;
    renderHotHistoryRows(list);
  } catch (e) {
    container.innerHTML = `<div style="grid-column: 1/-1; color: #ef4444; padding: 20px;">历史版本加载失败: ${escapeHtml(e.message)}</div>`;
  }
}

function renderHotHistoryRows(list) {
  const container = byId("hotHistoryRows");
  if (!container) return;
  container.innerHTML = "";

  for (const item of list) {
    const card = document.createElement("article");
    const isCurrent = item.version === currentHotLiveVersion;
    card.className = `history-ver-card ${isCurrent ? "is-current-active" : ""}`;

    card.innerHTML = `
      <div class="history-ver-top">
        <div class="history-ver-badge">
          <span class="ver-tag">v${escapeHtml(item.version || "0.0.0")}</span>
          ${isCurrent ? `<span class="active-now-tag">🟢 当前线上</span>` : ""}
          ${item.forceUpdate ? `<span class="force-tag">⚠️ 强制更新</span>` : ""}
        </div>
        <span class="history-date">${formatDateTime(item.updatedAt || item.publishedAt || "")}</span>
      </div>
      <div class="history-ver-meta">
        <span>补丁文件:</span>
        <span class="history-meta-path" title="${escapeAttr(item.patchUrl || "-")}">${escapeHtml(item.patchUrl || "-")}</span>
        ${item.patchSize ? `<span>(${formatBytes(item.patchSize)})</span>` : ""}
      </div>
      <div class="history-ver-meta">
        <span>全量安装:</span>
        <span class="history-meta-path" title="${escapeAttr(item.fullSetupUrl || "-")}">${escapeHtml(item.fullSetupUrl || "-")}</span>
      </div>
      ${item.minSupportedVersion ? `<div class="history-ver-meta"><span>最低支持:</span><span>v${escapeHtml(item.minSupportedVersion)}</span></div>` : ""}
      ${item.changelog ? `<pre class="history-changelog">${escapeHtml(item.changelog)}</pre>` : ""}
      <div class="history-ver-actions">
        <button type="button" class="btn-load-history">⏮️ 载入配置并一键回滚</button>
      </div>
    `;

    card.querySelector(".btn-load-history").addEventListener("click", () => {
      rollbackToHistoryItem(item);
    });

    container.appendChild(card);
  }
}

function rollbackToHistoryItem(item) {
  fillHotUpdateFormFromData(item, true);
  byId("hotUpdateForm")?.scrollIntoView({ block: "start", behavior: "smooth" });
  toast(`已载入 v${item.version} 的全部配置，核对无误后点击“立即发布”即可快速回滚上线！`);
}

