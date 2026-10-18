import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import { type ArticleCategory, type ArticleTaxonomyConfig } from '@/lib/queries'

interface CleanupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taxonomyConfig?: ArticleTaxonomyConfig
  articles: Array<{ id: string; title: string; category?: string }>
}

interface OrphanCategory {
  originalName: string
  count: number
  generatedSlug: string
  name: string
  layout: 'grid' | 'list' | 'docs'
}

export function CleanupDialog({
  open,
  onOpenChange,
  taxonomyConfig,
  articles,
}: CleanupDialogProps) {
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)
  const [candidates, setCandidates] = useState<OrphanCategory[]>([])

  // Find category values in articles that are NOT in taxonomyConfig
  const orphans = useMemo(() => {
    const existing = new Set<string>()
    for (const cat of taxonomyConfig?.categories || []) {
      existing.add(cat.slug.toLowerCase())
      existing.add(cat.name.toLowerCase())
    }

    const counts = new Map<string, number>()
    for (const a of articles) {
      const raw = (a.category || '').trim()
      if (!raw) continue
      if (!existing.has(raw.toLowerCase())) {
        counts.set(raw, (counts.get(raw) || 0) + 1)
      }
    }

    const res: OrphanCategory[] = []
    let idx = 1
    for (const [name, count] of counts.entries()) {
      // Auto-generate slug
      let slug = name
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
      if (!slug) slug = `legacy-cat-${idx++}`

      res.push({
        originalName: name,
        count,
        generatedSlug: slug,
        name: name,
        layout: 'list',
      })
    }
    return res
  }, [taxonomyConfig, articles])

  // Sync state when opened
  const [items, setItems] = useState<OrphanCategory[]>([])

  // Initialize candidates when dialog opens
  const handleOpen = (val: boolean) => {
    if (val) setItems(orphans)
    onOpenChange(val)
  }

  const updateItem = (index: number, patch: Partial<OrphanCategory>) => {
    setItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const handleCreateAll = async () => {
    if (!items.length) {
      onOpenChange(false)
      return
    }

    setIsSaving(true)
    try {
      const currentCats = taxonomyConfig?.categories ? [...taxonomyConfig.categories] : []
      const colors = ['#06B6D4', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B']

      let nextOrder = currentCats.length
        ? Math.max(...currentCats.map((c) => c.order || 0)) + 10
        : 10

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const cleanSlug = item.generatedSlug.trim().toLowerCase()
        if (!cleanSlug) continue

        currentCats.push({
          slug: cleanSlug,
          name: item.name.trim() || item.originalName,
          description: `自历史数据自动整理创建（原类别：${item.originalName}）`,
          icon: 'book-open',
          color: colors[i % colors.length],
          layout: item.layout,
          order: nextOrder,
          showInNav: true,
        })
        nextOrder += 10
      }

      const res = await api.post('/api/admin/config', {
        action: 'save',
        name: 'article-taxonomy',
        data: { categories: currentCats },
      })

      if (res.success) {
        queryClient.setQueryData(['config', 'article-taxonomy'], res.config)
        toast.success(`成功整理并创建 ${items.length} 个新分类！`)
        onOpenChange(false)
      } else {
        toast.error(res.msg || '保存分类失败')
      }
    } catch (err: any) {
      toast.error(`保存异常：${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className='max-w-2xl max-h-[85vh] flex flex-col'>
        <DialogHeader>
          <div className='flex items-center gap-2'>
            <div className='p-2 rounded-lg bg-cyan-500/10 text-cyan-500'>
              <Sparkles className='w-5 h-5' />
            </div>
            <div>
              <DialogTitle>整理历史文章分类</DialogTitle>
              <DialogDescription className='text-xs'>
                扫描数据库中存在但尚未纳入统一分类配置的文章类别，一键补齐为标准分类。
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto py-2 space-y-4'>
          {orphans.length === 0 ? (
            <div className='p-8 text-center border rounded-xl border-dashed bg-muted/20'>
              <CheckCircle2 className='w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80' />
              <p className='text-sm font-medium'>所有历史文章分类均已规范化</p>
              <p className='text-xs text-muted-foreground mt-1'>
                未发现孤立或未建档的 category 字段值。
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              <p className='text-xs text-muted-foreground'>
                发现 {orphans.length} 个未规范分类，共覆盖{' '}
                {orphans.reduce((s, i) => s + i.count, 0)} 篇文章：
              </p>
              <div className='border rounded-lg divide-y bg-background'>
                {items.map((item, idx) => (
                  <div key={item.originalName} className='p-3 space-y-2 text-xs'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <span className='font-semibold'>{item.originalName}</span>
                        <Badge variant='secondary' className='text-[10px]'>
                          {item.count} 篇文章
                        </Badge>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Label className='text-[11px] text-muted-foreground'>排版</Label>
                        <select
                          value={item.layout}
                          onChange={(e) =>
                            updateItem(idx, { layout: e.target.value as any })
                          }
                          className='h-7 rounded border bg-background px-2 text-xs'
                        >
                          <option value='grid'>卡片网格 (Grid)</option>
                          <option value='list'>图文列表 (List)</option>
                          <option value='docs'>文档手册 (Docs)</option>
                        </select>
                      </div>
                    </div>
                    <div className='grid grid-cols-2 gap-2'>
                      <div>
                        <Label className='text-[10px] text-muted-foreground'>显示名称</Label>
                        <Input
                          value={item.name}
                          onChange={(e) => updateItem(idx, { name: e.target.value })}
                          className='h-7 text-xs'
                        />
                      </div>
                      <div>
                        <Label className='text-[10px] text-muted-foreground'>分类标识 (Slug)</Label>
                        <Input
                          value={item.generatedSlug}
                          onChange={(e) =>
                            updateItem(idx, { generatedSlug: e.target.value })
                          }
                          className='h-7 text-xs font-mono'
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className='border-t pt-3'>
          <Button variant='outline' size='sm' onClick={() => onOpenChange(false)}>
            取消
          </Button>
          {orphans.length > 0 && (
            <Button
              size='sm'
              disabled={isSaving}
              onClick={handleCreateAll}
              className='gap-2'
            >
              {isSaving && <Loader2 className='w-4 h-4 animate-spin' />}
              一键补齐创建分类
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
