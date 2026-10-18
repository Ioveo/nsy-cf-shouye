import { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Sliders,
  Plus,
  Upload,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  Save,
  Sparkles,
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

export function CarouselFeature() {
  const queryClient = useQueryClient()
  const { data: catalog, isLoading } = useCatalog()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState<any | null>(null)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const carouselList = (catalog as any)?.siteCarousel || []

  function handleOpenCreate() {
    setEditingSlide(null)
    setTitle('')
    setDesc('')
    setImageUrl('')
    setSuggestion('')
    setDrawerOpen(true)
  }

  function handleOpenEdit(slide: any) {
    setEditingSlide(slide)
    setTitle(slide.title || '')
    setDesc(slide.description || '')
    setImageUrl(slide.imageUrl || '')
    setSuggestion(slide.suggestion || '')
    setDrawerOpen(true)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const res = await uploadAssetFile(file, { kind: 'image', folder: 'carousel' })
      if (res.success && res.url) {
        setImageUrl(res.url)
        if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ''))
        toast.success('轮播图上传成功')
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
      toast.error('轮播图片地址不能为空')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        id: editingSlide?.id || '',
        title: title.trim(),
        description: desc.trim(),
        imageUrl: imageUrl.trim(),
        suggestion: suggestion.trim(),
        sortOrder: editingSlide?.sortOrder ?? carouselList.length,
      }
      const res = await api.post('/api/admin/site-carousel', payload)
      if (res.success) {
        toast.success(editingSlide ? '轮播已更新' : '轮播已添加')
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

  async function handleMove(idx: number, direction: 'up' | 'down') {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= carouselList.length) return
    const itemA = carouselList[idx]
    const itemB = carouselList[targetIdx]
    const orderA = itemA.sortOrder ?? idx
    const orderB = itemB.sortOrder ?? targetIdx

    try {
      await api.post('/api/admin/site-carousel', { ...itemA, sortOrder: orderB })
      await api.post('/api/admin/site-carousel', { ...itemB, sortOrder: orderA })
      toast.success('轮播排序已更新')
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    } catch (e: any) {
      toast.error(`更新排序异常：${e.message}`)
    }
  }

  async function handleDelete(item: any) {
    if (!confirm(`确定要删除轮播项「${item.title || '此项'}」吗？`)) return
    try {
      const res = await api.post('/api/admin/site-carousel', { action: 'delete', id: item.id })
      if (res.success) {
        toast.success('轮播项已删除')
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '删除失败')
      }
    } catch (err: any) {
      toast.error(`删除异常：${err.message}`)
    }
  }

  const [isMigrating, setIsMigrating] = useState(false)

  async function handleMigrateToPromotions() {
    if (carouselList.length === 0) {
      toast.info('当前没有旧版轮播图需要迁移')
      return
    }
    if (!confirm(`确定将现有的 ${carouselList.length} 条首页轮播图迁移为统一推广位（portal）吗？\n迁移后旧数据将完整保留。`)) return

    setIsMigrating(true)
    try {
      const promoRes = await api.post('/api/admin/config', { action: 'get', name: 'promotions' })
      const existingItems: any[] = promoRes.config?.items || []

      let addedCount = 0
      const nextItems = [...existingItems]

      carouselList.forEach((slide: any, idx: number) => {
        const promoId = `promo_migrated_${slide.id || idx}`
        const alreadyExists = nextItems.some((p: any) => p.id === promoId)
        if (!alreadyExists) {
          nextItems.push({
            id: promoId,
            placements: ['portal'],
            entity: { type: 'custom', id: slide.id || `custom_${idx}` },
            override: {
              title: slide.title || '首页推荐',
              subtitle: slide.description || '',
              image: slide.imageUrl || '',
              ctaText: '立即查看',
              ctaHref: slide.suggestion || '/',
            },
            badge: '官方推荐',
            startAt: 0,
            endAt: 0,
            status: slide.status === 'disabled' ? 'paused' : 'active',
            order: (slide.sortOrder ?? idx) * 10,
          })
          addedCount++
        }
      })

      if (addedCount === 0) {
        toast.info('现有轮播图此前已全部迁移过，无需重复添加')
        return
      }

      await api.post('/api/admin/config', {
        action: 'save',
        name: 'promotions',
        data: { items: nextItems }
      })
      queryClient.invalidateQueries({ queryKey: ['config', 'promotions'] })
      toast.success(`成功迁移 ${addedCount} 条轮播图到统一推广位（投放位置：portal）`)
    } catch (err: any) {
      toast.error(`迁移异常：${err.message}`)
    } finally {
      setIsMigrating(false)
    }
  }

  return (
    <div className='space-y-6'>
      {/* 头部标题与操作 */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
            <Sliders className='size-6 text-primary' />
            <span>首页巨幕轮播管理</span>
          </h1>
          <p className='text-xs text-muted-foreground mt-1'>
            配置官网首页顶部的轮播大图、引导副标题与跳转操作。
          </p>
        </div>
        <Button onClick={handleOpenCreate} className='gap-2'>
          <Plus className='size-4' />
          <span>添加轮播大图</span>
        </Button>
      </div>

      {/* 迁移到统一推广位提示条 */}
      <div className='p-4 rounded-xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <div className='flex items-start gap-3'>
          <Sparkles className='size-5 text-primary shrink-0 mt-0.5' />
          <div className='space-y-1 text-xs'>
            <div className='font-semibold text-sm text-foreground flex items-center gap-2'>
              <span>首页轮播升级为「统一推广位」</span>
              <span className='px-1.5 py-0.5 rounded text-[10px] bg-primary/20 text-primary font-mono'>v4 推荐</span>
            </div>
            <p className='text-muted-foreground'>
              门户首页（portal）现已支持实时读取统一推广位。点击一键迁移，可将当前轮播图转为自定义推广位，原有数据保留不删。
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2 shrink-0 self-end sm:self-center'>
          <Button
            size='sm'
            variant='outline'
            className='gap-1.5 text-xs'
            onClick={() => window.location.href = '/studio/site/promotions'}
          >
            推广位管理
          </Button>
          <Button
            size='sm'
            className='gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground'
            onClick={handleMigrateToPromotions}
            disabled={isMigrating}
          >
            {isMigrating ? <Loader2 className='size-3.5 animate-spin' /> : <Sparkles className='size-3.5' />}
            <span>一键迁移到推广位</span>
          </Button>
        </div>
      </div>

      {/* 骨架屏 / 轮播项列表 */}
      {isLoading ? (
        <div className='space-y-3'>
          <div className='h-24 w-full bg-muted/40 animate-pulse rounded-lg' />
          <div className='h-24 w-full bg-muted/30 animate-pulse rounded-lg' />
          <div className='h-24 w-full bg-muted/30 animate-pulse rounded-lg' />
        </div>
      ) : carouselList.length === 0 ? (
        <div className='rounded-lg border border-dashed p-12 text-center'>
          <Sliders className='mx-auto size-10 text-muted-foreground/40 mb-3' />
          <h3 className='text-sm font-semibold'>暂无轮播幻灯片</h3>
          <p className='text-xs text-muted-foreground mt-1 mb-4'>
            点击右上角添加首张首页全宽宣传图
          </p>
          <Button size='sm' onClick={handleOpenCreate} className='gap-1.5'>
            <Plus className='size-3.5' />
            <span>立即添加</span>
          </Button>
        </div>
      ) : (
        <div className='space-y-3'>
          {carouselList.map((item: any, idx: number) => (
            <div
              key={item.id}
              className='p-3.5 rounded-lg border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors text-xs'
            >
              <div className='flex items-center gap-3.5 min-w-0 flex-1'>
                <div className='w-28 h-16 rounded-md bg-muted overflow-hidden shrink-0 border'>
                  <img src={item.imageUrl} alt={item.title} className='size-full object-cover' />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='font-semibold text-foreground text-sm truncate'>
                    {item.title || '未命名幻灯片'}
                  </div>
                  {item.description && (
                    <p className='text-muted-foreground line-clamp-1 mt-0.5 text-xs'>
                      {item.description}
                    </p>
                  )}
                  {item.suggestion && (
                    <div className='text-[11px] text-primary/80 font-mono mt-1 truncate'>
                      跳转: {item.suggestion}
                    </div>
                  )}
                </div>
              </div>

              <div className='flex items-center gap-1 shrink-0 self-end sm:self-center'>
                <Button
                  size='icon'
                  variant='ghost'
                  className='size-7'
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, 'up')}
                  title='上移'
                >
                  <ArrowUp className='size-3.5' />
                </Button>
                <Button
                  size='icon'
                  variant='ghost'
                  className='size-7'
                  disabled={idx === carouselList.length - 1}
                  onClick={() => handleMove(idx, 'down')}
                  title='下移'
                >
                  <ArrowDown className='size-3.5' />
                </Button>
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
          ))}
        </div>
      )}

      {/* 轮播编辑抽屉 */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className='w-full sm:max-w-md overflow-y-auto'>
          <SheetHeader>
            <SheetTitle>{editingSlide ? '编辑轮播项' : '添加轮播大图'}</SheetTitle>
            <SheetDescription>
              设置首页轮播图的展示文案与用户点击后的去向。
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSave} className='space-y-4 py-4 text-xs'>
            <div className='space-y-1.5 p-3 rounded-lg border bg-muted/20'>
              <div className='flex items-center justify-between mb-1'>
                <Label className='text-xs font-semibold'>大图文件</Label>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  className='h-6 text-[11px] gap-1'
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? <Loader2 className='size-3 animate-spin' /> : <Upload className='size-3' />}
                  <span>上传大图</span>
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
                placeholder='https://.../slide.jpg'
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
              <Label className='text-xs'>主标题</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='如：天才猫桌面 2.0 震撼发布'
                className='h-8 text-xs'
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs'>副标题说明</Label>
              <Textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder='如：新一代创作者桌面效率引擎，支持 Windows 与 macOS'
                className='text-xs min-h-[60px]'
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs'>跳转目标 URL 或 页面路径</Label>
              <Input
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder='如：/download.html 或 https://...'
                className='h-8 text-xs font-mono'
              />
            </div>

            <SheetFooter className='pt-2'>
              <Button type='submit' size='sm' disabled={isSaving} className='w-full gap-1.5'>
                {isSaving ? <Loader2 className='size-3.5 animate-spin' /> : <Save className='size-3.5' />}
                <span>{editingSlide ? '保存修改' : '确认添加'}</span>
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
