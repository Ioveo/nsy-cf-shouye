import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Music,
  Search,
  Play,
  Pause,
  Check,
  Sparkles,
  Disc3,
  ExternalLink,
} from 'lucide-react'
import { useCatalog } from '@/lib/queries'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface MusicTrack {
  id: string
  title: string
  artist?: string
  album?: string
  audioUrl?: string
  coverUrl?: string
  lyric?: string
  featured?: boolean
  status?: string
}

interface EmbedMusicDialogProps {
  open: boolean
  onClose: () => void
  onInsert: (htmlSnippet: string) => void
}

export function EmbedMusicDialog({
  open,
  onClose,
  onInsert,
}: EmbedMusicDialogProps) {
  const { data: catalog } = useCatalog()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string>('')
  const [styleType, setStyleType] = useState<'capsule' | 'vinyl'>('capsule')

  // Audition playback
  const [auditionId, setAuditionId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const musicList: MusicTrack[] = (catalog as any)?.music || []

  // Stop audition on close
  useEffect(() => {
    if (!open && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      setAuditionId(null)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return musicList
    return musicList.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.artist && m.artist.toLowerCase().includes(q)) ||
        (m.album && m.album.toLowerCase().includes(q))
    )
  }, [musicList, search])

  const selectedTrack = useMemo(() => {
    return musicList.find((m) => m.id === selectedId) || null
  }, [musicList, selectedId])

  function toggleAudition(track: MusicTrack, e: React.MouseEvent) {
    e.stopPropagation()
    if (!track.audioUrl) return

    if (auditionId === track.id) {
      if (isPlaying) {
        audioRef.current?.pause()
        setIsPlaying(false)
      } else {
        audioRef.current?.play()
        setIsPlaying(true)
      }
      return
    }

    if (audioRef.current) {
      audioRef.current.src = track.audioUrl
      audioRef.current.play().then(() => {
        setAuditionId(track.id)
        setIsPlaying(true)
      }).catch(() => {})
    }
  }

  function generateSnippet(track: MusicTrack, style: 'capsule' | 'vinyl') {
    const id = track.id || 'm-' + Date.now()
    const title = track.title
    const artist = track.artist || '天才猫'
    const cover = track.coverUrl || '/logo.png'
    const audioUrl = track.audioUrl || ''

    if (style === 'vinyl') {
      return `\n<div class="article-embed-music article-embed-music--vinyl" data-track-id="${id}">
  <div class="article-embed-music__vinyl-disc">
    <img src="${cover}" alt="${title}" class="article-embed-music__cover" />
    <button type="button" class="article-embed-music__play-btn" aria-label="播放音乐">
      <span class="article-embed-music__play-icon">▶</span>
    </button>
  </div>
  <div class="article-embed-music__main">
    <div class="article-embed-music__title-row">
      <h4 class="article-embed-music__title">${title}</h4>
      <span class="article-embed-music__badge">音乐馆特推</span>
    </div>
    <div class="article-embed-music__sub">
      <span class="article-embed-music__artist">${artist} · ${track.album || '官方单曲'}</span>
      <div class="article-embed-music__wave" aria-hidden="true">
        <span></span><span></span><span></span><span></span>
      </div>
    </div>
  </div>
  <div class="article-embed-music__actions">
    <a href="/music.html" target="_blank" class="article-embed-music__link">音乐馆 ↗</a>
  </div>
  <audio class="article-embed-music__audio" src="${audioUrl}" preload="none"></audio>
</div>\n`
    }

    // Default: WeChat Capsule Bar
    return `\n<div class="article-embed-music" data-track-id="${id}">
  <div class="article-embed-music__cover-wrap">
    <img src="${cover}" alt="${title}" class="article-embed-music__cover" />
    <button type="button" class="article-embed-music__play-btn" aria-label="播放音乐">
      <span class="article-embed-music__play-icon">▶</span>
    </button>
  </div>
  <div class="article-embed-music__main">
    <div class="article-embed-music__title-row">
      <h4 class="article-embed-music__title">${title}</h4>
      <span class="article-embed-music__badge">公众号精选</span>
    </div>
    <div class="article-embed-music__sub">
      <span class="article-embed-music__artist">${artist}</span>
      <div class="article-embed-music__wave" aria-hidden="true">
        <span></span><span></span><span></span><span></span>
      </div>
    </div>
  </div>
  <div class="article-embed-music__actions">
    <a href="/music.html" target="_blank" class="article-embed-music__link">音乐馆 ↗</a>
  </div>
  <audio class="article-embed-music__audio" src="${audioUrl}" preload="none"></audio>
</div>\n`
  }

  function handleConfirm() {
    if (!selectedTrack) return
    const snippet = generateSnippet(selectedTrack, styleType)
    onInsert(snippet)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className='max-w-2xl max-h-[85vh] p-0 flex flex-col overflow-hidden'>
        <DialogHeader className='p-5 border-b border-border bg-muted/20'>
          <DialogTitle className='text-base font-bold flex items-center gap-2'>
            <Music className='size-4 text-primary' />
            <span>引用音乐频道歌曲到正文</span>
          </DialogTitle>
          <DialogDescription className='text-xs'>
            像微信公众号推文一样，在文章中嵌入精选背景音乐卡片，读者点击即可沉浸聆听。
          </DialogDescription>

          <div className='relative mt-3'>
            <Search className='size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='搜索歌曲名称、歌手或所属专辑...'
              className='h-8 pl-8 text-xs bg-background'
            />
          </div>
        </DialogHeader>

        {/* Style Selection Bar */}
        <div className='px-5 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between text-xs'>
          <span className='text-muted-foreground font-medium'>音乐卡片版式：</span>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => setStyleType('capsule')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                styleType === 'capsule'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background hover:bg-muted text-muted-foreground'
              }`}
            >
              微信经典音乐条
            </button>
            <button
              type='button'
              onClick={() => setStyleType('vinyl')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                styleType === 'vinyl'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background hover:bg-muted text-muted-foreground'
              }`}
            >
              黑胶唱片大卡片
            </button>
          </div>
        </div>

        {/* Tracks List */}
        <div className='flex-1 overflow-y-auto p-5'>
          {filtered.length === 0 ? (
            <div className='py-12 text-center text-muted-foreground text-xs space-y-2'>
              <Music className='size-8 mx-auto opacity-40' />
              <p>暂无符合条件的音乐曲目</p>
              <p className='text-[11px] text-muted-foreground/70'>可在左侧侧边栏「音乐库」中上传曲目</p>
            </div>
          ) : (
            <div className='space-y-2'>
              {filtered.map((item) => {
                const isSelected = selectedId === item.id
                const isAuditioning = auditionId === item.id && isPlaying
                const cover = item.coverUrl || '/logo.png'
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    onDoubleClick={() => {
                      setSelectedId(item.id)
                      const snippet = generateSnippet(item, styleType)
                      onInsert(snippet)
                      onClose()
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/30 bg-primary/5 shadow-sm'
                        : 'border-border/70 hover:border-border hover:bg-muted/30'
                    }`}
                  >
                    <div className='flex items-center gap-3 min-w-0'>
                      <div className='relative size-10 rounded-lg overflow-hidden bg-muted/40 shrink-0 group/cover'>
                        <img src={cover} alt={item.title} className='w-full h-full object-cover' />
                        {item.audioUrl && (
                          <button
                            type='button'
                            onClick={(e) => toggleAudition(item, e)}
                            className='absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity'
                            title={isAuditioning ? '暂停试听' : '点击试听'}
                          >
                            {isAuditioning ? <Pause className='size-4' /> : <Play className='size-4 fill-white' />}
                          </button>
                        )}
                      </div>
                      <div className='min-w-0'>
                        <div className='flex items-center gap-2'>
                          <strong className='text-xs font-semibold text-foreground truncate'>
                            {item.title}
                          </strong>
                          {item.featured && (
                            <Badge variant='secondary' className='text-[10px] px-1.5 py-0 text-amber-500'>
                              精选
                            </Badge>
                          )}
                        </div>
                        <p className='text-[11px] text-muted-foreground truncate mt-0.5'>
                          {item.artist || '天才猫'} {item.album ? `· ${item.album}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center gap-2 shrink-0'>
                      {isSelected ? (
                        <div className='size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow'>
                          <Check className='size-3.5 stroke-[3]' />
                        </div>
                      ) : (
                        <span className='text-[11px] text-muted-foreground'>点击选中</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Hidden Audio for Audition */}
        <audio
          ref={audioRef}
          onEnded={() => {
            setIsPlaying(false)
            setAuditionId(null)
          }}
          className='hidden'
        />

        {/* Footer */}
        <div className='p-4 border-t border-border bg-muted/10 flex items-center justify-between'>
          <div className='text-xs text-muted-foreground truncate max-w-sm'>
            {selectedTrack ? (
              <span className='text-foreground font-medium flex items-center gap-1.5'>
                <Sparkles className='size-3.5 text-primary' />
                已选：{selectedTrack.title} - {selectedTrack.artist || '天才猫'}
              </span>
            ) : (
              '请选择一首歌曲，可点击封面试听，双击直接插入'
            )}
          </div>
          <div className='flex items-center gap-2'>
            <Button type='button' variant='outline' size='sm' onClick={onClose} className='h-8 text-xs'>
              取消
            </Button>
            <Button
              type='button'
              size='sm'
              disabled={!selectedTrack}
              onClick={handleConfirm}
              className='h-8 text-xs gap-1.5'
            >
              <Check className='size-3.5' />
              <span>插入音乐卡片</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
