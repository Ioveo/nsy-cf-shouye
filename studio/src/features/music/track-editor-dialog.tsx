import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  Loader2,
  Upload,
  Save,
  Music,
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
  const [lyric, setLyric] = useState('')
  const [neteaseId, setNeteaseId] = useState('')
  const [featured, setFeatured] = useState(false)
  const [status, setStatus] = useState('published')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAudio, setIsUploadingAudio] = useState(false)

  const audioInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    if (track) {
      setTitle(track.title || '')
      setArtist(track.artist || '天才猫')
      setAlbum(track.album || '')
      setAudioUrl(track.audioUrl || '')
      setCoverUrl(track.coverUrl || '')
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
        if (!title.trim()) {
          setTitle(file.name.replace(/\.[^.]+$/, ''))
        }
        toast.success('音频上传成功并已就绪')
      } else {
        toast.error(res.msg || '音频上传失败')
      }
    } catch (err: any) {
      toast.error(`音频上传异常：${err.message}`)
    } finally {
      setIsUploadingAudio(false)
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
      <SheetContent className='w-full sm:max-w-md overflow-y-auto'>
        <SheetHeader>
          <SheetTitle className='flex items-center gap-2'>
            <Music className='size-5 text-primary' />
            <span>{track ? '编辑歌曲' : '添加新曲目'}</span>
          </SheetTitle>
          <SheetDescription>
            支持本地音频直接上传至 R2，或输入网易云音乐 ID 自动绑定。
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSave} className='space-y-4 py-4 text-xs'>
          <div className='space-y-1.5'>
            <Label className='text-xs'>歌曲名称 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='如：Stay with Me'
              className='h-8 text-xs'
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
              <Label className='text-xs'>专辑名称</Label>
              <Input
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                placeholder='如：Official OST'
                className='h-8 text-xs'
              />
            </div>
          </div>

          <div className='space-y-1.5 p-3 rounded-lg border bg-muted/20'>
            <div className='flex items-center justify-between mb-1'>
              <Label className='text-xs font-semibold'>音频文件来源</Label>
              <Button
                type='button'
                size='sm'
                variant='outline'
                className='h-6 text-[11px] gap-1'
                disabled={isUploadingAudio}
                onClick={() => audioInputRef.current?.click()}
              >
                {isUploadingAudio ? <Loader2 className='size-3 animate-spin' /> : <Upload className='size-3' />}
                <span>上传本地音频</span>
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

          <div className='space-y-1.5 p-3 rounded-lg border bg-muted/20'>
            <Label className='text-xs font-semibold'>网易云音乐 ID (快速导入)</Label>
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

          <div className='space-y-1.5'>
            <Label className='text-xs'>封面图片 URL</Label>
            <Input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder='https://.../cover.jpg'
              className='h-8 text-xs font-mono'
            />
          </div>

          <div className='space-y-1.5'>
            <Label className='text-xs'>LRC 歌词 (可选)</Label>
            <Textarea
              value={lyric}
              onChange={(e) => setLyric(e.target.value)}
              placeholder='[00:00.00] 歌词文本...'
              className='text-xs min-h-[80px] font-mono'
            />
          </div>

          <div className='flex items-center justify-between p-3 rounded-lg border bg-muted/20'>
            <div className='space-y-0.5'>
              <Label className='text-xs font-medium'>主推推荐曲目</Label>
              <p className='text-[11px] text-muted-foreground'>
                开启后将在音乐播放器首页高亮呈现
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
