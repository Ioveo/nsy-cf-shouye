import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  FileText,
  Plus,
  Search,
  LayoutGrid,
  List,
} from 'lucide-react'
import { useCatalog } from '@/hooks/use-catalog'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArticleTable } from './article-table'
import { ArticleCards } from './article-cards'
import { ArticleEditorDialog } from './article-editor-dialog'

export function ArticlesFeature() {
  const queryClient = useQueryClient()
  const { data: catalog, isLoading } = useCatalog()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<any | null>(null)
  const [previewArticle, setPreviewArticle] = useState<any | null>(null)

  const articlesList = (catalog as any)?.articles || []
  const softwareList = catalog?.software || []

  // Filtered articles
  const filteredArticles = articlesList.filter((a: any) => {
    const matchSearch =
      (a.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.summary || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.slug || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || (a.status || 'published') === statusFilter
    return matchSearch && matchStatus
  })

  function handleOpenCreate() {
    setEditingArticle(null)
    setEditorOpen(true)
  }

  function handleOpenEdit(art: any) {
    setEditingArticle(art)
    setEditorOpen(true)
  }

  async function handleDelete(art: any) {
    if (!confirm(`确定要删除文章「${art.title}」吗？`)) return
    try {
      const res = await api.post('/api/admin/articles', { action: 'delete', id: art.id })
      if (res.success) {
        toast.success(`文章「${art.title}」已删除`)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '删除文章失败')
      }
    } catch (err: any) {
      toast.error(`删除异常：${err.message}`)
    }
  }

  function handlePreview(art: any) {
    window.open(`/article.html?id=${art.id}`, '_blank')
  }

  return (
    <div className='space-y-6'>
      {/* 头部标题与快捷操作 */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
            <FileText className='size-6 text-primary' />
            <span>文章专栏管理</span>
          </h1>
          <p className='text-xs text-muted-foreground mt-1'>
            发布官方使用教程、版本发布说明与深度技术专栏。
          </p>
        </div>
        <Button onClick={handleOpenCreate} className='gap-2'>
          <Plus className='size-4' />
          <span>撰写新文章</span>
        </Button>
      </div>

      {/* 搜索与视图控制栏 */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <div className='flex items-center gap-2 flex-1 max-w-md'>
          <div className='relative flex-1'>
            <Search className='absolute left-2.5 top-2.5 size-3.5 text-muted-foreground' />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='搜索文章标题或 Slug...'
              className='h-8 pl-8 text-xs'
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className='h-8 rounded-md border border-input bg-background px-3 text-xs'
          >
            <option value='all'>全状态</option>
            <option value='published'>已发布</option>
            <option value='draft'>草稿箱</option>
          </select>
        </div>

        <div className='flex items-center gap-1 border rounded-lg p-0.5 bg-muted/40'>
          <Button
            size='sm'
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            className='h-7 px-2.5 text-xs gap-1'
            onClick={() => setViewMode('table')}
          >
            <List className='size-3.5' />
            <span>表格</span>
          </Button>
          <Button
            size='sm'
            variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
            className='h-7 px-2.5 text-xs gap-1'
            onClick={() => setViewMode('cards')}
          >
            <LayoutGrid className='size-3.5' />
            <span>卡片</span>
          </Button>
        </div>
      </div>

      {/* 骨架屏 / 内容展示 */}
      {isLoading ? (
        <div className='space-y-3'>
          <div className='h-10 w-full bg-muted/40 animate-pulse rounded-lg' />
          <div className='h-16 w-full bg-muted/30 animate-pulse rounded-lg' />
          <div className='h-16 w-full bg-muted/30 animate-pulse rounded-lg' />
          <div className='h-16 w-full bg-muted/30 animate-pulse rounded-lg' />
        </div>
      ) : viewMode === 'table' ? (
        <ArticleTable
          articles={filteredArticles}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onPreview={handlePreview}
        />
      ) : (
        <ArticleCards
          articles={filteredArticles}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onPreview={handlePreview}
        />
      )}

      {/* 文章编辑对话框 */}
      {editorOpen && (
        <ArticleEditorDialog
          open={editorOpen}
          article={editingArticle}
          softwareList={softwareList}
          articlesCount={articlesList.length}
          onClose={() => setEditorOpen(false)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['catalog'] })}
        />
      )}
    </div>
  )
}
