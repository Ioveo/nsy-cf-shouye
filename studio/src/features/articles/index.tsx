import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  FileText,
  Plus,
  Search,
  LayoutGrid,
  List,
  Save,
  RotateCcw,
  ExternalLink,
  Sparkles,
  Film,
  Radio,
  Share2,
  Bookmark,
  Loader2,
} from 'lucide-react'
import { useCatalog } from '@/hooks/use-catalog'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ArticleTable } from './article-table'
import { ArticleCards } from './article-cards'
import { ArticleWorkbench } from './workbench/article-workbench'
import { ArticleHeroTab } from './article-hero-tab'
import { ArticleBentoTab } from './article-bento-tab'
import { ArticleCinemaTab } from './article-cinema-tab'
import { ArticleWireAuthorsTab } from './article-wire-authors-tab'
import { ArticleFooterTab } from './article-footer-tab'
import {
  ArticlesPortalConfig,
  DEFAULT_ARTICLES_PORTAL_CONFIG,
} from './types'

export function ArticlesFeature() {
  const queryClient = useQueryClient()
  const { data: catalog, isLoading: isCatalogLoading } = useCatalog()

  // 1. 全网落地页配置状态 (articles-portal)
  const [config, setConfig] = useState<ArticlesPortalConfig>(DEFAULT_ARTICLES_PORTAL_CONFIG)
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)
  const [isSavingConfig, setIsSavingConfig] = useState(false)
  const [isRollingBack, setIsRollingBack] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // 2. 传统文章列表与编辑工作台状态
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<any | null>(null)

  const articlesList = (catalog as any)?.articles || []
  const softwareList = catalog?.software || []

  // 加载全网文章落地页配置
  useEffect(() => {
    let mounted = true
    async function loadPortalConfig() {
      try {
        const res = await api.post('/api/admin/config', { action: 'get', name: 'articles-portal' })
        if (mounted && res.success && res.config) {
          setConfig({
            ...DEFAULT_ARTICLES_PORTAL_CONFIG,
            ...res.config,
            brand: { ...DEFAULT_ARTICLES_PORTAL_CONFIG.brand, ...(res.config.brand || {}) },
            hero: { ...DEFAULT_ARTICLES_PORTAL_CONFIG.hero, ...(res.config.hero || {}) },
            bento: { ...DEFAULT_ARTICLES_PORTAL_CONFIG.bento, ...(res.config.bento || {}) },
            cinema: { ...DEFAULT_ARTICLES_PORTAL_CONFIG.cinema, ...(res.config.cinema || {}) },
            theWire: { ...DEFAULT_ARTICLES_PORTAL_CONFIG.theWire, ...(res.config.theWire || {}) },
            trending: { ...DEFAULT_ARTICLES_PORTAL_CONFIG.trending, ...(res.config.trending || {}) },
            authors: { ...DEFAULT_ARTICLES_PORTAL_CONFIG.authors, ...(res.config.authors || {}) },
            knowledgeGraph: { ...DEFAULT_ARTICLES_PORTAL_CONFIG.knowledgeGraph, ...(res.config.knowledgeGraph || {}) },
            newsletter: { ...DEFAULT_ARTICLES_PORTAL_CONFIG.newsletter, ...(res.config.newsletter || {}) },
            footer: { ...DEFAULT_ARTICLES_PORTAL_CONFIG.footer, ...(res.config.footer || {}) },
          })
        }
      } catch (err: any) {
        console.warn('加载文章频道配置异常，采用预设默认值:', err.message)
      } finally {
        if (mounted) setIsLoadingConfig(false)
      }
    }
    loadPortalConfig()
    return () => {
      mounted = false
    }
  }, [])

  // 保存落地页配置至 Cloudflare R2
  async function handleSaveConfig() {
    setIsSavingConfig(true)
    try {
      const res = await api.post('/api/admin/config', {
        action: 'save',
        name: 'articles-portal',
        data: config,
      })
      if (res.success) {
        toast.success('文章落地页配置已保存至 R2，前台实时生效！')
        setHasChanges(false)
      } else {
        toast.error(res.msg || '保存配置失败')
      }
    } catch (err: any) {
      toast.error(`保存异常：${err.message}`)
    } finally {
      setIsSavingConfig(false)
    }
  }

  // 回滚配置
  async function handleRollback() {
    if (!confirm('确定要回滚到上一次保存的文章落地页配置吗？')) return
    setIsRollingBack(true)
    try {
      const res = await api.post('/api/admin/config', {
        action: 'rollback',
        name: 'articles-portal',
      })
      if (res.success && res.config) {
        setConfig(res.config)
        setHasChanges(false)
        toast.success('已回滚至上一个版本配置')
      } else {
        toast.error(res.msg || '回滚失败')
      }
    } catch (err: any) {
      toast.error(`回滚异常：${err.message}`)
    } finally {
      setIsRollingBack(false)
    }
  }

  // 过滤文章
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
    const slugOrId = encodeURIComponent(art.slug || art.id)
    const previewFlag = art.status === 'draft' ? '&preview=1' : ''
    window.open(`/article.html?slug=${slugOrId}${previewFlag}`, '_blank')
  }

  return (
    <div className='space-y-6'>
      {/* 顶部主标题与操作动作 */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
            <FileText className='size-6 text-primary' />
            <span>白卷 · 杂志特稿与文章专栏</span>
            {hasChanges && (
              <span className='text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 font-normal'>
                ● 未保存更改
              </span>
            )}
          </h1>
          <p className='text-xs text-muted-foreground mt-1'>
            管理前台视觉杂志落地页、Hero 媒体与文案、编辑精选、电影滑轨及专栏撰写。
          </p>
        </div>

        {/* 顶部按钮组合：保存配置、回滚、预览前台、撰写新文章 */}
        <div className='flex items-center gap-2 flex-wrap'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleRollback}
            disabled={isRollingBack || isLoadingConfig}
            className='gap-1.5 text-xs'
          >
            {isRollingBack ? <Loader2 className='size-3.5 animate-spin' /> : <RotateCcw className='size-3.5' />}
            <span>回滚</span>
          </Button>

          <Button
            size='sm'
            onClick={handleSaveConfig}
            disabled={isSavingConfig || isLoadingConfig}
            className='gap-1.5 text-xs'
          >
            {isSavingConfig ? <Loader2 className='size-3.5 animate-spin' /> : <Save className='size-3.5' />}
            <span>保存全站落地页</span>
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={() => window.open('/articles.html', '_blank')}
            className='gap-1.5 text-xs'
          >
            <ExternalLink className='size-3.5' />
            <span>预览落地页</span>
          </Button>

          <Button onClick={handleOpenCreate} size='sm' className='gap-1.5 text-xs bg-primary'>
            <Plus className='size-3.5' />
            <span>撰写新文章</span>
          </Button>
        </div>
      </div>

      {/* 六大模块 Tabs 选项卡 */}
      <Tabs defaultValue='articles' className='space-y-4'>
        <TabsList className='h-10 p-1 flex items-center gap-1 overflow-x-auto w-full justify-start border bg-muted/40'>
          <TabsTrigger value='articles' className='gap-1.5 text-xs'>
            <FileText className='size-3.5' />
            <span>文章内容管理 ({articlesList.length})</span>
          </TabsTrigger>

          <TabsTrigger value='hero' className='gap-1.5 text-xs'>
            <Bookmark className='size-3.5 text-amber-500' />
            <span>首屏 Hero 与刊号</span>
          </TabsTrigger>

          <TabsTrigger value='bento' className='gap-1.5 text-xs'>
            <LayoutGrid className='size-3.5 text-primary' />
            <span>编辑精选 (Bento 4格)</span>
          </TabsTrigger>

          <TabsTrigger value='cinema' className='gap-1.5 text-xs'>
            <Film className='size-3.5 text-cyan-500' />
            <span>影像特稿 (电影滑轨)</span>
          </TabsTrigger>

          <TabsTrigger value='wire-authors' className='gap-1.5 text-xs'>
            <Radio className='size-3.5 text-emerald-500' />
            <span>快讯·热榜·驻站作者</span>
          </TabsTrigger>

          <TabsTrigger value='footer' className='gap-1.5 text-xs'>
            <Share2 className='size-3.5 text-purple-500' />
            <span>知识网络·订阅·页脚</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: 专栏文章列表 */}
        <TabsContent value='articles' className='space-y-4'>
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

          {isCatalogLoading ? (
            <div className='space-y-3'>
              <div className='h-10 w-full bg-muted/40 animate-pulse rounded-lg' />
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
        </TabsContent>

        {/* Tab 2: Hero 设置 */}
        <TabsContent value='hero'>
          <ArticleHeroTab
            brand={config.brand}
            hero={config.hero}
            onChangeBrand={(b) => {
              setConfig({ ...config, brand: b })
              setHasChanges(true)
            }}
            onChangeHero={(h) => {
              setConfig({ ...config, hero: h })
              setHasChanges(true)
            }}
          />
        </TabsContent>

        {/* Tab 3: Bento 设置 */}
        <TabsContent value='bento'>
          <ArticleBentoTab
            bento={config.bento}
            articles={articlesList}
            onChangeBento={(b) => {
              setConfig({ ...config, bento: b })
              setHasChanges(true)
            }}
          />
        </TabsContent>

        {/* Tab 4: 电影滑轨 Cinema 设置 */}
        <TabsContent value='cinema'>
          <ArticleCinemaTab
            cinema={config.cinema}
            onChangeCinema={(c) => {
              setConfig({ ...config, cinema: c })
              setHasChanges(true)
            }}
          />
        </TabsContent>

        {/* Tab 5: 快讯·热榜·作者设置 */}
        <TabsContent value='wire-authors'>
          <ArticleWireAuthorsTab
            theWire={config.theWire}
            trending={config.trending}
            authors={config.authors}
            onChangeWire={(w) => {
              setConfig({ ...config, theWire: w })
              setHasChanges(true)
            }}
            onChangeTrending={(t) => {
              setConfig({ ...config, trending: t })
              setHasChanges(true)
            }}
            onChangeAuthors={(a) => {
              setConfig({ ...config, authors: a })
              setHasChanges(true)
            }}
          />
        </TabsContent>

        {/* Tab 6: 知识网络·订阅·页脚设置 */}
        <TabsContent value='footer'>
          <ArticleFooterTab
            knowledgeGraph={config.knowledgeGraph}
            newsletter={config.newsletter}
            footer={config.footer}
            onChangeGraph={(g) => {
              setConfig({ ...config, knowledgeGraph: g })
              setHasChanges(true)
            }}
            onChangeNewsletter={(n) => {
              setConfig({ ...config, newsletter: n })
              setHasChanges(true)
            }}
            onChangeFooter={(f) => {
              setConfig({ ...config, footer: f })
              setHasChanges(true)
            }}
          />
        </TabsContent>
      </Tabs>

      {/* 文章编辑/撰写全功能工作台 */}
      {editorOpen && (
        <ArticleWorkbench
          article={editingArticle}
          softwareList={softwareList}
          articlesCount={articlesList.length}
          onClose={() => setEditorOpen(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['catalog'] })
            setEditorOpen(false)
          }}
        />
      )}
    </div>
  )
}
