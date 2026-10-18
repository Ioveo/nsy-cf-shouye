import { useState } from 'react'
import { Sparkles, ChevronDown, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { WECHAT_TEMPLATES, type WechatTemplate } from './types'
import {
  CustomTemplateDialog,
  getStoredCustomTemplates,
  saveStoredCustomTemplates,
} from './custom-template-dialog'

interface TemplatePickerDropdownProps {
  onInsertText: (text: string) => void
}

export function TemplatePickerDropdown({ onInsertText }: TemplatePickerDropdownProps) {
  const [customTemplates, setCustomTemplates] = useState<WechatTemplate[]>(() =>
    getStoredCustomTemplates()
  )
  const [customDialogOpen, setCustomDialogOpen] = useState(false)
  const [templateFilter, setTemplateFilter] = useState<
    'all' | 'product' | 'industry' | 'callout' | 'custom'
  >('all')

  function handleSelectTemplate(tpl: WechatTemplate) {
    onInsertText(`\n\n${tpl.snippet}\n\n`)
    toast.success(`已插入「${tpl.name}」排版模板`)
  }

  function handleDeleteCustomTemplate(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    const next = customTemplates.filter((t) => t.id !== id)
    setCustomTemplates(next)
    saveStoredCustomTemplates(next)
    toast.success('已删除自定义模板')
  }

  const allTemplates = [...customTemplates, ...WECHAT_TEMPLATES]
  const filteredTemplates = allTemplates.filter((t) => {
    if (templateFilter === 'all') return true
    if (templateFilter === 'custom') return t.category === 'custom'
    if (templateFilter === 'product') return t.category === 'product'
    if (templateFilter === 'industry') return t.category === 'industry'
    if (templateFilter === 'callout') return ['callout', 'quote', 'step', 'layout'].includes(t.category)
    return true
  })

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type='button'
            variant='secondary'
            size='sm'
            className='h-7 px-2.5 text-xs gap-1.5 font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
          >
            <Sparkles className='size-3.5' />
            <span className='hidden sm:inline'>公众号样式模板</span>
            <span className='sm:hidden'>模板库</span>
            <ChevronDown className='size-3 opacity-70' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start' className='w-80 sm:w-96 p-0'>
          {/* 顶栏标题与自定义按钮 */}
          <div className='p-2.5 flex items-center justify-between border-b border-border/60 bg-muted/40'>
            <div className='flex items-center gap-1.5 font-semibold text-xs text-foreground'>
              <Sparkles className='size-3.5 text-primary' />
              <span>排版模板库</span>
              <span className='text-[10px] text-muted-foreground font-normal'>
                共 {allTemplates.length} 款
              </span>
            </div>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setCustomDialogOpen(true)}
              className='h-6 px-2 text-[11px] gap-1 text-primary hover:text-primary font-medium'
            >
              <Plus className='size-3' />
              <span>自定义模板</span>
            </Button>
          </div>

          {/* 分类快捷筛选 */}
          <div className='p-1.5 flex items-center gap-1 border-b border-border/40 overflow-x-auto text-[11px] select-none bg-muted/10'>
            <button
              type='button'
              onClick={() => setTemplateFilter('all')}
              className={`px-2 py-0.5 rounded-full transition-all text-[11px] whitespace-nowrap ${
                templateFilter === 'all'
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              全部
            </button>
            <button
              type='button'
              onClick={() => setTemplateFilter('product')}
              className={`px-2 py-0.5 rounded-full transition-all text-[11px] whitespace-nowrap ${
                templateFilter === 'product'
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              📱产品图文
            </button>
            <button
              type='button'
              onClick={() => setTemplateFilter('industry')}
              className={`px-2 py-0.5 rounded-full transition-all text-[11px] whitespace-nowrap ${
                templateFilter === 'industry'
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🏢行业方案
            </button>
            <button
              type='button'
              onClick={() => setTemplateFilter('callout')}
              className={`px-2 py-0.5 rounded-full transition-all text-[11px] whitespace-nowrap ${
                templateFilter === 'callout'
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              💡卡片/步骤
            </button>
            {customTemplates.length > 0 && (
              <button
                type='button'
                onClick={() => setTemplateFilter('custom')}
                className={`px-2 py-0.5 rounded-full transition-all text-[11px] whitespace-nowrap ${
                  templateFilter === 'custom'
                    ? 'bg-amber-500 text-black font-semibold'
                    : 'text-amber-500 hover:text-amber-400'
                }`}
              >
                ⭐我的 ({customTemplates.length})
              </button>
            )}
          </div>

          {/* 模板列表 */}
          <div className='max-h-[340px] overflow-y-auto p-1.5 space-y-1'>
            {filteredTemplates.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => handleSelectTemplate(tpl)}
                className='group flex items-start justify-between p-2 rounded-lg hover:bg-muted/70 cursor-pointer transition-all border border-transparent hover:border-border/50'
              >
                <div className='flex-1 min-w-0 pr-2'>
                  <div className='font-medium text-xs text-foreground flex items-center gap-1.5'>
                    <span className='truncate'>{tpl.name}</span>
                    {tpl.category === 'custom' && (
                      <span className='text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-500 font-semibold shrink-0'>
                        自定义
                      </span>
                    )}
                  </div>
                  <p className='text-[11px] text-muted-foreground line-clamp-1 mt-0.5'>
                    {tpl.description}
                  </p>
                </div>
                {tpl.category === 'custom' && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={(e) => handleDeleteCustomTemplate(e, tpl.id)}
                    className='h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 shrink-0'
                    title='删除此自定义模板'
                  >
                    <Trash2 className='size-3' />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Custom Template Dialog */}
      <CustomTemplateDialog
        open={customDialogOpen}
        onClose={() => setCustomDialogOpen(false)}
        onTemplateCreated={(newTpl) => {
          setCustomTemplates((prev) => [newTpl, ...prev])
          setTemplateFilter('custom')
        }}
      />
    </>
  )
}
