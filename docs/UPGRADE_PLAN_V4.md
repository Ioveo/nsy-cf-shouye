# v4 升级方案：前台展示编排层（软件中心配置 / 统一推广位 / 文章分类与排版 / 音乐歌单）

> 策划：Claude｜执行：其它 AI｜验收：Claude
> 本文是对执行 AI 提交的《后端现状与演进建议》的**审定版**：方向采纳，但修正了会导致数据丢失的存储设计，并收窄了范围。**以本文为准。**
> 铁律仍然有效（见 `docs/UPGRADE_PLAN_V2.md` 第 0 节）。

---

## 0. 对原建议的审定结论（执行前必读）

| 原建议 | 结论 | 原因 |
|---|---|---|
| “后台只能录数据，管不了前台展示” | ✅ 采纳 | 判断正确，本次就补“展示编排层” |
| 把新配置加进 `catalog.json`（`site.softwareCenterConfig`、`playlists`、`articleCategories`、`siteCarousel.placement`），“无缝、无破坏” | ❌ **禁止** | `saveCatalog()` 每次保存都经过 `normalizeCatalog()`，**只保留已知字段**；`normalizeSite()` 只保留 `DEFAULT_SITE` 里的键。新字段会在下一次任何保存（哪怕改个软件排序）时被**静默删除**。而且 `catalog.js` 是受保护文件。 |
| 文章分类存进 `catalog.json` | ❌ 修正 | 文章实际存在 **D1 数据库** `articles` 表（`category` 是一个文本列），不在 catalog 里。 |
| 软件中心 4 套主题（极光暗黑 / 磨砂亮色 / 深蓝工业 / 商务） | ⚠️ 缩小 | 每多一套主题，所有页面、所有状态都要做一遍、测一遍，必然出现半成品。**只做一套极光暗黑做到精致**，后台只开放“强调色”（青 / 金 / 紫）一个变量。 |
| 3 种 Hero 模式 | ✅ 采纳 2 种 | 主推软件自动（默认）/ 推广位投放。“极简搜索”并入：任何模式下都可开关“大搜索框”。 |
| 3 种卡片密度 | ✅ 采纳 | 标准卡片 / 紧凑卡片 / 列表，CSS 变体实现，成本低。 |
| 统计条“支持自定义静态数字，避免新站数据不好看” | ❌ 拒绝 | 对用户展示假数据会损害信任。改为：每项可单独隐藏，或设置“低于 N 时自动隐藏”。 |
| 文章 3 种排版（网格 / 列表 / 文档手册） | ✅ 采纳，按**分类**设置 | 每个分类选一种排版，比每篇文章单独选更一致。 |
| 音乐歌单 / 场景频道 | ✅ 采纳 | 运营价值高。 |
| 播放器 3 种外观 | ⚠️ 缩小 | 只做一种：底部悬浮胶囊播放条 + 歌词面板。黑胶作为音乐页 Hero 装饰，不做成可选模式。 |
| 全站常驻背景音乐小播放器 | ❌ 本期不做 | 本站是多页面网站，**每次跳页音频都会中断**，要做必须改成单页应用或 iframe 外壳，代价大、体验差。 |
| 统一轮播投放 + 实体一键绑定 | ✅ 采纳，作为核心 | 新建“推广位”，渲染时实时读取软件/文章最新数据，不复制旧数据。 |

**优先级（按顺序做，每个阶段一个分支）**：阶段 1 配置存储（地基）→ 阶段 2 软件中心配置 + 推广位 → 阶段 3 文章分类与排版 → 阶段 4 音乐歌单 → 阶段 5 门户首页切换到推广位。

---

## 阶段 1：通用配置存储（地基，其它阶段都依赖它）

### 1.1 设计
每类配置一个**独立的 R2 对象**，与 `catalog.json` 完全隔离：

| 配置名 | R2 key | 用途 |
|---|---|---|
| `software-center` | `config/software-center.json` | 软件中心展示配置 |
| `promotions` | `config/promotions.json` | 统一推广位 |
| `article-taxonomy` | `config/article-taxonomy.json` | 文章分类与排版 |
| `playlists` | `config/playlists.json` | 音乐歌单 |

已有的 `functions/_landing/store.js`（落地页）是同样的模式，可参考。

### 1.2 新建文件（不在受保护清单内）
**`functions/_config/store.js`**：
```js
// 白名单：只允许这几个配置名；每个配置有默认值和校验函数
import { DEFAULTS, VALIDATORS } from "./schemas.js";
const keyOf = name => `config/${name}.json`;

export function isKnownConfig(name) { return Object.hasOwn(DEFAULTS, name); }

export async function loadConfig(env, name) {
  if (!isKnownConfig(name)) throw new Error("unknown config");
  const object = await env.SOFTWARE_BUCKET?.get(keyOf(name));
  if (!object) return structuredClone(DEFAULTS[name]);
  try {
    // 和默认值合并：老配置缺字段时用默认值兜底
    return VALIDATORS[name]({ ...structuredClone(DEFAULTS[name]), ...JSON.parse(await object.text()) });
  } catch {
    return structuredClone(DEFAULTS[name]);
  }
}

export async function saveConfig(env, name, data) {
  if (!isKnownConfig(name)) throw new Error("unknown config");
  const clean = VALIDATORS[name](data);            // 校验失败要 throw，带中文错误信息
  clean.version = 1;
  clean.updatedAt = Date.now();
  const previous = await env.SOFTWARE_BUCKET.get(keyOf(name));
  if (previous) {                                   // 保留上一版，支持一键回滚
    await env.SOFTWARE_BUCKET.put(`config/${name}.prev.json`, await previous.text(), { httpMetadata: { contentType: "application/json" } });
  }
  await env.SOFTWARE_BUCKET.put(keyOf(name), JSON.stringify(clean, null, 2), { httpMetadata: { contentType: "application/json; charset=utf-8" } });
  return clean;
}

export async function rollbackConfig(env, name) { /* 读 .prev.json → saveConfig */ }
```
**`functions/_config/schemas.js`**：四个配置的 `DEFAULTS` 和 `VALIDATORS`（结构见各阶段）。校验规则：
- 只保留规定字段（像 normalize 一样），字符串截断到规定长度；
- 所有链接只允许以 `/`、`https://`、`http://` 开头，**拒绝 `javascript:` 等**；
- 数组设上限（推广位 ≤30、歌单 ≤50、每个歌单 ≤200 首、分类 ≤30）；
- 枚举字段不在列表内时回退默认值。

**接口**：
- `GET /api/config/[name].js`：公开读取，返回 `loadConfig()` 结果；响应头 `Cache-Control: no-cache`。
- `POST /api/admin/config.js`：`requireAdmin`（从 `./_lib.js` 导入，不修改）。`{ action: "get" | "save" | "rollback", name, data }`。

### 1.3 测试（新建 `scripts/guard/config-store.mjs`，参照 `r2-regression.mjs` 的内存 R2 写法）
必须覆盖：未知配置名被拒；缺文件返回默认值；保存后读取一致；非法链接 `javascript:` 被拒；超长数组被截断；保存会生成 `.prev.json`；回滚生效；**保存配置后再保存一次软件，配置仍在**（证明与 catalog 隔离）。

**验收**：三个护栏脚本全部通过。

---

## 阶段 2：软件中心展示配置 + 统一推广位

### 2.1 `software-center` 配置结构
```json
{
  "accent": "cyan",                 // cyan | gold | violet → 前台只改 CSS 变量
  "hero": { "mode": "featured", "showSearch": true, "autoplaySeconds": 6 },   // mode: featured | promotions
  "stats": { "show": true, "items": ["software", "downloads", "monthlyUpdates", "platforms"], "hideBelow": 0 },
  "newArrivals": { "show": true, "days": 30, "max": 8 },
  "ranking": { "show": true, "tabs": ["downloads", "updated"], "size": 10 },
  "density": "comfortable",         // comfortable | compact | list
  "pageSize": 12,
  "announcement": { "show": false, "text": "", "href": "", "tone": "info" }   // 顶部公告条
}
```
前台 `software-center.js`：先并行请求 `/api/catalog` 和 `/api/config/software-center`（`Promise.all`），配置请求失败时用代码里的同一份默认值，**页面不能因为配置缺失而空白**。
- `accent` → 在 `<html>` 上设置 `data-accent="gold"`，CSS 里 `[data-accent="gold"] { --sc-accent: #f5c86e; --sc-accent-2: #e8a33d; }`。所有强调色都必须用变量，不准写死 `#00F2FE`。
- `density` → 列表容器加 `sc-grid--compact` / `sc-grid--list` 类。列表模式每行：图标、名称+tagline、平台图标、版本、大小、下载数、各平台下载按钮。
- `stats.hideBelow`：某项数值小于它就不显示该项；全部被隐藏则整条不显示。

### 2.2 `promotions` 统一推广位
```json
{ "items": [ {
  "id": "promo_xxx",
  "placements": ["software", "portal"],        // portal | software | music | articles
  "entity": { "type": "software", "id": "soft_xxx" },   // software | article | playlist | custom
  "override": { "title": "", "subtitle": "", "image": "", "ctaText": "", "ctaHref": "" },
  "badge": "限时推荐",
  "startAt": 0, "endAt": 0,                    // 0 = 不限
  "status": "active",                          // active | paused
  "order": 10
} ] }
```
**渲染规则（前台公共函数 `public/js/promotions.js`，各页面共用）**：
1. 过滤：`status==="active"`、`placements` 含当前页面、当前时间在 `[startAt, endAt]` 内。
2. 解析实体：按 `entity.type/id` 在 `/api/catalog` 数据里找对象；**找不到（被删、下架、草稿）就跳过这条，不报错**。
3. 字段取值：`override` 里非空的优先，否则用实体数据——
   软件：标题=name、副标题=tagline、图=coverUrl→screenshots[0]→iconUrl、按钮“下载”→`/download/latest/<slug>`、次链接→landingUrl 或 `/software.html?slug=`；
   文章：标题、摘要、封面、按钮“阅读”→`/article.html?slug=`；
   歌单：标题、描述、封面、按钮“播放”→`/music.html?playlist=<id>`；
   custom：全部取 override，`image` 和 `ctaHref` 必填。
4. 按 `order` 升序。`hero.mode==="promotions"` 但没有可用推广时，**自动回退到主推软件**。

### 2.3 Studio 页面
- **软件中心配置页** `/site/software-center`：左侧配置表单（分组折叠：外观 / 首屏 / 板块 / 列表），右侧 iframe 预览 `/download.html?preview=1`。表单每次变更 300ms 防抖后 `postMessage({ type: "studio-preview-config", config })`，前台在 preview 模式下用这份配置重新渲染（**不保存也能看效果**）。底部【保存】【恢复上一版】。
- **推广位页** `/site/promotions`：列表（缩略图、标题、投放位置徽标、时间窗口、状态开关、拖拽排序）。新建抽屉：
  第 1 步选类型；第 2 步**实体选择器**（带搜索的下拉，显示图标/封面 + 名称 + 状态；草稿或下架的显示灰色并提示“前台不会显示”）；第 3 步投放位置多选 + 时间 + 角标；第 4 步可选覆盖文案/图片（输入框的 placeholder 显示实体原值）。右侧实时卡片预览。
- 软件编辑页里加一个快捷按钮“加入推广位”。

**验收**：在后台把软件中心切到金色、紧凑卡片、隐藏统计条，预览立即变化，保存后前台生效；建一条“软件”推广位投放到软件中心并把 Hero 切到推广模式；把那个软件改成草稿 → 推广自动消失、Hero 回退到主推软件，前台无报错。

---

## 阶段 3：文章分类与排版

### 3.1 `article-taxonomy` 结构
```json
{ "categories": [ {
  "slug": "tutorial", "name": "上手教程", "description": "", "icon": "book-open",   // lucide 图标名
  "color": "#06B6D4", "layout": "list",          // grid | list | docs
  "order": 10, "showInNav": true
} ] }
```
- **数据兼容**：D1 里文章的 `category` 列继续存字符串。前台匹配规则：先按 `slug` 匹配，匹配不到再按 `name` 匹配（兼容老文章存的是中文名），都匹配不到归入“其他”。
- Studio：新页面 `/content/article-categories`（可拖拽排序的列表 + 抽屉编辑，图标用下拉选择并实时显示）。文章编辑器里的“分类”从文本框改为下拉，存 `slug`。
- 提供一个“整理老数据”按钮：列出 D1 里出现过但不在分类表里的 `category` 值，一键创建对应分类（slug 自动生成，管理员可改）。

### 3.2 前台 `articles.html`
- 顶部分类导航（`showInNav` 的分类，带图标和颜色点）；URL `?cat=slug`。
- 按当前分类的 `layout` 渲染：
  - `grid`：卡片网格（封面 16:9、分类色标签、标题、摘要、日期）；第一篇置顶大卡。
  - `list`：左图（4:3，160px 宽）右文的列表，信息密度高。
  - `docs`：左侧该分类全部文章标题树（按 `sortOrder`），右侧直接显示选中文章正文，适合手册；手机上左侧变成顶部下拉。
- “全部”视图固定用 `grid`。

### 3.3 软件 ↔ 文章闭环
- 文章页：文章关联了软件（`softwareIds`）时，正文末尾 + 右侧栏显示**软件下载挂件**（图标、名称、版本、主下载按钮）。
- 软件详情页：自动显示关联该软件的文章（最多 6 篇，分“教程”和“其他”）。
- `article.js` 已有 `renderRelated`，在它基础上改，不要重写正文渲染部分（安全过滤在里面）。

**验收**：建 3 个分类，分别设三种排版，前台切换正确；老文章（中文分类名）不丢失；文章页能直接下载关联软件。

---

## 阶段 4：音乐歌单

### 4.1 `playlists` 结构
```json
{ "items": [ {
  "id": "pl_xxx", "title": "直播暖场·高燃", "description": "", "cover": "",
  "scene": "live",                 // live | soundcheck | night | sales | other（前台显示对应中文和图标）
  "trackIds": ["music_id_1", "music_id_2"],
  "status": "published", "order": 10, "featured": false
} ] }
```
- 歌曲仍在 `catalog.music` 里，歌单只存 id。**渲染时跳过已删除或未发布的歌曲**。删除歌曲时不用改歌单（自动跳过）。
- Studio `/content/playlists`：歌单卡片网格；编辑页左边歌单信息，右边双栏“曲库（搜索、勾选添加）↔ 歌单曲目（拖拽排序、移除）”。歌单封面未设置时用前 4 首歌封面拼成 2×2。

### 4.2 前台 `music.html`
- 顶部 Hero：推广位（placement=music）或 featured 歌单；
- 场景频道横排（按 scene 分组的歌单卡片）；点击进入歌单视图 `?playlist=id`（封面、简介、曲目列表、播放全部）；
- 播放器统一为**底部悬浮胶囊播放条**：封面、歌名歌手、上一首/播放/下一首、进度条、音量、播放队列、歌词面板（有 lrc 时滚动高亮）。
- 播放队列、当前进度存 `sessionStorage`，刷新本页可续播（跨页面不续播，见第 0 节）。

**验收**：建 2 个歌单，拖拽排序后前台顺序一致；下架一首歌后歌单里自动不显示且不报错；手机上播放条不遮挡内容（页面底部留出播放条高度）。

---

## 阶段 5：门户首页切换到推广位
- 门户首页（`index.html`）的轮播改为读取 `placement=portal` 的推广位；没有时回退到旧的 `siteCarousel`。
- Studio 旧“首页轮播”页面顶部加提示和【迁移到推广位】按钮：把每条 siteCarousel 转为 `custom` 推广位（placements=["portal"]），迁移后旧数据保留不删。
- 迁移稳定后，把“首页轮播”菜单隐藏。

---

## 附 A：执行 AI 容易漏掉的点（逐条检查）
1. **不要往 `catalog.json`/`normalizeSite` 加字段**（会被删）；新配置一律走阶段 1 的配置存储。
2. 所有前台渲染的文本用 `textContent` 或转义函数；所有链接校验协议。
3. 所有前台模块都要有**三种状态**：加载中（骨架屏）、空（友好提示）、出错（提示 + 不影响页面其它部分）。
4. 配置读取失败时用默认值，**页面绝不能因为某个配置缺失而白屏**。
5. 引用的实体（软件/文章/歌曲/歌单）可能被删除或下架，渲染时一律“找不到就跳过”。
6. Studio 保存成功后，用接口返回值更新缓存（`queryClient.setQueryData`），不要整页刷新；保存按钮保存中禁用。
7. 预览统一用 `?preview=1` + `postMessage`，并校验 `event.origin === location.origin`。
8. 时间窗口用毫秒时间戳；Studio 里用日期时间选择器显示本地时间。
9. 图片尺寸提示：推广图 1600×900（16:9），图标 256×256，歌单封面 600×600；上传后在表单里显示实际尺寸，不符合时黄色提示（不阻止）。
10. 所有新加的前台 JS/CSS 文件，引用处带 `?v=日期` 版本号。
11. 每个阶段结束：三个护栏脚本 + studio 构建 + 1440/390 截图 + 本阶段验收用例全部通过，再合并。

## 附 B：本期不做（避免范围失控）
多主题切换、全站跨页常驻播放器、按日下载趋势图（需要新的统计表）、多管理员与审批流、评论系统。
