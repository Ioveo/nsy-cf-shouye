import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  BookOpen,
  Sparkles,
  FileText,
  HelpCircle,
  Terminal,
  Layers,
  Code,
  Bookmark,
  Compass,
  Cpu,
  Zap,
  FolderTree,
  Loader2,
  Trash2,
} from 'lucide-react'
import { type ArticleCategory, type ArticleTaxonomyConfig } from '@/lib/queries'

const ICON_OPTIONS = [
  { value: 'book-open', label: '开本书籍', icon: BookOpen },
  { value: 'sparkles', label: '星星灵感', icon: Sparkles },
  { value: 'file-text', label: '文本文档', icon: FileText },
  { value: 'help-circle', label: '帮助疑问', icon: HelpCircle },
  { value: 'terminal', label: '终端代码', icon: Terminal },
  { value: 'layers', label: '层次结构', icon: Layers },
  { value: 'code', label: '代码标签', icon: Code },
  { value: 'bookmark', label: '书签标记', icon: Bookmark },
  { value: 'compass', label: '指南针', icon: Compass },
  { value: 'cpu', label: '硬件芯片', icon: Cpu },
  { value: 'zap', label: '闪电极速', icon: Zap },
  { value: 'folder-tree', label: '分类目录树', icon: FolderTree },
]

const COLOR_PRESETS = [
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#EC4899', // pink
  '#64748B', // slate
]

interface CategoryDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: ArticleCategory | null
  taxonomyConfig?: ArticleTaxonomyConfig
}

export function CategoryDrawer({
  open,
  onOpenChange,
  category,
  taxonomyConfig,
}: CategoryDrawerProps) {
  const queryClient = useQueryClient()
  const isEdit = Boolean(category)

  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('book-open')
  const [color, setColor] = useState('#06B6D4')
  const [layout, setLayout] = useState<'grid' | 'list' | 'docs'>('list')
  const [order, setOrder] = useState(10)
  const [showInNav, setShowInNav] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (category) {
      setSlug(category.slug || '')
      setName(category.name || '')
      setDescription(category.description || '')
      setIcon(category.icon || 'book-open')
      setColor(category.color || '#06B6D4')
      setLayout(category.layout || 'list')
      setOrder(Number(category.order) || 10)
      setShowInNav(category.showInNav !== false)
    } else {
      const nextOrder = taxonomyConfig?.categories?.length
        ? Math.max(...taxonomyConfig.categories.map((c) => c.order || 0)) + 10
        : 10
      setSlug('')
      setName('')
      setDescription('')
      setIcon('book-open')
      setColor('#06B6D4')
      setLayout('list')
      setOrder(nextOrder)
      setShowInNav(true)
    }
  }, [category, open, taxonomyConfig])

  const SelectedIconComp =
    ICON_OPTIONS.find((opt) => opt.value === icon)?.icon || BookOpen

  const handleSave = async () => {
    const cleanSlug = slug.trim().toLowerCase()
    const cleanName = name.trim()

    if (!cleanSlug) {
      toast.error('分类标识 Slug 不能为空')
      return
    }
    if (!/^[a-z0-9_-]+$/i.test(cleanSlug)) {
      toast.error('Slug 只能包含英文、数字、中划线和下划线')
      return
    }
    if (!cleanName) {
      toast.error('分类名称不能为空')
      return
    }

    const currentCats = taxonomyConfig?.categories ? [...taxonomyConfig.categories] : []

    // Check duplicate slug
    const duplicate = currentCats.find(
      (c) => c.slug === cleanSlug && (!isEdit || category?.slug !== cleanSlug)
    )
    if (duplicate) {
      toast.error(`已存在相同的分类标识「${cleanSlug}」`)
      return
    }

    const updatedCat: ArticleCategory = {
      slug: cleanSlug,
      name: cleanName,
      description: description.trim(),
      icon,
      color,
      layout,
      order: Number(order) || 0,
      showInNav,
    }

    let nextCats: ArticleCategory[]
    if (isEdit) {
      nextCats = currentCats.map((c) => (c.slug === category!.slug ? updatedCat : c))
    } else {
      nextCats = [...currentCats, updatedCat]
    }

    // Sort by order
    nextCats.sort((a, b) => (a.order || 0) - (b.order || 0))

    setIsSaving(true)
    try {
      const res = await api.post('/api/admin/config', {
        action: 'save',
        name: 'article-taxonomy',
        data: { categories: nextCats },
      })
      if (res.success) {
        queryClient.setQueryData(['config', 'article-taxonomy'], res.config)
        toast.success(isEdit ? '分类已更新' : '分类已创建')
        onOpenChange(false)
      } else {
        toast.error(res.msg || '保存失败')
      }
    } catch (err: any) {
      toast.error(`保存异常：${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!category) return
    if (!confirm(`确定要删除分类「${category.name}」吗？历史文章仍将安全归于“其他”。`)) {
      return
    }

    const currentCats = taxonomyConfig?.categories ? [...taxonomyConfig.categories] : []
    const nextCats = currentCats.filter((c) => c.slug !== category.slug)

    setIsSaving(true)
    try {
      const res = await api.post('/api/admin/config', {
        action: 'save',
        name: 'article-taxonomy',
        data: { categories: nextCats },
      })
      if (res.success) {
        queryClient.setQueryData(['config', 'article-taxonomy'], res.config)
        toast.success('分类已删除')
        onOpenChange(false)
      } else {
        toast.error(res.msg || '删除失败')
      }
    } catch (err: any) {
      toast.error(`删除异常：${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full sm:max-w-md flex flex-col justify-between overflow-y-auto'>
        <div className='space-y-6 py-2'>
          <SheetHeader>
            <SheetTitle>{isEdit ? '编辑文章分类' : '新建文章分类'}</SheetTitle>
            <SheetDescription className='text-xs'>
              设定文章分类的基本标识、排版呈现模式与视觉色彩。
            </SheetDescription>
          </SheetHeader>

          <div className='space-y-4 text-xs'>
            {/* Slug & Name */}
            <div className='space-y-1.5'>
              <Label className='text-xs'>分类标识 (Slug) *</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder='如：tutorial / news / guide'
                className='h-8 text-xs font-mono'
              />
              <p className='text-[10px] text-muted-foreground'>
                用于前台 URL（?cat=xxx），纯英文、数字或短横线。
              </p>
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs'>分类显示名称 *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='如：上手教程 / 版本发布 / 深度指南'
                className='h-8 text-xs'
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs'>分类简介</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='向读者简要介绍本分类收录的内容题材...'
                className='text-xs min-h-[64px]'
              />
            </div>

            {/* Layout */}
            <div className='space-y-1.5'>
              <Label className='text-xs'>默认前台排版模式 *</Label>
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value as any)}
                className='h-8 w-full rounded-md border border-input bg-background px-3 text-xs'
              >
                <option value='grid'>卡片网格 (Grid) — 16:9封面卡片，首篇大卡</option>
                <option value='list'>图文列表 (List) — 左图右文，高信息密度</option>
                <option value='docs'>文档手册 (Docs) — 左侧目录树，右侧直显正文</option>
              </select>
            </div>

            {/* Icon & Color */}
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label className='text-xs flex items-center justify-between'>
                  <span>图标</span>
                  <SelectedIconComp className='w-4 h-4' style={{ color }} />
                </Label>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className='h-8 w-full rounded-md border border-input bg-background px-2 text-xs'
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({opt.value})
                    </option>
                  ))}
                </select>
              </div>

              <div className='space-y-1.5'>
                <Label className='text-xs flex items-center justify-between'>
                  <span>主题色</span>
                  <span
                    className='w-3.5 h-3.5 rounded-full border shadow-sm'
                    style={{ backgroundColor: color }}
                  />
                </Label>
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className='h-8 text-xs font-mono'
                  placeholder='#06B6D4'
                />
              </div>
            </div>

            {/* Color Presets */}
            <div className='space-y-1.5'>
              <Label className='text-[10px] text-muted-foreground'>常用预设色</Label>
              <div className='flex items-center gap-1.5'>
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type='button'
                    onClick={() => setColor(c)}
                    className={`w-5 h-5 rounded-full border transition-transform ${
                      color === c ? 'scale-125 border-foreground' : 'border-transparent opacity-80'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Order & showInNav */}
            <div className='grid grid-cols-2 gap-3 pt-1'>
              <div className='space-y-1.5'>
                <Label className='text-xs'>排序权重 (Order)</Label>
                <Input
                  type='number'
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  className='h-8 text-xs'
                />
              </div>

              <div className='space-y-1.5'>
                <Label className='text-xs'>顶部分类导航</Label>
                <div className='flex items-center justify-between pt-1'>
                  <span className='text-[11px] text-muted-foreground'>
                    {showInNav ? '在导航常驻显示' : '仅在下拉/列表显示'}
                  </span>
                  <Switch checked={showInNav} onCheckedChange={setShowInNav} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className='border-t pt-3 flex flex-row items-center justify-between gap-2'>
          {isEdit ? (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              disabled={isSaving}
              onClick={handleDelete}
              className='text-destructive hover:bg-destructive/10 gap-1'
            >
              <Trash2 className='w-4 h-4' />
              删除
            </Button>
          ) : (
            <div />
          )}

          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button size='sm' disabled={isSaving} onClick={handleSave} className='gap-2'>
              {isSaving && <Loader2 className='w-4 h-4 animate-spin' />}
              {isEdit ? '保存更改' : '立即创建'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
