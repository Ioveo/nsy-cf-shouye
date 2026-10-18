import {
  LayoutDashboard,
  Layers,
  Boxes,
  Zap,
  LayoutTemplate,
  FileText,
  FolderArchive,
  ShieldCheck,
  Terminal,
  Music,
  Image,
  Sliders,
  Compass,
  Sparkles,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: '天才猫管理员',
    email: 'admin@nsyoo.com',
    avatar: '',
  },
  teams: [
    {
      name: '天才猫 Studio',
      logo: Terminal,
      plan: 'v2.0 Console',
    },
  ],
  navGroups: [
    {
      title: '核心管理',
      items: [
        {
          title: '仪表盘',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: '软件管理',
          url: '/software',
          icon: Layers,
        },
        {
          title: '版本管理',
          url: '/releases',
          icon: Boxes,
        },
        {
          title: '在线热更',
          url: '/hotupdate',
          icon: Zap,
        },
      ],
    },
    {
      title: '内容模块',
      items: [
        {
          title: '文章管理',
          url: '/content/articles',
          icon: FileText,
        },
        {
          title: '音乐频道',
          url: '/content/music',
          icon: Music,
        },
        {
          title: '画廊相册',
          url: '/content/gallery',
          icon: Image,
        },
        {
          title: '照片墙',
          url: '/content/photo-wall',
          icon: FolderArchive,
        },
      ],
    },
    {
      title: '站点与展示',
      items: [
        {
          title: '软件中心配置',
          url: '/site/software-center',
          icon: Sliders,
        },
        {
          title: '推广位管理',
          url: '/site/promotions',
          icon: Sparkles,
        },
        {
          title: '落地页配置',
          url: '/landing',
          icon: LayoutTemplate,
        },
        {
          title: '首页轮播',
          url: '/site/carousel',
          icon: Sliders,
        },
        {
          title: '顶部导航',
          url: '/site/navigation',
          icon: Compass,
        },
        {
          title: '资源库',
          url: '/assets',
          icon: FolderArchive,
        },
      ],
    },
    {
      title: '系统',
      items: [
        {
          title: '系统与健康',
          url: '/system',
          icon: ShieldCheck,
        },
      ],
    },
  ],
}
