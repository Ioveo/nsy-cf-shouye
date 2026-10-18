export interface MusicHeroConfig {
  chip: string
  title: string
  titleEn: string
  subtitle: string
  ctaPrimaryText: string
  ctaPrimaryHref: string
  ctaSecondaryText: string
  ctaSecondaryHref: string
  mediaType: 'video' | 'image'
  mediaUrl: string
  nowPlayingTitle: string
  nowPlayingSub: string
  stickerText: string
  stats: Array<{ label: string; value: string }>
}

export interface MusicMarqueeConfig {
  text: string
}

export interface MusicManifestoConfig {
  show: boolean
  chip: string
  badge: string
  title: string
  highlight: string
  description: string
  stats: Array<{ label: string; value: string }>
}

export interface MusicAlbumItem {
  id: string
  name: string
  nameEn: string
  year: string
  color1: string
  color2: string
  coverUrl: string
  trackIds: (number | string)[]
}

export interface MusicGenreItem {
  id: string
  name: string
  nameEn: string
  color: string
  tags: string[]
}

export interface MusicTourItem {
  id: string
  date: string
  city: string
  venue: string
  status: 'hot' | 'sold' | 'soon'
  statusLabel: string
}

export interface MusicAboutConfig {
  title: string
  text1: string
  text2: string
  stats: Array<{ label: string; value: string }>
}

export interface MusicFooterConfig {
  title: string
  subtitle: string
  subscribeText: string
  subscribeHref: string
  replayText: string
  socialLinks: Array<{ label: string; href: string }>
  copyright: string
}

export interface MusicPortalConfig {
  hero: MusicHeroConfig
  marquee: MusicMarqueeConfig
  manifesto: MusicManifestoConfig
  albums: MusicAlbumItem[]
  genres: MusicGenreItem[]
  tours: MusicTourItem[]
  about: MusicAboutConfig
  footer: MusicFooterConfig
}

export const DEFAULT_MUSIC_PORTAL_CONFIG: MusicPortalConfig = {
  hero: {
    chip: 'NEW ALBUM · 新专辑上线',
    title: '白夜',
    titleEn: 'FIFTEEN REALMS',
    subtitle: '十五首曲子，十五个世界。\n一张用眼睛听的电子专辑。',
    ctaPrimaryText: '播放专辑',
    ctaPrimaryHref: '#tracks',
    ctaSecondaryText: '巡演日程',
    ctaSecondaryHref: '#tour',
    mediaType: 'video',
    mediaUrl: 'https://muse.ai/files/1331075203424773/1432998841610842/xq500iv9v5g5t769vpxqq7gw/noir.mp4',
    nowPlayingTitle: '霓虹雨夜',
    nowPlayingSub: 'Neon Rain · 主打单曲',
    stickerText: '15\nTRACKS',
    stats: [
      { label: '曲目 TRACKS', value: '15' },
      { label: '专辑 ALBUMS', value: '04' },
      { label: '巡演 SHOWS', value: '40+' },
    ],
  },
  marquee: {
    text: '十五境 FIFTEEN REALMS ◆ 白夜 WHITE NIGHT ◆',
  },
  manifesto: {
    show: true,
    chip: 'MANIFESTO · 宣言',
    badge: 'NEW\nALBUM',
    title: '十五首曲子，',
    highlight: '十五个世界。',
    description: '从霓虹雨夜到云海日出，从深海到星云——这是一张用眼睛听的专辑。每一个画面，都是一段旋律的形状。',
    stats: [
      { label: '曲目 TRACKS', value: '15' },
      { label: '世界 WORLDS', value: '15' },
      { label: '分钟 MINUTES', value: '76' },
    ],
  },
  albums: [
    { id: 'alb_1', name: '霓虹雨夜', nameEn: 'NEON RAIN', year: '2026 · EP', color1: '#57e6ff', color2: '#a855f7', coverUrl: '', trackIds: [0, 4, 13] },
    { id: 'alb_2', name: '万物有声', nameEn: 'WILD', year: '2025', color1: '#4ade80', color2: '#bfe3ff', coverUrl: '', trackIds: [2, 9, 10, 11] },
    { id: 'alb_3', name: '东方既白', nameEn: 'ORIENT', year: '2024', color1: '#3ddc84', color2: '#f0a840', coverUrl: '', trackIds: [12, 7, 6, 8] },
    { id: 'alb_4', name: '深渊', nameEn: 'ABYSS', year: '2023', color1: '#3d7bff', color2: '#8a7cff', coverUrl: '', trackIds: [5, 1, 3, 14] },
  ],
  genres: [
    { id: 'gen_1', name: '电子舞曲', nameEn: 'ELECTRONIC', color: '#a855f7', tags: ['INDUSTRIAL', 'DARK TECHNO', 'LIQUID DNB', 'UPLIFTING'] },
    { id: 'gen_2', name: '环境氛围', nameEn: 'AMBIENT', color: '#4ade80', tags: ['AMBIENT', 'DEEP AMBIENT', 'DOWNTEMPO'] },
    { id: 'gen_3', name: '合成器浪潮', nameEn: 'SYNTHWAVE', color: '#57e6ff', tags: ['SYNTHWAVE', 'EPIC'] },
    { id: 'gen_4', name: '世界融合', nameEn: 'WORLD', color: '#f0a840', tags: ['WORLD', 'FOLKTRONICA'] },
    { id: 'gen_5', name: '电影管弦', nameEn: 'CINEMATIC', color: '#bfe3ff', tags: ['CINEMATIC', 'ORCHESTRAL'] },
    { id: 'gen_6', name: '独立流行', nameEn: 'INDIE', color: '#ff8fb3', tags: ['LO-FI', 'ART POP'] },
  ],
  tours: [
    { id: 'tour_1', date: '2026.11.08', city: '上海', venue: 'Modern Sky Lab', status: 'hot', statusLabel: '余票' },
    { id: 'tour_2', date: '2026.11.15', city: '北京', venue: '愚公移山', status: 'hot', statusLabel: '余票' },
    { id: 'tour_3', date: '2026.11.22', city: '深圳', venue: 'B10 Live', status: 'sold', statusLabel: '售罄' },
    { id: 'tour_4', date: '2026.11.29', city: '成都', venue: '正火艺术中心', status: 'soon', statusLabel: '待售' },
    { id: 'tour_5', date: '2026.12.06', city: '杭州', venue: '酒球会', status: 'soon', statusLabel: '待售' },
  ],
  about: {
    title: '关于白夜',
    text1: '白夜，电子音乐制作人。以电影感的氛围电子见长，作品游走于合成器浪潮、环境音乐与东方意象之间。',
    text2: '《十五境》是她的第三张录音室专辑——十五首曲子，十五个自然与梦境。从霓虹雨夜的合成器，到云海日出的弦乐，每一轨都配有一部视觉短片。',
    stats: [
      { label: '录音室专辑', value: '3' },
      { label: '单曲', value: '27' },
      { label: '巡演场次', value: '40+' },
    ],
  },
  footer: {
    title: '在云海之上\n听见日出。',
    subtitle: '订阅获取新专辑、巡演预售与未公开曲目',
    subscribeText: '订阅邮件',
    subscribeHref: '#',
    replayText: '重听专辑',
    socialLinks: [
      { label: '网易云音乐', href: 'https://music.163.com' },
      { label: 'QQ 音乐', href: 'https://y.qq.com' },
      { label: 'Spotify', href: 'https://spotify.com' },
      { label: 'Apple Music', href: 'https://music.apple.com' },
      { label: 'Bilibili', href: 'https://bilibili.com' },
    ],
    copyright: '© 2026 白夜 WHITE NIGHT · 天才猫音乐频道',
  },
}

export const PRESET_VIDEOS = [
  { label: '霓虹雨夜 (Noir)', url: 'https://muse.ai/files/1331075203424773/1432998841610842/xq500iv9v5g5t769vpxqq7gw/noir.mp4' },
  { label: '星云漫游 (Nebula)', url: 'https://muse.ai/files/1331075203424773/1111954698096282/l0gspntqz6w0a5cvml3sxe7e/nebula.mp4' },
  { label: '极光幕 (Aurora)', url: 'https://muse.ai/files/1331075203424773/4652450651659595/n7ovqqi2larx76i5lpywaogj/aurora.mp4' },
  { label: '熔岩之心 (Volcano)', url: 'https://muse.ai/files/1331075203424773/1496429802541049/32ptj5b41589vx3gqksl88my/volcano.mp4' },
  { label: '风暴潮 (Storm)', url: 'https://muse.ai/files/1331075203424773/1088652230742754/h6ly755g5wexjub0femjdphe/storm.mp4' },
  { label: '深渊 (Deepsea)', url: 'https://muse.ai/files/1331075203424773/1846872469843698/ka99z5x3vs32micm76g3cg1y/deepsea.mp4' },
  { label: '云海日出 (Cloudsea)', url: 'https://muse.ai/files/1331075203424773/4033096033492611/kxyw991u5ma9zpmr4mryf34f/cloudsea.mp4' },
  { label: '龙升 (Dragon)', url: 'https://muse.ai/files/1331075203424773/2009118896428863/tke42k321webkvmq91h16h5z/dragon.mp4' },
]
