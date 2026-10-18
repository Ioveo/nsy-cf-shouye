import { useState, useMemo } from 'react'
import {
  Package,
  Search,
  Download,
  ExternalLink,
  Check,
  Sparkles,
  Layers,
} from 'lucide-react'
import { useCatalog, Software } from '@/lib/queries'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface EmbedSoftwareDialogProps {
  open: boolean
  onClose: () => void
  onInsert: (htmlSnippet: string) => void
}

export function EmbedSoftwareDialog({
  open,
  onClose,
  onInsert,
}: EmbedSoftwareDialogProps) {
  const { data: catalog } = useCatalog()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string>('')
  const [styleType, setStyleType] = useState<'feature' | 'compact'>('feature')

  const softwareList: Software[] = catalog?.software || []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return softwareList
    return softwareList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.tagline && s.tagline.toLowerCase().includes(q))
    )
  }, [softwareList, search])

  const selectedSoftware = useMemo(() => {
    return softwareList.find((s) => (s.id || s.slug) === selectedId) || null
  }, [softwareList, selectedId])

  function generateSnippet(item: Software, style: 'feature' | 'compact') {
    const icon = item.iconUrl || item.icon || '/logo.png'
    const name = item.name
    const slug = item.slug
    const desc = item.tagline || item.description || '官方正版极速下载，尽享极致桌面体验。'
    const badge = item.priceLabel || '官方应用'

    if (style === 'compact') {
      return `\n<div class="article-embed-software article-embed-software--compact" data-slug="${slug}">
  <img src="${icon}" alt="${name}" class="article-embed-software__icon" />
  <div class="article-embed-software__main">
    <div class="article-embed-software__title-row">
      <strong class="article-embed-software__name">${name}</strong>
      <span class="article-embed-software__badge">${badge}</span>
    </div>
    <span class="article-embed-software__desc">${desc}</span>
  </div>
  <a href="/download/latest/${slug}" class="article-embed-software__btn article-embed-software__btn--primary">↓ 下载</a>
</div>\n`
    }

    // Default: Feature Card
    return `\n<div class="article-embed-software" data-slug="${slug}">
  <div class="article-embed-software__icon-wrap">
    <img src="${icon}" alt="${name}" class="article-embed-software__icon" />
  </div>
  <div class="article-embed-software__main">
    <div class="article-embed-software__title-row">
      <h3 class="article-embed-software__name">${name}</h3>
      <span class="article-embed-software__badge">${badge}</span>
    </div>
    <p class="article-embed-software__desc">${desc}</p>
  </div>
  <div class="article-embed-software__actions">
    <a href="/software.html?slug=${slug}" class="article-embed-software__btn article-embed-software__btn--outline">了解详情</a>
    <a href="/download/latest/${slug}" class="article-embed-software__btn article-embed-software__btn--primary">↓ 立即下载</a>
  </div>
</div>\n`
  }

  function handleConfirm() {
    if (!selectedSoftware) return
    const snippet = generateSnippet(selectedSoftware, styleType)
    onInsert(snippet)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className='max-w-2xl max-h-[85vh] p-0 flex flex-col overflow-hidden'>
        <DialogHeader className='p-5 border-b border-border bg-muted/20'>
          <DialogTitle className='text-base font-bold flex items-center gap-2'>
            <Package className='size-4 text-primary' />
            <span>引用软件中心卡片到正文</span>
          </DialogTitle>
          <DialogDescription className='text-xs'>
            在文章任意段落插入我们自研软件的交互式推荐卡片，形成「阅读 → 了解 → 下载」闭环转化。
          </DialogDescription>

          <div className='relative mt-3'>
            <Search className='size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='搜索软件名称、标识 Slug 或功能简介...'
              className='h-8 pl-8 text-xs bg-background'
            />
          </div>
        </DialogHeader>

        {/* Style Selection Bar */}
        <div className='px-5 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between text-xs'>
          <span className='text-muted-foreground font-medium'>展示卡片形态：</span>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => setStyleType('feature')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                styleType === 'feature'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background hover:bg-muted text-muted-foreground'
              }`}
            >
              微信精选大卡片
            </button>
            <button
              type='button'
              onClick={() => setStyleType('compact')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                styleType === 'compact'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background hover:bg-muted text-muted-foreground'
              }`}
            >
              紧凑下载小条
            </button>
          </div>
        </div>

        {/* Software Grid */}
        <div className='flex-1 overflow-y-auto p-5'>
          {filtered.length === 0 ? (
            <div className='py-12 text-center text-muted-foreground text-xs'>
              没有找到匹配的软件
            </div>
          ) : (
            <div className='space-y-2'>
              {filtered.map((item) => {
                const id = item.id || item.slug
                const isSelected = selectedId === id
                const icon = item.iconUrl || item.icon || '/logo.png'
                return (
                  <div
                    key={id}
                    onClick={() => setSelectedId(id)}
                    onDoubleClick={() => {
                      setSelectedId(id)
                      const snippet = generateSnippet(item, styleType)
                      onInsert(snippet)
                      onClose()
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/30 bg-primary/5 shadow-sm'
                        : 'border-border/70 hover:border-border hover:bg-muted/30'
                    }`}
                  >
                    <div className='flex items-center gap-3 min-w-0'>
                      <img
                        src={icon}
                        alt={item.name}
                        className='size-10 rounded-xl object-contain bg-muted/40 p-1 border border-border/50 shrink-0'
                      />
                      <div className='min-w-0'>
                        <div className='flex items-center gap-2'>
                          <strong className='text-xs font-semibold text-foreground truncate'>
                            {item.name}
                          </strong>
                          <Badge variant='outline' className='text-[10px] px-1.5 py-0'>
                            {item.slug}
                          </Badge>
                          {item.priceLabel && (
                            <Badge variant='secondary' className='text-[10px] px-1.5 py-0 text-amber-500'>
                              {item.priceLabel}
                            </Badge>
                          )}
                        </div>
                        <p className='text-[11px] text-muted-foreground truncate mt-0.5'>
                          {item.tagline || item.description || '暂无描述'}
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center gap-2 shrink-0'>
                      {isSelected ? (
                        <div className='size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow'>
                          <Check className='size-3.5 stroke-[3]' />
                        </div>
                      ) : (
                        <span className='text-[11px] text-muted-foreground'>点击选中</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='p-4 border-t border-border bg-muted/10 flex items-center justify-between'>
          <div className='text-xs text-muted-foreground truncate max-w-sm'>
            {selectedSoftware ? (
              <span className='text-foreground font-medium flex items-center gap-1.5'>
                <Sparkles className='size-3.5 text-primary' />
                已选：{selectedSoftware.name} ({styleType === 'feature' ? '精选大卡片' : '紧凑下载条'})
              </span>
            ) : (
              '请先点击选中一个软件，可双击直接插入'
            )}
          </div>
          <div className='flex items-center gap-2'>
            <Button type='button' variant='outline' size='sm' onClick={onClose} className='h-8 text-xs'>
              取消
            </Button>
            <Button
              type='button'
              size='sm'
              disabled={!selectedSoftware}
              onClick={handleConfirm}
              className='h-8 text-xs gap-1.5'
            >
              <Check className='size-3.5' />
              <span>插入软件卡片</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
