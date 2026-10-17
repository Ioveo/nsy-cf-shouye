import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  FolderTree,
  Upload,
  Plus,
  Search,
  Loader2,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCatalog, Software } from '@/lib/queries'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CategoryDialog } from './category-dialog'
import { QuickUploadDialog } from './quick-upload-dialog'
import { SoftwareDeleteDialogs } from './software-delete-dialogs'
import { SoftwareTable } from './software-table'

export function SoftwareFeature() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: catalog, isLoading } = useCatalog()

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Fast reordering state
  const [isSavingOrder, setIsSavingOrder] = useState(false)

  // Delete software state
  const [deletingSoftware, setDeletingSoftware] = useState<Software | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [forceDeleteConfirmOpen, setForceDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Modals state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [quickUploadOpen, setQuickUploadOpen] = useState(false)

  // Live preview modal state
  const [previewSoftware, setPreviewSoftware] = useState<Software | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const softwareList = catalog?.software || []
  const categories = catalog?.categories || []
  const releases = catalog?.releases || []

  // Filtered list
  const filteredSoftware = softwareList.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase()) ||
      (s.tagline || '').toLowerCase().includes(search.toLowerCase())
    const matchCategory =
      selectedCategory === 'all' || s.categoryId === selectedCategory
    const matchStatus =
      statusFilter === 'all' || (s.status || 'active') === statusFilter
    return matchSearch && matchCategory && matchStatus
  })

  // Toggle Featured switch (Instant serial save)
  async function handleToggleFeatured(sw: Software, nextFeatured: boolean) {
    try {
      const payload = {
        ...sw,
        id: sw.id || sw.slug,
        featured: nextFeatured,
      }
      const res = await api.post('/api/admin/software', payload)
      if (res.success) {
        toast.success(nextFeatured ? `已将「${sw.name}」设为主推` : `已取消「${sw.name}」的主推`)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '切换主推失败')
      }
    } catch (e: any) {
      toast.error(`操作异常：${e.message}`)
    }
  }

  // Quick toggle status (active <-> draft/disabled)
  async function handleToggleStatus(sw: Software) {
    const nextStatus = sw.status === 'active' ? 'disabled' : 'active'
    try {
      const payload = {
        ...sw,
        id: sw.id || sw.slug,
        status: nextStatus,
      }
      const res = await api.post('/api/admin/software', payload)
      if (res.success) {
        toast.success(`软件状态已切换为「${nextStatus === 'active' ? '上架' : '下架'}」`)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '切换状态失败')
      }
    } catch (e: any) {
      toast.error(`操作异常：${e.message}`)
    }
  }

  // Serial reorder saving (Rule 4: for ... await)
  async function handleMove(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= filteredSoftware.length) return

    const reordered = [...softwareList]
    const itemA = filteredSoftware[index]
    const itemB = filteredSoftware[targetIndex]

    const idxA = reordered.findIndex((s) => s.id === itemA.id || s.slug === itemA.slug)
    const idxB = reordered.findIndex((s) => s.id === itemB.id || s.slug === itemB.slug)

    if (idxA < 0 || idxB < 0) return

    // Swap sortOrders
    const tempOrder = itemA.sortOrder ?? idxA
    itemA.sortOrder = itemB.sortOrder ?? idxB
    itemB.sortOrder = tempOrder

    setIsSavingOrder(true)
    try {
      // Must save serially
      await api.post('/api/admin/software', { ...itemA, id: itemA.id || itemA.slug })
      await api.post('/api/admin/software', { ...itemB, id: itemB.id || itemB.slug })
      toast.success('排序已保存')
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    } catch (e: any) {
      toast.error(`排序保存失败：${e.message}`)
    } finally {
      setIsSavingOrder(false)
    }
  }

  // Open delete confirm
  function handleOpenDelete(sw: Software) {
    setDeletingSoftware(sw)
    setDeleteConfirmOpen(true)
  }

  // Execute delete software
  async function executeDeleteSoftware(force = false) {
    if (!deletingSoftware) return
    setIsDeleting(true)
    try {
      const res = await api.post('/api/admin/software/delete', {
        id: deletingSoftware.id || deletingSoftware.slug,
        force,
      })
      if (res.success) {
        toast.success(`软件「${deletingSoftware.name}」已成功删除`)
        setDeleteConfirmOpen(false)
        setForceDeleteConfirmOpen(false)
        setDeletingSoftware(null)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else if (res.hasReleases && !force) {
        setDeleteConfirmOpen(false)
        setForceDeleteConfirmOpen(true)
      } else {
        toast.error(res.msg || '删除失败')
      }
    } catch (e: any) {
      toast.error(`删除异常：${e.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>软件管理</h1>
          <p className='text-sm text-muted-foreground'>
            统一管理软件档案、多平台安装包、版本发布与首屏轮播主推
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setCategoryModalOpen(true)}
            className='gap-1.5'
          >
            <FolderTree className='size-4 text-primary' />
            分类管理
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={() => setQuickUploadOpen(true)}
            className='gap-1.5'
          >
            <Upload className='size-4 text-primary' />
            上传新版本
          </Button>

          <Button
            size='sm'
            asChild
            className='gap-1.5 bg-primary text-primary-foreground font-medium shadow-sm'
          >
            <Link to='/software/new'>
              <Plus className='size-4' /> 发布新软件
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-1 items-center gap-2 max-w-md'>
          <div className='relative w-full'>
            <Search className='absolute left-2.5 top-2.5 size-4 text-muted-foreground' />
            <Input
              placeholder='搜索软件名称、Slug、一句话介绍...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='h-9 pl-9 text-xs bg-card/60'
            />
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className='h-9 rounded-md border border-input bg-card/60 px-3 py-1 text-xs shadow-xs focus:outline-hidden'
          >
            <option value='all'>全部分类 ({softwareList.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className='h-9 rounded-md border border-input bg-card/60 px-3 py-1 text-xs shadow-xs focus:outline-hidden'
          >
            <option value='all'>全部状态</option>
            <option value='active'>已上架 (Active)</option>
            <option value='draft'>草稿箱 (Draft)</option>
            <option value='disabled'>已下架 (Disabled)</option>
          </select>

          {isSavingOrder && (
            <Badge variant='outline' className='gap-1 text-xs text-amber-400 border-amber-500/40 bg-amber-500/10'>
              <Loader2 className='size-3 animate-spin' /> 正在保存排序...
            </Badge>
          )}
        </div>
      </div>

      {/* Software Table with New (新品) badge column */}
      <SoftwareTable
        isLoading={isLoading}
        softwareList={filteredSoftware}
        categories={categories}
        releases={releases}
        isSavingOrder={isSavingOrder}
        onToggleFeatured={handleToggleFeatured}
        onToggleStatus={handleToggleStatus}
        onMove={handleMove}
        onOpenDelete={handleOpenDelete}
        onOpenPreview={(sw) => {
          setPreviewSoftware(sw)
          setPreviewOpen(true)
        }}
      />

      {/* Modals */}
      <CategoryDialog
        open={categoryModalOpen}
        categories={categories}
        onOpenChange={setCategoryModalOpen}
      />

      <QuickUploadDialog
        open={quickUploadOpen}
        softwareList={softwareList}
        onOpenChange={setQuickUploadOpen}
      />

      <SoftwareDeleteDialogs
        software={deletingSoftware}
        deleteConfirmOpen={deleteConfirmOpen}
        forceDeleteConfirmOpen={forceDeleteConfirmOpen}
        isDeleting={isDeleting}
        onDeleteConfirmChange={setDeleteConfirmOpen}
        onForceDeleteConfirmChange={setForceDeleteConfirmOpen}
        onExecuteDelete={executeDeleteSoftware}
      />

      {/* Live Preview Modal */}
      {previewOpen && previewSoftware && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className='max-w-5xl h-[85vh] p-0 flex flex-col overflow-hidden'>
            <DialogHeader className='p-4 border-b bg-muted/20 flex flex-row items-center justify-between'>
              <DialogTitle className='text-sm'>
                「{previewSoftware.name}」前台详情页预览
              </DialogTitle>
              <Button size='sm' variant='outline' className='h-7 text-xs' onClick={() => setPreviewOpen(false)}>
                关闭预览
              </Button>
            </DialogHeader>
            <div className='flex-1 w-full h-full bg-background'>
              <iframe
                src={`/software.html?slug=${previewSoftware.slug}&preview=1&v=${Date.now()}`}
                className='w-full h-full border-0'
                title='软件详情预览'
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
