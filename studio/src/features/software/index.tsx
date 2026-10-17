import { useState } from 'react'
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
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCatalog, Software, Category } from '@/lib/queries'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface HighlightItem {
  title: string
  text: string
}

export function SoftwareFeature() {
  const queryClient = useQueryClient()
  const { data: catalog, isLoading } = useCatalog()

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Software Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingSoftware, setEditingSoftware] = useState<Software | null>(null)
  const [formSlug, setFormSlug] = useState('')
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formTagline, setFormTagline] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formRequirements, setFormRequirements] = useState('')
  const [formLandingUrl, setFormLandingUrl] = useState('')
  const [formSortOrder, setFormSortOrder] = useState<number>(0)
  const [formHighlights, setFormHighlights] = useState<HighlightItem[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Delete software state
  const [deletingSoftware, setDeletingSoftware] = useState<Software | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [forceDeleteConfirmOpen, setForceDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Category modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isSavingCategory, setIsSavingCategory] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

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
    return matchSearch && matchCategory
  })

  function openCreateDrawer() {
    setEditingSoftware(null)
    setFormSlug('')
    setFormName('')
    setFormCategory(categories[0]?.id || 'general')
    setFormTagline('')
    setFormDescription('')
    setFormRequirements('Windows 10 / 11 64位')
    setFormLandingUrl('')
    setFormSortOrder(softwareList.length)
    setFormHighlights([])
    setDrawerOpen(true)
  }

  function openEditDrawer(sw: Software) {
    setEditingSoftware(sw)
    setFormSlug(sw.slug)
    setFormName(sw.name)
    setFormCategory(sw.categoryId || categories[0]?.id || '')
    setFormTagline(sw.tagline || '')
    setFormDescription(sw.description || '')
    setFormRequirements(sw.requirements || '')
    setFormLandingUrl(sw.landingUrl || '')
    setFormSortOrder(sw.sortOrder ?? 0)
    setFormHighlights(
      Array.isArray(sw.highlights) ? JSON.parse(JSON.stringify(sw.highlights)) : []
    )
    setDrawerOpen(true)
  }

  async function handleSaveSoftware(e: React.FormEvent) {
    e.preventDefault()
    if (!formSlug.trim() || !formName.trim()) {
      toast.error('软件标识 (Slug) 和名称为必填项')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        id: formSlug.trim(),
        slug: formSlug.trim(),
        name: formName.trim(),
        categoryId: formCategory || categories[0]?.id || 'general',
        tagline: formTagline.trim(),
        description: formDescription.trim(),
        requirements: formRequirements.trim(),
        landingUrl: formLandingUrl.trim(),
        sortOrder: Number(formSortOrder) || 0,
        highlights: formHighlights.filter((h) => h.title.trim() || h.text.trim()),
      }

      const res = await api.post('/api/admin/software', payload)
      if (res.success) {
        toast.success(editingSoftware ? '软件资料已更新' : '软件创建成功')
        setDrawerOpen(false)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '保存软件失败')
      }
    } catch (err: any) {
      toast.error(`保存失败：${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  function addHighlightItem() {
    setFormHighlights([...formHighlights, { title: '', text: '' }])
  }

  function updateHighlightItem(index: number, field: 'title' | 'text', val: string) {
    const list = [...formHighlights]
    list[index][field] = val
    setFormHighlights(list)
  }

  function removeHighlightItem(index: number) {
    setFormHighlights(formHighlights.filter((_, i) => i !== index))
  }

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

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    setIsSavingCategory(true)
    try {
      const res = await api.post('/api/admin/categories', {
        name: newCategoryName.trim(),
        sortOrder: categories.length,
      })
      if (res.success) {
        toast.success('分类已添加')
        setNewCategoryName('')
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '添加分类失败')
      }
    } catch (err: any) {
      toast.error(`添加异常：${err.message}`)
    } finally {
      setIsSavingCategory(false)
    }
  }

  async function handleDeleteCategory(cat: Category) {
    try {
      const res = await api.post('/api/admin/categories/delete', { id: cat.id })
      if (res.success) {
        toast.success(`分类「${cat.name}」已删除`)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '删除分类失败')
      }
    } catch (err: any) {
      toast.error(`删除分类异常：${err.message}`)
    }
  }

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 pt-0 md:gap-6 md:p-8'>
      {/* Header */}
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>软件管理</h1>
          <p className='text-sm text-muted-foreground'>
            维护软件资料、分类标签、特性亮点及各平台详情页配置
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' onClick={() => setCategoryModalOpen(true)}>
            <FolderTree className='mr-2 size-4 text-primary' />
            分类管理
          </Button>
          <Button size='sm' onClick={openCreateDrawer}>
            <Plus className='mr-2 size-4' />
            新建软件
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
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
        <div className='flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0'>
          <Button
            variant={selectedCategory === 'all' ? 'secondary' : 'ghost'}
            size='sm'
            onClick={() => setSelectedCategory('all')}
            className='text-xs'
          >
            全部 ({softwareList.length})
          </Button>
          {categories.map((c) => {
            const count = softwareList.filter((s) => s.categoryId === c.id).length
            return (
              <Button
                key={c.id}
                variant={selectedCategory === c.id ? 'secondary' : 'ghost'}
                size='sm'
                onClick={() => setSelectedCategory(c.id)}
                className='text-xs whitespace-nowrap'
              >
                {c.name} ({count})
              </Button>
            )
          })}
        </div>
      </div>

      {/* Software Table */}
      <div className='rounded-xl border border-border/60 bg-card/60 overflow-hidden backdrop-blur-sm'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-sm'>
            <thead className='border-b border-border/60 bg-muted/40 text-xs font-semibold uppercase text-muted-foreground'>
              <tr>
                <th className='px-4 py-3'>软件</th>
                <th className='px-4 py-3'>分类</th>
                <th className='px-4 py-3'>一句话介绍 / 特性亮点</th>
                <th className='px-4 py-3'>系统要求</th>
                <th className='px-4 py-3 text-center'>安装包数量</th>
                <th className='px-4 py-3 text-center'>排序</th>
                <th className='px-4 py-3 text-right'>操作</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border/40'>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className='px-4 py-8 text-center text-muted-foreground'>
                    <Loader2 className='mx-auto size-5 animate-spin text-primary' />
                    <p className='mt-2 text-xs'>加载软件列表中...</p>
                  </td>
                </tr>
              ) : filteredSoftware.length === 0 ? (
                <tr>
                  <td colSpan={7} className='px-4 py-8 text-center text-muted-foreground'>
                    未找到匹配的软件
                  </td>
                </tr>
              ) : (
                filteredSoftware.map((sw) => {
                  const cat = categories.find((c) => c.id === sw.categoryId)
                  const relCount = releases.filter((r) => r.softwareId === sw.slug).length
                  const highlightsCount = (sw.highlights || []).length

                  return (
                    <tr key={sw.slug} className='hover:bg-muted/30 transition-colors'>
                      <td className='px-4 py-3'>
                        <div className='flex items-center gap-3'>
                          <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary'>
                            {sw.name[0] || '软'}
                          </div>
                          <div className='min-w-0'>
                            <div className='font-semibold text-foreground flex items-center gap-1.5'>
                              <span>{sw.name}</span>
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
                            <div className='font-mono text-xs text-muted-foreground'>
                              {sw.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className='px-4 py-3'>
                        <Badge variant='outline' className='text-xs'>
                          {cat?.name || sw.categoryId || '通用'}
                        </Badge>
                      </td>
                      <td className='px-4 py-3 max-w-xs'>
                        <p className='truncate text-xs text-foreground'>
                          {sw.tagline || '未设置一句话介绍'}
                        </p>
                        {highlightsCount > 0 && (
                          <p className='text-xs text-muted-foreground'>
                            {highlightsCount} 个亮点
                          </p>
                        )}
                      </td>
                      <td className='px-4 py-3 text-xs text-muted-foreground'>
                        {sw.requirements || '未限制'}
                      </td>
                      <td className='px-4 py-3 text-center'>
                        <Badge
                          variant={relCount > 0 ? 'secondary' : 'outline'}
                          className='font-mono text-xs'
                        >
                          {relCount}
                        </Badge>
                      </td>
                      <td className='px-4 py-3 text-center font-mono text-xs text-muted-foreground'>
                        {sw.sortOrder ?? 0}
                      </td>
                      <td className='px-4 py-3 text-right'>
                        <div className='flex items-center justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='size-8 p-0'
                            onClick={() => openEditDrawer(sw)}
                            title='编辑资料'
                          >
                            <Edit2 className='size-4' />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='sm' className='size-8 p-0'>
                                <MoreHorizontal className='size-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem
                                onClick={() => {
                                  window.open(`/download.html?app=${sw.slug}`, '_blank')
                                }}
                              >
                                <ExternalLink className='mr-2 size-4' />
                                软件中心预览
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

      {/* Edit/Create Software Drawer (Offcanvas Sheet) */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side='right' className='sm:max-w-lg overflow-y-auto w-full'>
          <SheetHeader>
            <SheetTitle>
              {editingSoftware ? `编辑软件：${editingSoftware.name}` : '新建软件产品'}
            </SheetTitle>
            <SheetDescription>
              保存后数据即刻同步至 Cloudflare R2 catalog，前台软件中心与门户实时更新。
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSaveSoftware} className='space-y-4 py-4 text-sm'>
            <div className='grid gap-2'>
              <Label htmlFor='slug'>软件标识 (Slug) *</Label>
              <Input
                id='slug'
                placeholder='例如: desktop, novadisk, player'
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                disabled={Boolean(editingSoftware)}
                className='font-mono'
              />
              <p className='text-xs text-muted-foreground'>
                唯一键，不可修改；用于 URL 参数（如 /download.html?app=desktop）
              </p>
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='name'>软件中文名称 *</Label>
              <Input
                id='name'
                placeholder='例如: 天才猫桌面 2.0'
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='categoryId'>所属分类</Label>
              <select
                id='categoryId'
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors'
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='tagline'>一句话宣传语 (Tagline)</Label>
              <Input
                id='tagline'
                placeholder='例如: 极简流动的生产力工作台'
                value={formTagline}
                onChange={(e) => setFormTagline(e.target.value)}
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='requirements'>系统要求 (Requirements)</Label>
              <Input
                id='requirements'
                placeholder='例如: Windows 10/11 64位, macOS 12+'
                value={formRequirements}
                onChange={(e) => setFormRequirements(e.target.value)}
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='landingUrl'>专属落地页 URL (Landing URL)</Label>
              <Input
                id='landingUrl'
                placeholder='例如: /desktop.html 或 https://...'
                value={formLandingUrl}
                onChange={(e) => setFormLandingUrl(e.target.value)}
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='sortOrder'>展示排序权重</Label>
              <Input
                id='sortOrder'
                type='number'
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(Number(e.target.value))}
              />
              <p className='text-xs text-muted-foreground'>
                数字越小排在越前面（0 居首位）
              </p>
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='description'>详细介绍 (Markdown / 文本)</Label>
              <Textarea
                id='description'
                rows={3}
                placeholder='详细的产品功能描述...'
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            {/* Highlights Editor */}
            <div className='space-y-2 border-t border-border/40 pt-4'>
              <div className='flex items-center justify-between'>
                <Label>核心特性亮点 (Highlights)</Label>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={addHighlightItem}
                  className='h-7 text-xs'
                >
                  <Plus className='mr-1 size-3' />
                  添加亮点
                </Button>
              </div>
              {formHighlights.length === 0 ? (
                <p className='text-xs text-muted-foreground'>
                  未添加亮点。软件中心仅在包含亮点时渲染 Bento 亮点卡片。
                </p>
              ) : (
                <div className='space-y-3'>
                  {formHighlights.map((hl, idx) => (
                    <div
                      key={idx}
                      className='rounded-md border border-border/60 p-2.5 space-y-2 bg-secondary/20'
                    >
                      <div className='flex items-center justify-between gap-2'>
                        <Input
                          placeholder='亮点小标题 (例如: 极速启动)'
                          value={hl.title}
                          onChange={(e) =>
                            updateHighlightItem(idx, 'title', e.target.value)
                          }
                          className='h-8 text-xs font-semibold'
                        />
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='size-8 p-0 text-destructive'
                          onClick={() => removeHighlightItem(idx)}
                        >
                          <Trash2 className='size-3.5' />
                        </Button>
                      </div>
                      <Textarea
                        placeholder='亮点描述文案...'
                        rows={2}
                        value={hl.text}
                        onChange={(e) =>
                          updateHighlightItem(idx, 'text', e.target.value)
                        }
                        className='text-xs'
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <SheetFooter className='border-t border-border/40 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setDrawerOpen(false)}
                disabled={isSaving}
              >
                取消
              </Button>
              <Button type='submit' disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className='mr-2 size-4 animate-spin' />
                    正在保存...
                  </>
                ) : (
                  '保存软件资料'
                )}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Category Management Dialog */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>软件分类维护</DialogTitle>
            <DialogDescription>
              维护前台软件中心的分类标签与筛选 Tab。
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <form onSubmit={handleAddCategory} className='flex items-center gap-2'>
              <Input
                placeholder='新分类名称 (例如: 效率办公)...'
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <Button type='submit' disabled={isSavingCategory} size='sm'>
                {isSavingCategory ? <Loader2 className='size-4 animate-spin' /> : '添加'}
              </Button>
            </form>

            <div className='max-h-60 overflow-y-auto divide-y divide-border/40 rounded-lg border border-border/60'>
              {categories.map((c) => (
                <div
                  key={c.id}
                  className='flex items-center justify-between p-2.5 text-sm'
                >
                  <span className='font-medium'>{c.name}</span>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='size-7 p-0 text-destructive'
                    onClick={() => handleDeleteCategory(c)}
                  >
                    <Trash2 className='size-3.5' />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* First Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title='删除软件确认'
        desc={`确定要删除软件「${deletingSoftware?.name}」吗？`}
        confirmText='确认删除'
        cancelBtnText='取消'
        destructive
        isLoading={isDeleting}
        handleConfirm={() => executeDeleteSoftware(false)}
      />

      {/* Secondary Force Delete Confirm Dialog (when 409 needForce) */}
      <ConfirmDialog
        open={forceDeleteConfirmOpen}
        onOpenChange={setForceDeleteConfirmOpen}
        title='强制删除警告'
        desc={
          <div className='space-y-2 text-sm'>
            <p className='text-destructive font-medium flex items-center gap-1.5'>
              <AlertTriangle className='size-4' />
              检测到该软件下存在已发布的安装包或历史版本！
            </p>
            <p className='text-muted-foreground'>
              直接删除将清除该软件的所有版本索引与下载记录。确定要强制删除软件「
              {deletingSoftware?.name}」吗？
            </p>
          </div>
        }
        confirmText='强制删除'
        cancelBtnText='放弃'
        destructive
        isLoading={isDeleting}
        handleConfirm={() => executeDeleteSoftware(true)}
      />
    </div>
  )
}
