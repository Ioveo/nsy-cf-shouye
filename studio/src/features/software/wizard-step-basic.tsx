import { useState } from 'react'
import { Plus, Trash2, FolderTree, Sparkles } from 'lucide-react'
import type { Category } from '@/lib/queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface HighlightItem {
  title: string
  text: string
}

interface WizardStepBasicProps {
  name: string
  setName: (val: string) => void
  slug: string
  setSlug: (val: string) => void
  isSlugManuallyEdited: boolean
  setIsSlugManuallyEdited: (val: boolean) => void
  categoryId: string
  setCategoryId: (val: string) => void
  categories: Category[]
  onOpenCategoryModal: () => void
  tagline: string
  setTagline: (val: string) => void
  description: string
  setDescription: (val: string) => void
  requirements: string
  setRequirements: (val: string) => void
  developer: string
  setDeveloper: (val: string) => void
  website: string
  setWebsite: (val: string) => void
  priceLabel: string
  setPriceLabel: (val: string) => void
  highlights: HighlightItem[]
  setHighlights: (val: HighlightItem[]) => void
}

export function WizardStepBasic({
  name,
  setName,
  slug,
  setSlug,
  isSlugManuallyEdited,
  setIsSlugManuallyEdited,
  categoryId,
  setCategoryId,
  categories,
  onOpenCategoryModal,
  tagline,
  setTagline,
  description,
  setDescription,
  requirements,
  setRequirements,
  developer,
  setDeveloper,
  website,
  setWebsite,
  priceLabel,
  setPriceLabel,
  highlights,
  setHighlights,
}: WizardStepBasicProps) {
  const [descTab, setDescTab] = useState<'write' | 'preview'>('write')

  return (
    <div className='space-y-6 animate-in fade-in-50 duration-200'>
      <div className='rounded-xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm space-y-6'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div>
            <h3 className='text-base font-semibold text-foreground'>基础档案资料</h3>
            <p className='text-xs text-muted-foreground mt-0.5'>
              定义软件的基本身份、分类归属与卖点介绍。
            </p>
          </div>
          <Badge variant='outline' className='text-xs'>
            步骤 1 / 4
          </Badge>
        </div>

        <div className='grid gap-4 md:grid-cols-2'>
          {/* Software Name */}
          <div className='space-y-2'>
            <Label htmlFor='sw-name' className='flex items-center gap-1.5'>
              <span>软件名称</span>
              <span className='text-red-400'>*</span>
            </Label>
            <Input
              id='sw-name'
              placeholder='例如：灵猫桌面数据管理'
              value={name}
              onChange={(e) => {
                const nextName = e.target.value
                setName(nextName)
                if (!isSlugManuallyEdited) {
                  const generated = nextName
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '')
                  if (generated) setSlug(generated)
                }
              }}
              className='bg-background/80'
            />
          </div>

          {/* Slug */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='sw-slug' className='flex items-center gap-1.5'>
                <span>Slug 唯一标识 (URL 别名)</span>
                <span className='text-red-400'>*</span>
              </Label>
              <span className='text-[10px] text-muted-foreground font-mono'>
                仅限小写字母/数字/连字符
              </span>
            </div>
            <Input
              id='sw-slug'
              placeholder='例如：novadisk'
              value={slug}
              onChange={(e) => {
                setIsSlugManuallyEdited(true)
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
              }}
              className='bg-background/80 font-mono text-xs'
            />
          </div>

          {/* Category */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label className='flex items-center gap-1.5'>
                <span>所属分类</span>
                <span className='text-red-400'>*</span>
              </Label>
              <button
                type='button'
                onClick={onOpenCategoryModal}
                className='text-[11px] text-primary hover:underline flex items-center gap-1'
              >
                <FolderTree className='size-3' />
                <span>分类管理</span>
              </button>
            </div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className='w-full h-9 rounded-md border border-input bg-background/80 px-3 py-1 text-xs shadow-xs focus:outline-hidden'
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id})
                </option>
              ))}
            </select>
          </div>

          {/* Tagline */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='sw-tagline' className='flex items-center gap-1.5'>
                <span>一句话卖点 (Tagline)</span>
                <span className='text-red-400'>*</span>
              </Label>
              <span
                className={cn(
                  'text-[10px] font-mono',
                  tagline.length > 40 ? 'text-red-400' : 'text-muted-foreground'
                )}
              >
                {tagline.length}/40 字
              </span>
            </div>
            <Input
              id='sw-tagline'
              placeholder='简明扼要概括最强卖点，用于列表卡片和轮播...'
              value={tagline}
              maxLength={50}
              onChange={(e) => setTagline(e.target.value)}
              className={cn('bg-background/80', tagline.length > 40 && 'border-red-500')}
            />
          </div>
        </div>

        {/* Description Markdown */}
        <div className='space-y-2 pt-2 border-t border-border/40'>
          <div className='flex items-center justify-between'>
            <Label className='flex items-center gap-1.5'>
              软件详细介绍 (Markdown 支持)
            </Label>
            <div className='flex items-center rounded-md border border-border/60 bg-muted/40 p-0.5 text-xs'>
              <button
                type='button'
                onClick={() => setDescTab('write')}
                className={cn(
                  'px-2.5 py-1 rounded transition-colors',
                  descTab === 'write' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                )}
              >
                编辑
              </button>
              <button
                type='button'
                onClick={() => setDescTab('preview')}
                className={cn(
                  'px-2.5 py-1 rounded transition-colors',
                  descTab === 'preview' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                )}
              >
                实时预览
              </button>
            </div>
          </div>

          {descTab === 'write' ? (
            <Textarea
              placeholder='支持详细功能说明、使用指南、快捷键及安全声明（支持 Markdown 语法）...'
              value={description}
              rows={7}
              onChange={(e) => setDescription(e.target.value)}
              className='bg-background/80 font-mono text-xs'
            />
          ) : (
            <div className='min-h-[160px] rounded-md border border-input bg-background/50 p-4 text-xs prose prose-invert max-w-none'>
              {description ? (
                <div className='whitespace-pre-line text-foreground/90'>{description}</div>
              ) : (
                <span className='text-muted-foreground italic'>暂无内容</span>
              )}
            </div>
          )}
          <p className='text-[11px] text-muted-foreground'>
            当前字数：{description.length} 字（建议 ≥50 字以获得最佳详情页呈现）
          </p>
        </div>

        {/* Highlights */}
        <div className='space-y-3 pt-2 border-t border-border/40'>
          <div className='flex items-center justify-between'>
            <div>
              <Label className='text-sm font-medium'>核心特性亮点 (Highlights)</Label>
              <p className='text-xs text-muted-foreground'>
                展示于软件详情页醒目网格区域（建议 3-4 条）。
              </p>
            </div>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setHighlights([...highlights, { title: '', text: '' }])}
              className='gap-1 text-xs'
            >
              <Plus className='size-3.5' /> 添加亮点
            </Button>
          </div>

          <div className='space-y-2.5'>
            {highlights.map((hl, idx) => (
              <div
                key={idx}
                className='flex items-start gap-2 rounded-lg border border-border/60 bg-background/60 p-3'
              >
                <span className='mt-2 text-xs font-semibold text-muted-foreground size-5 flex items-center justify-center rounded-full bg-muted/60'>
                  {idx + 1}
                </span>
                <div className='flex-1 grid gap-2 md:grid-cols-3'>
                  <Input
                    placeholder='亮点标题（如：离线高精OCR）'
                    value={hl.title}
                    onChange={(e) => {
                      const next = [...highlights]
                      next[idx].title = e.target.value
                      setHighlights(next)
                    }}
                    className='h-8 text-xs bg-background/90'
                  />
                  <Input
                    placeholder='亮点说明（如：毫秒级响应，无需网络连接）'
                    value={hl.text}
                    onChange={(e) => {
                      const next = [...highlights]
                      next[idx].text = e.target.value
                      setHighlights(next)
                    }}
                    className='h-8 text-xs bg-background/90 md:col-span-2'
                  />
                </div>
                {highlights.length > 1 && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => setHighlights(highlights.filter((_, i) => i !== idx))}
                    className='size-8 p-0 text-muted-foreground hover:text-red-400 mt-1'
                  >
                    <Trash2 className='size-3.5' />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Requirements, Price, Developer */}
        <div className='grid gap-4 md:grid-cols-3 pt-2 border-t border-border/40'>
          <div className='space-y-2'>
            <Label className='text-xs font-medium'>运行环境要求</Label>
            <Input
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder='如：Windows 10 / 11 64位'
              className='h-8 text-xs bg-background/80'
            />
          </div>
          <div className='space-y-2'>
            <Label className='text-xs font-medium'>开发者 / 出品方</Label>
            <Input
              value={developer}
              onChange={(e) => setDeveloper(e.target.value)}
              placeholder='如：天才猫'
              className='h-8 text-xs bg-background/80'
            />
          </div>
          <div className='space-y-2'>
            <Label className='text-xs font-medium'>价格标签</Label>
            <Input
              value={priceLabel}
              onChange={(e) => setPriceLabel(e.target.value)}
              placeholder='如：免费 / 买断制 / 开源'
              className='h-8 text-xs bg-background/80'
            />
          </div>
        </div>
      </div>
    </div>
  )
}
