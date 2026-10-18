import { useState, useEffect, useRef } from 'react'
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
  Save,
  RotateCcw,
  ExternalLink,
  Film,
  Disc3,
  Tag,
  Calendar,
  Info,
  Loader2,
} from 'lucide-react'
import { useCatalog } from '@/hooks/use-catalog'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TrackEditorDialog } from './track-editor-dialog'
import { MusicHeroTab } from './music-hero-tab'
import { MusicAlbumsTab } from './music-albums-tab'
import { MusicGenresTab } from './music-genres-tab'
import { MusicToursTab } from './music-tours-tab'
import { MusicAboutTab } from './music-about-tab'
import {
  MusicPortalConfig,
  DEFAULT_MUSIC_PORTAL_CONFIG,
} from './types'

export function MusicFeature() {
  const queryClient = useQueryClient()
  const { data: catalog, isLoading: isCatalogLoading } = useCatalog()

  // 全站 Portal Config 状态
  const [config, setConfig] = useState<MusicPortalConfig>(DEFAULT_MUSIC_PORTAL_CONFIG)
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)
  const [isSavingConfig, setIsSavingConfig] = useState(false)
  const [isRollingBack, setIsRollingBack] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // 单曲曲目编辑状态
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingTrack, setEditingTrack] = useState<any | null>(null)

  // Audition 试听播放器状态
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)

  const musicList = (catalog as any)?.music || []

  // 1. 加载音乐频道配置 (music-portal)
  useEffect(() => {
    let mounted = true
    async function loadPortalConfig() {
      try {
        const res = await api.post('/api/admin/config', { action: 'get', name: 'music-portal' })
        if (mounted && res.success && res.config) {
          setConfig({
            ...DEFAULT_MUSIC_PORTAL_CONFIG,
            ...res.config,
            hero: { ...DEFAULT_MUSIC_PORTAL_CONFIG.hero, ...(res.config.hero || {}) },
            marquee: { ...DEFAULT_MUSIC_PORTAL_CONFIG.marquee, ...(res.config.marquee || {}) },
            manifesto: { ...DEFAULT_MUSIC_PORTAL_CONFIG.manifesto, ...(res.config.manifesto || {}) },
            albums: res.config.albums || DEFAULT_MUSIC_PORTAL_CONFIG.albums,
            genres: res.config.genres || DEFAULT_MUSIC_PORTAL_CONFIG.genres,
            tours: res.config.tours || DEFAULT_MUSIC_PORTAL_CONFIG.tours,
            about: { ...DEFAULT_MUSIC_PORTAL_CONFIG.about, ...(res.config.about || {}) },
            footer: { ...DEFAULT_MUSIC_PORTAL_CONFIG.footer, ...(res.config.footer || {}) },
          })
        }
      } catch (err: any) {
        console.warn('加载音乐频道配置异常，采用预设默认值:', err.message)
      } finally {
        if (mounted) setIsLoadingConfig(false)
      }
    }
    loadPortalConfig()
    return () => {
      mounted = false
      if (audioPlayerRef.current) audioPlayerRef.current.pause()
    }
  }, [])

  // 2. 保存配置至 Cloudflare R2
  async function handleSaveConfig() {
    setIsSavingConfig(true)
    try {
      const res = await api.post('/api/admin/config', {
        action: 'save',
        name: 'music-portal',
        data: config,
      })
      if (res.success) {
        toast.success('音乐频道全站配置已保存至 R2，前台已同步生效！')
        setHasChanges(false)
      } else {
        toast.error(res.msg || '保存配置失败')
      }
    } catch (err: any) {
      toast.error(`保存异常：${err.message}`)
    } finally {
      setIsSavingConfig(false)
    }
  }

  // 3. 回滚至上一版本
  async function handleRollback() {
    if (!confirm('确定要回滚到上一次保存的音乐频道配置吗？')) return
    setIsRollingBack(true)
    try {
      const res = await api.post('/api/admin/config', {
        action: 'rollback',
        name: 'music-portal',
      })
      if (res.success && res.config) {
        setConfig(res.config)
        setHasChanges(false)
        toast.success('已回滚至上一个版本配置')
      } else {
        toast.error(res.msg || '回滚失败')
      }
    } catch (err: any) {
      toast.error(`回滚异常：${err.message}`)
    } finally {
      setIsRollingBack(false)
    }
  }

  function handleConfigChange<K extends keyof MusicPortalConfig>(key: K, val: MusicPortalConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: val }))
    setHasChanges(true)
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

  // Move track order
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

  // Delete track
  async function handleDeleteTrack(track: any) {
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
      {/* 头部标题与全站操作栏 */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
            <Music className='size-6 text-primary' />
            <span>音乐频道控制台 (Cinema Music)</span>
            {hasChanges && (
              <Badge variant='outline' className='text-xs border-amber-500/40 text-amber-500 bg-amber-500/10'>
                有未保存修改
              </Badge>
            )}
          </h1>
          <p className='text-xs text-muted-foreground mt-1'>
            可视化统一管理电影级视听前台 (Hero巨幕、背景视频/图片、专辑管理、流派分类、单曲曲库、巡演日程)。
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => window.open('/music.html', '_blank')}
            className='gap-1.5'
          >
            <ExternalLink className='size-3.5' />
            <span>前台预览</span>
          </Button>
          <Button
            variant='outline'
            size='sm'
            disabled={isRollingBack}
            onClick={handleRollback}
            className='gap-1.5'
            title='回滚至上一个版本配置'
          >
            {isRollingBack ? <Loader2 className='size-3.5 animate-spin' /> : <RotateCcw className='size-3.5' />}
            <span>回滚</span>
          </Button>
          <Button
            size='sm'
            disabled={isSavingConfig}
            onClick={handleSaveConfig}
            className='gap-1.5'
          >
            {isSavingConfig ? <Loader2 className='size-3.5 animate-spin' /> : <Save className='size-3.5' />}
            <span>保存全站配置</span>
          </Button>
        </div>
      </div>

      {/* 多模块标签页控制 */}
      <Tabs defaultValue='hero' className='w-full'>
        <TabsList className='grid grid-cols-3 sm:grid-cols-6 h-auto p-1 bg-muted/50 rounded-xl'>
          <TabsTrigger value='hero' className='gap-1.5 text-xs py-2'>
            <Film className='size-3.5 text-cyan-400' />
            <span>巨幕首屏</span>
          </TabsTrigger>
          <TabsTrigger value='albums' className='gap-1.5 text-xs py-2'>
            <Disc3 className='size-3.5 text-purple-400' />
            <span>专辑管理</span>
          </TabsTrigger>
          <TabsTrigger value='genres' className='gap-1.5 text-xs py-2'>
            <Tag className='size-3.5 text-emerald-400' />
            <span>流派分类</span>
          </TabsTrigger>
          <TabsTrigger value='tracks' className='gap-1.5 text-xs py-2'>
            <Music className='size-3.5 text-amber-400' />
            <span>单曲曲库</span>
          </TabsTrigger>
          <TabsTrigger value='tours' className='gap-1.5 text-xs py-2'>
            <Calendar className='size-3.5 text-rose-400' />
            <span>巡演日程</span>
          </TabsTrigger>
          <TabsTrigger value='about' className='gap-1.5 text-xs py-2'>
            <Info className='size-3.5 text-blue-400' />
            <span>关于与页脚</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: 巨幕首屏 */}
        <TabsContent value='hero' className='pt-4'>
          <MusicHeroTab
            hero={config.hero}
            marquee={config.marquee}
            manifesto={config.manifesto}
            onChangeHero={(next) => handleConfigChange('hero', next)}
            onChangeMarquee={(next) => handleConfigChange('marquee', next)}
            onChangeManifesto={(next) => handleConfigChange('manifesto', next)}
          />
        </TabsContent>

        {/* Tab 2: 专辑管理 */}
        <TabsContent value='albums' className='pt-4'>
          <MusicAlbumsTab
            albums={config.albums}
            onChangeAlbums={(next) => handleConfigChange('albums', next)}
          />
        </TabsContent>

        {/* Tab 3: 流派分类 */}
        <TabsContent value='genres' className='pt-4'>
          <MusicGenresTab
            genres={config.genres}
            onChangeGenres={(next) => handleConfigChange('genres', next)}
          />
        </TabsContent>

        {/* Tab 4: 单曲曲库 */}
        <TabsContent value='tracks' className='pt-4 space-y-4'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
            <div>
              <h3 className='text-base font-semibold flex items-center gap-2'>
                <Music className='size-5 text-amber-400' />
                <span>单曲曲库与实时试听 (Tracklist & Audio Engine)</span>
              </h3>
              <p className='text-xs text-muted-foreground mt-0.5'>
                管理前台曲目列表，支持本地 MP3 上传 R2、网易云解析、舞台短片绑定与 BPM 速度。
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingTrack(null)
                setEditorOpen(true)
              }}
              size='sm'
              className='gap-1.5'
            >
              <Plus className='size-4' />
              <span>添加新歌曲</span>
            </Button>
          </div>

          {isCatalogLoading ? (
            <div className='space-y-2'>
              <div className='h-12 w-full bg-muted/40 animate-pulse rounded-lg' />
              <div className='h-14 w-full bg-muted/30 animate-pulse rounded-lg' />
              <div className='h-14 w-full bg-muted/30 animate-pulse rounded-lg' />
            </div>
          ) : musicList.length === 0 ? (
            <div className='rounded-xl border border-dashed p-10 text-center'>
              <Music className='mx-auto size-10 text-muted-foreground/40 mb-2' />
              <p className='text-xs text-muted-foreground'>曲库暂无音轨，点击右上角添加歌曲或上传官方原声带</p>
            </div>
          ) : (
            <div className='rounded-xl border bg-card overflow-hidden divide-y'>
              {musicList.map((m: any, idx: number) => {
                const isCurrentPlaying = playingTrackId === m.id && isPlaying
                return (
                  <div
                    key={m.id || idx}
                    className='p-3.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors text-xs'
                  >
                    <div className='flex items-center gap-3 min-w-0 flex-1'>
                      {/* 试听播放 */}
                      <Button
                        size='icon'
                        variant={isCurrentPlaying ? 'default' : 'outline'}
                        className='size-8 shrink-0 rounded-full'
                        onClick={() => handleTogglePlay(m)}
                        title={isCurrentPlaying ? '暂停' : '试听'}
                      >
                        {isCurrentPlaying ? <Pause className='size-3.5' /> : <Play className='size-3.5 ml-0.5' />}
                      </Button>

                      {/* 封面 */}
                      <div className='size-10 rounded-md overflow-hidden bg-muted shrink-0 flex items-center justify-center border'>
                        {m.coverUrl ? (
                          <img src={m.coverUrl} alt={m.title} className='size-full object-cover' />
                        ) : (
                          <Volume2 className='size-4 text-muted-foreground' />
                        )}
                      </div>

                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center gap-2'>
                          <span className='font-semibold text-foreground truncate'>{m.title}</span>
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

                    {/* 操作区 */}
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
                        onClick={() => {
                          setEditingTrack(m)
                          setEditorOpen(true)
                        }}
                        title='编辑'
                      >
                        <Edit2 className='size-3.5' />
                      </Button>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='size-7 text-destructive'
                        onClick={() => handleDeleteTrack(m)}
                        title='删除'
                      >
                        <Trash2 className='size-3.5' />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 5: 巡演日程 */}
        <TabsContent value='tours' className='pt-4'>
          <MusicToursTab
            tours={config.tours}
            onChangeTours={(next) => handleConfigChange('tours', next)}
          />
        </TabsContent>

        {/* Tab 6: 关于与页脚 */}
        <TabsContent value='about' className='pt-4'>
          <MusicAboutTab
            about={config.about}
            footer={config.footer}
            onChangeAbout={(next) => handleConfigChange('about', next)}
            onChangeFooter={(next) => handleConfigChange('footer', next)}
          />
        </TabsContent>
      </Tabs>

      {/* 单曲编辑 Sheet */}
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
