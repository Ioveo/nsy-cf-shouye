# 🤝 KK Seint - 项目进程无缝交接备忘录

> **交接时间**: 2026-10-14 05:07:42 | **前序操作账号**: `folun8@gmail.com` | **Git分支**: `main`

## 1. 任务进度与当前上下文
**进行中目标**:
Testing seamless account handoff in Go

- **最新提交节点**: `51a53eb fix(design): 满幅大画幅特写重构落地页视觉资产（消灭黑边留白、UI主体放大200%、文字超清锐化、支持点击全屏灯箱放大）`
- **未提交修改文件**: 共 24 个文件

### 修改/未跟踪文件清单:
- ` M functions/_lib/asset-upload.js`
- ` M functions/_lib/catalog.js`
- ` M functions/api/admin/assets/complete-upload.js`
- ` M functions/api/admin/releases/delete.js`
- ` M functions/api/admin/releases/update.js`
- ` M functions/api/admin/site.js`
- ` M functions/api/admin/software.js`
- ` M functions/api/admin/software/delete.js`
- ` M functions/api/update.js`
- ` M public/admin.html`
- ` M public/admin.js`
- ` M public/desktop.html`
- `?? .claude/`
- `?? CLAUDE.md`
- `?? aesthetic_girl_sky_4k.jpg`
- `?? anime_sky_whale_4k.jpg`
- `?? docs/homepage-redesign-brief.md`
- `?? functions/api/admin/site-mode.js`
- `?? functions/index.js`
- `?? ghibli_sky_girl_4k.jpg`
- `?? orig_enhanced_blue_4k.jpg`
- `?? red_manta_beach_4k.jpg`
- `?? scripts/__pycache__/`
- `?? sea_beach_4k.jpg`

### 当前工作区未提交 Diff 摘要 (含 Staged & Unstaged):
```diff
diff --git a/functions/_lib/asset-upload.js b/functions/_lib/asset-upload.js
index 8cd4f52..00c7d49 100644
--- a/functions/_lib/asset-upload.js
+++ b/functions/_lib/asset-upload.js
@@ -8,4 +8,5 @@ export const ASSET_LIMITS = {
   audio: 50 * 1024 * 1024,
   software: MAX_MULTIPART_SIZE,
+  hotupdate: MAX_MULTIPART_SIZE,
   site: 8 * 1024 * 1024,
   other: 30 * 1024 * 1024
@@ -18,4 +19,5 @@ export function normalizeKind(kind, name, type) {
   if (kind === "audio" && ["mp3", "m4a", "aac", "wav", "ogg", "oga", "webm", "flac"].includes(ext)) return "audio";
   if (kind === "software" && ["zip", "7z", "rar", "exe", "msi"].includes(ext)) return "software";
+  if (kind === "hotupdate" && ["zip", "7z", "rar", "exe", "msi", "dll", "gz", "bin", "json"].includes(ext)) return "hotupdate";
   if (kind === "site" && ["png", "jpg", "jpeg", "gif", "webp", "avif", "ico"].includes(ext)) return "site";
   if (kind === "other") return "other";
@@ -27,4 +29,6 @@ export function keyFor(kind, folder, fileName) {
   const ym = new Date().toISOString().slice(0, 7).replace("-", "/");
   if (kind === "software") return `software/manual/${Date.now()}-${fileName}`;
+  // 热更新文件放在 apps/<应用>/ 下，由 /apps/* 路由直接提供下载
+  if (kind === "hotupdate") return `apps/${slugify(folder || "desktop")}/${Date.now()}-${fileName}`;
   if (kind === "site") return `site/${safeFolder}/${Date.now()}-${fileName}`;
   if (kind === "audio") return `media/audio/${ym}/${id("audio")}-${fileName}`;
diff --git a/functions/_lib/catalog.js b/functions/_lib/catalog.js
index de22b66..5a01f04 100644
--- a/functions/_lib/catalog.js
+++ b/functions/_lib/catalog.js
@@ -20,5 +20,19 @@ export const DEFAULT_NAVIGATION = [
 ];
 
+// 网站模式：software 软件下载站 / portal 综合门户 / blog 博客
+export const SITE_MODES = ["software", "portal", "blog"];
+const MODE_HIDDEN_HREFS = {
+  software: ["/photo-wall.html", "/gallery.html", "/music.html"],
+  portal: [],
+  blog: ["/download.html", "/desktop.html", "/license.html", "/photo-wall.html"]
+};
+
+export function navigationForMode(navigation, mode) {
+  const hidden = MODE_HIDDEN_HREFS[mode] || [];
+  return (navigation || []).filter(item => !hidden.includes(String(item.href || "").split(/[?#]/)[0]));
+}
+
 export const DEFAULT_SITE = {
+  siteMode: "portal",
   homeHeroKicker: "Tiancaimao Command Center",
   homeHeroTitle: "把直播运营入口，压缩成一次打开。",
@@ -222,5 +236,5 @@ export function publicCatalog(catalog) {
     product: catalog.product,
     categories: catalog.categories.filter(item => item.status !
... [已截断其余增量]
```

## 2. 后续账号接力执行准则
1. 优先阅读上述未提交修改，避免推倒重写上个账号已编写的代码。
2. 保持原有架构风格与模块设计规范，继续补全后续逻辑。
3. 完成后执行编译与测试验证。
