# v3 升级方案：软件中心重做 + Studio 卡顿修复

> 策划：Claude｜执行：其它 AI｜按 阶段 1 → 2 → 3 顺序做，每阶段一个分支。
> 铁律同前（`docs/UPGRADE_PLAN_V2.md` 第 0 节）：不改受保护文件；每阶段跑完两个护栏脚本 + `npm --prefix studio run build`；保存请求必须串行。

---

## 0. 现在为什么"丑"和"卡"（根本原因，先读懂）

1. **软件中心排版散架**：`download.html` 用的是预编译的 `public/vendor/software-center.css`（Tailwind 生成），但之后 `software-center.js` 里新写的样式类**没有重新编译进去**——实测 279 个类里缺 93 个（如 `lg:grid-cols-[1fr_320px]`、`max-w-6xl`、`h-[42px]`）。所以按钮被拉满整行、侧栏没到右边、导航叠在一起。
   **结论：前台软件页不再使用 Tailwind 类名**，改用手写的语义化 CSS（下面第 1.2 节），从根上消除"写了类但没编译"的问题。
2. **Studio 点了没反应**：文章/音乐/画廊/照片墙/轮播/导航全塞在一个 2312 行的组件 `features/content/index.tsx`，侧边栏链接是 `/content?tab=music` 这种同一路由不同参数；组件只在首次挂载时用 `useState(() => location.search…)` 读一次 tab，之后点侧边栏网址变了但组件不重读，所以要刷新。

---

## 阶段 1：软件中心前台重做（`download.html` + `software.html`）

### 1.1 视觉风格（必须严格遵守）
**参考原稿**：`docs/reference/download-ui-original.html`（你要复刻的那版，先在浏览器打开看效果）。保留它的气质：
- 深空背景 `#07090E`，表面色 `#0F1420`；背景有 3 个缓慢漂移的模糊光球（aurora，青/靛/紫，透明度 ≤0.18）+ 极淡点阵网格。
- **主强调色青色** `#00F2FE` → `#06B6D4` 渐变（主按钮、徽标、选中态）；辅助靛 `#4F46E5`、紫 `#7C3AED` 只用于光球和极少量点缀。（软件中心保持青色，与 /desktop 的暖金区分开，这是有意的。）
- **玻璃卡片**：背景 `rgba(255,255,255,.035)`，`backdrop-filter: blur(20px) saturate(140%)`，1px 边框 `rgba(255,255,255,.08)`，圆角 16–20px，顶部 1px 高光渐变；悬停边框变 `rgba(0,242,254,.35)` + 轻微上浮 2px（只有卡片可以浮，按钮不浮）。
- **主按钮**：高 48–52px，圆角 14px，青色渐变底、深色字 `#04101A`、加粗，带一次性的扫光（`btn-shimmer`）；**次按钮**：同高，透明底 + 1px 白边 16% 不透明。同一行按钮必须等高。
- 字体：系统字体栈（-apple-system、PingFang SC、Microsoft YaHei）；数字/版本号用等宽字体。标题字重 700，大标题 48–60px、字间距 -0.02em；正文 15–16px、行高 1.618；次要文字 `#94A3B8`。
- 图标：`lucide`（已在 `public/vendor/lucide.min.js`），线条 1.75px，**不准用 emoji**。
- 动效：入场依次淡入上移（stagger 60ms），时长 ≤500ms；尊重 `prefers-reduced-motion`（关闭所有动画和自动轮播）。
- 间距基数 8px；内容最大宽度 1280px，两侧留白 24px（手机 16px）。

### 1.2 技术路线
- 新建 `public/css/software-center.css`：**手写语义化 CSS**，CSS 变量写在 `:root`（颜色、圆角、阴影、间距）。类名用 `sc-` 前缀：`sc-nav` `sc-hero` `sc-hero__slide` `sc-chip` `sc-segment` `sc-card` `sc-card--new` `sc-rank` `sc-aside` `sc-btn` `sc-btn--primary` `sc-btn--ghost` `sc-badge` `sc-skeleton` 等。
  `glass-card`、`aurora`、`btn-shimmer`、`mockup-3d-window` 的效果从参考原稿的 `<style>` 里**原样拷贝**改名过来。
- `download.html` 与 `software.html` 都只引用这一个 CSS + `lucide.min.js`；**删除** `vendor/software-center.css` 的引用，HTML/JS 里**不再出现任何 Tailwind 类名**（`grep -E 'class="[^"]*(px-|py-|grid-cols|bg-\[)' public/download.html public/software.html public/software-center.js public/software.js` 应为空）。
- `software-center.js` 重写为：一次请求 `/api/catalog` → 计算派生数据 → 渲染各区块。筛选/排序/切换**只重渲染列表区**，不重渲染整页；筛选状态同步到 URL（`history.replaceState`），刷新保持。
- 加载时显示骨架屏（与真实布局同尺寸），数据到后替换，避免跳动。图片一律 `loading="lazy"` 并写死宽高比容器。

### 1.3 派生数据（前端计算，后端不用改）
- `downloadable(r)`：`r.status==="published" && (r.fileKey||r.publicUrl) && r.version!=="待上传"`
- 每个软件：`latest`（isLatest 或最新）、`packages`（latest 同版本号的所有包）、`platforms`（所有可下载包的 platform 去重）、`downloads`（所有版本 `downloadCount` 之和）、`firstReleasedAt`（最早一个可下载版本的 `createdAt`）、`updatedAt`（latest 的 `createdAt`）。
- **新品**：`firstReleasedAt` 在 30 天内；不足 4 个时按 `firstReleasedAt` 倒序补足到 4–8 个。
- **主推**：`featured===true`，按 `featuredOrder` 升序；没有主推时用下载量第一的软件。

### 1.4 `download.html` 页面结构（自上而下）
1. **浮动导航**（沿用原稿顶部玻璃胶囊导航）：品牌 + 首页 / 软件中心 / 文章 / 桌面 2.0 + 右侧搜索图标（点击聚焦搜索框）。
2. **头部推广轮播** `sc-hero`（高 460px，手机自适应）：左 7/12 文案（分类·版本徽标、软件名 56px、tagline 渐变字、简介两行、【下载 xx】主按钮 +【了解详情】次按钮、元信息：大小 · 下载次数 · 更新日期），右 5/12 用原稿的 `mockup-3d-window` 3D 倾斜窗口装入封面图（无封面用第一张截图，再没有用图标放大+光晕）。底部圆点 + 左右箭头，6 秒自动切换，悬停暂停，支持键盘左右与触屏滑动。只有 1 个主推时不显示圆点箭头。
3. **数据条**（一行 4 个小玻璃块）：收录软件数、累计下载、本月更新数、支持平台数。
4. **分类导航**（滚动到此后吸顶，玻璃模糊背景）：左侧分类胶囊（"全部"+各分类，带数量，选中为青色描边发光），右侧平台分段控件（全部 / Windows / macOS / 绿色版 / 其他，只显示存在的），再右边搜索框。
5. **新品上架**：横向滚动卡片行（每张 280px，左右渐隐遮罩 + 箭头按钮），卡片左上角 `NEW` 青色角标，显示图标、名称、tagline、版本、上线日期、【下载】。
6. **主体两栏**（≥1100px：左自适应 + 右 340px；以下侧栏下移）：
   - 左【全部软件】：标题行右侧排序下拉（推荐 / 最近更新 / 下载最多 / 名称）+ 结果数；卡片网格 3 列（≥1100）/ 2 列 / 1 列。卡片：顶部 16:9 封面（无则渐变底 + 大图标），图标叠在封面左下角压边，名称 + 价格徽标，tagline 两行截断，平台小图标组，底部一行 `v版本 · 大小 · ↓下载数`，按钮【下载】主 +【详情】次。每次显示 12 个，底部【加载更多】。空结果显示插画式空状态 +【清除筛选】。
   - 右侧栏 `sc-aside`（`position: sticky; top: 吸顶条高度+16px`）：
     a.【排行榜】顶部两个 Tab：**下载榜**（按 downloads）/ **更新榜**（按 updatedAt），各 Top 10。第 1–3 名序号用青色大号数字，其余灰色；每行图标、名称、副信息（下载数或更新日期）、悬停出现小下载按钮。
     b.【最近更新】5 条：软件名、版本、平台、相对时间（"3 天前"）。
7. **底部 CTA + 页脚**（沿用原稿）。删除截图里那个"开放应用生态 / 进入发布后台"块（前台不能出现后台入口）。

### 1.5 `software.html` 详情页（同一套 CSS）
顶部大卡：图标 96px、名称、tagline、徽标（分类、价格、平台）、主下载按钮（推荐包）+ "其它版本"下拉（列出所有平台包）、元信息（版本、大小、更新日期、开发者、下载数）。
下面依次：截图画廊（横滑缩略图 + 灯箱，键盘切换）→ 简介（Markdown 安全渲染）→ 特性亮点（2–3 列玻璃卡）→ 下载包卡片（每平台一张）→ 版本历史（折叠，可下载旧版）→ 相关文章 → 同分类推荐（4 个卡片）。有 `landingUrl` 的软件在顶部显示"查看产品介绍页 →"。保留 `?preview=1` + `postMessage` 预览模式。

### 1.6 验收
1440 / 1024 / 390 三个宽度截图；对照参考原稿气质一致；无横向滚动；筛选/排序/切换分类无刷新且 <100ms；控制台无报错；Lighthouse 性能 ≥85。

---

## 阶段 2：Studio 卡顿修复（必须先于阶段 3）

1. **拆分内容模块路由**：删除 `/content?tab=` 方式，改为独立路由：
   `/content/articles` `/content/music` `/content/gallery` `/content/photo-wall` `/site/carousel` `/site/navigation`，每个对应 `features/<模块>/index.tsx`，**单文件不超过 500 行**（表单、表格、对话框拆成子组件）。
   旧地址 `/content?tab=xxx` 做一次重定向到新地址。侧边栏 `sidebar-data.ts` 同步改。
2. **规则：不准在 `useState` 初始化里读 `window.location`**。需要 URL 参数时用 TanStack Router 的 `validateSearch` + `Route.useSearch()`，参数变化组件会自动更新。
3. **规则：站内跳转只用 `<Link>` / `navigate()`**，不准用 `<a href>` 或 `window.location`（外链除外）。
4. **数据统一缓存**：新建 `hooks/use-catalog.ts`：`useQuery({ queryKey: ['catalog'], queryFn: 拉 /api/admin/catalog, staleTime: 30_000 })`；所有页面共用，不要各自 `fetch`。保存成功后 `queryClient.setQueryData(['catalog'], 返回的catalog)`，不要整页 reload。
5. 切换页面时显示该页骨架屏，不要白屏。

**验收**：侧边栏在"文章 → 音乐 → 画廊 → 软件 → 文章"之间连续快速点击，每次都立即切换且内容正确，无需刷新；`npm --prefix studio run build` 无类型错误。

---

## 阶段 3：Studio 补齐软件中心需要的设置

在"软件编辑"里确认这些都能设置，且有直观预览：
- 主推开关 + 主推排序（拖拽）；封面图（16:9 裁切预览，标注"用于头部推广"）；图标；截图组（拖拽排序）。
- 软件列表加一列"新品"标识（30 天内首发自动显示，只读）。
- 仪表盘加"软件中心预览"卡片：内嵌 `/download.html` 的缩略 iframe + "打开前台"按钮。

---

## 附：给执行 AI 的检查清单（每阶段结束逐条确认）
- [ ] 两个护栏脚本通过，studio 构建通过
- [ ] 前台页面没有 Tailwind 类名、没有 emoji、没有外部 CDN
- [ ] 三个宽度截图已附上
- [ ] 侧边栏连续切换无需刷新
- [ ] 所有下载按钮指向 `/download/<id>`，点击能下载
