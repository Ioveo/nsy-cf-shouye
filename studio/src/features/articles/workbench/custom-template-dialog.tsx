import { useState, useEffect } from 'react'
import { Plus, Trash2, BookmarkPlus, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { WechatTemplate } from './types'

const CUSTOM_TEMPLATES_KEY = 'studio_custom_article_templates'

export function getStoredCustomTemplates(): WechatTemplate[] {
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATES_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveStoredCustomTemplates(list: WechatTemplate[]) {
  try {
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(list))
  } catch {}
}

interface CustomTemplateDialogProps {
  open: boolean
  onClose: () => void
  initialSnippet?: string
  onTemplateCreated: (template: WechatTemplate) => void
}

export function CustomTemplateDialog({
  open,
  onClose,
  initialSnippet = '',
  onTemplateCreated,
}: CustomTemplateDialogProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<'product' | 'industry' | 'callout' | 'custom'>('product')
  const [description, setDescription] = useState('')
  const [snippet, setSnippet] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setDescription('')
      setSnippet(
        initialSnippet.trim() ||
`<div class="article-feature-row article-feature-row--left-img">
  <div class="article-feature-row__media">
    <img src="/logo.png" alt="自定义功能展示" />
  </div>
  <div class="article-feature-row__content">
    <span class="article-feature-row__tag">我的专属特性</span>
    <h3 class="article-feature-row__title">在此输入功能特性标题</h3>
    <p class="article-feature-row__desc">在此输入该功能的详细痛点解决与说明内容...</p>
    <ul class="article-feature-row__list">
      <li>✦ 特性要点 1：原生高性能响应</li>
      <li>✦ 特性要点 2：随时随地一键撤销</li>
    </ul>
  </div>
</div>`
      )
    }
  }, [open, initialSnippet])

  function handleSave() {
    if (!name.trim()) {
      toast.error('请填写自定义模板名称')
      return
    }
    if (!snippet.trim()) {
      toast.error('模板代码内容不能为空')
      return
    }

    const newTemplate: WechatTemplate = {
      id: `custom-${Date.now()}`,
      name: `⭐ ${name.trim()}`,
      category: 'custom',
      icon: 'BookmarkPlus',
      description: description.trim() || '用户自定义排版样式模板',
      snippet: snippet.trim(),
    }

    const currentList = getStoredCustomTemplates()
    const updatedList = [newTemplate, ...currentList]
    saveStoredCustomTemplates(updatedList)

    toast.success(`自定义模板「${name.trim()}」已成功保存！`)
    onTemplateCreated(newTemplate)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className='sm:max-w-[580px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-base font-bold'>
            <BookmarkPlus className='size-5 text-primary' />
            <span>制作与保存自定义排版模板</span>
          </DialogTitle>
          <DialogDescription className='text-xs text-muted-foreground'>
            根据您的业务需求制定专属模板（如产品功能图文、多图展示、行业方案），保存后可一键重复调用。
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1.5'>
              <Label htmlFor='tpl-name' className='text-xs font-semibold'>
                模板名称 <span className='text-rose-500'>*</span>
              </Label>
              <Input
                id='tpl-name'
                placeholder='例如：电商直播产品主推图文卡'
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='h-8 text-xs'
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='tpl-desc' className='text-xs font-semibold'>
                简要说明描述
              </Label>
              <Input
                id='tpl-desc'
                placeholder='例如：左侧软件大图，右侧带特性勾选'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className='h-8 text-xs'
              />
            </div>
          </div>

          <div className='space-y-1.5'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='tpl-snippet' className='text-xs font-semibold'>
                模板 HTML / Markdown 代码
              </Label>
              <span className='text-[10px] text-muted-foreground font-mono'>
                支持包含标准 CSS 类名与占位文字
              </span>
            </div>
            <Textarea
              id='tpl-snippet'
              rows={9}
              value={snippet}
              onChange={(e) => setSnippet(e.target.value)}
              className='font-mono text-[11px] leading-relaxed resize-y'
              placeholder='在此输入或粘贴自定义 HTML 代码...'
            />
          </div>
        </div>

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button type='button' variant='outline' size='sm' onClick={onClose} className='h-8 text-xs'>
            取消
          </Button>
          <Button type='button' size='sm' onClick={handleSave} className='h-8 text-xs gap-1.5'>
            <Plus className='size-3.5' />
            <span>保存到我的模板库</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
