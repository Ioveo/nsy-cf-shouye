import { Radio, Mic, Moon, ShoppingBag, Sparkles } from 'lucide-react'
import type { PlaylistItem } from '@/lib/queries'

export type { PlaylistItem }

export interface SceneMeta {
  key: PlaylistItem['scene']
  label: string
  icon: any
  color: string
}

export const SCENES: SceneMeta[] = [
  { key: 'live', label: '直播暖场', icon: Radio, color: '#EF4444' },
  { key: 'soundcheck', label: '试音调音', icon: Mic, color: '#3B82F6' },
  { key: 'night', label: '沉浸夜聊', icon: Moon, color: '#8B5CF6' },
  { key: 'sales', label: '爆单带货', icon: ShoppingBag, color: '#F59E0B' },
  { key: 'other', label: '其它场景', icon: Sparkles, color: '#06B6D4' },
]

export function getSceneMeta(sceneKey: string): SceneMeta {
  return SCENES.find((s) => s.key === sceneKey) || SCENES[4]
}
