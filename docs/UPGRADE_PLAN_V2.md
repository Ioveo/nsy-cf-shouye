# 天才猫 v2 升级方案：软件中心 + Studio 完整后台 + 内容模块

> 策划：Claude｜执行：其它 AI｜验收：Claude
> 前一份 `docs/UPGRADE_PLAN.md` 的阶段 1–4 已完成。本文件是下一轮，**按 A → E 顺序做，每个阶段一个分支、一次合并**。

---

## 0. 铁律（与上一份相同，再强调）

1. 不准修改受保护文件（清单见 `scripts/guard/check-protected.mjs`）。不准运行 `--update`。
2. 每个阶段结束前必须通过：
   ```
   node scripts/guard/check-protected.mjs
   node scripts/guard/r2-regression.mjs
   npm --prefix studio run build
   ```
3. 上传只能通过 `@r2`（`public/console/lib/r2-upload.js`）。
4. **保存必须串行**：每个 `/api/admin/*` 保存接口都是“读取整个目录 → 修改 → 写回整个目录”。同时发两个保存请求，后一个会覆盖前一个的修改（数据丢失）。
   批量操作（拖拽排序、批量上传图片后逐条登记、批量上下架）**必须 `for … await` 一个接一个发**，禁止 `Promise.all`。
5. 前台页面风格不变（深色玻璃、现有配色）；后台保持 shadcn 风格 + 暖金主色。不准用 emoji 当图标。
6. 所有前台页面只展示 `status === "published"`（版本）/ `status === "active"`（软件，后端已过滤）的数据。

---

## 1. 已经替你准备好的后端（不用做，直接用）

`/api/admin/software` 现在接收并保存这些软件字段（`/api/catalog` 会返回）：

| 字段 | 说明 |
|---|---|
| `name` `slug` `categoryId` `description` `sortOrder` | 原有 |
| `status` | `active` 上架 / `draft` 草稿（前台不可见）/ `disabled` 下架 |
| `tagline` | 一句话介绍 |
| `iconUrl` | 软件图标（方形，建议 256×256） |
| `coverUrl` | 封面大图（16:9，用于主推轮播和卡片） |
| `screenshots` | 截图地址数组（最多 12 张），也接受“每行一个地址”的字符串 |
| `highlights` | 特性亮点 `[{title, text}]` |
| `featured` `featuredOrder` | 是否主推、主推排序（小的在前） |
| `priceLabel` | 价格标签，默认“免费” |
| `developer` `website` `requirements` `landingUrl` | 开发者、官网、系统要求、专属落地页（有值时详情跳到这里） |

版本（release）字段：`version` `platform`（windows/portable/macos/linux/android/other，上传时按扩展名自动判断）`label` `arch` `changelog` `fileName` `size` `isLatest` `status` `downloadCount`（来自下载统计）。

**一个软件 = 多个版本；一个版本号 = 多个下载包（不同平台）。** “Mac 软件”不是单独的软件，而是该软件有 `platform=macos` 的下载包。

---

## 阶段 A（立即，5 分钟）：恢复旧后台入口

现在 `public/_redirects` 里 `/admin /studio/ 302` 让旧后台打不开，画廊、文章、音乐目前**完全无法管理**。
- 删除 `/admin /studio/ 302` 这一行（保留 `/lvtuang /studio/ 302`）。
- 旧后台地址：`/admin`。在 Studio 侧边栏底部加一个“旧版后台”外链，阶段 D 全部完成后再移除。

---

## 阶段 B：前台软件中心（`download.html` 列表页 + `software.html` 详情页）

### B.1 决策
- **平台是筛选维度，不是分类**：平台从下载包自动得出（有 windows 包就出现在 Windows 下），后台不需要手动给软件打“Win/Mac”标签，避免数据不一致。
- **分类是功能维度**：沿用后台“分类管理”（桌面效能、数据中心、直播辅助…）。
- **两种详情页**：
  - 普通软件（多数）→ 统一模板 `/software.html?slug=xxx`，全部由后台数据生成，**发布软件不需要写任何页面**；
  - 主推品（少数）→ 填了 `landingUrl` 的，详情按钮跳到专属落地页（如 `/desktop.html`）。

### B.2 `download.html` 改为列表页（保留现有视觉风格、导航、页脚）
自上而下：
1. **主推轮播**：`featured === true` 的软件按 `featuredOrder` 排，1–5 个。每屏：封面图（无封面用第一张截图）、名称、tagline、平台徽标、主下载按钮（最新版第一个包 `/download/<id>`）、“了解详情”（`landingUrl` 或 `/software.html?slug=`）。自动 6 秒切换，可左右切换、圆点指示，鼠标悬停暂停。没有主推品时整块隐藏。
2. **筛选条**（滚动时吸顶）：平台分段按钮〔全部 / Windows / macOS / 绿色便携 / 其他〕（只显示实际存在的平台）+ 分类标签 + 搜索框（名称、tagline）+ 排序〔推荐（sortOrder）/ 最近更新 / 下载最多〕。筛选状态写进 URL（`?platform=macos&cat=xxx&sort=downloads&q=`），刷新/分享保持。
3. **两栏主体**（≥1024px）：
   - 左：软件卡片网格。卡片 = 图标、名称、tagline（两行截断）、平台小图标、版本号、大小、下载次数、价格标签、【下载】【详情】。
   - 右侧栏（固定宽 320px）：**下载榜 Top 10**（软件下载数 = 其所有版本 `downloadCount` 之和；前三名序号用暖金色）、**最近更新**（最近 5 个发版，显示软件名 + 版本 + 日期）。
   - <1024px：侧栏移到网格下方。
4. 空状态：筛选无结果显示“没有符合条件的软件”+“清除筛选”按钮。
5. 兼容旧链接：访问 `download.html?app=xxx` 时跳转到 `/software.html?slug=xxx`。
6. 当前 `software-center.js` 中按软件切换大标题的逻辑移到详情页使用，列表页不再需要。

### B.3 `software.html` 详情页（重做，同一视觉风格）
- 顶部：图标、名称、tagline、平台徽标、版本、更新日期、大小、开发者、价格标签、主下载按钮 + 其它平台下载下拉。
- 截图画廊：横向滚动缩略图 + 点击灯箱大图（键盘左右切换、Esc 关闭）。
- 简介（Markdown，复用 `article.js` 的 `markdownToHtml` 思路，只允许安全标签）、特性亮点、系统要求。
- 下载包卡片（当前版本所有平台）、历史版本与更新日志（折叠，可下载旧版本）。
- 相关文章：`articles` 中 `softwareIds` 包含此软件 id 的文章（最多 3 篇）。
- SEO：动态设置 `<title>`、`meta description`。
- **预览模式**：URL 带 `?preview=1` 时，不读 `/api/catalog`，改为监听 `window.postMessage({ type: "studio-preview", software })` 渲染（只接受 `event.origin === location.origin`）。Studio 用 iframe 预览草稿。

**验收**：后台新建一个只有 macOS 包的软件 → 列表页“macOS”筛选能看到、“Windows”看不到；设为主推后出现在轮播；下载 3 次后下载榜变化。

---

## 阶段 C：Studio 软件发布（核心）

### C.1 决策：两个入口，不做多人审批
- 只有你一个管理员，**不做审批流**，用“草稿 → 预览 → 上架”+“发布前检查清单”代替审核，既安全又不拖慢。
- 入口 1【发布新软件】：一页式**发布向导**（新软件用，信息+图片+安装包一次完成）。
- 入口 2【上传新版本】：已有软件发新版本（只选软件、版本号、拖入一个或多个安装包、写更新说明），30 秒完成。日常最常用。
- 版本记录本身就是发布历史；暂不做操作日志（以后多人管理再加）。

### C.2 发布向导（`/studio/software/new`，也用于编辑 `/studio/software/$id`）
左侧步骤条，右侧表单，底部固定操作栏〔保存草稿〕〔预览〕〔上架发布〕。每一步可随时保存草稿（软件 `status: "draft"`）。
1. **基本信息**：名称（自动生成 slug，可改，实时校验唯一）、分类（可就地新建）、tagline（≤40 字，计数）、简介（Markdown 编辑 + 预览）、亮点（可增删排序的列表：标题 + 说明）、系统要求、开发者、官网、价格标签。
2. **图片**：图标（方形裁切预览）、封面（16:9 预览）、截图（拖拽多选批量上传，缩略图网格可拖拽排序、删除，最多 12 张）。上传用 `uploadAssetFile(file, { kind: "image", folder: "software-<slug>" })`，取返回的 `url`。
3. **安装包**：拖入一个或多个文件 → 每个文件一行：自动识别平台（可改）、包名称、架构；统一填版本号和更新说明 → 逐个 `uploadReleaseFile()`（**串行**，每个显示自己的进度）。第一个包设为最新版。
4. **展示与发布**：是否主推 + 主推排序、专属落地页 `landingUrl`（可选，从落地页列表选择）、状态。
   右侧**检查清单**（实时打勾）：必填〔名称、slug、分类、tagline、图标、≥1 个安装包〕；建议〔封面、≥3 张截图、简介 ≥50 字、≥3 条亮点〕。必填项未完成时“上架发布”按钮禁用并提示缺什么。
5. **预览**：右侧抽屉/弹窗内 iframe 加载 `/software.html?preview=1`，`onload` 后 `postMessage` 当前表单数据（同 `/api/catalog` 中软件的结构，含 releases）。切换“卡片 / 详情页”两种预览。

保存顺序：先 `POST /api/admin/software` 拿到/确认 `id`，再上传安装包（`softwareId` 用该 id），最后再保存一次软件（状态、主推等）。

### C.3 软件列表页增强
表格列：图标+名称、分类、平台徽标、最新版本、总下载、主推（开关，点击即保存）、状态（徽标）、更新时间、操作。
- 顶部：搜索、分类筛选、状态筛选（全部/上架/草稿/下架）、【发布新软件】【上传新版本】。
- 行操作菜单：编辑、上传新版本、预览、复制下载链接、上架/下架、删除（二次确认；有版本时提示会删记录）。
- 拖拽排序（`sortOrder`，**串行保存**，保存期间显示“正在保存排序…”并禁用拖拽）。

### C.4 版本管理页增强（在现有基础上）
- 按软件分组折叠显示；同一版本号的多个包合并为一行，展开看各平台包。
- 行操作：编辑（版本号、平台、包名、架构、说明、状态）、设为最新、替换文件、复制下载链接、删除（可选同时删 R2 文件）。

**验收**：用向导从零发布一个软件（3 张截图 + Windows 包 + 绿色版），先存草稿（前台看不到）→ 预览 → 上架（前台出现）→ 设主推（出现在轮播）。全程无报错，两个护栏通过。

---

## 阶段 D：内容模块搬进 Studio（文章 / 音乐 / 画廊 / 照片墙 / 首页轮播 / 导航）

接口全部已存在，请求体照抄旧后台 `public/admin.js` 中的对应调用（搜索接口路径即可找到）：

| 模块 | 保存 | 删除 | 主要字段 |
|---|---|---|---|
| 文章 | `/api/admin/articles` | `/api/admin/articles/delete` | title slug summary coverUrl content category tags softwareIds featured status seoTitle seoDescription sortOrder |
| 音乐 | `/api/admin/music` | 同接口 `action: "delete"` | title artist album audioUrl coverUrl lyric neteaseId tags featured status sortOrder |
| 画廊 | `/api/admin/gallery` | 同接口 `action: "delete"` | title description imageUrl thumbUrl assetKey storageId source tags featured status sortOrder |
| 照片墙 | `/api/admin/photo-wall` | 同接口 `action: "delete"` | title description imageUrl thumbUrl linkUrl linkText assetKey status sortOrder |
| 首页轮播 | `/api/admin/site-carousel` | 同接口 `action: "delete"` | title description imageUrl thumbUrl suggestion status sortOrder |
| 导航 | `/api/admin/navigation` | `/api/admin/navigation/delete` | label href external status sortOrder |

侧边栏分组：**内容**（文章、音乐、画廊、照片墙）/ **站点**（落地页、首页轮播、导航、首页文案）。

### D.1 文章（交互升级）
- 列表：卡片/表格切换、搜索、分类与状态筛选（草稿/已发布/隐藏）、置顶（featured）开关。
- 编辑器整页：左 Markdown 编辑（工具栏：标题、粗体、列表、引用、代码、链接、图片），右实时预览。
  预览方式同软件：iframe `/article.html?preview=1` + `postMessage({ type: "studio-preview", article })`（需在 `article.js` 加预览模式，复用现有 `renderArticle`）。
- 图片：工具栏上传、**粘贴图片**、**拖入图片**都自动上传（`uploadAssetFile(file,{kind:"image",folder:"article"})`），在光标处插入 `![](url)`，上传中显示占位文字。
- 封面：上传或从资源库选；关联软件多选；SEO 标题/描述（带字数提示）。
- 自动保存草稿：每 30 秒 + 离开页面前，存 localStorage；回到页面时提示“恢复未保存的草稿？”。
- `Ctrl/⌘+S` 保存。

### D.2 音乐
- 列表：封面、标题、歌手、时长（读音频元数据）、状态、试听按钮（页面内迷你播放器）。
- 新增：拖入音频（≤50MB，`kind:"audio"`）自动读取文件名填标题；封面上传；歌词粘贴（LRC）；或填网易云 ID 二选一。
- 拖拽排序决定播放顺序（串行保存）。

### D.3 画廊
- 网格视图（瀑布流缩略图），**拖入多张图片批量上传**：逐张 `uploadAssetFile(kind:"image", folder:"gallery")` → 逐张保存画廊条目（串行），整体进度“3/12”。
- 多选后批量操作：发布/隐藏/删除/加标签（串行）。
- 单张编辑抽屉：标题、描述、标签（可输入新建）、精选。
- 拖拽排序。

### D.4 照片墙、首页轮播、导航
照片墙与轮播同画廊的交互（批量上传 + 拖拽排序 + 抽屉编辑）；导航为可拖拽排序的列表，内联编辑名称/链接/新窗口/显示。

### D.5 前台对应页面
`articles.html` `article.html` `music.html` `gallery.html` `photo-wall.html` 统一到软件中心同一视觉语言（同一导航、页脚、配色），只改样式，不改数据接口；确保只显示 `published`。每页保留 `data-landing-page` 与 `landing-bind.js`。

**验收**：在 Studio 写一篇带 3 张粘贴图片的文章并发布；批量上传 10 张画廊图片并拖拽排序；上传一首歌试听并发布；前台三个页面都正确显示，顺序与后台一致。

---

## 阶段 E：Studio 全局交互规范（贯穿所有页面）

- **布局**：列表页 = 顶部标题+主操作按钮 → 筛选条 → 表格/网格；编辑 = 右侧抽屉（简单对象）或整页（软件向导、文章）。
- **反馈**：保存成功 toast；失败 toast 显示接口返回的 `msg`；按钮保存中显示加载并禁用，防止重复提交。
- **危险操作**：删除、替换文件、切换首页、下架主推 → 确认对话框，说明后果。
- **乐观更新慎用**：因为保存是整目录写入，**保存成功后用接口返回的 `catalog` 刷新数据**（多数接口返回 `{ success, catalog }`），不要只改本地状态。
- **空状态**：每个列表都有插图式空状态 + 主操作按钮（如“发布第一个软件”）。
- **加载**：骨架屏，不用整页转圈。
- **快捷键**：`⌘K` 命令面板（跳转页面、发布新软件、上传新版本、发布热更新、新文章、切换首页）；`⌘S` 保存当前编辑；`Esc` 关闭抽屉。
- **未保存提醒**：表单有改动时离开页面或关闭抽屉要确认。
- **上传**：全局上传进度面板（右下角，可最小化），显示每个文件的进度、速度、失败重试；上传中刷新页面前提示。
- **响应式**：≥768px 侧边栏常驻，以下折叠为抽屉；表格在窄屏转卡片。
- **仪表盘**补充：下载趋势（如无按日数据，先显示各软件下载占比）、草稿待发布数量、最近 5 次操作（来自各数据的 `updatedAt`）。

---

## 附：数据与接口速查

- 读取全部后台数据：`POST /api/admin/catalog` → `{ catalog }`（含草稿、文章、存储授权）。
- 前台公开数据：`GET /api/catalog`（只含上架软件、已发布内容）。
- 下载链接：`/download/<releaseId>`、`/download/latest/<slug>`；不要拼 R2 地址。
- 资源上传返回：`{ success, url, fileKey, asset }`，`url` 可直接用于 `<img>` / `<audio>`。
- 登录令牌：sessionStorage `downloadAdminToken`，2 小时有效，上传过程中自动续期；其它时候遇到 403 跳回登录页。
