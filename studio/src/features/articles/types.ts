export interface ArticlesHeroConfig {
  eyebrow: string
  title: string
  highlight: string
  lede: string
  ctaPrimaryText: string
  ctaPrimaryHref: string
  ctaSecondaryText: string
  ctaSecondaryHref: string
  mediaType: 'video' | 'image'
  mediaUrl: string
  badgeText: string
  floatCard: {
    tag: string
    title: string
    subtitle: string
    reads: string
  }
  stats: Array<{ value: string; label: string }>
}

export interface ArticlesBentoItem {
  tag: string
  title: string
  author: string
  reads: string
  mediaType?: 'video' | 'image'
  mediaUrl?: string
  color1?: string
  color2?: string
  articleIndex?: number
}

export interface ArticlesBentoConfig {
  title: string
  subtitle: string
  picks: ArticlesBentoItem[]
}

export interface ArticlesCinemaSlide {
  videoUrl: string
  watermark: string
  tag: string
  title: string
  desc: string
  articleIndex?: number
}

export interface ArticlesCinemaConfig {
  title: string
  subtitle: string
  slides: ArticlesCinemaSlide[]
}

export interface ArticlesWireItem {
  title: string
  tag: string
  time: string
  articleIndex?: number
}

export interface ArticlesWireConfig {
  title: string
  subtitle: string
  items: ArticlesWireItem[]
}

export interface ArticlesTrendingItem {
  rank: string
  title: string
  tag: string
  reads: string
  color1?: string
  articleIndex?: number
}

export interface ArticlesTrendingConfig {
  title: string
  subtitle: string
  items: ArticlesTrendingItem[]
}

export interface ArticlesAuthorItem {
  name: string
  role: string
  color: string
  bio: string
  count: string
}

export interface ArticlesAuthorsConfig {
  title: string
  subtitle: string
  items: ArticlesAuthorItem[]
}

export interface ArticlesGraphConfig {
  title: string
  subtitle: string
  eyebrow: string
  headline: string
  desc: string
}

export interface ArticlesNewsletterConfig {
  title: string
  subtitle: string
  placeholder: string
  buttonText: string
}

export interface ArticlesFooterLink {
  label: string
  href: string
}

export interface ArticlesFooterColumn {
  title: string
  links: ArticlesFooterLink[]
}

export interface ArticlesFooterConfig {
  brandDesc: string
  columns: ArticlesFooterColumn[]
  copyright: string
}

export interface ArticlesPortalConfig {
  brand: {
    logo: string
    issue: string
  }
  hero: ArticlesHeroConfig
  bento: ArticlesBentoConfig
  cinema: ArticlesCinemaConfig
  theWire: ArticlesWireConfig
  trending: ArticlesTrendingConfig
  authors: ArticlesAuthorsConfig
  knowledgeGraph: ArticlesGraphConfig
  newsletter: ArticlesNewsletterConfig
  footer: ArticlesFooterConfig
}

export const DEFAULT_ARTICLES_PORTAL_CONFIG: ArticlesPortalConfig = {
  brand: {
    logo: '白卷',
    issue: 'VOL.1',
  },
  hero: {
    eyebrow: '本期特稿 · FEATURED',
    title: '用眼睛\n读',
    highlight: '世界',
    lede: '十五位撰稿人，十五个现场。从霓虹雨夜到云海日出——白卷把远方折成可以翻阅的形状。',
    ctaPrimaryText: '开始阅读 →',
    ctaPrimaryHref: '#sec-picks',
    ctaSecondaryText: '浏览全部',
    ctaSecondaryHref: '#sec-grid',
    mediaType: 'video',
    mediaUrl: 'https://muse.ai/files/1331075203424773/1432998841610842/xq500iv9v5g5t769vpxqq7gw/noir.mp4',
    badgeText: '本期\n特稿',
    floatCard: {
      tag: '城市',
      title: '霓虹雨夜',
      subtitle: 'Neon Noir · 陈默',
      reads: '▶ 12.8万',
    },
    stats: [
      { value: '15', label: '深度特稿' },
      { value: '06', label: '驻站作者' },
      { value: '32万', label: '本月读者' },
    ],
  },
  bento: {
    title: '编辑精选',
    subtitle: "EDITORS' PICKS",
    picks: [
      {
        tag: '城市',
        title: '霓虹雨夜',
        author: '陈默',
        reads: '12.8万',
        mediaType: 'video',
        mediaUrl: 'https://muse.ai/files/1331075203424773/1432998841610842/xq500iv9v5g5t769vpxqq7gw/noir.mp4',
        articleIndex: 0,
      },
      {
        tag: '自然',
        title: '火山口',
        author: '顾晓',
        reads: '15.2万',
        color1: '#ff5c38',
        color2: '#ff9a5c',
        articleIndex: 3,
      },
      {
        tag: '文化',
        title: '樱落时分',
        author: '林晚',
        reads: '18.9万',
        color1: '#e86a9a',
        color2: '#ffd3e0',
        articleIndex: 7,
      },
      {
        tag: '文化',
        title: '龙',
        author: '陈默',
        reads: '10.2万',
        color1: '#1fae62',
        color2: '#a9f0c9',
        articleIndex: 12,
      },
    ],
  },
  cinema: {
    title: '影像特稿',
    subtitle: 'FILM STORIES',
    slides: [
      {
        videoUrl: 'https://muse.ai/files/1331075203424773/1432998841610842/xq500iv9v5g5t769vpxqq7gw/noir.mp4',
        watermark: 'NEON',
        tag: '城市 · 特稿',
        title: '霓虹雨夜',
        desc: '雨把城市洗成一块巨大的霓虹底片。我们在凌晨三点的便利店门口，读懂了不夜城的语法。',
        articleIndex: 0,
      },
      {
        videoUrl: 'https://muse.ai/files/1331075203424773/1496429802541049/32ptj5b41589vx3gqksl88my/volcano.mp4',
        watermark: 'CRATER',
        tag: '自然 · 特稿',
        title: '火山口',
        desc: '站在火山口边缘往下看，看到的是大地的心脏——一颗跳动了四十亿年的心脏。',
        articleIndex: 3,
      },
      {
        videoUrl: 'https://muse.ai/files/1331075203424773/4033096033492611/kxyw991u5ma9zpmr4mryf34f/cloudsea.mp4',
        watermark: 'SUNRISE',
        tag: '旅行 · 特稿',
        title: '云海日出',
        desc: '凌晨四点登顶，在云海之上等一场日出。当第一缕金光刺破云层，值得所有的夜行。',
        articleIndex: 11,
      },
    ],
  },
  theWire: {
    title: '24 小时',
    subtitle: 'THE WIRE',
    items: [
      { title: '霓虹雨夜入选本月最佳特稿', tag: '城市', time: '2 小时前', articleIndex: 0 },
      { title: '樱落时分》印刷版加印第三次', tag: '文化', time: '5 小时前', articleIndex: 7 },
      { title: '云海日出摄影展周末开展', tag: '旅行', time: '8 小时前', articleIndex: 11 },
      { title: '火山口科考队发回最新影像', tag: '自然', time: '12 小时前', articleIndex: 3 },
      { title: '虚空》获年度哲学图书提名', tag: '哲学', time: '1 天前', articleIndex: 13 },
    ],
  },
  trending: {
    title: '热榜',
    subtitle: 'TRENDING',
    items: [
      { rank: '01', title: '樱落时分', tag: '文化', reads: '18.9万', color1: '#e86a9a', articleIndex: 7 },
      { rank: '02', title: '火山口', tag: '自然', reads: '15.2万', color1: '#ff5c38', articleIndex: 3 },
      { rank: '03', title: '霓虹雨夜', tag: '城市', reads: '12.8万', color1: '#3b5bff', articleIndex: 0 },
      { rank: '04', title: '云海日出', tag: '旅行', reads: '3.8万', color1: '#e8a83d', articleIndex: 11 },
      { rank: '05', title: '龙', tag: '文化', reads: '10.2万', color1: '#1fae62', articleIndex: 12 },
    ],
  },
  authors: {
    title: '驻站作者',
    subtitle: 'AUTHORS',
    items: [
      { name: '陈默', role: '特稿记者', color: '#d97857', bio: '把远方折成可以翻阅的形状，常年行走在城市与荒野之间。', count: '3 篇特稿' },
      { name: '林晚', role: '自然撰稿', color: '#5da87a', bio: '相信每一片叶子都有名字，山野是她永远的编辑部。', count: '2 篇特稿' },
      { name: '沈括', role: '科学编辑', color: '#527fd4', bio: '把论文翻译成人话，让宇宙变得可以触摸。', count: '3 篇特稿' },
      { name: '顾晓', role: '文化评论', color: '#a263a7', bio: '在传统与潮流之间摆渡，打捞时间的碎片。', count: '3 篇特稿' },
      { name: '江离', role: '旅行作家', color: '#e8a33d', bio: '一年有两百天在路上，剩下的一百天在写路上的事。', count: '2 篇特稿' },
      { name: '陆深', role: '专栏作者', color: '#7a4ff0', bio: '关心"无"与"有"之间的一切，哲学是他的望远镜。', count: '2 篇特稿' },
    ],
  },
  knowledgeGraph: {
    title: '知识网络',
    subtitle: 'KNOWLEDGE GRAPH',
    eyebrow: '知识网络 / KNOWLEDGE GRAPH',
    headline: '每一篇特稿，都是网络上的一个节点。',
    desc: '十五个现场，十大主题。从任意一篇出发，沿着这条粉色的线，走到下一篇——阅读在这里有了方向。',
  },
  newsletter: {
    title: '每周一封，把世界折好寄给你。',
    subtitle: '订阅白卷周刊 · 每周五早上 8 点 · 5 分钟读完',
    placeholder: '你的邮箱地址',
    buttonText: '订阅',
  },
  footer: {
    brandDesc: '用眼睛读的杂志。十五位撰稿人，十五个现场，每周五更新。',
    columns: [
      {
        title: '栏目',
        links: [
          { label: '旅行', href: '#sec-grid' },
          { label: '自然', href: "#sec-grid" },
          { label: '文化', href: '#sec-grid' },
          { label: '科学', href: '#sec-grid' },
        ],
      },
      {
        title: '关于',
        links: [
          { label: '关于天才猫', href: '/' },
          { label: '软件下载', href: '/download.html' },
          { label: '音乐频道', href: '/music.html' },
          { label: '授权服务', href: '/license.html' },
        ],
      },
      {
        title: '关注',
        links: [
          { label: '微信公众号', href: 'https://weixin.qq.com' },
          { label: '小红书', href: 'https://xiaohongshu.com' },
          { label: 'Bilibili', href: 'https://bilibili.com' },
          { label: 'RSS 订阅', href: '/api/catalog' },
        ],
      },
    ],
    copyright: '© 2026 白卷 WHITE FOLIO · 天才猫文章专栏',
  },
}
