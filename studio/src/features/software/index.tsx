import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Layers,
  Plus,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  FolderTree,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Upload,
  Eye,
  CheckCircle2,
  Circle,
  Copy,
  ArrowUp,
  ArrowDown,
  Monitor,
  Apple,
  Terminal,
  FolderArchive,
  Smartphone,
  Sparkles,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCatalog, Software, Category, Release } from '@/lib/queries'
import { api } from '@/lib/api'
// @ts-ignore
import { uploadReleaseFile, formatBytes } from '@r2'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

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

  // Category modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isSavingCategory, setIsSavingCategory] = useState(false)

  // Quick Upload new release state (Entry 2)
  const [quickUploadOpen, setQuickUploadOpen] = useState(false)
  const [uploadSwSlug, setUploadSwSlug] = useState('')
  const [uploadVersion, setUploadVersion] = useState('')
  const [uploadChangelog, setUploadChangelog] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isQuickUploading, setIsQuickUploading] = useState(false)

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

  // Format date
  function formatDate(ts?: number | string) {
    if (!ts) return '-'
    const d = new Date(Number(ts) || ts)
    if (isNaN(d.getTime())) return '-'
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  // Calculate software stats
  function getSoftwareStats(sw: Software) {
    const swReleases = (sw.releases || releases.filter((r) => r.softwareId === sw.slug || r.softwareId === sw.id)) || []
    const totalDownloads = swReleases.reduce((sum, r) => sum + (Number(r.downloadCount) || 0), 0)
    const latestRel = swReleases.find((r) => r.isLatest) || swReleases[0]
    const platforms = Array.from(
      new Set(
        swReleases
          .map((r) => r.platform || 'windows')
          .filter(Boolean)
      )
    )
    return {
      totalDownloads,
      latestVersion: latestRel ? `v${latestRel.version}` : '待上传',
      platforms,
      releaseCount: swReleases.length,
    }
  }

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
        toast.success(`软件「${deletingSoftware.name}」已删除`)
        setDeleteConfirmOpen(false)
        setForceDeleteConfirmOpen(false)
        setDeletingSoftware(null)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else if (res.needForce) {
        setDeleteConfirmOpen(false)
        setForceDeleteConfirmOpen(true)
      } else {
        toast.error(res.msg || '删除失败')
      }
    } catch (err: any) {
      if (err.data?.needForce) {
        setDeleteConfirmOpen(false)
        setForceDeleteConfirmOpen(true)
      } else {
        toast.error(`删除异常：${err.message}`)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  // Quick Release upload (Entry 2)
  async function handleQuickUploadSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!uploadSwSlug || !uploadVersion.trim() || !uploadFile) {
      toast.error('请填写版本号并选择安装包')
      return
    }

    setIsQuickUploading(true)
    try {
      const res = await uploadReleaseFile(uploadFile, {
        softwareId: uploadSwSlug,
        version: uploadVersion.trim(),
        changelog: uploadChangelog.trim(),
        isLatest: true,
      })

      if (res.success) {
        toast.success('新版本安装包上传成功！')
        setQuickUploadOpen(false)
        setUploadFile(null)
        setUploadVersion('')
        setUploadChangelog('')
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '版本发布失败')
      }
    } catch (e: any) {
      toast.error(`发布异常：${e.message}`)
    } finally {
      setIsQuickUploading(false)
    }
  }

  // Platform icon helper
  function renderPlatformIcon(plat: string) {
    switch (plat) {
      case 'windows':
        return <Monitor className='size-3 text-sky-400' />
      case 'macos':
        return <Apple className='size-3 text-slate-300' />
      case 'linux':
        return <Terminal className='size-3 text-amber-400' />
      case 'portable':
        return <FolderArchive className='size-3 text-emerald-400' />
      case 'android':
        return <Smartphone className='size-3 text-emerald-300' />
      default:
        return <Layers className='size-3 text-muted-foreground' />
    }
  }

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 pt-0 md:gap-6 md:p-8'>
      {/* Header */}
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
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
            onClick={() => {
              setUploadSwSlug(softwareList[0]?.slug || '')
              setUploadVersion('')
              setUploadChangelog('')
              setUploadFile(null)
              setQuickUploadOpen(true)
            }}
            className='gap-1.5'
          >
            <Upload className='size-4 text-primary' />
            上传新版本
          </Button>

          <Button
            size='sm'
            onClick={() => navigate({ to: '/software/new' })}
            className='gap-1.5 bg-primary text-primary-foreground font-medium shadow-sm'
          >
            <Plus className='size-4' />
            发布新软件
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
              className='pl-9 bg-card/60'
            />
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className='h-9 rounded-md border border-input bg-card/60 px-3 py-1 text-xs text-foreground shadow-sm'
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
            className='h-9 rounded-md border border-input bg-card/60 px-3 py-1 text-xs text-foreground shadow-sm'
          >
            <option value='all'>全部状态</option>
            <option value='active'>已上架 (Active)</option>
            <option value='draft'>草稿 (Draft)</option>
            <option value='disabled'>已下架 (Disabled)</option>
          </select>

          {isSavingOrder && (
            <Badge variant='outline' className='gap-1 text-xs text-amber-400 border-amber-500/40 bg-amber-500/10'>
              <Loader2 className='size-3 animate-spin' /> 正在保存排序...
            </Badge>
          )}
        </div>
      </div>

      {/* Software Table */}
      <div className='rounded-xl border border-border/60 bg-card/60 overflow-hidden backdrop-blur-sm'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-sm'>
            <thead className='border-b border-border/60 bg-muted/40 text-xs font-semibold uppercase text-muted-foreground'>
              <tr>
                <th className='px-4 py-3'>图标 & 软件名称</th>
                <th className='px-4 py-3'>分类</th>
                <th className='px-4 py-3'>支持平台</th>
                <th className='px-4 py-3'>最新版本</th>
                <th className='px-4 py-3 text-center'>总下载</th>
                <th className='px-4 py-3 text-center'>首屏主推</th>
                <th className='px-4 py-3 text-center'>状态</th>
                <th className='px-4 py-3'>更新时间</th>
                <th className='px-4 py-3 text-right'>操作</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border/40'>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className='px-4 py-12 text-center text-muted-foreground'>
                    <Loader2 className='mx-auto size-6 animate-spin text-primary' />
                    <p className='mt-2 text-xs'>加载软件列表中...</p>
                  </td>
                </tr>
              ) : filteredSoftware.length === 0 ? (
                <tr>
                  <td colSpan={9} className='px-4 py-12 text-center text-muted-foreground'>
                    <div className='flex flex-col items-center justify-center gap-2'>
                      <Layers className='size-8 text-muted-foreground/40' />
                      <p className='text-sm'>未找到符合条件的软件</p>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => navigate({ to: '/software/new' })}
                        className='mt-2 gap-1.5'
                      >
                        <Plus className='size-3.5' /> 发布第一个软件
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSoftware.map((sw, index) => {
                  const cat = categories.find((c) => c.id === sw.categoryId)
                  const stats = getSoftwareStats(sw)
                  const isDraft = sw.status === 'draft'
                  const isDisabled = sw.status === 'disabled'
                  const isActive = sw.status === 'active' || (!sw.status && !isDraft && !isDisabled)

                  return (
                    <tr key={sw.slug} className='hover:bg-muted/30 transition-colors'>
                      {/* Name & Icon */}
                      <td className='px-4 py-3'>
                        <div className='flex items-center gap-3'>
                          <div className='relative size-10 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-background/80 shadow-xs flex items-center justify-center'>
                            {sw.iconUrl || sw.icon ? (
                              <img
                                src={sw.iconUrl || sw.icon}
                                alt={sw.name}
                                className='size-full object-cover'
                              />
                            ) : (
                              <div className='font-bold text-primary'>
                                {sw.name[0] || '软'}
                              </div>
                            )}
                          </div>
                          <div className='min-w-0'>
                            <div className='font-semibold text-foreground flex items-center gap-1.5'>
                              <span className='truncate'>{sw.name}</span>
                              {sw.landingUrl && (
                                <a
                                  href={sw.landingUrl}
                                  target='_blank'
                                  rel='noreferrer'
                                  className='text-muted-foreground hover:text-primary'
                                  title={`专属详情页: ${sw.landingUrl}`}
                                >
                                  <ExternalLink className='size-3' />
                                </a>
                              )}
                            </div>
                            <div className='font-mono text-xs text-muted-foreground flex items-center gap-2'>
                              <span>{sw.slug}</span>
                              {sw.tagline && (
                                <span className='truncate max-w-[180px] text-muted-foreground/80' title={sw.tagline}>
                                  · {sw.tagline}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className='px-4 py-3'>
                        <Badge variant='outline' className='text-xs'>
                          {cat?.name || sw.categoryId || '通用'}
                        </Badge>
                      </td>

                      {/* Platform Badges */}
                      <td className='px-4 py-3'>
                        <div className='flex flex-wrap items-center gap-1'>
                          {stats.platforms.length === 0 ? (
                            <span className='text-xs text-muted-foreground'>无安装包</span>
                          ) : (
                            stats.platforms.map((p) => (
                              <span
                                key={p}
                                className='inline-flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono'
                                title={p}
                              >
                                {renderPlatformIcon(p)}
                                <span>{p}</span>
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      {/* Latest Version */}
                      <td className='px-4 py-3'>
                        <Badge
                          variant='secondary'
                          className='font-mono text-xs font-medium'
                        >
                          {stats.latestVersion}
                        </Badge>
                      </td>

                      {/* Total Downloads */}
                      <td className='px-4 py-3 text-center font-mono text-xs font-semibold text-foreground'>
                        {stats.totalDownloads.toLocaleString()}
                      </td>

                      {/* Featured Switch */}
                      <td className='px-4 py-3 text-center'>
                        <div className='flex items-center justify-center gap-1.5'>
                          <Switch
                            checked={Boolean(sw.featured)}
                            onCheckedChange={(val) => handleToggleFeatured(sw, val)}
                          />
                          {sw.featured && (
                            <span title='已设为主推'>
                              <Sparkles className='size-3 text-primary animate-pulse' />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className='px-4 py-3 text-center'>
                        {isActive && (
                          <Badge variant='outline' className='border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-xs'>
                            已上架
                          </Badge>
                        )}
                        {isDraft && (
                          <Badge variant='outline' className='border-amber-500/40 text-amber-400 bg-amber-500/10 text-xs'>
                            草稿
                          </Badge>
                        )}
                        {isDisabled && (
                          <Badge variant='outline' className='border-muted text-muted-foreground text-xs'>
                            已下架
                          </Badge>
                        )}
                      </td>

                      {/* Updated Time */}
                      <td className='px-4 py-3 text-xs text-muted-foreground whitespace-nowrap'>
                        {formatDate(sw.updatedAt)}
                      </td>

                      {/* Actions */}
                      <td className='px-4 py-3 text-right'>
                        <div className='flex items-center justify-end gap-1'>
                          {/* Reorder buttons */}
                          <Button
                            variant='ghost'
                            size='sm'
                            disabled={index === 0 || isSavingOrder}
                            className='size-7 p-0 text-muted-foreground hover:text-foreground'
                            onClick={() => handleMove(index, 'up')}
                            title='上移排序'
                          >
                            <ArrowUp className='size-3.5' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            disabled={index === filteredSoftware.length - 1 || isSavingOrder}
                            className='size-7 p-0 text-muted-foreground hover:text-foreground'
                            onClick={() => handleMove(index, 'down')}
                            title='下移排序'
                          >
                            <ArrowDown className='size-3.5' />
                          </Button>

                          {/* Edit button */}
                          <Button
                            variant='ghost'
                            size='sm'
                            className='size-7 p-0'
                            onClick={() => navigate({ to: `/software/${sw.slug}` })}
                            title='编辑软件资料'
                          >
                            <Edit2 className='size-3.5' />
                          </Button>

                          {/* More dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='sm' className='size-7 p-0'>
                                <MoreHorizontal className='size-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem
                                onClick={() => navigate({ to: `/software/${sw.slug}` })}
                              >
                                <Edit2 className='mr-2 size-4' />
                                进入向导编辑
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => {
                                  setUploadSwSlug(sw.slug)
                                  setUploadVersion('')
                                  setUploadChangelog('')
                                  setUploadFile(null)
                                  setQuickUploadOpen(true)
                                }}
                              >
                                <Upload className='mr-2 size-4 text-primary' />
                                上传新版本
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => {
                                  setPreviewSoftware(sw)
                                  setPreviewOpen(true)
                                }}
                              >
                                <Eye className='mr-2 size-4' />
                                在线预览详情页
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => {
                                  const url = `${window.location.origin}/download/latest/${sw.slug}`
                                  navigator.clipboard.writeText(url)
                                  toast.success('最新版直链已复制到剪贴板')
                                }}
                              >
                                <Copy className='mr-2 size-4' />
                                复制最新下载链接
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem onClick={() => handleToggleStatus(sw)}>
                                {isActive ? (
                                  <>
                                    <Circle className='mr-2 size-4 text-amber-400' />
                                    下架此软件
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className='mr-2 size-4 text-emerald-400' />
                                    重新上架
                                  </>
                                )}
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className='text-destructive focus:text-destructive'
                                onClick={() => {
                                  setDeletingSoftware(sw)
                                  setDeleteConfirmOpen(true)
                                }}
                              >
                                <Trash2 className='mr-2 size-4' />
                                删除软件
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-destructive'>
              <AlertTriangle className='size-5' />
              确认删除软件
            </DialogTitle>
            <DialogDescription>
              确定要删除软件「{deletingSoftware?.name}」吗？如果该软件下已关联版本安装包，将需要进行二次确认。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              disabled={isDeleting}
              onClick={() => setDeleteConfirmOpen(false)}
            >
              取消
            </Button>
            <Button
              variant='destructive'
              disabled={isDeleting}
              onClick={() => executeDeleteSoftware(false)}
            >
              {isDeleting ? <Loader2 className='size-3.5 animate-spin mr-1' /> : null}
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Force Delete Confirmation Dialog (When software has releases) */}
      <Dialog open={forceDeleteConfirmOpen} onOpenChange={setForceDeleteConfirmOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-destructive'>
              <AlertTriangle className='size-5' />
              强行删除确认
            </DialogTitle>
            <DialogDescription className='space-y-2 text-xs'>
              <p className='text-amber-300 font-medium'>
                注意：该软件下存在已发布的安装包记录！
              </p>
              <p>
                强行删除将一并移除所有关联的版本元数据，前台将不再提供下载。请再次确认是否强行删除？
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              disabled={isDeleting}
              onClick={() => setForceDeleteConfirmOpen(false)}
            >
              取消
            </Button>
            <Button
              variant='destructive'
              disabled={isDeleting}
              onClick={() => executeDeleteSoftware(true)}
            >
              {isDeleting ? <Loader2 className='size-3.5 animate-spin mr-1' /> : null}
              确认强行删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Upload New Release Modal (Entry 2) */}
      <Dialog open={quickUploadOpen} onOpenChange={setQuickUploadOpen}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Upload className='size-5 text-primary' />
              上传新版本 (快速通道)
            </DialogTitle>
            <DialogDescription>
              30 秒快速为已有软件发布新版本，自动识别安装包并支持分片断点续传。
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickUploadSubmit} className='space-y-4 py-2 text-xs'>
            <div className='space-y-1.5'>
              <Label className='text-xs'>归属软件</Label>
              <select
                value={uploadSwSlug}
                onChange={(e) => setUploadSwSlug(e.target.value)}
                className='h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-xs shadow-sm'
              >
                {softwareList.map((sw) => (
                  <option key={sw.slug} value={sw.slug}>
                    {sw.name} ({sw.slug})
                  </option>
                ))}
              </select>
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='q-version' className='text-xs'>
                版本号 (如 2.0.1)
              </Label>
              <Input
                id='q-version'
                placeholder='例如：2.0.1'
                value={uploadVersion}
                onChange={(e) => setUploadVersion(e.target.value)}
                className='h-8 text-xs bg-background/80'
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='q-notes' className='text-xs'>
                更新日志说明
              </Label>
              <Textarea
                id='q-notes'
                rows={3}
                placeholder='写明本次升级内容...'
                value={uploadChangelog}
                onChange={(e) => setUploadChangelog(e.target.value)}
                className='text-xs font-mono bg-background/80'
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs'>选择安装包文件</Label>
              <Input
                type='file'
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) setUploadFile(f)
                }}
                className='h-9 text-xs bg-background/80'
              />
              {uploadFile && (
                <p className='text-[11px] text-muted-foreground'>
                  选中：{uploadFile.name} ({formatBytes(uploadFile.size)})
                </p>
              )}
            </div>

            <DialogFooter className='pt-2'>
              <Button
                type='button'
                variant='outline'
                disabled={isQuickUploading}
                onClick={() => setQuickUploadOpen(false)}
              >
                取消
              </Button>
              <Button
                type='submit'
                disabled={isQuickUploading || !uploadFile || !uploadVersion.trim()}
                className='bg-primary text-primary-foreground font-semibold shadow-sm'
              >
                {isQuickUploading ? (
                  <Loader2 className='size-3.5 animate-spin mr-1' />
                ) : (
                  <Upload className='size-3.5 mr-1' />
                )}
                开始上传发布
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Management Modal */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>软件分类管理</DialogTitle>
            <DialogDescription>
              维护前台下载中心分类维度。
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-2 text-xs'>
            <div className='flex items-center gap-2'>
              <Input
                placeholder='输入新分类名称...'
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className='h-8 text-xs'
              />
              <Button
                size='sm'
                disabled={isSavingCategory || !newCategoryName.trim()}
                onClick={async () => {
                  if (!newCategoryName.trim()) return
                  setIsSavingCategory(true)
                  try {
                    const res = await api.post('/api/admin/categories', {
                      name: newCategoryName.trim(),
                      sortOrder: categories.length,
                    })
                    if (res.success) {
                      toast.success(`分类「${newCategoryName.trim()}」已添加`)
                      setNewCategoryName('')
                      queryClient.invalidateQueries({ queryKey: ['catalog'] })
                    } else {
                      toast.error(res.msg || '添加分类失败')
                    }
                  } catch (e: any) {
                    toast.error(`添加失败：${e.message}`)
                  } finally {
                    setIsSavingCategory(false)
                  }
                }}
              >
                {isSavingCategory ? <Loader2 className='size-3 animate-spin mr-1' /> : null}
                添加
              </Button>
            </div>

            <div className='divide-y divide-border/40 rounded-lg border border-border/60 bg-background/60 overflow-hidden max-h-60 overflow-y-auto'>
              {categories.map((c) => (
                <div key={c.id} className='flex items-center justify-between p-2.5'>
                  <div>
                    <span className='font-semibold text-foreground'>{c.name}</span>
                    <span className='ml-2 text-muted-foreground font-mono'>({c.slug || c.id})</span>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='size-7 p-0 text-red-400 hover:text-red-300'
                    onClick={async () => {
                      try {
                        const res = await api.post('/api/admin/categories/delete', { id: c.id })
                        if (res.success) {
                          toast.success(`分类「${c.name}」已删除`)
                          queryClient.invalidateQueries({ queryKey: ['catalog'] })
                        } else {
                          toast.error(res.msg || '删除分类失败')
                        }
                      } catch (e: any) {
                        toast.error(`删除失败：${e.message}`)
                      }
                    }}
                  >
                    <Trash2 className='size-3.5' />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Online Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className='max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden bg-background'>
          <DialogHeader className='px-4 py-3 border-b border-border/60 flex flex-row items-center justify-between'>
            <div className='flex items-center gap-3'>
              <DialogTitle className='text-sm font-semibold'>前台详情页预览</DialogTitle>
              {previewSoftware && (
                <Badge variant='outline' className='text-xs text-primary border-primary/40'>
                  {previewSoftware.name}
                </Badge>
              )}
            </div>
          </DialogHeader>

          <div className='flex-1 bg-muted/20 flex items-center justify-center p-2 overflow-hidden'>
            <iframe
              src={previewSoftware ? `/software.html?slug=${previewSoftware.slug}` : '/software.html'}
              title='Software Live Preview'
              className='size-full border border-border/60 rounded-lg shadow-xl bg-[#07090e]'
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
