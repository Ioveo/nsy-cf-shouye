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
  category: 'callout' | 'quote' | 'step' | 'layout'
  icon: string
  description: string
  snippet: string
}

export const WECHAT_TEMPLATES: WechatTemplate[] = [
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
