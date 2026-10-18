import { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Disc3,
  Plus,
  RotateCcw,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Music,
  Radio,
  Play,
  Volume2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCatalog } from '@/hooks/use-catalog'
import { useConfig, type PlaylistsConfig, type PlaylistItem } from '@/lib/queries'
import { api } from '@/lib/api'
import { SCENES, getSceneMeta } from './types'
import { PlaylistCoverCollage } from './playlist-cover-collage'
import { PlaylistDrawer } from './playlist-drawer'

export function PlaylistsFeature() {
  const queryClient = useQueryClient()
  const { data: config, isLoading } = useConfig<PlaylistsConfig>('playlists')
  const { data: catalog } = useCatalog()

  const [activeSceneTab, setActiveSceneTab] = useState<string>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingPlaylist, setEditingPlaylist] = useState<PlaylistItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isRollingBack, setIsRollingBack] = useState(false)

  const items = useMemo(() => config?.items || [], [config])
  const catalogTracks = useMemo(() => (catalog as any)?.music || [], [catalog])

  const filteredItems = useMemo(() => {
    if (activeSceneTab === 'all') return items
    return items.filter((p) => p.scene === activeSceneTab)
  }, [items, activeSceneTab])

  function handleCreate() {
    setEditingPlaylist(null)
    setDrawerOpen(true)
  }

  function handleEdit(item: PlaylistItem) {
    setEditingPlaylist(item)
    setDrawerOpen(true)
  }

  async function handleSavePlaylist(item: PlaylistItem) {
    setIsSaving(true)
    try {
      let nextItems: PlaylistItem[]
      const existsIndex = items.findIndex((p) => p.id === item.id)
      if (existsIndex >= 0) {
        nextItems = [...items]
        nextItems[existsIndex] = item
      } else {
        nextItems = [...items, item]
      }

      // Re-assign order
      nextItems.forEach((p, idx) => {
        p.order = (idx + 1) * 10
      })

      const res = await api.post('/api/admin/config', {
        action: 'save',
        name: 'playlists',
        data: { items: nextItems },
      })

      toast.success('歌单已保存')
      queryClient.setQueryData(['config', 'playlists'], res.config)
      setDrawerOpen(false)
    } catch (err: any) {
      toast.error(`保存失败：${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(item: PlaylistItem) {
    if (!confirm(`确定要删除歌单「${item.title}」吗？`)) return
    try {
      const nextItems = items.filter((p) => p.id !== item.id)
      const res = await api.post('/api/admin/config', {
        action: 'save',
        name: 'playlists',
        data: { items: nextItems },
      })
      toast.success(`歌单「${item.title}」已删除`)
      queryClient.setQueryData(['config', 'playlists'], res.config)
    } catch (err: any) {
      toast.error(`删除失败：${err.message}`)
    }
  }

  async function handleMove(idx: number, direction: 'up' | 'down') {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= items.length) return

    const nextItems = [...items]
    const temp = nextItems[idx]
    nextItems[idx] = nextItems[targetIdx]
    nextItems[targetIdx] = temp

    nextItems.forEach((p, i) => {
      p.order = (i + 1) * 10
    })

    try {
      const res = await api.post('/api/admin/config', {
        action: 'save',
        name: 'playlists',
        data: { items: nextItems },
      })
      toast.success('歌单排序已保存')
      queryClient.setQueryData(['config', 'playlists'], res.config)
    } catch (err: any) {
      toast.error(`排序更新异常：${err.message}`)
    }
  }

  async function handleRollback() {
    if (!confirm('确定要恢复到上一版本歌单配置吗？')) return
    setIsRollingBack(true)
    try {
      const res = await api.post('/api/admin/config', {
        action: 'rollback',
        name: 'playlists',
      })
      toast.success('已恢复到上一版本')
      queryClient.setQueryData(['config', 'playlists'], res.config)
    } catch (err: any) {
      toast.error(`恢复失败：${err.message}`)
    } finally {
      setIsRollingBack(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">音乐歌单管理</h1>
            <Badge variant="outline" className="text-xs">
              Phase 4
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            编排前台音乐场景频道与推荐歌单，关联曲库中的音频
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRollback}
            disabled={isRollingBack}
            className="gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            恢复上一版
          </Button>
          <Button size="sm" onClick={handleCreate} className="gap-1.5">
            <Plus className="w-4 h-4" />
            新建歌单
          </Button>
        </div>
      </div>

      {/* Scene Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveSceneTab('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            activeSceneTab === 'all'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/40 hover:bg-muted text-muted-foreground'
          }`}
        >
          全部歌单 ({items.length})
        </button>
        {SCENES.map((sc) => {
          const count = items.filter((p) => p.scene === sc.key).length
          const Icon = sc.icon
          const isSelected = activeSceneTab === sc.key
          return (
            <button
              key={sc.key}
              type="button"
              onClick={() => setActiveSceneTab(sc.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/40 hover:bg-muted text-muted-foreground'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{sc.label}</span>
              <span className="opacity-70 text-[10px]">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Playlists Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-xl border bg-muted/20 animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border rounded-xl bg-card text-center">
          <Disc3 className="w-12 h-12 text-muted-foreground/40 mb-3 animate-spin duration-3000" />
          <h3 className="text-base font-semibold">暂无歌单</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            点击右上角「新建歌单」为直播、试音、夜聊或带货创建场景频道与曲目编排。
          </p>
          <Button size="sm" onClick={handleCreate} className="mt-4 gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            立即创建歌单
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const globalIndex = items.findIndex((p) => p.id === item.id)
            const sceneMeta = getSceneMeta(item.scene)
            const SceneIcon = sceneMeta.icon

            return (
              <div
                key={item.id}
                className="group flex flex-col justify-between border rounded-xl overflow-hidden bg-card transition-all hover:border-primary/40 hover:shadow-lg"
              >
                <div>
                  {/* Cover */}
                  <div className="relative">
                    <PlaylistCoverCollage
                      coverUrl={item.cover}
                      trackIds={item.trackIds}
                      catalogTracks={catalogTracks}
                      className="w-full h-44"
                    />

                    {/* Overlay Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                      <Badge
                        variant="secondary"
                        className="text-[11px] font-medium gap-1 bg-black/60 backdrop-blur-md text-white border-0"
                      >
                        <SceneIcon className="w-3 h-3" style={{ color: sceneMeta.color }} />
                        {sceneMeta.label}
                      </Badge>
                      {item.featured && (
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          Hero 主推
                        </Badge>
                      )}
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      {item.status === 'published' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/90 text-white shadow-sm">
                          已发布
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-600/90 text-white shadow-sm">
                          草稿
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[11px] font-mono flex items-center gap-1">
                      <Music className="w-3 h-3 text-cyan-400" />
                      {item.trackIds?.length || 0} 首曲目
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-base tracking-tight truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                      {item.description || '暂无详细描述'}
                    </p>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-4 py-3 bg-muted/20 border-t flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      disabled={globalIndex === 0}
                      onClick={() => handleMove(globalIndex, 'up')}
                      title="上移"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      disabled={globalIndex === items.length - 1}
                      onClick={() => handleMove(globalIndex, 'down')}
                      title="下移"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-xs gap-1"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit2 className="w-3 h-3" />
                      编辑
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                      onClick={() => handleDelete(item)}
                      title="删除歌单"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Editor Drawer */}
      <PlaylistDrawer
        open={drawerOpen}
        playlist={editingPlaylist}
        catalogTracks={catalogTracks}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSavePlaylist}
        isSaving={isSaving}
      />
    </div>
  )
}
