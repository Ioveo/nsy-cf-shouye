import { useState, useRef } from 'react'
import { toast } from 'sonner'
import {
  Disc3,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Loader2,
  Save,
  ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
// @ts-ignore
import { uploadAssetFile } from '@r2'
import { MusicAlbumItem } from './types'

interface MusicAlbumsTabProps {
  albums: MusicAlbumItem[]
  onChangeAlbums: (next: MusicAlbumItem[]) => void
}

export function MusicAlbumsTab({ albums, onChangeAlbums }: MusicAlbumsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState<MusicAlbumItem | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [year, setYear] = useState('')
  const [color1, setColor1] = useState('#57e6ff')
  const [color2, setColor2] = useState('#a855f7')
  const [coverUrl, setCoverUrl] = useState('')
  const [trackIdsText, setTrackIdsText] = useState('')
  const [isUploadingCover, setIsUploadingCover] = useState(false)

  const coverInputRef = useRef<HTMLInputElement>(null)

  function handleOpenCreate() {
    setEditingAlbum(null)
    setName('')
    setNameEn('')
    setYear('2026 · EP')
    setColor1('#57e6ff')
    setColor2('#a855f7')
    setCoverUrl('')
    setTrackIdsText('')
    setDialogOpen(true)
  }

  function handleOpenEdit(album: MusicAlbumItem) {
    setEditingAlbum(album)
    setName(album.name || '')
    setNameEn(album.nameEn || '')
    setYear(album.year || '')
    setColor1(album.color1 || '#57e6ff')
    setColor2(album.color2 || '#a855f7')
    setCoverUrl(album.coverUrl || '')
    setTrackIdsText((album.trackIds || []).join(', '))
    setDialogOpen(true)
  }

  function handleDelete(album: MusicAlbumItem) {
    if (!confirm(`确定要删除专辑「${album.name}」吗？`)) return
    onChangeAlbums(albums.filter((a) => a.id !== album.id))
    toast.success(`专辑「${album.name}」已移除`)
  }

  function handleMove(idx: number, direction: 'up' | 'down') {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= albums.length) return
    const next = [...albums]
    const temp = next[idx]
    next[idx] = next[targetIdx]
    next[targetIdx] = temp
    onChangeAlbums(next)
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingCover(true)
    try {
      const res = await uploadAssetFile(file, { kind: 'image', folder: 'music' })
      if (res.success && res.url) {
        setCoverUrl(res.url)
        toast.success('专辑封面上传成功！')
      } else {
        toast.error(res.msg || '封面上传失败')
      }
    } catch (err: any) {
      toast.error(`上传异常：${err.message}`)
    } finally {
      setIsUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('请填写专辑名称')
      return
    }

    const parsedTrackIds = trackIdsText
      .split(/[,，\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (Number.isNaN(Number(s)) ? s : Number(s)))

    const newItem: MusicAlbumItem = {
      id: editingAlbum?.id || `alb_${Date.now()}`,
      name: name.trim(),
      nameEn: nameEn.trim(),
      year: year.trim() || '2026',
      color1: color1.trim() || '#57e6ff',
      color2: color2.trim() || '#a855f7',
      coverUrl: coverUrl.trim(),
      trackIds: parsedTrackIds,
    }

    if (editingAlbum) {
      onChangeAlbums(albums.map((a) => (a.id === editingAlbum.id ? newItem : a)))
      toast.success(`专辑「${newItem.name}」已更新`)
    } else {
      onChangeAlbums([...albums, newItem])
      toast.success(`新专辑「${newItem.name}」已添加`)
    }
    setDialogOpen(false)
  }

  return (
    <div className='space-y-5'>
      {/* 头部说明与添加 */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <div>
          <h3 className='text-base font-semibold flex items-center gap-2'>
            <Disc3 className='size-5 text-purple-400' />
            <span>精选录音室专辑 (Discography)</span>
          </h3>
          <p className='text-xs text-muted-foreground mt-0.5'>
            前台第 5 模块展示的专辑卡片矩阵，支持配置双色渐变强调、封面图与曲目关联。
          </p>
        </div>
        <Button onClick={handleOpenCreate} size='sm' className='gap-1.5'>
          <Plus className='size-4' />
          <span>添加新专辑</span>
        </Button>
      </div>

      {/* 专辑卡片网格 */}
      {albums.length === 0 ? (
        <div className='rounded-xl border border-dashed p-10 text-center'>
          <Disc3 className='mx-auto size-10 text-muted-foreground/40 mb-2' />
          <p className='text-xs text-muted-foreground'>暂无专辑配置，点击上方按钮添加第一张专辑</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {albums.map((a, idx) => (
            <div
              key={a.id}
              className='rounded-xl border bg-card p-4 space-y-3 relative overflow-hidden group hover:shadow-md transition-shadow'
            >
              {/* 渐变装饰条 */}
              <div
                className='h-2 rounded-full w-full'
                style={{
                  background: `linear-gradient(90deg, ${a.color1 || '#57e6ff'}, ${a.color2 || '#a855f7'})`,
                }}
              />

              <div className='flex gap-3 items-center'>
                {/* 封面缩略图 */}
                <div
                  className='size-14 rounded-lg border overflow-hidden shrink-0 flex items-center justify-center'
                  style={{
                    background: a.coverUrl
                      ? undefined
                      : `linear-gradient(135deg, ${a.color1}33, ${a.color2}66)`,
                  }}
                >
                  {a.coverUrl ? (
                    <img src={a.coverUrl} alt={a.name} className='size-full object-cover' />
                  ) : (
                    <Disc3 className='size-6 text-foreground/40' />
                  )}
                </div>

                <div className='min-w-0 flex-1'>
                  <div className='font-bold text-sm truncate'>{a.name}</div>
                  <div className='text-xs text-muted-foreground font-mono truncate'>
                    {a.nameEn || 'ALBUM'}
                  </div>
                  <div className='text-[10px] text-cyan-400 font-medium mt-0.5'>{a.year}</div>
                </div>
              </div>

              {/* 曲目统计与色值 */}
              <div className='flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t'>
                <span>关联 {(a.trackIds || []).length} 支曲目</span>
                <div className='flex items-center gap-1 font-mono text-[10px]'>
                  <span className='size-2.5 rounded-full' style={{ background: a.color1 }} />
                  <span className='size-2.5 rounded-full' style={{ background: a.color2 }} />
                </div>
              </div>

              {/* 操作区 */}
              <div className='flex items-center justify-end gap-1 pt-1'>
                <Button
                  size='icon'
                  variant='ghost'
                  className='size-6'
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, 'up')}
                  title='前移'
                >
                  <ArrowUp className='size-3' />
                </Button>
                <Button
                  size='icon'
                  variant='ghost'
                  className='size-6'
                  disabled={idx === albums.length - 1}
                  onClick={() => handleMove(idx, 'down')}
                  title='后移'
                >
                  <ArrowDown className='size-3' />
                </Button>
                <Button
                  size='icon'
                  variant='ghost'
                  className='size-6'
                  onClick={() => handleOpenEdit(a)}
                  title='编辑'
                >
                  <Edit2 className='size-3' />
                </Button>
                <Button
                  size='icon'
                  variant='ghost'
                  className='size-6 text-destructive'
                  onClick={() => handleDelete(a)}
                  title='删除'
                >
                  <Trash2 className='size-3' />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 专辑编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Disc3 className='size-5 text-purple-400' />
              <span>{editingAlbum ? '编辑专辑' : '添加新专辑'}</span>
            </DialogTitle>
            <DialogDescription>
              设置专辑的双色渐变、中英文名称与封面。
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className='space-y-4 py-2 text-xs'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label className='text-xs'>专辑中文名 *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='如：霓虹雨夜'
                  className='h-8 text-xs font-semibold'
                  required
                />
              </div>
              <div className='space-y-1.5'>
                <Label className='text-xs'>专辑英文名</Label>
                <Input
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder='如：NEON RAIN'
                  className='h-8 text-xs font-mono'
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label className='text-xs'>发行年份 / 规格</Label>
                <Input
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder='如：2026 · EP'
                  className='h-8 text-xs'
                />
              </div>
              <div className='space-y-1.5'>
                <Label className='text-xs'>关联曲目序号 (逗号隔开)</Label>
                <Input
                  value={trackIdsText}
                  onChange={(e) => setTrackIdsText(e.target.value)}
                  placeholder='如：0, 4, 13'
                  className='h-8 text-xs font-mono'
                />
              </div>
            </div>

            {/* 渐变强调色设置 */}
            <div className='space-y-2 p-3 rounded-lg border bg-muted/20'>
              <div className='flex items-center justify-between'>
                <Label className='text-xs font-semibold'>专辑双色渐变 (Accent Gradient)</Label>
                <div
                  className='h-5 w-24 rounded-full border shadow-xs'
                  style={{ background: `linear-gradient(90deg, ${color1}, ${color2})` }}
                />
              </div>
              <div className='grid grid-cols-2 gap-3 pt-1'>
                <div className='flex items-center gap-2'>
                  <input
                    type='color'
                    value={color1}
                    onChange={(e) => setColor1(e.target.value)}
                    className='size-8 p-0 rounded border cursor-pointer shrink-0'
                  />
                  <Input
                    value={color1}
                    onChange={(e) => setColor1(e.target.value)}
                    className='h-8 text-xs font-mono'
                  />
                </div>
                <div className='flex items-center gap-2'>
                  <input
                    type='color'
                    value={color2}
                    onChange={(e) => setColor2(e.target.value)}
                    className='size-8 p-0 rounded border cursor-pointer shrink-0'
                  />
                  <Input
                    value={color2}
                    onChange={(e) => setColor2(e.target.value)}
                    className='h-8 text-xs font-mono'
                  />
                </div>
              </div>
            </div>

            {/* 封面图设置与上传 */}
            <div className='space-y-1.5'>
              <div className='flex items-center justify-between'>
                <Label className='text-xs'>封面图片 URL (可选)</Label>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  disabled={isUploadingCover}
                  onClick={() => coverInputRef.current?.click()}
                  className='h-6 text-[11px] gap-1'
                >
                  {isUploadingCover ? (
                    <Loader2 className='size-3 animate-spin' />
                  ) : (
                    <Upload className='size-3' />
                  )}
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

            <DialogFooter className='pt-2'>
              <Button type='submit' size='sm' className='gap-1.5 w-full'>
                <Save className='size-3.5' />
                <span>{editingAlbum ? '保存专辑修改' : '确认添加专辑'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
