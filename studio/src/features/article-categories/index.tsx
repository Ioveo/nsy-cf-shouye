import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useConfig, type ArticleCategory, type ArticleTaxonomyConfig } from '@/lib/queries'
import { useCatalog } from '@/hooks/use-catalog'
import { api } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  FolderTree,
  Plus,
  ArrowUp,
  ArrowDown,
  Sparkles,
  BookOpen,
  FileText,
  HelpCircle,
  Terminal,
  Layers,
  Code,
  Bookmark,
  Compass,
  Cpu,
  Zap,
  Edit,
  Loader2,
  RotateCcw,
} from 'lucide-react'
import { CategoryDrawer } from './category-drawer'
import { CleanupDialog } from './cleanup-dialog'

const ICON_MAP: Record<string, any> = {
  'book-open': BookOpen,
  sparkles: Sparkles,
  'file-text': FileText,
  'help-circle': HelpCircle,
  terminal: Terminal,
  layers: Layers,
  code: Code,
  bookmark: Bookmark,
  compass: Compass,
  cpu: Cpu,
  zap: Zap,
  'folder-tree': FolderTree,
}

const LAYOUT_LABELS: Record<string, { label: string; badge: string }> = {
  grid: { label: '卡片网格 (Grid)', badge: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
  list: { label: '图文列表 (List)', badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  docs: { label: '文档手册 (Docs)', badge: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
}

export function ArticleCategoriesFeature() {
  const queryClient = useQueryClient()
  const { data: taxonomyConfig, isLoading } = useConfig<ArticleTaxonomyConfig>('article-taxonomy')
  const { data: catalog } = useCatalog()
  const articles: Array<{ id: string; title: string; category?: string }> = (catalog as any)?.articles || []

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedCat, setSelectedCat] = useState<ArticleCategory | null>(null)
  const [cleanupOpen, setCleanupOpen] = useState(false)
  const [isReordering, setIsReordering] = useState(false)

  const categories = taxonomyConfig?.categories || []

  const handleOpenCreate = () => {
    setSelectedCat(null)
    setDrawerOpen(true)
  }

  const handleOpenEdit = (cat: ArticleCategory) => {
    setSelectedCat(cat)
    setDrawerOpen(true)
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === categories.length - 1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const next = [...categories]
    const temp = next[index]
    next[index] = next[targetIndex]
    next[targetIndex] = temp

    // Re-assign order numbers in steps of 10
    const reordered = next.map((cat, i) => ({
      ...cat,
      order: (i + 1) * 10,
    }))

    setIsReordering(true)
    try {
      const res = await api.post('/api/admin/config', {
        action: 'save',
        name: 'article-taxonomy',
        data: { categories: reordered },
      })
      if (res.success) {
        queryClient.setQueryData(['config', 'article-taxonomy'], res.config)
        toast.success('分类排序已保存')
      } else {
        toast.error(res.msg || '排序保存失败')
      }
    } catch (err: any) {
      toast.error(`排序异常：${err.message}`)
    } finally {
      setIsReordering(false)
    }
  }

  const handleRollback = async () => {
    if (!confirm('确定要恢复到上一版的分类配置吗？')) return
    try {
      const res = await api.post('/api/admin/config', {
        action: 'rollback',
        name: 'article-taxonomy',
      })
      if (res.success) {
        queryClient.setQueryData(['config', 'article-taxonomy'], res.config)
        toast.success('已成功回滚分类配置')
      } else {
        toast.error(res.msg || '回滚失败')
      }
    } catch (err: any) {
      toast.error(`回滚异常：${err.message}`)
    }
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-3'>
          <div className='flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500'>
            <FolderTree className='w-4 h-4' />
          </div>
          <div>
            <h1 className='text-sm font-semibold tracking-tight'>文章分类与排版管理</h1>
            <p className='text-xs text-muted-foreground'>
              管理前台文章频道的分类维度、图标、排版呈现模式（网格/列表/手册）。
            </p>
          </div>
        </div>

        <div className='ml-auto flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleRollback}
            className='h-8 text-xs gap-1.5'
            title='恢复至上一版本的分类配置'
          >
            <RotateCcw className='w-3.5 h-3.5' />
            恢复上版
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setCleanupOpen(true)}
            className='h-8 text-xs gap-1.5'
          >
            <Sparkles className='w-3.5 h-3.5 text-amber-500' />
            整理老数据
          </Button>
          <Button
            size='sm'
            onClick={handleOpenCreate}
            className='h-8 text-xs gap-1.5'
          >
            <Plus className='w-3.5 h-3.5' />
            新建分类
          </Button>
        </div>
      </Header>

      <Main className='p-6'>
        {isLoading ? (
          <div className='flex items-center justify-center p-12'>
            <Loader2 className='w-6 h-6 animate-spin text-muted-foreground' />
          </div>
        ) : categories.length === 0 ? (
          <Card className='border-dashed'>
            <CardContent className='flex flex-col items-center justify-center py-16 text-center'>
              <div className='p-3 rounded-full bg-muted/50 mb-3 text-muted-foreground'>
                <FolderTree className='w-8 h-8 opacity-60' />
              </div>
              <h3 className='text-sm font-semibold mb-1'>暂无文章分类</h3>
              <p className='text-xs text-muted-foreground max-w-sm mb-4'>
                当前尚未配置标准文章分类。可点击下方按钮创建，或从已有文章中一键整理。
              </p>
              <div className='flex items-center gap-2'>
                <Button size='sm' onClick={handleOpenCreate} className='gap-1.5'>
                  <Plus className='w-3.5 h-3.5' />
                  新建分类
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCleanupOpen(true)}
                  className='gap-1.5'
                >
                  <Sparkles className='w-3.5 h-3.5 text-amber-500' />
                  整理老数据
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-3'>
            <div className='flex items-center justify-between text-xs text-muted-foreground px-1'>
              <span>共 {categories.length} 个配置分类（按排序值生效）</span>
              <span>支持调整先后顺序与自定义排版</span>
            </div>

            <div className='border rounded-xl divide-y bg-card overflow-hidden shadow-sm'>
              {categories.map((cat, idx) => {
                const IconComp = ICON_MAP[cat.icon || 'book-open'] || BookOpen
                const layoutInfo = LAYOUT_LABELS[cat.layout || 'list'] || LAYOUT_LABELS.list
                const matchingArticles = articles.filter(
                  (a) =>
                    (a.category || '').toLowerCase() === cat.slug.toLowerCase() ||
                    (a.category || '').toLowerCase() === cat.name.toLowerCase()
                )

                return (
                  <div
                    key={cat.slug}
                    className='p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors'
                  >
                    <div className='flex items-center gap-4 min-w-0'>
                      {/* Up/Down buttons */}
                      <div className='flex flex-col gap-0.5'>
                        <Button
                          variant='ghost'
                          size='icon'
                          disabled={idx === 0 || isReordering}
                          onClick={() => handleMove(idx, 'up')}
                          className='h-6 w-6 text-muted-foreground hover:text-foreground'
                        >
                          <ArrowUp className='w-3 h-3' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          disabled={idx === categories.length - 1 || isReordering}
                          onClick={() => handleMove(idx, 'down')}
                          className='h-6 w-6 text-muted-foreground hover:text-foreground'
                        >
                          <ArrowDown className='w-3 h-3' />
                        </Button>
                      </div>

                      {/* Icon with colored circle */}
                      <div
                        className='w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-xs'
                        style={{
                          backgroundColor: `${cat.color || '#06B6D4'}15`,
                          borderColor: `${cat.color || '#06B6D4'}30`,
                          color: cat.color || '#06B6D4',
                        }}
                      >
                        <IconComp className='w-5 h-5' />
                      </div>

                      {/* Info */}
                      <div className='min-w-0 space-y-1'>
                        <div className='flex items-center gap-2'>
                          <span className='font-semibold text-sm'>{cat.name}</span>
                          <span className='text-xs font-mono text-muted-foreground'>
                            /{cat.slug}
                          </span>
                          <span
                            className='inline-block w-2 h-2 rounded-full'
                            style={{ backgroundColor: cat.color || '#06B6D4' }}
                            title={`主题色：${cat.color}`}
                          />
                        </div>
                        {cat.description && (
                          <p className='text-xs text-muted-foreground truncate max-w-md'>
                            {cat.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Meta & Badges */}
                    <div className='flex items-center gap-3 shrink-0'>
                      <Badge
                        variant='outline'
                        className={`text-[11px] font-normal border ${layoutInfo.badge}`}
                      >
                        {layoutInfo.label}
                      </Badge>

                      <Badge variant='secondary' className='text-[11px] font-normal'>
                        {matchingArticles.length} 篇文章
                      </Badge>

                      {cat.showInNav ? (
                        <Badge
                          variant='outline'
                          className='text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        >
                          导航展示
                        </Badge>
                      ) : (
                        <Badge variant='outline' className='text-[10px] text-muted-foreground'>
                          仅下拉
                        </Badge>
                      )}

                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleOpenEdit(cat)}
                        className='h-8 px-2 text-xs gap-1'
                      >
                        <Edit className='w-3.5 h-3.5' />
                        编辑
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <CategoryDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          category={selectedCat}
          taxonomyConfig={taxonomyConfig}
        />

        <CleanupDialog
          open={cleanupOpen}
          onOpenChange={setCleanupOpen}
          taxonomyConfig={taxonomyConfig}
          articles={articles}
        />
      </Main>
    </>
  )
}
