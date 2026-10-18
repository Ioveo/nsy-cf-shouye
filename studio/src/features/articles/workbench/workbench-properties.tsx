import { useRef, useState } from 'react'
import {
  Upload,
  X,
  Sparkles,
  Link as LinkIcon,
  Tag,
  FolderTree,
  Eye,
  Sliders,
  Loader2,
  Package,
} from 'lucide-react'
import { toast } from 'sonner'
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
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useConfig, type ArticleTaxonomyConfig, type Software } from '@/lib/queries'

interface WorkbenchPropertiesProps {
  open: boolean
  onClose: () => void
  category: string
  slug: string
  tags: string
  coverUrl: string
  softwareIds: string[]
  featured: boolean
  status: 'published' | 'draft'
  seoTitle: string
  seoDescription: string
  softwareList: Software[]
  onCategoryChange: (v: string) => void
  onSlugChange: (v: string) => void
  onTagsChange: (v: string) => void
  onCoverUrlChange: (v: string) => void
  onSoftwareIdsChange: (ids: string[]) => void
  onFeaturedChange: (v: boolean) => void
  onStatusChange: (v: 'published' | 'draft') => void
  onSeoTitleChange: (v: string) => void
  onSeoDescriptionChange: (v: string) => void
  onAutoGenerateSlug: () => void
}

export function WorkbenchProperties({
  open,
  onClose,
  category,
  slug,
  tags,
  coverUrl,
  softwareIds,
  featured,
  status,
  seoTitle,
  seoDescription,
  softwareList,
  onCategoryChange,
  onSlugChange,
  onTagsChange,
  onCoverUrlChange,
  onSoftwareIdsChange,
  onFeaturedChange,
  onStatusChange,
  onSeoTitleChange,
  onSeoDescriptionChange,
  onAutoGenerateSlug,
}: WorkbenchPropertiesProps) {
  const { data: taxonomyConfig } = useConfig<ArticleTaxonomyConfig>('article-taxonomy')
  const categories = taxonomyConfig?.categories || []

  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  async function handleCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingCover(true)
    const toastId = toast.loading('正在上传封面图至 R2...')
    try {
      const res = await uploadAssetFile(file, { kind: 'image', folder: 'articles' })
      if (res.success && res.url) {
        onCoverUrlChange(res.url)
        toast.success('封面图上传成功', { id: toastId })
      } else {
        toast.error(res.msg || '封面上传失败', { id: toastId })
      }
    } catch (err: any) {
      toast.error(`上传异常: ${err.message}`, { id: toastId })
    } finally {
      setIsUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  function toggleSoftware(id: string) {
    if (softwareIds.includes(id)) {
      onSoftwareIdsChange(softwareIds.filter((item) => item !== id))
    } else {
      onSoftwareIdsChange([...softwareIds, id])
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side='right' className='w-full sm:max-w-md overflow-y-auto p-0 flex flex-col'>
        <SheetHeader className='p-5 border-b border-border select-none'>
          <SheetTitle className='text-base font-bold flex items-center gap-2'>
            <Sliders className='size-4 text-primary' />
            <span>文章元数据与高级属性</span>
          </SheetTitle>
          <SheetDescription className='text-xs'>
            配置发布状态、专栏归属、封面视觉与搜索引擎 SEO 信息。
          </SheetDescription>
        </SheetHeader>

        <div className='p-5 space-y-5 flex-1 text-xs'>
          {/* 1. 发布状态 */}
          <div className='space-y-2'>
            <Label className='text-xs font-semibold flex items-center gap-1.5'>
              <Eye className='size-3.5 text-primary' />
              <span>发布状态</span>
            </Label>
            <div className='grid grid-cols-2 gap-2'>
              <button
                type='button'
                onClick={() => onStatusChange('published')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  status === 'published'
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-semibold'
                    : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                }`}
              >
                公开已发布
              </button>
              <button
                type='button'
                onClick={() => onStatusChange('draft')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  status === 'draft'
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-400 font-semibold'
                    : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                }`}
              >
                草稿箱 (仅后台可见)
              </button>
            </div>
          </div>

          {/* 2. 所属分类 */}
          <div className='space-y-1.5'>
            <Label className='text-xs font-semibold flex items-center gap-1.5'>
              <FolderTree className='size-3.5 text-primary' />
              <span>所属分类 *</span>
            </Label>
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className='h-9 w-full rounded-md border border-input bg-background px-3 text-xs'
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} ({c.slug})
                </option>
              ))}
              {category && !categories.some((c) => c.slug === category || c.name === category) && (
                <option value={category}>{category} (历史分类)</option>
              )}
            </select>
          </div>

          {/* 3. URL 别名 (Slug) */}
          <div className='space-y-1.5'>
            <div className='flex items-center justify-between'>
              <Label className='text-xs font-semibold flex items-center gap-1.5'>
                <LinkIcon className='size-3.5 text-primary' />
                <span>URL 别名 (Slug)</span>
              </Label>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='h-6 text-[11px] px-2 text-primary gap-1'
                onClick={onAutoGenerateSlug}
              >
                <Sparkles className='size-3' />
                <span>根据标题生成</span>
              </Button>
            </div>
            <Input
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              placeholder='如: desktop-quickstart'
              className='h-8 text-xs font-mono'
            />
          </div>

          {/* 4. 封面图 */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label className='text-xs font-semibold'>封面图片</Label>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={isUploadingCover}
                className='h-6 text-[11px] gap-1'
                onClick={() => coverInputRef.current?.click()}
              >
                {isUploadingCover ? <Loader2 className='size-3 animate-spin' /> : <Upload className='size-3' />}
                <span>上传到 R2</span>
              </Button>
              <input
                ref={coverInputRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={handleCoverFile}
              />
            </div>

            {coverUrl ? (
              <div className='relative rounded-lg overflow-hidden border border-border group bg-muted/20'>
                <img src={coverUrl} alt='文章封面' className='w-full h-32 object-cover' />
                <button
                  type='button'
                  onClick={() => onCoverUrlChange('')}
                  className='absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-black transition-all'
                  title='移除封面'
                >
                  <X className='size-3.5' />
                </button>
              </div>
            ) : (
              <div
                onClick={() => coverInputRef.current?.click()}
                className='h-24 rounded-lg border border-dashed border-border/80 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:bg-muted/10 cursor-pointer transition-all'
              >
                <Upload className='size-4' />
                <span className='text-[11px]'>点击上传 16:9 高清封面图</span>
              </div>
            )}
            <Input
              value={coverUrl}
              onChange={(e) => onCoverUrlChange(e.target.value)}
              placeholder='或者直接填写图片外链 https://...'
              className='h-7 text-[11px] font-mono'
            />
          </div>

          {/* 5. 标签 */}
          <div className='space-y-1.5'>
            <Label className='text-xs font-semibold flex items-center gap-1.5'>
              <Tag className='size-3.5 text-primary' />
              <span>文章标签 (逗号分隔)</span>
            </Label>
            <Input
              value={tags}
              onChange={(e) => onTagsChange(e.target.value)}
              placeholder='如：快捷键, 桌面收纳, 效率'
              className='h-8 text-xs'
            />
          </div>

          {/* 6. 关联软件闭环 */}
          <div className='space-y-1.5'>
            <Label className='text-xs font-semibold flex items-center gap-1.5'>
              <Package className='size-3.5 text-primary' />
              <span>关联推荐软件 (文章底部展示直达下载卡片)</span>
            </Label>
            <div className='space-y-1 max-h-36 overflow-y-auto border border-border rounded-lg p-2 bg-muted/10'>
              {softwareList.length === 0 ? (
                <p className='text-[11px] text-muted-foreground py-1 text-center'>暂无可关联软件</p>
              ) : (
                softwareList.map((sw) => {
                  const swId = sw.id || ''
                  if (!swId) return null
                  const checked = softwareIds.includes(swId)
                  return (
                    <label
                      key={swId}
                      className={`flex items-center gap-2 p-1.5 rounded-md text-xs cursor-pointer transition-all ${
                        checked ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/30 text-foreground'
                      }`}
                    >
                      <input
                        type='checkbox'
                        checked={checked}
                        onChange={() => toggleSoftware(swId)}
                        className='rounded border-border text-primary focus:ring-primary size-3.5'
                      />
                      <span className='truncate'>{sw.name}</span>
                    </label>
                  )
                })
              )}
            </div>
          </div>

          {/* 7. 主推置顶 */}
          <div className='flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20'>
            <div className='space-y-0.5'>
              <Label className='text-xs font-semibold'>设为主推置顶文章</Label>
              <p className='text-[11px] text-muted-foreground'>
                开启后将在专栏频道与关联软件推荐位优先置顶展示
              </p>
            </div>
            <Switch checked={featured} onCheckedChange={onFeaturedChange} />
          </div>

          {/* 8. SEO 设置 */}
          <div className='space-y-3 pt-2 border-t border-border'>
            <Label className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              SEO 搜索引擎优化
            </Label>
            <div className='space-y-1'>
              <Label className='text-[11px] text-muted-foreground'>自定义网页标题 (SEO Title)</Label>
              <Input
                value={seoTitle}
                onChange={(e) => onSeoTitleChange(e.target.value)}
                placeholder='留空将自动使用文章主标题'
                className='h-8 text-xs'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-[11px] text-muted-foreground'>自定义网页描述 (SEO Description)</Label>
              <Textarea
                value={seoDescription}
                onChange={(e) => onSeoDescriptionChange(e.target.value)}
                placeholder='留空将自动使用导读摘要内容'
                className='text-xs min-h-[50px] resize-none'
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
