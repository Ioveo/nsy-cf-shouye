import { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Music,
  Plus,
  Play,
  Pause,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Volume2,
  Sparkles,
} from 'lucide-react'
import { useCatalog } from '@/hooks/use-catalog'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrackEditorDialog } from './track-editor-dialog'

export function MusicFeature() {
  const queryClient = useQueryClient()
  const { data: catalog, isLoading } = useCatalog()

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingTrack, setEditingTrack] = useState<any | null>(null)

  // Audition player state
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)

  const musicList = (catalog as any)?.music || []

  function handleOpenCreate() {
    setEditingTrack(null)
    setEditorOpen(true)
  }

  function handleOpenEdit(track: any) {
    setEditingTrack(track)
    setEditorOpen(true)
  }

  // Audition toggle
  function handleTogglePlay(track: any) {
    if (playingTrackId === track.id) {
      if (isPlaying) {
        audioPlayerRef.current?.pause()
        setIsPlaying(false)
      } else {
        audioPlayerRef.current?.play()
        setIsPlaying(true)
      }
      return
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause()
    }

    const audio = new Audio(track.audioUrl)
    audioPlayerRef.current = audio
    setPlayingTrackId(track.id)
    setIsPlaying(true)

    audio.play().catch((err) => {
      toast.error(`试听播放失败：${err.message}`)
      setIsPlaying(false)
    })

    audio.onended = () => {
      setIsPlaying(false)
      setPlayingTrackId(null)
    }
  }

  // Serial reorder
  async function handleMoveMusic(idx: number, direction: 'up' | 'down') {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= musicList.length) return
    const itemA = musicList[idx]
    const itemB = musicList[targetIdx]
    const orderA = itemA.sortOrder ?? idx
    const orderB = itemB.sortOrder ?? targetIdx

    try {
      await api.post('/api/admin/music', { ...itemA, sortOrder: orderB })
      await api.post('/api/admin/music', { ...itemB, sortOrder: orderA })
      toast.success('播放排序已更新')
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    } catch (e: any) {
      toast.error(`更新排序异常：${e.message}`)
    }
  }

  // Delete
  async function handleDelete(track: any) {
    if (!confirm(`确定要删除曲目「${track.title}」吗？`)) return
    if (playingTrackId === track.id && audioPlayerRef.current) {
      audioPlayerRef.current.pause()
      setPlayingTrackId(null)
      setIsPlaying(false)
    }
    try {
      const res = await api.post('/api/admin/music', { action: 'delete', id: track.id })
      if (res.success) {
        toast.success(`曲目「${track.title}」已删除`)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '删除失败')
      }
    } catch (e: any) {
      toast.error(`删除异常：${e.message}`)
    }
  }

  return (
    <div className='space-y-6'>
      {/* 头部标题与操作 */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
            <Music className='size-6 text-primary' />
            <span>音乐频道管理</span>
          </h1>
          <p className='text-xs text-muted-foreground mt-1'>
            维护站点背景音乐与精选原声，支持本地 MP3 上传与网易云无损解析。
          </p>
        </div>
        <Button onClick={handleOpenCreate} className='gap-2'>
          <Plus className='size-4' />
          <span>添加新曲目</span>
        </Button>
      </div>

      {/* 骨架屏 / 曲目列表 */}
      {isLoading ? (
        <div className='space-y-3'>
          <div className='h-12 w-full bg-muted/40 animate-pulse rounded-lg' />
          <div className='h-16 w-full bg-muted/30 animate-pulse rounded-lg' />
          <div className='h-16 w-full bg-muted/30 animate-pulse rounded-lg' />
          <div className='h-16 w-full bg-muted/30 animate-pulse rounded-lg' />
        </div>
      ) : musicList.length === 0 ? (
        <div className='rounded-lg border border-dashed p-12 text-center'>
          <Music className='mx-auto size-10 text-muted-foreground/40 mb-3' />
          <h3 className='text-sm font-semibold'>曲库暂无音轨</h3>
          <p className='text-xs text-muted-foreground mt-1 mb-4'>
            点击右上角添加歌曲或上传首支官方原声带
          </p>
          <Button size='sm' onClick={handleOpenCreate} className='gap-1.5'>
            <Plus className='size-3.5' />
            <span>立即添加</span>
          </Button>
        </div>
      ) : (
        <div className='rounded-lg border bg-card overflow-hidden'>
          <div className='divide-y'>
            {musicList.map((m: any, idx: number) => {
              const isCurrentPlaying = playingTrackId === m.id && isPlaying

              return (
                <div
                  key={m.id || idx}
                  className='p-3.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors text-xs'
                >
                  <div className='flex items-center gap-3 min-w-0 flex-1'>
                    {/* 试听播放按钮 */}
                    <Button
                      size='icon'
                      variant={isCurrentPlaying ? 'default' : 'outline'}
                      className='size-8 shrink-0 rounded-full'
                      onClick={() => handleTogglePlay(m)}
                      title={isCurrentPlaying ? '暂停试听' : '试听音频'}
                    >
                      {isCurrentPlaying ? (
                        <Pause className='size-3.5' />
                      ) : (
                        <Play className='size-3.5 ml-0.5' />
                      )}
                    </Button>

                    {/* 封面或占位图 */}
                    <div className='size-10 rounded-md overflow-hidden bg-muted shrink-0 flex items-center justify-center border'>
                      {m.coverUrl ? (
                        <img
                          src={m.coverUrl}
                          alt={m.title}
                          className='size-full object-cover'
                          loading='lazy'
                        />
                      ) : (
                        <Volume2 className='size-4 text-muted-foreground' />
                      )}
                    </div>

                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        <span className='font-semibold text-foreground truncate'>
                          {m.title}
                        </span>
                        {m.featured && (
                          <Badge variant='outline' className='text-[10px] gap-0.5 border-amber-500/30 text-amber-500'>
                            <Sparkles className='size-2.5' />
                            <span>主推</span>
                          </Badge>
                        )}
                        {m.neteaseId && (
                          <Badge variant='secondary' className='text-[10px]'>
                            网易云
                          </Badge>
                        )}
                      </div>
                      <p className='text-muted-foreground text-[11px] truncate mt-0.5'>
                        {m.artist || '未知艺术家'} {m.album ? `· ${m.album}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* 排序与管理操作 */}
                  <div className='flex items-center gap-1 shrink-0'>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='size-7'
                      disabled={idx === 0}
                      onClick={() => handleMoveMusic(idx, 'up')}
                      title='上移'
                    >
                      <ArrowUp className='size-3.5' />
                    </Button>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='size-7'
                      disabled={idx === musicList.length - 1}
                      onClick={() => handleMoveMusic(idx, 'down')}
                      title='下移'
                    >
                      <ArrowDown className='size-3.5' />
                    </Button>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='size-7'
                      onClick={() => handleOpenEdit(m)}
                      title='编辑'
                    >
                      <Edit2 className='size-3.5' />
                    </Button>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='size-7 text-destructive'
                      onClick={() => handleDelete(m)}
                      title='删除'
                    >
                      <Trash2 className='size-3.5' />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 曲目编辑对话框 */}
      {editorOpen && (
        <TrackEditorDialog
          open={editorOpen}
          track={editingTrack}
          tracksCount={musicList.length}
          onClose={() => setEditorOpen(false)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['catalog'] })}
        />
      )}
    </div>
  )
}
