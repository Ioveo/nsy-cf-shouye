import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  Loader2,
  Upload,
  Save,
  Image as ImageIcon,
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

interface GalleryEditorDialogProps {
  open: boolean
  photo: any | null
  photosCount: number
  onClose: () => void
  onSaved: () => void
}

export function GalleryEditorDialog({
  open,
  photo,
  photosCount,
  onClose,
  onSaved,
}: GalleryEditorDialogProps) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [tags, setTags] = useState('')
  const [featured, setFeatured] = useState(false)
  const [status, setStatus] = useState('published')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    if (photo) {
      setTitle(photo.title || '')
      setDesc(photo.description || '')
      setImageUrl(photo.imageUrl || '')
      setTags(Array.isArray(photo.tags) ? photo.tags.join(', ') : '')
      setFeatured(Boolean(photo.featured))
      setStatus(photo.status || 'published')
    } else {
      setTitle('')
      setDesc('')
      setImageUrl('')
      setTags('')
      setFeatured(false)
      setStatus('published')
    }
  }, [open, photo])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const res = await uploadAssetFile(file, { kind: 'image', folder: 'gallery' })
      if (res.success && res.url) {
        setImageUrl(res.url)
        if (!title.trim()) {
          setTitle(file.name.replace(/\.[^.]+$/, ''))
        }
        toast.success('图片上传成功')
      } else {
        toast.error(res.msg || '上传失败')
      }
    } catch (err: any) {
      toast.error(`上传异常：${err.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!imageUrl.trim()) {
      toast.error('图片地址不能为空')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        id: photo?.id || '',
        title: title.trim() || '未命名图片',
        description: desc.trim(),
        imageUrl: imageUrl.trim(),
        thumbUrl: imageUrl.trim(),
        tags: tags.split(/[,，\s]+/).map((s) => s.trim()).filter(Boolean),
        featured,
        status,
        sortOrder: photo?.sortOrder ?? photosCount,
      }
      const res = await api.post('/api/admin/gallery', payload)
      if (res.success) {
        toast.success('图片已保存')
        onSaved()
        onClose()
      } else {
        toast.error(res.msg || '保存失败')
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
            <ImageIcon className='size-5 text-primary' />
            <span>{photo ? '编辑画廊图片' : '上传画廊图片'}</span>
          </SheetTitle>
          <SheetDescription>
            支持从本地选择原图上传至 R2，并维护标题与分类标签。
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSave} className='space-y-4 py-4 text-xs'>
          <div className='space-y-1.5 p-3 rounded-lg border bg-muted/20'>
            <div className='flex items-center justify-between mb-1'>
              <Label className='text-xs font-semibold'>图片文件</Label>
              <Button
                type='button'
                size='sm'
                variant='outline'
                className='h-6 text-[11px] gap-1'
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? <Loader2 className='size-3 animate-spin' /> : <Upload className='size-3' />}
                <span>从电脑上传</span>
              </Button>
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={handleImageUpload}
              />
            </div>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder='https://.../photo.jpg'
              className='h-8 text-xs font-mono'
              required
            />
            {imageUrl && (
              <div className='mt-2 aspect-video w-full rounded-md overflow-hidden bg-black/40 border'>
                <img src={imageUrl} alt='预览' className='size-full object-contain' />
              </div>
            )}
          </div>

          <div className='space-y-1.5'>
            <Label className='text-xs'>图片标题</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='如：视觉引擎动态流光概念图'
              className='h-8 text-xs'
            />
          </div>

          <div className='space-y-1.5'>
            <Label className='text-xs'>标签 (逗号分隔)</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder='如：毛玻璃, 界面设计, 官方壁纸'
              className='h-8 text-xs'
            />
          </div>

          <div className='space-y-1.5'>
            <Label className='text-xs'>简要介绍</Label>
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder='写点关于这幅作品的灵感...'
              className='text-xs min-h-[60px]'
            />
          </div>

          <div className='flex items-center justify-between p-3 rounded-lg border bg-muted/20'>
            <div className='space-y-0.5'>
              <Label className='text-xs font-medium'>主推作品</Label>
              <p className='text-[11px] text-muted-foreground'>
                开启后将在画廊首屏大图高亮展示
              </p>
            </div>
            <Switch checked={featured} onCheckedChange={setFeatured} />
          </div>

          <SheetFooter className='pt-2'>
            <Button type='submit' size='sm' disabled={isSaving} className='w-full gap-1.5'>
              {isSaving ? <Loader2 className='size-3.5 animate-spin' /> : <Save className='size-3.5' />}
              <span>{photo ? '保存修改' : '确认添加'}</span>
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
