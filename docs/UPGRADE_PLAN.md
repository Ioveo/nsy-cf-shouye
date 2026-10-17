# 天才猫站点升级方案（交给执行 AI）

> 策划：Claude｜执行：其它 AI｜项目：Cloudflare Pages（静态 `public/` + `functions/`），数据存 R2（`SOFTWARE_BUCKET`），文章/资源记录存 D1（`DB`）。
> 前台页面没有构建步骤；只有阶段 3 的新后台 `studio/` 需要 Vite 构建，输出到 `public/studio/`。

---

## 0. 铁律（违反任何一条 = 任务失败）

1. **不准修改受保护文件**（负责 R2 上传、下载、热更新、登录）。清单见 `scripts/guard/check-protected.mjs` 里的 `PROTECTED`，主要是：
   `functions/_lib/*`（catalog / r2-s3 / multipart / releases / asset-upload 等）、`functions/api/admin/releases*`、`uploads/`、`assets/`、`storage/`、`software*`、`functions/api/update.js`、`functions/api/catalog.js`、`functions/download/`、`functions/apps/`、`functions/software/`、`functions/media/`、`public/console/lib/r2-upload.js`、`wrangler.toml`。
2. **每完成一步都必须运行**，两条都通过才能提交：
   ```
   node scripts/guard/check-protected.mjs
   node scripts/guard/r2-regression.mjs
   ```
   任何一条失败：`git checkout -- <被改的文件>` 还原，重做。不准用 `--update` 参数（那是负责人用的）。
3. 需要上传文件的地方，**只能** `import` 使用 `public/console/lib/r2-upload.js` 里的函数，不准自己写上传逻辑，不准复制改写。
4. 需要新的后端数据时，**新建** `functions/_lib/` 以外的文件（例如 `functions/api/admin/landing.js`），并把数据存成**单独的 R2 对象**（例如 `config/landing.json`）。
   **原因（必读）**：`saveCatalog()` 保存前会经过 `normalizeCatalog()`，它只保留已知字段。往 catalog 里加新字段会在下次保存时被**静默删除**。
5. （阶段 3 的 `studio/` 除外）前台不引入外部 CDN 的 `@latest` 版本；所有第三方文件下载后放进 `public/vendor/` 本地引用（国内访问 CDN 不稳定）。
6. 每个阶段一个 git 分支（`upgrade/phase-1` …），一个阶段一次提交，提交信息写清改了什么。不准推送 main。
7. 不确定的地方停下来问，不要猜。

---

## 1. 当前状态（已完成，不用再做）

| 已完成 | 位置 |
|---|---|
| R2 分片并行上传（8 路、10GB、断点、续期）、下载断点续传、热更新上传与 `/apps/*` 路由 | 受保护文件 |
| 版本编辑、多下载包：版本新增字段 `platform`（windows/portable/macos/linux/android/other，按扩展名自动判断）、`label`、`arch` | `functions/_lib/catalog.js` |
| 软件新增字段 `tagline` 一句话介绍、`requirements` 系统要求、`landingUrl` 详情页、`highlights` 特性亮点 `[{title,text}]` | 同上；旧后台“软件管理”表单已加对应输入框 |
| 网站模式（软件站/综合门户/博客）一键切换 | `functions/api/admin/site-mode.js`、`functions/index.js` |
| 上传模块（新后台专用） | `public/console/lib/r2-upload.js`（用法写在文件头注释） |
| **软件中心页**：`public/download.html` 保留原复刻 UI，内容改由 `public/software-center.js` 从 `/api/catalog` 渲染：全部软件列表 + 分类 Tab、所选软件的大标题/下载按钮/封面、特性亮点、当前版本所有下载包、历史版本更新日志（含各版本下载链接）。支持 `?app=<软件标识>` 直达 | **已写好但未在浏览器验证** → 阶段 1 |
| 测试与护栏 | `scripts/guard/` |

---

## 阶段 1：验证并收尾软件中心页（小任务，先做）

1. 本地运行：`npx wrangler pages dev public --port 8788`，打开 `http://localhost:8788/download.html`。
   本地没有 R2 数据时，`/api/catalog` 会返回默认目录，页面应显示默认软件，**控制台不能有报错**。
2. 检查：点“查看详情”能切换上方大标题、下载包、更新日志；`?app=xxx` 直达；没有特性亮点的软件不显示“特性”区块；没有版本的软件显示“暂未发布安装包”。
3. 页面里还残留的写死内容要删除或改成通用文案：
   - 顶部导航的“全景落地页”链接 → 改为“全部软件”(`#software`)；
   - `copyChecksum('e3b0c4…')` 那个旧按钮和 `heroMeta` 里的旧内容已被脚本覆盖，确认无闪烁即可；
   - 页脚里如有“桌面 2.0 专属”文案改成“天才猫软件中心”。
4. **把 Tailwind 换成本地 CSS**：现在用的是 `https://cdn.tailwindcss.com`（开发用的 Play CDN，国内慢且官方不建议生产使用）。
   做法：本地执行一次 Tailwind CLI，把 `download.html` + `software-center.js` 里用到的类生成成 `public/vendor/software-center.css`（提交生成后的 CSS 文件，**线上仍然没有构建步骤**）。`tailwind.config` 里的自定义颜色（`accent-cyan` 等）要带上。注意 `software-center.js` 里动态拼接的类名也要被扫描到（content 里加上这个 js 文件）。
5. `lucide@latest` 换成固定版本，下载到 `public/vendor/lucide.min.js` 本地引用。
6. 改完 `download.html` 引用的版本号 `?v=` 换成新日期。

**验收**：1440 / 390 两个宽度截图；在后台新增一个测试软件并上传一个小文件，刷新软件中心能看到它并能下载。

---

## 阶段 2：首页“落地页”随时切换

目标：后台一键决定网站首页 `/` 显示哪个页面（综合门户、桌面 2.0、软件中心、音乐、画廊、照片墙、文章…），并能编辑每个落地页上的主要文案。

### 2.1 数据（新建，不碰 catalog）
R2 对象 `config/landing.json`：
```json
{
  "homeLanding": "portal",
  "pages": [{ "id": "my-event", "title": "活动页", "path": "/landing/my-event.html" }],
  "content": { "desktop": { "heroTitle": "天才猫桌面", "ctaText": "免费下载" } },
  "updatedAt": 0
}
```
内置落地页（写死在代码里，不可删除）：
`portal → /index.html`、`desktop → /desktop.html`、`software → /download.html`、`music → /music.html`、`gallery → /gallery.html`、`photo-wall → /photo-wall.html`、`articles → /articles.html`、`novadisk → /novadisk.html`。

### 2.2 新建文件
- `functions/_landing/store.js`（**注意不要放进 `functions/_lib/`**）：`loadLanding(env)`、`saveLanding(env, data)`、内置列表、校验（`path` 必须以 `/` 开头、以 `.html` 结尾、不含 `..`、不能是 `/admin.html` `/console/` `/studio/` `/lvtuang`；每个 content 值是字符串、≤5000 字、每页 ≤200 个键）。
- `functions/api/landing.js`（GET，公开）：返回 `{ homeLanding, content }`。
- `functions/api/admin/landing.js`（POST，`requireAdmin` 鉴权，从 `./_lib.js` 导入，只导入不修改）：`action` = `get` / `setHome` / `saveContent` / `addPage` / `removePage`。
- **修改 `functions/index.js`**（它不在受保护清单）：
  1. 读 `config/landing.json` 的 `homeLanding`；文件不存在时按旧的 `site.siteMode` 兼容（software→software，blog→articles，其它→portal）。
  2. 支持预览参数 `/?landing=<id>`（后台预览用）。
  3. `portal` → `context.next()`；其它 → `env.ASSETS.fetch(new URL(去掉.html的路径, request.url))`，返回时加 `Cache-Control: no-cache`。失败时 `context.next()`。
- `public/js/landing-bind.js`：页面 `<body data-landing-page="desktop">`；脚本请求 `/api/landing`，把 `content[页面id]` 写进：
  - `[data-landing="key"]` → `textContent`（**只用 textContent，不用 innerHTML**）
  - `[data-landing-href="key"]` → `href`；`[data-landing-src="key"]` → `src`
- 在每个内置落地页的主标题、副标题、主按钮文字/链接、主图上加 `data-landing*` 属性（HTML 里原有文字就是默认值），并引入 `landing-bind.js`。

### 2.3 后台编辑器（在阶段 3 的新后台里做）
“落地页”页面：卡片列出所有落地页 →【设为首页】【预览（iframe 加载 `/?landing=id`）】【编辑文案】。
**编辑文案的表单自动生成**：用 `fetch(path)` 取落地页 HTML → `DOMParser` 解析 → 收集所有 `data-landing*` 元素 → 每个键生成一个输入框（默认值 = HTML 原文字）。这样以后新增落地页不用改后台代码。

**验收**：在后台把首页切到“桌面 2.0”，打开 `/` 看到桌面落地页；改一条标题，刷新落地页生效；切回门户正常。

---

## 阶段 3：新后台 `/studio/`（替换旧 admin.html）

### 3.1 选型：shadcn-admin
- 仓库：https://github.com/satnaing/shadcn-admin （MIT，React + Vite + TypeScript + Tailwind + shadcn/ui，自带深色模式、侧边栏、⌘K 命令面板）。
- 备选：Soybean Admin（Vue3 + NaiveUI，中文文档）。二选一，不要混用。
- 用法：把仓库代码复制到项目根目录的 `studio/` 文件夹（不要放进 `public/`），删掉示例页面（Tasks、Chats、Apps 等），保留布局、侧边栏、命令面板、表格、表单、主题切换。删掉它自带的登录/Clerk 等第三方认证，改用我们的登录接口。

### 3.2 构建与部署（重要）
- `studio/vite.config.ts`：`base: "/studio/"`，`build.outDir: "../public/studio"`，`build.emptyOutDir: true`。
- **只允许输出到 `public/studio/`**，不准覆盖 `public/` 下其它任何文件。
- 上传模块：在 vite 配置加别名 `"@r2": path.resolve(__dirname, "../public/console/lib/r2-upload.js")`，代码里 `import { uploadReleaseFile, ... } from "@r2"`。**不准复制或改写这个文件。**
- 本地开发：`cd studio && npm run dev`，用 vite 的 `server.proxy` 把 `/api`、`/download`、`/apps` 代理到 `npx wrangler pages dev public --port 8788`。
- Cloudflare Pages 设置：构建命令 `npm --prefix studio ci && npm --prefix studio run build`，输出目录仍为 `public`。构建失败 Cloudflare 不会上线，旧版本继续运行。
- `.gitignore` 加 `studio/node_modules/`；`public/studio/` 是构建产物，**不提交**（由 Pages 构建生成）。
- 依赖固定版本（`package-lock.json` 提交），不要随手 `npm update`。

### 3.3 页面结构（`studio/src/features/`）
`auth`（登录，令牌存 sessionStorage `downloadAdminToken`，与旧后台共用）、`dashboard`（软件数、总下载、最近版本、热更新状态）、`software`、`releases`、`hotupdate`、`landing`（阶段 2）、`content`（文章/音乐/画廊/照片墙/导航）、`assets`、`system`（存储授权、健康检查）。
- 数据请求统一用 TanStack Query（shadcn-admin 已自带），一个 `api.ts` 封装 `POST + Bearer`。
- ⌘K 命令面板加入：跳转各页面、“上传新版本”、“发布热更新”、“切换首页落地页”。
- 上传进度：`configureUpload({ ui })` 接到一个全局进度对话框组件。

### 3.3 接口对照（全部已存在，直接调用，不新增上传接口）
| 功能 | 接口（POST，带 `Authorization: Bearer <token>`） |
|---|---|
| 登录 / 续期 | `/api/admin/login`、`/api/admin/refresh` |
| 读取全部数据 | `/api/admin/catalog` → `{ catalog }` |
| 软件 增改 / 删 | `/api/admin/software`、`/api/admin/software/delete`（有版本时返回 409 + `needForce`，二次确认后带 `force:true`） |
| 分类 | `/api/admin/categories`、`/api/admin/categories/delete` |
| 上传版本 / 替换安装包 | `r2-upload.js` 的 `uploadReleaseFile()`、`replaceReleaseFile()` |
| 版本 编辑 / 设最新 / 隐藏 | `/api/admin/releases/update`，`action`=`edit`（version、changelog、status、fileName、isLatest、platform、label、arch）/`latest`/`toggle` |
| 版本删除 | `/api/admin/releases/delete`（`deleteFile:true` 同时删 R2 文件） |
| 登记已在 R2 的文件 | `/api/admin/releases/register` |
| 热更新 | 上传：`uploadHotUpdateFile(file, app)`；发布：`POST /api/update`；读取：`GET /api/update?app=x`、`&action=history` |
| 资源库 | 上传：`uploadAssetFile()`；列表/删除：`/api/admin/assets/list`、`/delete` |
| 网站模式 | `/api/admin/site-mode`（`mode`=software/portal/blog） |
| 首页文案 | `/api/admin/site` |
| 文章/音乐/画廊/照片墙/导航/轮播 | 与旧后台 `public/admin.js` 中同名调用一致（照抄请求体） |

### 3.4 设计要求
- 默认深色主题；把 shadcn 主题变量 `--primary` 改成暖金 `#e8a33d`，与前台统一；图标只用它自带的 lucide 线条图标，**不用 emoji**。
- 每个列表页：顶部筛选 + 表格 + 右侧抽屉（offcanvas）编辑，不要整页长表单。
- 危险操作（删除、替换文件、切换首页）必须二次确认。
- 上传进度用 `configureUpload({ ui })` 接到一个全局进度弹层。

### 3.5 切换
新后台全部验收通过后：`public/_redirects` 里 `/lvtuang` 指向 `/studio/`；旧 `admin.html/admin.js` **保留一个版本周期**作为备用，不要删除。

**验收**：在新后台完成一遍：新建软件 → 上传 15MB 以上安装包（走分片）→ 再为同版本上传绿色版 → 编辑平台/包名 → 软件中心页看到两个下载包 → 发布热更新 → 切换首页落地页。全程控制台无报错，两个护栏脚本通过。

---

## 阶段 4：首页（综合门户）重设计

参考已有的 `docs/homepage-redesign-brief.md`（视觉规范、约束、自检清单仍然有效），补充：
1. 首页只做“品牌门户”：首屏一句话 + 两个按钮（主：天才猫桌面 2.0；次：软件中心 `/download.html`）+ 一张真实产品截图。
2. 首屏下面按顺序：**旗舰产品**（数据来自 `/api/catalog` 中 `sortOrder` 最小的软件：名称、tagline、封面、下载按钮 `/download/latest/<slug>`）→ **全部软件**（最多 6 个卡片 + “查看全部”到软件中心）→ **最新文章**（3 篇）→ **生态入口**（音乐、画廊、照片墙、NovaDisk 四个小卡，一行）→ 结尾 CTA → 页脚。删除常见问题以外的所有装饰性板块。
3. 主标题、副标题、按钮用阶段 2 的 `data-landing` 绑定（`<body data-landing-page="portal">`），并保留现有 `data-site-text`。
4. 与 `/desktop` 统一：暖金单一强调色，线条图标，无 emoji，卡片悬停只改边框色。
5. 导航只保留一套（顶部导航，由后台“导航设置”渲染 `data-nav`）；删除底部浮动 Dock，或只保留“回到顶部”。

**验收**：1440 / 390 截图；首页数据全部来自后台（在后台改一个软件的 tagline，首页旗舰区跟着变）。

---

## 附：常见坑
- Pages 的“漂亮 URL”：访问 `/desktop.html` 会 308 到 `/desktop`；在 Functions 里用 `env.ASSETS.fetch` 取页面时用不带 `.html` 的路径。
- `/api/catalog` 里 `status: "draft"` 的版本也会返回，前端必须只展示 `status === "published"` 且有 `fileKey` 或 `publicUrl` 的版本（参考 `software-center.js` 的 `downloadable()`）。
- 同一个版本号可以有多个下载包（不同 `platform`/`label`）；“最新版本”= 带 `isLatest` 的那个版本号下的所有包。
- 下载链接一律用 `/download/<releaseId>` 或 `/download/latest/<软件标识>`，不要直接拼 R2 地址。
- 后台令牌 2 小时过期；`r2-upload.js` 在长上传时会自动续期。
- 修改任何 `public/*.js|css` 后，记得改引用处的 `?v=` 版本号。
