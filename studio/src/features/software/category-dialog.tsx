import { useState } from 'react'
import { FolderTree, Trash2, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Category } from '@/lib/queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface CategoryDialogProps {
  open: boolean
  categories: Category[]
  onOpenChange: (open: boolean) => void
}

export function CategoryDialog({
  open,
  categories,
  onOpenChange,
}: CategoryDialogProps) {
  const queryClient = useQueryClient()
  const [newCatName, setNewCatName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCatName.trim()) {
      toast.error('分类名称不能为空')
      return
    }
    const catId = newCatName.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-') || `cat-${Date.now()}`
    setIsSaving(true)
    try {
      const res = await api.post('/api/admin/catalog', {
        action: 'addCategory',
        category: {
          id: catId,
          name: newCatName.trim(),
          sortOrder: categories.length + 1,
        },
      })
      if (res.success) {
        toast.success(`分类「${newCatName.trim()}」创建成功`)
        setNewCatName('')
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '创建分类失败')
      }
    } catch (err: any) {
      toast.error(`操作异常：${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteCategory(cat: Category) {
    if (!confirm(`确定要删除分类「${cat.name}」吗？属于该分类的软件将移至默认分类。`)) return
    try {
      const res = await api.post('/api/admin/catalog', {
        action: 'deleteCategory',
        id: cat.id,
      })
      if (res.success) {
        toast.success(`已删除分类「${cat.name}」`)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '删除失败')
      }
    } catch (err: any) {
      toast.error(`删除分类异常：${err.message}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <FolderTree className='size-5 text-primary' />
            <span>软件分类管理</span>
          </DialogTitle>
          <DialogDescription>
            添加或维护软件中心前台分类导航标签
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAddCategory} className='flex items-center gap-2 py-2'>
          <Input
            placeholder='输入新分类名称 (如：实用工具、影音娱乐)'
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className='h-9 text-xs'
          />
          <Button type='submit' size='sm' disabled={isSaving} className='gap-1.5 shrink-0'>
            {isSaving ? <Loader2 className='size-3.5 animate-spin' /> : <Plus className='size-3.5' />}
            <span>添加</span>
          </Button>
        </form>

        <div className='max-h-60 overflow-y-auto divide-y divide-border/40 rounded-lg border border-border/60 bg-muted/20'>
          {categories.length === 0 ? (
            <div className='py-6 text-center text-xs text-muted-foreground'>
              暂无自定义分类
            </div>
          ) : (
            categories.map((c) => (
              <div key={c.id} className='flex items-center justify-between p-2.5 text-xs'>
                <div>
                  <span className='font-medium text-foreground'>{c.name}</span>
                  <span className='ml-2 font-mono text-[11px] text-muted-foreground'>({c.id})</span>
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => handleDeleteCategory(c)}
                  className='size-7 p-0 text-muted-foreground hover:text-red-400'
                  title='删除分类'
                >
                  <Trash2 className='size-3.5' />
                </Button>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' size='sm' onClick={() => onOpenChange(false)}>
            完成
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
