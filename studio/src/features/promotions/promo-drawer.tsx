import React, { useState, useEffect, useRef } from 'react'
import {
  Upload,
  Sparkles,
  Search,
  ExternalLink,
  Layers,
  FileText,
  Music,
  Globe,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
// @ts-ignore
import { uploadAssetFile } from '@r2'
import type { PromotionItem, Software } from '@/lib/queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'

interface PromoDrawerProps {
  open: boolean
  onClose: () => void
  onSave: (item: PromotionItem) => Promise<void>
  editingItem: PromotionItem | null
  softwareList: Software[]
  articlesList: any[]
}

const PLACEMENTS_ALL = [
  { id: 'software', label: '软件中心 (download.html)' },
  { id: 'portal', label: '官网综合门户 (portal.html / index.html)' },
  { id: 'music', label: '音乐频道 (music.html)' },
  { id: 'articles', label: '文章专栏 (articles.html)' },
]

export function PromoDrawer({
  open,
  onClose,
  onSave,
  editingItem,
  softwareList,
  articlesList,
}: PromoDrawerProps) {
  const [type, setType] = useState<'software' | 'article' | 'playlist' | 'custom'>('software')
  const [entityId, setEntityId] = useState('')
  const [placements, setPlacements] = useState<string[]>(['software'])
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [image, setImage] = useState('')
  const [ctaText, setCtaText] = useState('')
  const [ctaHref, setCtaHref] = useState('')
  const [badge, setBadge] = useState('限时推荐')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [imageSizeWarning, setImageSizeWarning] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // 初始化表单
  useEffect(() => {
    if (!open) return
    if (editingItem) {
      setType((editingItem.entity?.type as any) || 'custom')
      setEntityId(editingItem.entity?.id || '')
      setPlacements(editingItem.placements || ['software'])
      setTitle(editingItem.override?.title || '')
      setSubtitle(editingItem.override?.subtitle || '')
      setImage(editingItem.override?.image || '')
      setCtaText(editingItem.override?.ctaText || '')
      setCtaHref(editingItem.override?.ctaHref || '')
      setBadge(editingItem.badge || '限时推荐')
      setStartDate(editingItem.startAt ? new Date(editingItem.startAt).toISOString().slice(0, 10) : '')
      setEndDate(editingItem.endAt ? new Date(editingItem.endAt).toISOString().slice(0, 10) : '')
    } else {
      setType('software')
      setEntityId(softwareList[0]?.id || softwareList[0]?.slug || '')
      setPlacements(['software'])
      setTitle('')
      setSubtitle('')
      setImage('')
      setCtaText('')
      setCtaHref('')
      setBadge('限时推荐')
      setStartDate('')
      setEndDate('')
    }
    setImageSizeWarning('')
  }, [open, editingItem, softwareList])

  // 实体匹配与原值计算
  const selectedSoftware = type === 'software' ? softwareList.find((s) => s.id === entityId || s.slug === entityId) : null
  const selectedArticle = type === 'article' ? articlesList.find((a) => a.id === entityId || a.slug === entityId) : null

  const placeholderTitle = selectedSoftware?.name || selectedArticle?.title || '未选择实体'
  const placeholderSubtitle = selectedSoftware?.tagline || selectedArticle?.summary || ''
  const placeholderImage = selectedSoftware?.coverUrl || selectedSoftware?.screenshots?.[0] || selectedArticle?.coverUrl || ''
  const placeholderCtaText = type === 'software' ? '立即下载' : type === 'article' ? '阅读全文' : '了解更多'
  const placeholderCtaHref = selectedSoftware ? `/download/latest/${selectedSoftware.slug}` : selectedArticle ? `/article.html?slug=${selectedArticle.slug}` : ''

  // 上传图片处理
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // 检测实际图片尺寸并给予提示 (附录 A 规范: 1600x900 建议)
    const imgObj = new Image()
    imgObj.src = URL.createObjectURL(file)
    imgObj.onload = () => {
      const { width, height } = imgObj
      if (width < 800 || height < 450) {
        setImageSizeWarning(`当前图片尺寸为 ${width}×${height}，建议使用 1600×900 (16:9) 高清大图以获得最佳视觉呈现。`)
      } else {
        setImageSizeWarning('')
      }
    }

    setIsUploading(true)
    try {
      const res = await uploadAssetFile(file, { kind: 'image', folder: 'promotions' })
      if (res.success && res.url) {
        setImage(res.url)
        toast.success('推广图片上传成功')
      } else {
        toast.error(res.msg || '上传失败')
      }
    } catch (err: any) {
      toast.error(`上传异常：${err.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  function togglePlacement(p: string) {
    if (placements.includes(p)) {
      if (placements.length > 1) {
        setPlacements(placements.filter((x) => x !== p))
      } else {
        toast.warning('至少需要保留一个投放页面')
      }
    } else {
      setPlacements([...placements, p])
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (type === 'custom' && (!image || !ctaHref)) {
      toast.error('自定义推广项必须提供推广图片地址与跳转链接')
      return
    }

    setIsSaving(true)
    try {
      const payload: PromotionItem = {
        id: editingItem?.id || `promo_${Date.now()}`,
        placements,
        entity: {
          type,
          id: entityId,
        },
        override: {
          title: title.trim(),
          subtitle: subtitle.trim(),
          image: image.trim(),
          ctaText: ctaText.trim(),
          ctaHref: ctaHref.trim(),
        },
        badge: badge.trim(),
        startAt: startDate ? new Date(startDate).getTime() : 0,
        endAt: endDate ? new Date(endDate).getTime() : 0,
        status: editingItem?.status || 'active',
        order: editingItem?.order ?? Date.now(),
      }

      await onSave(payload)
      onClose()
    } catch (err: any) {
      toast.error(`保存失败：${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side='right' className='sm:max-w-xl overflow-y-auto p-6'>
        <SheetHeader>
          <SheetTitle className='flex items-center gap-2 text-lg'>
            <Sparkles className='size-5 text-primary' />
            <span>{editingItem ? '编辑推广位' : '新建统一推广位'}</span>
          </SheetTitle>
          <SheetDescription className='text-xs'>
            将重点软件、评测教程或特别活动投放到全站首屏 Hero 与焦点位。
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className='space-y-5 pt-4'>
          {/* 第 1 步：类型选择 */}
          <div className='space-y-2'>
            <Label className='text-xs font-semibold'>1. 推广实体类型</Label>
            <div className='grid grid-cols-4 gap-2'>
              {[
                { id: 'software', label: '关联软件', icon: Layers },
                { id: 'article', label: '关联文章', icon: FileText },
                { id: 'playlist', label: '关联歌单', icon: Music },
                { id: 'custom', label: '自定义外链', icon: Globe },
              ].map((t) => {
                const Icon = t.icon
                return (
                  <button
                    key={t.id}
                    type='button'
                    onClick={() => setType(t.id as any)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs transition-all ${
                      type === t.id
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className='size-4 mb-1' />
                    <span>{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 第 2 步：实体选择器 */}
          {type === 'software' && (
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold'>2. 选择目标软件</Label>
              <select
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                className='w-full h-9 rounded-md border bg-background px-3 text-xs'
              >
                {softwareList.map((s) => (
                  <option key={s.id || s.slug} value={s.id || s.slug}>
                    {s.name} ({s.status === 'active' ? '已上架' : '草稿/下架 - 前台不会展示'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {type === 'article' && (
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold'>2. 选择目标文章</Label>
              <select
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                className='w-full h-9 rounded-md border bg-background px-3 text-xs'
              >
                {articlesList.map((a) => (
                  <option key={a.id || a.slug} value={a.id || a.slug}>
                    {a.title} ({a.status === 'published' ? '已发布' : '草稿'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 第 3 步：投放页面与时间 */}
          <div className='space-y-3 rounded-lg border p-3 bg-muted/20'>
            <div>
              <Label className='text-xs font-semibold'>3. 投放目标页面 (多选)</Label>
              <div className='grid grid-cols-2 gap-2 mt-2'>
                {PLACEMENTS_ALL.map((p) => (
                  <label
                    key={p.id}
                    className={`flex items-center gap-2 p-2 rounded border text-xs cursor-pointer transition-all ${
                      placements.includes(p.id)
                        ? 'border-primary bg-primary/5 text-foreground font-medium'
                        : 'border-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    <input
                      type='checkbox'
                      checked={placements.includes(p.id)}
                      onChange={() => togglePlacement(p.id)}
                      className='rounded border-muted'
                    />
                    <span>{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className='grid grid-cols-2 gap-3 pt-2 border-t'>
              <div>
                <Label className='text-[11px]'>展示角标 (Badge)</Label>
                <Input
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder='限时推荐 / 编辑精选'
                  className='h-8 text-xs mt-1'
                />
              </div>
              <div className='grid grid-cols-2 gap-1'>
                <div>
                  <Label className='text-[11px]'>生效起始日</Label>
                  <Input
                    type='date'
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className='h-8 text-xs mt-1'
                  />
                </div>
                <div>
                  <Label className='text-[11px]'>截止日</Label>
                  <Input
                    type='date'
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className='h-8 text-xs mt-1'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 第 4 步：可选覆盖文案与图片 */}
          <div className='space-y-3 rounded-lg border p-3 bg-muted/20'>
            <div className='flex items-center justify-between'>
              <Label className='text-xs font-semibold'>4. 推广文案与视觉定制 (留空则沿用实体原值)</Label>
            </div>

            <div>
              <Label className='text-[11px]'>推广标题</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={placeholderTitle}
                className='h-8 text-xs mt-1'
              />
            </div>

            <div>
              <Label className='text-[11px]'>推广副标题 / 卖点介绍</Label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder={placeholderSubtitle || '一句话卖点'}
                className='h-8 text-xs mt-1'
              />
            </div>

            <div>
              <div className='flex items-center justify-between'>
                <Label className='text-[11px]'>专属宣传大图 (建议 1600×900 16:9)</Label>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className='h-7 text-xs gap-1'
                >
                  {isUploading ? <Loader2 className='size-3 animate-spin' /> : <Upload className='size-3' />}
                  <span>上传图片</span>
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
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder={placeholderImage || '图片 URL'}
                className='h-8 text-xs mt-1 font-mono'
              />
              {imageSizeWarning && (
                <div className='flex items-center gap-1.5 text-[11px] text-amber-400 mt-1.5'>
                  <AlertTriangle className='size-3 flex-shrink-0' />
                  <span>{imageSizeWarning}</span>
                </div>
              )}
            </div>

            <div className='grid grid-cols-2 gap-2 pt-1'>
              <div>
                <Label className='text-[11px]'>主操作按钮文案</Label>
                <Input
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder={placeholderCtaText}
                  className='h-8 text-xs mt-1'
                />
              </div>
              <div>
                <Label className='text-[11px]'>主跳转链接</Label>
                <Input
                  value={ctaHref}
                  onChange={(e) => setCtaHref(e.target.value)}
                  placeholder={placeholderCtaHref || '/download/...'}
                  className='h-8 text-xs mt-1 font-mono'
                />
              </div>
            </div>
          </div>

          <SheetFooter className='pt-2'>
            <Button type='button' variant='outline' onClick={onClose} disabled={isSaving}>
              取消
            </Button>
            <Button type='submit' disabled={isSaving}>
              {isSaving ? <Loader2 className='size-3.5 animate-spin mr-1.5' /> : null}
              <span>保存推广位</span>
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
