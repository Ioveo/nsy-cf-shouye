import { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  FolderArchive,
  Plus,
  Upload,
  Edit2,
  Trash2,
  Loader2,
  Save,
  ExternalLink,
} from 'lucide-react'
import { useCatalog } from '@/hooks/use-catalog'
import { api } from '@/lib/api'
// @ts-ignore
import { uploadAssetFile } from '@r2'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'

export function PhotoWallFeature() {
  const queryClient = useQueryClient()
  const { data: catalog, isLoading } = useCatalog()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('了解更多')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoWallList = (catalog as any)?.photoWall || []

  function handleOpenCreate() {
    setEditingItem(null)
    setTitle('')
    setDesc('')
    setImageUrl('')
    setLinkUrl('')
    setLinkText('了解更多')
    setDrawerOpen(true)
  }

  function handleOpenEdit(item: any) {
    setEditingItem(item)
    setTitle(item.title || '')
    setDesc(item.description || '')
    setImageUrl(item.imageUrl || '')
    setLinkUrl(item.linkUrl || '')
    setLinkText(item.linkText || '了解更多')
    setDrawerOpen(true)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const res = await uploadAssetFile(file, { kind: 'image', folder: 'photowall' })
      if (res.success && res.url) {
        setImageUrl(res.url)
        if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ''))
        toast.success('照片上传成功')
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
        id: editingItem?.id || '',
        title: title.trim() || '未命名照片',
        description: desc.trim(),
        imageUrl: imageUrl.trim(),
        linkUrl: linkUrl.trim(),
        linkText: linkText.trim(),
        sortOrder: editingItem?.sortOrder ?? photoWallList.length,
      }
      const res = await api.post('/api/admin/photowall', payload)
      if (res.success) {
        toast.success(editingItem ? '照片信息已更新' : '照片已上墙')
        setDrawerOpen(false)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '保存失败')
      }
    } catch (err: any) {
      toast.error(`保存异常：${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(item: any) {
    if (!confirm(`确定要移除照片「${item.title}」吗？`)) return
    try {
      const res = await api.post('/api/admin/photowall', { action: 'delete', id: item.id })
      if (res.success) {
        toast.success('照片已从照片墙移除')
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '移除失败')
      }
    } catch (err: any) {
      toast.error(`操作异常：${err.message}`)
    }
  }

  return (
    <div className='space-y-6'>
      {/* 头部标题与操作 */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
            <FolderArchive className='size-6 text-primary' />
            <span>照片墙互动展示</span>
          </h1>
          <p className='text-xs text-muted-foreground mt-1'>
            维护官网首页照片墙卡片流，支持标题、配图与自定义外链跳转。
          </p>
        </div>
        <Button onClick={handleOpenCreate} className='gap-2'>
          <Plus className='size-4' />
          <span>添加照片卡片</span>
        </Button>
      </div>

      {/* 骨架屏 / 内容网格 */}
      {isLoading ? (
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
          <div className='h-48 bg-muted/40 animate-pulse rounded-lg' />
          <div className='h-48 bg-muted/40 animate-pulse rounded-lg' />
          <div className='h-48 bg-muted/40 animate-pulse rounded-lg' />
          <div className='h-48 bg-muted/40 animate-pulse rounded-lg' />
        </div>
      ) : photoWallList.length === 0 ? (
        <div className='rounded-lg border border-dashed p-12 text-center'>
          <FolderArchive className='mx-auto size-10 text-muted-foreground/40 mb-3' />
          <h3 className='text-sm font-semibold'>照片墙暂无卡片</h3>
          <p className='text-xs text-muted-foreground mt-1 mb-4'>
            点击右上角添加卡片或上传图片
          </p>
          <Button size='sm' onClick={handleOpenCreate} className='gap-1.5'>
            <Plus className='size-3.5' />
            <span>立即添加</span>
          </Button>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
          {photoWallList.map((item: any) => (
            <div
              key={item.id}
              className='rounded-lg border bg-card overflow-hidden flex flex-col justify-between hover:shadow-md transition-all text-xs'
            >
              <div className='aspect-video w-full bg-muted/40 overflow-hidden relative'>
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className='size-full object-cover'
                  loading='lazy'
                />
              </div>

              <div className='p-3 flex-1 flex flex-col justify-between'>
                <div>
                  <div className='font-semibold text-foreground truncate'>
                    {item.title}
                  </div>
                  {item.description && (
                    <p className='text-muted-foreground line-clamp-2 mt-1 text-[11px]'>
                      {item.description}
                    </p>
                  )}
                </div>

                <div className='mt-3 pt-2 border-t flex items-center justify-between text-muted-foreground'>
                  {item.linkUrl ? (
                    <a
                      href={item.linkUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center gap-1 text-primary text-[11px] hover:underline'
                    >
                      <span>{item.linkText || '跳转链接'}</span>
                      <ExternalLink className='size-3' />
                    </a>
                  ) : (
                    <span className='text-[11px]'>无外链</span>
                  )}

                  <div className='flex items-center gap-0.5'>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='size-7'
                      onClick={() => handleOpenEdit(item)}
                      title='编辑'
                    >
                      <Edit2 className='size-3.5' />
                    </Button>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='size-7 text-destructive'
                      onClick={() => handleDelete(item)}
                      title='删除'
                    >
                      <Trash2 className='size-3.5' />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 照片编辑抽屉 */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className='w-full sm:max-w-md overflow-y-auto'>
          <SheetHeader>
            <SheetTitle>{editingItem ? '编辑照片卡片' : '添加照片卡片'}</SheetTitle>
            <SheetDescription>
              维护照片墙在官网首页的视觉呈现与跳转链接。
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSave} className='space-y-4 py-4 text-xs'>
            <div className='space-y-1.5 p-3 rounded-lg border bg-muted/20'>
              <div className='flex items-center justify-between mb-1'>
                <Label className='text-xs font-semibold'>照片文件</Label>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  className='h-6 text-[11px] gap-1'
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? <Loader2 className='size-3 animate-spin' /> : <Upload className='size-3' />}
                  <span>上传照片</span>
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
              <Label className='text-xs'>卡片标题</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='如：创作者工作流实拍'
                className='h-8 text-xs'
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs'>照片说明</Label>
              <Textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder='卡片下方的说明文字...'
                className='text-xs min-h-[60px]'
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label className='text-xs'>跳转链接 URL</Label>
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder='https://...'
                  className='h-8 text-xs font-mono'
                />
              </div>
              <div className='space-y-1.5'>
                <Label className='text-xs'>跳转文字</Label>
                <Input
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder='如：了解详情'
                  className='h-8 text-xs'
                />
              </div>
            </div>

            <SheetFooter className='pt-2'>
              <Button type='submit' size='sm' disabled={isSaving} className='w-full gap-1.5'>
                {isSaving ? <Loader2 className='size-3.5 animate-spin' /> : <Save className='size-3.5' />}
                <span>{editingItem ? '保存修改' : '确认添加'}</span>
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
