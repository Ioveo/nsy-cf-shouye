# 首页改版任务说明（交给 Antigravity 执行）

> 审查：Claude｜执行：Antigravity｜验收：Claude（看 git diff + 截图）
> 范围：只改首页 `public/index.html`、`public/apple-design.css`、`public/home.js`。不碰 `functions/`、后台、其它页面。

## 一、审查结论：为什么"乱"

1. **三套导航打架**：顶部主导航 + 第二条 "TianCaiMao Hub" 子导航 + 右下浮动 Dock。用户不知道该点哪一个。
2. **首屏没有主角**：标题讲"直播运营入口"，副标题讲"像 Raycast / Apple"，按钮却推"桌面 2.0"和"NovaDisk"。三个按钮三种样式（蓝色实心、深色描边、蓝框配橙色图标）。
3. **首屏装饰太多**：命令面板模拟窗口、两个漂浮标签（"自包含运行时""60 FPS"）压在窗口上、左侧猫咪被裁掉一半。
4. **和 /desktop 落地页不是一个品牌**：首页用苹果蓝，/desktop 已改成暖金色。同一个网站两种主色，看起来像两家公司。
5. **emoji 当图标**：按钮、标签、命令面板里大量 🚀⚡🟢🔍，这是"不高级"的最大来源（/desktop 已全部换成线条图标）。
6. **9 个板块权重一样**：旗舰、软件矩阵、生态 Bento、AI 工作台、动态、FAQ、CTA……每块都在喊。"AI 工作台"是模拟的 AI 分析，属于噱头。
7. **文案模仿痕迹重**：大量"X。Y。"苹果句式、"像 Raycast 一样快"，读起来不像自己的产品。
8. **代码层面**：`index.html` 有 66 处行内 `style=""`；仓库里还有没被引用的旧样式 `raycast-home.css`、`site-theme.css`。

## 二、改版目标

一句话：**首页是"天才猫"品牌的门户，主角是天才猫桌面 2.0，其余产品排在后面。** 风格与 `/desktop`（`public/desktop.html`）保持同一套视觉语言。

### 视觉规范（与 /desktop 一致）
- 背景近黑 `#07090f`；正文暖白；次要文字统一一个灰色。
- **唯一强调色：暖金** `#f5c86e → #e8a33d`，只用于主按钮、小标题（eyebrow）、每个板块最多一处高亮。去掉苹果蓝。
- 图标：全部用 24×24 线条 SVG（`stroke="currentColor"`、`stroke-width:1.5`、无填充），灰色或金色，**不要 emoji**，不要彩色渐变底座。可直接复用 `desktop.html` 顶部 `<svg>` sprite 里的图标。
- 标题字重 700（首屏 800），中文标题不加宽字间距，`text-wrap: balance`。正文 16px / 行高 1.75。
- 卡片：细边框 `rgba(255,255,255,.06)`、背景 `rgba(255,255,255,.02)`、圆角 16px；悬停只变边框颜色，不上浮、不放大、不加大阴影。
- 板块上下留白 120px（手机 72px）。
- 按钮：主按钮金色实心，次按钮透明细边框，**两种样式，等高**。

### 结构（从 9 块精简到 6 块）
1. **导航**：只保留一条顶部导航（`data-nav`，由后台导航设置渲染）+ 右侧一个"下载"金色按钮。删除第二条子导航；浮动 Dock 删除或仅保留"回到顶部"。
2. **首屏**：eyebrow + 标题 + 一句副标题 + 两个按钮（主：体验天才猫桌面 2.0 → `/desktop.html`；次：浏览全部软件 → `#softwareMatrix`）。下面放一张真实产品截图（`/card-desktop-full.png` 或 `/ui-desktop-full.png`），去掉漂浮标签和被裁切的猫。命令面板模拟窗口：如果保留，就做成截图下方的一个安静的小组件，去掉所有 emoji。
3. **旗舰：天才猫桌面 2.0**（`#flagshipDesktop`）：左图右文，3 条卖点，一个"了解详情 →"链接。
4. **全系软件**（`#softwareMatrix`）：保留现有 JS 渲染的软件卡片和分类 Tab（`matrixGrid`、`matrixTabs`），只改样式。
5. **最新动态 / 教程**（`#newsroom`，`homeArticlesGrid`）+ **常见问题**（`#faq`）。
6. **结尾 CTA**（`#readyCta`）+ 页脚。

"生态 Bento"（照片墙/音乐/NovaDisk/授权）压缩成一行 4 个小链接卡，放进旗舰或软件板块下方；**"AI 工作台"整块删除**（连同 home.js 里只服务它的代码，删前确认无其它引用）。

### 文案
- 去掉"像 Raycast""如 Apple 工具般"等对标说法，去掉"X。Y。"的连续句号句式。
- 首屏文案由后台"首页文案"驱动（`data-site-text` 属性），**改 HTML 里的默认文案即可，属性必须保留**。

## 三、硬性约束（不能破坏）
- 保留这些 `data-site-text` 属性：`homeHeroKicker` `homeHeroTitle` `homeHeroDescription` `readyKicker` `readyTitle` `footerWordmark`（删除 AI 板块后，`aiKicker` `aiTitle` `aiDescription` `aiPrompt*` 可随之删除）。
- 保留 `home.js` 依赖的元素：`[data-nav]`、`#matrixGrid`、`#matrixTabs`、`#homeArticlesGrid`、`.apple-faq-item` / `.apple-faq-question`、`#launcherList` / `#launcherSearchInput`（若删除命令面板，必须同步删除 home.js 对应代码，且不能报错）。
- 所有下载链接、`/desktop.html`、`/download.html`、`/novadisk.html` 等跳转保持可用。
- 不引入任何外部 CSS/JS/字体/CDN；不加构建步骤（Cloudflare Pages 无构建命令，输出目录 `public`）。
- 把行内 `style=""` 尽量移到 `apple-design.css`。
- 改样式文件后，把 `index.html` 里 `apple-design.css?v=` 和 `home.js?v=` 的版本号改成新日期，防止浏览器缓存旧文件。
- 手机宽度 390px 下不能出现横向滚动。

## 四、自检清单（Antigravity 完成后必须逐条确认）
1. 本地运行 `npx wrangler pages dev public --port 8788`，打开 `http://localhost:8788/`，浏览器控制台**无报错**。
2. 1440px 和 390px 两个宽度各截一张全页图（先滚动到底，让淡入动画触发）。
3. 搜索页面里的 emoji：除 ✓ → ↗ 这类文字符号外应为 0。
4. 软件卡片、分类 Tab、文章列表、FAQ 展开都能正常工作。
5. 全页只有暖金一个强调色，无苹果蓝残留（搜 `#0071e3`、`#2997ff`、`rgb(0, 113` 等）。
6. 在新分支 `redesign/home` 上提交，提交信息写清楚改了什么，**不要推送到 main**。
