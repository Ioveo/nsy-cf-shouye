import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  Loader2,
  Upload,
  Save,
  Music,
  Video,
  ImageIcon,
  Sparkles,
} from 'lucide-react'
import { api } from '@/lib/api'
// @ts-ignore
import { uploadAssetFile } from '@r2'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { PRESET_VIDEOS } from './types'

interface TrackEditorDialogProps {
  open: boolean
  track: any | null
  tracksCount: number
  onClose: () => void
  onSaved: () => void
}

export function TrackEditorDialog({
  open,
  track,
  tracksCount,
  onClose,
  onSaved,
}: TrackEditorDialogProps) {
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('天才猫')
  const [album, setAlbum] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [tag, setTag] = useState('SYNTHWAVE')
  const [bpm, setBpm] = useState('102')
  const [accentColor, setAccentColor] = useState('#57e6ff')
  const [lyric, setLyric] = useState('')
  const [neteaseId, setNeteaseId] = useState('')
  const [featured, setFeatured] = useState(false)
  const [status, setStatus] = useState('published')

  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAudio, setIsUploadingAudio] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)

  const audioInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    if (track) {
      setTitle(track.title || '')
      setArtist(track.artist || '天才猫')
      setAlbum(track.album || '')
      setAudioUrl(track.audioUrl || '')
      setCoverUrl(track.coverUrl || '')
      setVideoUrl(track.videoUrl || track.videoKey || '')
      setTag(Array.isArray(track.tags) ? track.tags[0] || 'SYNTHWAVE' : track.tags || 'SYNTHWAVE')
      setBpm(String(track.bpm || '102'))
      setAccentColor(track.accentColor || '#57e6ff')
      setLyric(track.lyric || '')
      setNeteaseId(track.neteaseId || '')
      setFeatured(Boolean(track.featured))
      setStatus(track.status || 'published')
    } else {
      setTitle('')
      setArtist('天才猫')
      setAlbum('')
      setAudioUrl('')
      setCoverUrl('')
      setVideoUrl('')
      setTag('SYNTHWAVE')
      setBpm('102')
      setAccentColor('#57e6ff')
      setLyric('')
      setNeteaseId('')
      setFeatured(false)
      setStatus('published')
    }
  }, [open, track])

  async function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingAudio(true)
    try {
      const res = await uploadAssetFile(file, { kind: 'audio', folder: 'music' })
      if (res.success && res.url) {
        setAudioUrl(res.url)
        if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ''))
        toast.success('音频上传成功并已就绪')
      } else {
        toast.error(res.msg || '音频上传失败')
      }
    } catch (err: any) {
      toast.error(`音频上传异常：${err.message}`)
    } finally {
      setIsUploadingAudio(false)
      if (audioInputRef.current) audioInputRef.current.value = ''
    }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingCover(true)
    try {
      const res = await uploadAssetFile(file, { kind: 'image', folder: 'music' })
      if (res.success && res.url) {
        setCoverUrl(res.url)
        toast.success('封面图上传成功！')
      } else {
        toast.error(res.msg || '封面上传失败')
      }
    } catch (err: any) {
      toast.error(`封面上传异常：${err.message}`)
    } finally {
      setIsUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingVideo(true)
    try {
      const res = await uploadAssetFile(file, { kind: 'video', folder: 'music' })
      if (res.success && res.url) {
        setVideoUrl(res.url)
        toast.success('舞台视频短片上传成功！')
      } else {
        toast.error(res.msg || '视频上传失败')
      }
    } catch (err: any) {
      toast.error(`视频上传异常：${err.message}`)
    } finally {
      setIsUploadingVideo(false)
      if (videoInputRef.current) videoInputRef.current.value = ''
    }
  }

  function handleResolveNetease() {
    if (!neteaseId.trim()) return
    const url = `/api/music/netease?id=${neteaseId.trim()}`
    setAudioUrl(url)
    toast.success(`已配置网易云解析接口: ${url}`)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('请填写歌曲名称')
      return
    }
    if (!audioUrl.trim() && !neteaseId.trim()) {
      toast.error('请提供音频文件 URL 或网易云 ID')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        id: track?.id || '',
        title: title.trim(),
        artist: artist.trim() || '天才猫',
        album: album.trim(),
        audioUrl: audioUrl.trim(),
        coverUrl: coverUrl.trim(),
        videoUrl: videoUrl.trim(),
        tags: tag.trim() ? [tag.trim().toUpperCase()] : [],
        bpm: Number(bpm) || 102,
        accentColor: accentColor.trim() || '#57e6ff',
        lyric: lyric.trim(),
        neteaseId: neteaseId.trim(),
        featured,
        status,
        sortOrder: track?.sortOrder ?? tracksCount,
      }
      const res = await api.post('/api/admin/music', payload)
      if (res.success) {
        toast.success(track ? '曲目已更新' : '歌曲已添加')
        onSaved()
        onClose()
      } else {
        toast.error(res.msg || '保存音乐失败')
      }
    } catch (err: any) {
      toast.error(`保存异常：${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent className='w-full sm:max-w-lg overflow-y-auto'>
        <SheetHeader>
          <SheetTitle className='flex items-center gap-2'>
            <Music className='size-5 text-primary' />
            <span>{track ? '编辑歌曲' : '添加新曲目'}</span>
          </SheetTitle>
          <SheetDescription>
            支持本地音频与短片上传至 R2，设置视听舞台联动效果。
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSave} className='space-y-4 py-4 text-xs'>
          <div className='space-y-1.5'>
            <Label className='text-xs'>歌曲名称 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='如：Stay with Me'
              className='h-8 text-xs font-semibold'
              required
            />
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1.5'>
              <Label className='text-xs'>艺术家 / 歌手</Label>
              <Input
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder='如：天才猫'
                className='h-8 text-xs'
              />
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs'>所属专辑</Label>
              <Input
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                placeholder='如：Official OST'
                className='h-8 text-xs'
              />
            </div>
          </div>

          {/* 音频文件来源 */}
          <div className='space-y-1.5 p-3 rounded-lg border bg-muted/20'>
            <div className='flex items-center justify-between mb-1'>
              <Label className='text-xs font-semibold'>音频文件来源 (MP3 / FLAC / WAV) *</Label>
              <Button
                type='button'
                size='sm'
                variant='outline'
                className='h-6 text-[11px] gap-1'
                disabled={isUploadingAudio}
                onClick={() => audioInputRef.current?.click()}
              >
                {isUploadingAudio ? <Loader2 className='size-3 animate-spin' /> : <Upload className='size-3' />}
                <span>上传本地音频至 R2</span>
              </Button>
              <input
                ref={audioInputRef}
                type='file'
                accept='audio/*'
                className='hidden'
                onChange={handleAudioUpload}
              />
            </div>
            <Input
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              placeholder='https://.../music.mp3'
              className='h-8 text-xs font-mono'
            />
          </div>

          {/* 网易云快速导入 */}
          <div className='space-y-1.5 p-3 rounded-lg border bg-muted/20'>
            <Label className='text-xs font-semibold'>网易云音乐 ID (免上传快捷解析)</Label>
            <div className='flex gap-2 mt-1'>
              <Input
                value={neteaseId}
                onChange={(e) => setNeteaseId(e.target.value)}
                placeholder='例如：186016'
                className='h-8 text-xs font-mono'
              />
              <Button
                type='button'
                size='sm'
                variant='secondary'
                className='h-8 text-xs whitespace-nowrap'
                onClick={handleResolveNetease}
              >
                解析生成
              </Button>
            </div>
          </div>

          {/* 舞台联动短片设置 */}
          <div className='space-y-2 p-3 rounded-lg border bg-muted/20'>
            <div className='flex items-center justify-between'>
              <Label className='text-xs font-semibold flex items-center gap-1.5'>
                <Video className='size-3.5 text-cyan-400' />
                <span>右侧粘性视听舞台视频 (Companion Stage Video)</span>
              </Label>
              <Button
                type='button'
                size='sm'
                variant='outline'
                disabled={isUploadingVideo}
                onClick={() => videoInputRef.current?.click()}
                className='h-6 text-[11px] gap-1'
              >
                {isUploadingVideo ? <Loader2 className='size-3 animate-spin' /> : <Upload className='size-3' />}
                <span>上传短片至 R2</span>
              </Button>
              <input
                ref={videoInputRef}
                type='file'
                accept='video/mp4,video/webm'
                className='hidden'
                onChange={handleVideoUpload}
              />
            </div>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder='视频 URL 或选择下方预设短片'
              className='h-8 text-xs font-mono'
            />
            {/* 快速选择官方预设电影级短片 */}
            <div className='flex flex-wrap gap-1 pt-1'>
              {PRESET_VIDEOS.slice(0, 5).map((pv) => (
                <button
                  key={pv.label}
                  type='button'
                  onClick={() => setVideoUrl(pv.url)}
                  className='text-[10px] bg-background border px-2 py-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground'
                >
                  {pv.label}
                </button>
              ))}
            </div>
          </div>

          {/* 风格 Tag、BPM、强调色 */}
          <div className='grid grid-cols-3 gap-3'>
            <div className='space-y-1'>
              <Label className='text-xs'>流派标签 (TAG)</Label>
              <Input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder='如：SYNTHWAVE'
                className='h-8 text-xs uppercase font-mono'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>速度 (BPM)</Label>
              <Input
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                placeholder='如：102'
                className='h-8 text-xs font-mono'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>频谱强调色</Label>
              <div className='flex items-center gap-1.5'>
                <input
                  type='color'
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className='size-8 p-0 rounded border cursor-pointer shrink-0'
                />
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className='h-8 text-xs font-mono'
                />
              </div>
            </div>
          </div>

          {/* 封面图 */}
          <div className='space-y-1.5'>
            <div className='flex items-center justify-between'>
              <Label className='text-xs'>封面图片 URL</Label>
              <Button
                type='button'
                size='sm'
                variant='outline'
                disabled={isUploadingCover}
                onClick={() => coverInputRef.current?.click()}
                className='h-6 text-[11px] gap-1'
              >
                {isUploadingCover ? <Loader2 className='size-3 animate-spin' /> : <Upload className='size-3' />}
                <span>上传封面至 R2</span>
              </Button>
              <input
                ref={coverInputRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={handleCoverUpload}
              />
            </div>
            <Input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder='https://.../cover.jpg'
              className='h-8 text-xs font-mono'
            />
          </div>

          {/* 歌词 */}
          <div className='space-y-1.5'>
            <Label className='text-xs'>LRC 歌词 (可选)</Label>
            <Textarea
              value={lyric}
              onChange={(e) => setLyric(e.target.value)}
              placeholder='[00:00.00] 歌词文本...'
              className='text-xs min-h-[60px] font-mono'
            />
          </div>

          {/* 主推推荐 */}
          <div className='flex items-center justify-between p-3 rounded-lg border bg-muted/20'>
            <div className='space-y-0.5'>
              <Label className='text-xs font-medium'>主推推荐曲目</Label>
              <p className='text-[11px] text-muted-foreground'>
                开启后将在音乐频道与排行榜优先高亮呈现
              </p>
            </div>
            <Switch checked={featured} onCheckedChange={setFeatured} />
          </div>

          <SheetFooter className='pt-2'>
            <Button type='submit' size='sm' disabled={isSaving} className='w-full gap-1.5'>
              {isSaving ? <Loader2 className='size-3.5 animate-spin' /> : <Save className='size-3.5' />}
              <span>{track ? '保存修改' : '确认添加'}</span>
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
