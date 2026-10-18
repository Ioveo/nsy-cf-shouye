import {
  Share2,
  Mail,
  PanelBottom,
  Plus,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ArticlesGraphConfig,
  ArticlesNewsletterConfig,
  ArticlesFooterConfig,
  ArticlesFooterColumn,
  ArticlesFooterLink,
} from './types'

interface ArticleFooterTabProps {
  knowledgeGraph: ArticlesGraphConfig
  newsletter: ArticlesNewsletterConfig
  footer: ArticlesFooterConfig
  onChangeGraph: (next: ArticlesGraphConfig) => void
  onChangeNewsletter: (next: ArticlesNewsletterConfig) => void
  onChangeFooter: (next: ArticlesFooterConfig) => void
}

export function ArticleFooterTab({
  knowledgeGraph,
  newsletter,
  footer,
  onChangeGraph,
  onChangeNewsletter,
  onChangeFooter,
}: ArticleFooterTabProps) {
  function updateGraphField<K extends keyof ArticlesGraphConfig>(key: K, value: ArticlesGraphConfig[K]) {
    onChangeGraph({ ...knowledgeGraph, [key]: value })
  }

  function updateNlField<K extends keyof ArticlesNewsletterConfig>(key: K, value: ArticlesNewsletterConfig[K]) {
    onChangeNewsletter({ ...newsletter, [key]: value })
  }

  function updateFooterColumnTitle(colIndex: number, title: string) {
    const nextCols = [...(footer.columns || [])]
    if (nextCols[colIndex]) {
      nextCols[colIndex] = { ...nextCols[colIndex], title }
      onChangeFooter({ ...footer, columns: nextCols })
    }
  }

  function updateFooterLink(colIndex: number, linkIndex: number, patch: Partial<ArticlesFooterLink>) {
    const nextCols = [...(footer.columns || [])]
    if (nextCols[colIndex]?.links?.[linkIndex]) {
      const nextLinks = [...nextCols[colIndex].links]
      nextLinks[linkIndex] = { ...nextLinks[linkIndex], ...patch }
      nextCols[colIndex] = { ...nextCols[colIndex], links: nextLinks }
      onChangeFooter({ ...footer, columns: nextCols })
    }
  }

  function handleAddFooterLink(colIndex: number) {
    const nextCols = [...(footer.columns || [])]
    if (nextCols[colIndex]) {
      const nextLinks = [...(nextCols[colIndex].links || []), { label: '新链接', href: '#' }]
      nextCols[colIndex] = { ...nextCols[colIndex], links: nextLinks }
      onChangeFooter({ ...footer, columns: nextCols })
    }
  }

  function handleDeleteFooterLink(colIndex: number, linkIndex: number) {
    const nextCols = [...(footer.columns || [])]
    if (nextCols[colIndex]) {
      const nextLinks = nextCols[colIndex].links.filter((_, i) => i !== linkIndex)
      nextCols[colIndex] = { ...nextCols[colIndex], links: nextLinks }
      onChangeFooter({ ...footer, columns: nextCols })
    }
  }

  return (
    <div className='space-y-6'>
      {/* 1. 知识网络 (KNOWLEDGE GRAPH) */}
      <div className='rounded-xl border bg-card p-5 space-y-4 shadow-xs'>
        <div className='border-b pb-3'>
          <h3 className='font-semibold text-sm flex items-center gap-2'>
            <Share2 className='size-4 text-pink-500' />
            <span>知识网络导引 (Knowledge Graph)</span>
          </h3>
          <p className='text-xs text-muted-foreground mt-0.5'>
            展示于页面底部的粉色脉冲弧线、动态光球与分类节点导引区。
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>主标题</Label>
            <Input
              value={knowledgeGraph.title}
              onChange={(e) => updateGraphField('title', e.target.value)}
              placeholder='知识网络'
              className='h-9 text-xs'
            />
          </div>
          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>副标题 (Subtitle)</Label>
            <Input
              value={knowledgeGraph.subtitle}
              onChange={(e) => updateGraphField('subtitle', e.target.value)}
              placeholder='KNOWLEDGE GRAPH'
              className='h-9 text-xs'
            />
          </div>
        </div>

        <div className='space-y-1.5'>
          <Label className='text-xs font-medium'>节点大标题 (Headline)</Label>
          <Input
            value={knowledgeGraph.headline}
            onChange={(e) => updateGraphField('headline', e.target.value)}
            placeholder='每一篇特稿，都是网络上的一个节点。'
            className='h-9 text-xs'
          />
        </div>

        <div className='space-y-1.5'>
          <Label className='text-xs font-medium'>导引说明段落 (Description)</Label>
          <Textarea
            rows={2}
            value={knowledgeGraph.desc}
            onChange={(e) => updateGraphField('desc', e.target.value)}
            placeholder='十五个现场，十大主题。从任意一篇出发，沿着这条粉色的线，走到下一篇——阅读在这里有了方向。'
            className='text-xs'
          />
        </div>
      </div>

      {/* 2. 电子简报订阅 (NEWSLETTER) */}
      <div className='rounded-xl border bg-card p-5 space-y-4 shadow-xs'>
        <div className='border-b pb-3'>
          <h3 className='font-semibold text-sm flex items-center gap-2'>
            <Mail className='size-4 text-amber-500' />
            <span>每周电子简报订阅卡片 (Newsletter Card)</span>
          </h3>
          <p className='text-xs text-muted-foreground mt-0.5'>
            前台双色微光模糊光斑、极简暗色背景的邮件订阅入口。
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>卡片主标题 (换行自动折行)</Label>
            <Input
              value={newsletter.title}
              onChange={(e) => updateNlField('title', e.target.value)}
              placeholder={'每周一封，\n把世界折好寄给你。'}
              className='h-9 text-xs'
            />
          </div>
          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>副标题说明</Label>
            <Input
              value={newsletter.subtitle}
              onChange={(e) => updateNlField('subtitle', e.target.value)}
              placeholder='订阅白卷周刊 · 每周五早上 8 点 · 5 分钟读完'
              className='h-9 text-xs'
            />
          </div>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>输入框占位符 (Placeholder)</Label>
            <Input
              value={newsletter.placeholder}
              onChange={(e) => updateNlField('placeholder', e.target.value)}
              placeholder='你的邮箱地址'
              className='h-9 text-xs'
            />
          </div>
          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>订阅按钮文字</Label>
            <Input
              value={newsletter.buttonText}
              onChange={(e) => updateNlField('buttonText', e.target.value)}
              placeholder='订阅'
              className='h-9 text-xs'
            />
          </div>
        </div>
      </div>

      {/* 3. 页脚信息与多列外链 (FOOTER) */}
      <div className='rounded-xl border bg-card p-5 space-y-4 shadow-xs'>
        <div className='border-b pb-3'>
          <h3 className='font-semibold text-sm flex items-center gap-2'>
            <PanelBottom className='size-4 text-primary' />
            <span>页脚描述、友情外链与版权声明 (Footer Links)</span>
          </h3>
          <p className='text-xs text-muted-foreground mt-0.5'>
            管理页面底部的品牌介绍、分列链接与版权信息。
          </p>
        </div>

        <div className='space-y-1.5'>
          <Label className='text-xs font-medium'>页脚品牌简述 (Brand Description)</Label>
          <Textarea
            rows={2}
            value={footer.brandDesc}
            onChange={(e) => onChangeFooter({ ...footer, brandDesc: e.target.value })}
            placeholder='用眼睛读的杂志。十五位撰稿人，十五个现场，每周五更新。'
            className='text-xs'
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 pt-2'>
          {(footer.columns || []).map((col, colIdx) => (
            <div key={colIdx} className='p-3 rounded-lg border bg-muted/20 space-y-3'>
              <div className='flex items-center justify-between'>
                <Input
                  value={col.title}
                  onChange={(e) => updateFooterColumnTitle(colIdx, e.target.value)}
                  className='h-7 text-xs font-bold w-24'
                  placeholder='列标题'
                />
                <Button
                  size='sm'
                  variant='ghost'
                  className='h-6 text-[10px] gap-1 px-1.5'
                  onClick={() => handleAddFooterLink(colIdx)}
                >
                  <Plus className='size-3' />
                  <span>加链接</span>
                </Button>
              </div>

              <div className='space-y-1.5'>
                {(col.links || []).map((link, linkIdx) => (
                  <div key={linkIdx} className='flex items-center gap-1.5'>
                    <Input
                      value={link.label}
                      onChange={(e) => updateFooterLink(colIdx, linkIdx, { label: e.target.value })}
                      placeholder='标签'
                      className='h-6 text-[11px] w-24'
                    />
                    <Input
                      value={link.href}
                      onChange={(e) => updateFooterLink(colIdx, linkIdx, { href: e.target.value })}
                      placeholder='#'
                      className='h-6 text-[11px] font-mono flex-1'
                    />
                    <Button
                      size='icon'
                      variant='ghost'
                      className='size-6 text-destructive shrink-0'
                      onClick={() => handleDeleteFooterLink(colIdx, linkIdx)}
                    >
                      <Trash2 className='size-3' />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className='space-y-1.5 pt-2 border-t'>
          <Label className='text-xs font-medium'>版权声明文案 (Copyright)</Label>
          <Input
            value={footer.copyright}
            onChange={(e) => onChangeFooter({ ...footer, copyright: e.target.value })}
            placeholder='© 2026 白卷 WHITE FOLIO · 天才猫文章专栏'
            className='h-9 text-xs'
          />
        </div>
      </div>
    </div>
  )
}
