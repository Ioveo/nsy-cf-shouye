import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Compass,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  Save,
  ExternalLink,
} from 'lucide-react'
import { useCatalog } from '@/hooks/use-catalog'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'

export function NavigationFeature() {
  const queryClient = useQueryClient()
  const { data: catalog, isLoading } = useCatalog()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingNav, setEditingNav] = useState<any | null>(null)
  const [label, setLabel] = useState('')
  const [href, setHref] = useState('')
  const [external, setExternal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const navList = (catalog as any)?.navigation || []

  function handleOpenCreate() {
    setEditingNav(null)
    setLabel('')
    setHref('')
    setExternal(false)
    setDrawerOpen(true)
  }

  function handleOpenEdit(item: any) {
    setEditingNav(item)
    setLabel(item.label || '')
    setHref(item.href || '')
    setExternal(Boolean(item.external))
    setDrawerOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim() || !href.trim()) {
      toast.error('请填写导航文本与链接地址')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        id: editingNav?.id || '',
        label: label.trim(),
        href: href.trim(),
        external,
        sortOrder: editingNav?.sortOrder ?? navList.length,
      }
      const res = await api.post('/api/admin/nav', payload)
      if (res.success) {
        toast.success(editingNav ? '导航已更新' : '导航已添加')
        setDrawerOpen(false)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '保存失败')
      }
    } catch (err: any) {
      toast.error(`保存异常：${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleMove(idx: number, direction: 'up' | 'down') {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= navList.length) return
    const itemA = navList[idx]
    const itemB = navList[targetIdx]
    const orderA = itemA.sortOrder ?? idx
    const orderB = itemB.sortOrder ?? targetIdx

    try {
      await api.post('/api/admin/nav', { ...itemA, sortOrder: orderB })
      await api.post('/api/admin/nav', { ...itemB, sortOrder: orderA })
      toast.success('导航排序已更新')
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    } catch (e: any) {
      toast.error(`更新排序异常：${e.message}`)
    }
  }

  async function handleDelete(item: any) {
    if (!confirm(`确定要移除导航项「${item.label}」吗？`)) return
    try {
      const res = await api.post('/api/admin/nav', { action: 'delete', id: item.id })
      if (res.success) {
        toast.success('导航项已移除')
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '移除失败')
      }
    } catch (err: any) {
      toast.error(`操作异常：${err.message}`)
    }
  }

  return (
    <div className='space-y-6'>
      {/* 头部标题与操作 */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
            <Compass className='size-6 text-primary' />
            <span>站点顶部导航管理</span>
          </h1>
          <p className='text-xs text-muted-foreground mt-1'>
            自定义前台全站顶部常驻导航菜单项目、页面路由与跳转目标。
          </p>
        </div>
        <Button onClick={handleOpenCreate} className='gap-2'>
          <Plus className='size-4' />
          <span>添加导航链接</span>
        </Button>
      </div>

      {/* 骨架屏 / 导航项目列表 */}
      {isLoading ? (
        <div className='space-y-3'>
          <div className='h-12 w-full bg-muted/40 animate-pulse rounded-lg' />
          <div className='h-12 w-full bg-muted/30 animate-pulse rounded-lg' />
          <div className='h-12 w-full bg-muted/30 animate-pulse rounded-lg' />
        </div>
      ) : navList.length === 0 ? (
        <div className='rounded-lg border border-dashed p-12 text-center'>
          <Compass className='mx-auto size-10 text-muted-foreground/40 mb-3' />
          <h3 className='text-sm font-semibold'>暂无导航菜单</h3>
          <p className='text-xs text-muted-foreground mt-1 mb-4'>
            点击右上角添加首个顶部导航锚点
          </p>
          <Button size='sm' onClick={handleOpenCreate} className='gap-1.5'>
            <Plus className='size-3.5' />
            <span>立即添加</span>
          </Button>
        </div>
      ) : (
        <div className='rounded-lg border bg-card overflow-hidden'>
          <div className='divide-y text-xs'>
            {navList.map((item: any, idx: number) => (
              <div
                key={item.id}
                className='p-3.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors'
              >
                <div className='flex items-center gap-3 min-w-0'>
                  <span className='font-mono text-muted-foreground w-6 text-center'>
                    {idx + 1}
                  </span>
                  <div>
                    <div className='font-semibold text-foreground flex items-center gap-1.5'>
                      <span>{item.label}</span>
                      {item.external && (
                        <ExternalLink className='size-3 text-muted-foreground' />
                      )}
                    </div>
                    <div className='text-muted-foreground font-mono text-[11px] mt-0.5'>
                      {item.href}
                    </div>
                  </div>
                </div>

                <div className='flex items-center gap-1 shrink-0'>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='size-7'
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    title='上移'
                  >
                    <ArrowUp className='size-3.5' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='size-7'
                    disabled={idx === navList.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    title='下移'
                  >
                    <ArrowDown className='size-3.5' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='size-7'
                    onClick={() => handleOpenEdit(item)}
                    title='编辑'
                  >
                    <Edit2 className='size-3.5' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='size-7 text-destructive'
                    onClick={() => handleDelete(item)}
                    title='删除'
                  >
                    <Trash2 className='size-3.5' />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 导航编辑抽屉 */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className='w-full sm:max-w-md overflow-y-auto'>
          <SheetHeader>
            <SheetTitle>{editingNav ? '编辑导航链接' : '添加导航链接'}</SheetTitle>
            <SheetDescription>
              设置前台顶部导航栏的显示文本与跳转链接。
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSave} className='space-y-4 py-4 text-xs'>
            <div className='space-y-1.5'>
              <Label className='text-xs'>导航标题文本 *</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder='如：软件中心 / 使用教程'
                className='h-8 text-xs'
                required
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs'>目标链接 URL *</Label>
              <Input
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder='如：/download.html 或 https://...'
                className='h-8 text-xs font-mono'
                required
              />
            </div>

            <div className='flex items-center justify-between p-3 rounded-lg border bg-muted/20'>
              <div className='space-y-0.5'>
                <Label className='text-xs font-medium'>新标签页打开</Label>
                <p className='text-[11px] text-muted-foreground'>
                  开启后将在 a 标签添加 target="_blank"
                </p>
              </div>
              <Switch checked={external} onCheckedChange={setExternal} />
            </div>

            <SheetFooter className='pt-2'>
              <Button type='submit' size='sm' disabled={isSaving} className='w-full gap-1.5'>
                {isSaving ? <Loader2 className='size-3.5 animate-spin' /> : <Save className='size-3.5' />}
                <span>{editingNav ? '保存修改' : '确认添加'}</span>
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
