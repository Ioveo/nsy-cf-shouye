export interface ArticleFormData {
  id?: string
  title: string
  slug: string
  summary: string
  category: string
  tags: string[]
  coverUrl: string
  content: string
  softwareIds: string[]
  featured: boolean
  status: 'published' | 'draft'
  seoTitle: string
  seoDescription: string
  sortOrder?: number
}

export type WorkbenchViewMode = 'focus' | 'split-phone' | 'split-desktop'

export interface WechatTemplate {
  id: string
  name: string
  category: 'callout' | 'quote' | 'step' | 'layout' | 'product' | 'industry' | 'custom'
  icon: string
  description: string
  snippet: string
}

export const WECHAT_TEMPLATES: WechatTemplate[] = [
  // 1. 软件/产品功能图文混排 (核心新增)
  {
    id: 'feature-left-img',
    name: '📱 产品功能：左图右文',
    category: 'product',
    icon: 'LayoutList',
    description: '左侧产品/软件截图大图，右侧功能标题、亮点特性与打勾清单',
    snippet: `<div class="article-feature-row article-feature-row--left-img">
  <div class="article-feature-row__media">
    <img src="/logo.png" alt="产品操作界面展示" />
  </div>
  <div class="article-feature-row__content">
    <span class="article-feature-row__tag">核心功能特性</span>
    <h3 class="article-feature-row__title">极简灵动侧边收纳，一触即达</h3>
    <p class="article-feature-row__desc">贴边自动隐藏，按下快捷键毫秒级滑出，告别繁杂凌乱的桌面图标堆叠，重塑纯净工作流。</p>
    <ul class="article-feature-row__list">
      <li>✦ 贴边智能吸附隐藏，全屏打游戏无打扰</li>
      <li>✦ 分类格子自定义布局，支持大文件拖入即归档</li>
      <li>✦ 纯净原生代码构建，仅占用约 18MB 待机内存</li>
    </ul>
  </div>
</div>`,
  },
  {
    id: 'feature-right-img',
    name: '💻 产品功能：右图左文',
    category: 'product',
    icon: 'LayoutGrid',
    description: '左侧功能亮点说明与清单，右侧软件大图展示',
    snippet: `<div class="article-feature-row article-feature-row--right-img">
  <div class="article-feature-row__content">
    <span class="article-feature-row__tag">深度生产力管家</span>
    <h3 class="article-feature-row__title">无损 C 盘深度搬家，原生提速</h3>
    <p class="article-feature-row__desc">借助 Windows NTFS 系统底层软链接技术，将微信缓存与大型软件透明转移至机械或扩展盘，无需重装。</p>
    <ul class="article-feature-row__list">
      <li>✦ 软件路径透明重定向，原快捷方式与存档完全有效</li>
      <li>✦ 毫秒级空间监控，支持一键安全原路撤销还原</li>
      <li>✦ 智能深度识别大文件、音视频库与工程缓存</li>
    </ul>
  </div>
  <div class="article-feature-row__media">
    <img src="/logo.png" alt="功能演示界面" />
  </div>
</div>`,
  },

  // 2. 多图片画廊展示 (核心新增)
  {
    id: 'img-grid-2',
    name: '🖼️ 软件多图：双列对比/画廊',
    category: 'product',
    icon: 'Columns',
    description: '2列并排大图卡片，适合展示前后对比、深浅色模式或双功能界面',
    snippet: `<div class="article-img-grid article-img-grid--2cols">
  <div class="article-img-card">
    <img src="/logo.png" alt="界面模块 A" />
    <p class="article-img-card__caption">模块 01：深色极客灵动面板</p>
  </div>
  <div class="article-img-card">
    <img src="/logo.png" alt="界面模块 B" />
    <p class="article-img-card__caption">模块 02：清爽浅色全屏工作流</p>
  </div>
</div>`,
  },
  {
    id: 'img-grid-3',
    name: '📸 软件多图：三列特性展示墙',
    category: 'product',
    icon: 'Grid3X3',
    description: '3列横向网格卡片，适合展示多界面联动或三大主打功能',
    snippet: `<div class="article-img-grid article-img-grid--3cols">
  <div class="article-img-card">
    <img src="/logo.png" alt="抽屉收纳" />
    <p class="article-img-card__caption">① 桌面灵动抽屉</p>
  </div>
  <div class="article-img-card">
    <img src="/logo.png" alt="顶部Dock" />
    <p class="article-img-card__caption">② 顶部偷看 Dock</p>
  </div>
  <div class="article-img-card">
    <img src="/logo.png" alt="离线OCR" />
    <p class="article-img-card__caption">③ 离线多语 OCR</p>
  </div>
</div>`,
  },

  // 3. 行业应用方案 (核心新增)
  {
    id: 'industry-scenarios',
    name: '🏢 适用行业与应用场景方案',
    category: 'industry',
    icon: 'Building2',
    description: '3大行业或用户群体解决方案矩阵卡片（电商直播、剪辑设计、企业极客）',
    snippet: `<div class="article-industry-grid">
  <div class="article-industry-card">
    <div class="article-industry-card__icon">🎬</div>
    <h4>直播与电商运营</h4>
    <p>多机位推流与实时监控窗口极简置顶吸附，不挡提词，一键快速切换商品数据控制台。</p>
  </div>
  <div class="article-industry-card">
    <div class="article-industry-card__icon">🎨</div>
    <h4>创意设计与剪辑</h4>
    <p>海量工程素材无损搬离 C 盘，释放固态空间，海量字体和设计工程一键拖拽收纳分组。</p>
  </div>
  <div class="article-industry-card">
    <div class="article-industry-card__icon">💻</div>
    <h4>自媒体与研发极客</h4>
    <p>深度全局热键唤醒，离线快捷截图 OCR 翻译与提取代码，跨多显示器智能吸附排列。</p>
  </div>
</div>`,
  },
  {
    id: 'specs-card',
    name: '⚙️ 软件运行规格与环境卡',
    category: 'industry',
    icon: 'Cpu',
    description: '展示操作系统版本、资源开销、绿色免安装、运行依赖等关键规格',
    snippet: `<div class="article-specs-card">
  <div class="article-specs-card__header">⚙️ 软件技术与系统运行规格</div>
  <div class="article-specs-card__grid">
    <div class="article-specs-card__item"><span>兼容系统</span><strong>Windows 10 / 11 (64位原生)</strong></div>
    <div class="article-specs-card__item"><span>分发形态</span><strong>绿色便携版 / 单文件免安装</strong></div>
    <div class="article-specs-card__item"><span>内存开销</span><strong>日常待机仅占用约 18MB</strong></div>
    <div class="article-specs-card__item"><span>依赖环境</span><strong>内置自包含运行库，无需配环境</strong></div>
  </div>
</div>`,
  },
  {
    id: 'faq',
    name: '❓ 常见问题与解答 FAQ',
    category: 'industry',
    icon: 'HelpCircle',
    description: '解决用户上手疑虑的高频问答卡片（安全机制、安装升级）',
    snippet: `<div class="article-faq-list">
  <div class="article-faq-item">
    <div class="article-faq-item__q">Q: 软件搬移 C 盘大文件后，会对原有程序运行造成异常吗？</div>
    <div class="article-faq-item__a">A: 不会。底层采用 Windows NTFS 系统原生软链接技术，系统与其他程序读取原路径完全透明无感知，随时支持原路撤销。</div>
  </div>
  <div class="article-faq-item">
    <div class="article-faq-item__q">Q: 便携版和安装版有什么区别？如何平滑更新？</div>
    <div class="article-faq-item__a">A: 便携版解压即用、配置随身携带；安装版集成开机自启。内置检测更新通道，新版本增量无损覆盖即可。</div>
  </div>
</div>`,
  },
  {
    id: 'testimonial',
    name: '🌟 行业背书与客户口碑',
    category: 'industry',
    icon: 'Award',
    description: '展示真实客户与行业团队的评价背书，提升转化信任度',
    snippet: `<div class="article-testimonial-grid">
  <div class="article-testimonial-card">
    <p class="article-testimonial-card__quote">“帮我们直播团队的 10 台推流机成功释放了 120GB 的 C 盘空间，桌面悬浮抽屉让主播切换工具丝滑顺畅！”</p>
    <div class="article-testimonial-card__author">
      <div class="article-testimonial-card__avatar">李</div>
      <div><strong>李总</strong> · 杭州某 MCN 机构技术主管</div>
    </div>
  </div>
  <div class="article-testimonial-card">
    <p class="article-testimonial-card__quote">“作为重度桌面洁癖患者，这款软件让我的 4K 宽屏彻底告别了满屏散落的快捷方式，离线 OCR 更是生产力神器。”</p>
    <div class="article-testimonial-card__author">
      <div class="article-testimonial-card__avatar">陈</div>
      <div><strong>陈老师</strong> · 独立设计师 / 少数派作者</div>
    </div>
  </div>
</div>`,
  },

  // 4. 经典微信样式卡片
  {
    id: 'tip',
    name: '💡 效率小技巧',
    category: 'callout',
    icon: 'Sparkles',
    description: '浅金微光卡片，适合标注核心快捷操作或重要提示',
    snippet: `<div class="article-callout article-callout--tip">
  <div class="article-callout__header">💡 核心技巧</div>
  <p>在这里输入本章节的核心要点或效率小技巧，引导读者快速掌握操作准则。</p>
</div>`,
  },
  {
    id: 'warning',
    name: '⚠️ 避坑与注意事项',
    category: 'callout',
    icon: 'AlertTriangle',
    description: '琥珀警告卡片，提醒数据安全与前置备份',
    snippet: `<div class="article-callout article-callout--warning">
  <div class="article-callout__header">⚠️ 避坑指南</div>
  <p>请注意：在此步骤执行前，建议先退出正在运行的相关进程，避免文件占用冲突。</p>
</div>`,
  },
  {
    id: 'info',
    name: '📌 重点速记卡片',
    category: 'callout',
    icon: 'Pin',
    description: '青蓝沉浸卡片，提炼段落结论',
    snippet: `<div class="article-callout article-callout--info">
  <div class="article-callout__header">📌 重点速记</div>
  <p>一句话总结本段落核心价值：无需配置环境变量，双击即享毫秒级响应。</p>
</div>`,
  },
  {
    id: 'quote',
    name: '💬 微信金句引言',
    category: 'quote',
    icon: 'Quote',
    description: '居中大引号杂志风微光卡片，适合提炼产品理念',
    snippet: `<div class="article-quote-card">
  <div class="article-quote-card__mark">“</div>
  <p class="article-quote-card__text">把复杂的底层交互，压缩成一次极简的双击与触达。</p>
  <div class="article-quote-card__author">—— 天才猫团队研发手记</div>
</div>`,
  },
  {
    id: 'steps',
    name: '🔢 3步上手流程',
    category: 'step',
    icon: 'ListOrdered',
    description: '带数字序号徽章的结构化步骤卡片',
    snippet: `<div class="article-step-card">
  <div class="article-step-card__item">
    <span class="article-step-card__num">01</span>
    <div class="article-step-card__body">
      <h4>第一步：快捷唤醒抽屉</h4>
      <p>按下 Alt + Space 快速呼出收纳盒或主界面。</p>
    </div>
  </div>
  <div class="article-step-card__item">
    <span class="article-step-card__num">02</span>
    <div class="article-step-card__body">
      <h4>第二步：归档常用桌面应用</h4>
      <p>将桌面常用快捷方式拖拽至对应分类格子内。</p>
    </div>
  </div>
  <div class="article-step-card__item">
    <span class="article-step-card__num">03</span>
    <div class="article-step-card__body">
      <h4>第三步：享受无干扰纯净视界</h4>
      <p>轻点边缘隐藏把手，开启专注高效工作流。</p>
    </div>
  </div>
</div>`,
  },
  {
    id: 'table',
    name: '📊 对照对比表格',
    category: 'layout',
    icon: 'Table',
    description: '现代深色磨砂数据对照表',
    snippet: `<table class="article-table">
  <thead>
    <tr>
      <th>功能维度</th>
      <th>传统方案</th>
      <th>天才猫 2.0 灵动架构</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>运行依赖</td>
      <td>需单独安装 VC++ 与 .NET</td>
      <td><strong>独立自包含</strong>，纯净免装</td>
    </tr>
    <tr>
      <td>空间搬移</td>
      <td>粗暴移动易导致数据损坏</td>
      <td><strong>NTFS 原生软链接</strong>，原路透明直读</td>
    </tr>
  </tbody>
</table>`,
  },
  {
    id: 'divider',
    name: '🌈 华丽微光分割线',
    category: 'layout',
    icon: 'Minus',
    description: '渐变柔光水平分割线',
    snippet: `<hr class="article-divider" />`,
  },
]
