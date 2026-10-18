import { useState, useEffect } from 'react'
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  Loader2,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useConfig, useCatalog, type PromotionsConfig, type PromotionItem } from '@/lib/queries'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PromoTable } from './promo-table'
import { PromoDrawer } from './promo-drawer'

export function PromotionsFeature() {
  const queryClient = useQueryClient()
  const { data: promoConfig, isLoading: isPromoLoading } = useConfig<PromotionsConfig>('promotions')
  const { data: catalog, isLoading: isCatalogLoading } = useCatalog()

  const [search, setSearch] = useState('')
  const [placementFilter, setPlacementFilter] = useState('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PromotionItem | null>(null)
  const [isMoving, setIsMoving] = useState(false)

  const items = promoConfig?.items || []
  const softwareList = catalog?.software || []
  const articlesList = (catalog as any)?.articles || []

  // 支持通过 URL 参数快捷创建推广
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const entityType = params.get('createEntity')
    const targetId = params.get('id')
    if (entityType && targetId) {
      setEditingItem({
        id: `promo_${Date.now()}`,
        placements: ['software'],
        entity: { type: entityType as any, id: targetId },
        override: { title: '', subtitle: '', image: '', ctaText: '', ctaHref: '' },
        badge: '限时推荐',
        startAt: 0,
        endAt: 0,
        status: 'active',
        order: items.length * 10,
      })
      setDrawerOpen(true)
    }
  }, [items.length])

  // 过滤项
  const filteredItems = items.filter((item) => {
    const matchSearch =
      (item.override?.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.override?.subtitle || '').toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase())

    const matchPlacement =
      placementFilter === 'all' || (item.placements || []).includes(placementFilter)

    return matchSearch && matchPlacement
  })

  // 保存或新增推广位
  async function handleSaveItem(item: PromotionItem) {
    const nextItems = [...items]
    const existingIndex = nextItems.findIndex((x) => x.id === item.id)

    if (existingIndex >= 0) {
      nextItems[existingIndex] = item
    } else {
      nextItems.push(item)
    }

    const res = await api.post('/api/admin/config', {
      action: 'save',
      name: 'promotions',
      data: { items: nextItems },
    })

    if (res.success) {
      toast.success('推广位已保存生效')
      queryClient.setQueryData(['config', 'promotions'], res.config)
    } else {
      throw new Error(res.msg || '保存推广位失败')
    }
  }

  // 切换状态
  async function handleToggleStatus(item: PromotionItem) {
    const nextStatus = item.status === 'active' ? 'paused' : 'active'
    const nextItems = items.map((x) => (x.id === item.id ? { ...x, status: nextStatus } : x))

    try {
      const res = await api.post('/api/admin/config', {
        action: 'save',
        name: 'promotions',
        data: { items: nextItems },
      })
      if (res.success) {
        toast.success(`推广位已切换为「${nextStatus === 'active' ? '生效' : '暂停'}」`)
        queryClient.setQueryData(['config', 'promotions'], res.config)
      } else {
        toast.error(res.msg || '状态切换失败')
      }
    } catch (e: any) {
      toast.error(`状态切换异常：${e.message}`)
    }
  }

  // 删除推广位
  async function handleDelete(id: string) {
    if (!confirm('确定要删除此推广位吗？')) return
    const nextItems = items.filter((x) => x.id !== id)
    try {
      const res = await api.post('/api/admin/config', {
        action: 'save',
        name: 'promotions',
        data: { items: nextItems },
      })
      if (res.success) {
        toast.success('推广位已删除')
        queryClient.setQueryData(['config', 'promotions'], res.config)
      } else {
        toast.error(res.msg || '删除失败')
      }
    } catch (e: any) {
      toast.error(`删除异常：${e.message}`)
    }
  }

  // 上移/下移排序
  async function handleMove(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= items.length) return

    const reordered = [...items]
    const temp = reordered[index]
    reordered[index] = reordered[targetIndex]
    reordered[targetIndex] = temp

    // 重新赋予 order 字段保证单调
    const updated = reordered.map((item, idx) => ({ ...item, order: idx * 10 }))

    setIsMoving(true)
    try {
      const res = await api.post('/api/admin/config', {
        action: 'save',
        name: 'promotions',
        data: { items: updated },
      })
      if (res.success) {
        toast.success('推广顺序已更新')
        queryClient.setQueryData(['config', 'promotions'], res.config)
      } else {
        toast.error(res.msg || '排序失败')
      }
    } catch (e: any) {
      toast.error(`排序更新异常：${e.message}`)
    } finally {
      setIsMoving(false)
    }
  }

  function handleOpenCreate() {
    setEditingItem(null)
    setDrawerOpen(true)
  }

  function handleOpenEdit(item: PromotionItem) {
    setEditingItem(item)
    setDrawerOpen(true)
  }

  return (
    <div className='space-y-6'>
      {/* 头部标题与新建按钮 */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
            <Sparkles className='size-6 text-primary' />
            <span>统一推广位管理</span>
          </h1>
          <p className='text-xs text-muted-foreground mt-1'>
            统一调度官网首页、软件中心、音乐频道与文章专栏的首屏焦点推广。
          </p>
        </div>

        <Button onClick={handleOpenCreate} className='gap-1.5'>
          <Plus className='size-4' />
          <span>新建推广位</span>
        </Button>
      </div>

      {/* 搜索与过滤工具栏 */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <div className='flex items-center gap-2 flex-1 max-w-sm'>
          <div className='relative flex-1'>
            <Search className='absolute left-2.5 top-2.5 size-3.5 text-muted-foreground' />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='搜索推广标题或 ID...'
              className='h-8 pl-8 text-xs'
            />
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <select
            value={placementFilter}
            onChange={(e) => setPlacementFilter(e.target.value)}
            className='h-8 rounded-md border bg-background px-2.5 text-xs'
          >
            <option value='all'>全部投放页面</option>
            <option value='software'>软件中心 (download.html)</option>
            <option value='portal'>官网综合门户 (portal.html)</option>
            <option value='music'>音乐频道 (music.html)</option>
            <option value='articles'>文章专栏 (articles.html)</option>
          </select>
        </div>
      </div>

      {/* 推广位表格 */}
      {isPromoLoading || isCatalogLoading ? (
        <div className='flex items-center justify-center p-12 text-muted-foreground'>
          <Loader2 className='size-5 animate-spin mr-2' />
          <span className='text-xs'>正在载入推广位数据...</span>
        </div>
      ) : (
        <PromoTable
          items={filteredItems}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
          onMove={handleMove}
          isMoving={isMoving}
        />
      )}

      {/* 新建/编辑抽屉 */}
      <PromoDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSaveItem}
        editingItem={editingItem}
        softwareList={softwareList}
        articlesList={articlesList}
      />
    </div>
  )
}
