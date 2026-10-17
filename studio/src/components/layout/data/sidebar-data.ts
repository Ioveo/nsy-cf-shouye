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
      title: '展示与门户',
      items: [
        {
          title: '落地页配置',
          url: '/landing',
          icon: LayoutTemplate,
        },
        {
          title: '内容与导航',
          url: '/content',
          icon: FileText,
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
