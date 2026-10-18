import { useMemo } from 'react'
import {
  ChevronLeft,
  MoreHorizontal,
  Share2,
  Heart,
  Eye,
  Smartphone,
  Monitor,
  Globe,
} from 'lucide-react'

interface WorkbenchPhonePreviewProps {
  title: string
  summary: string
  content: string
  category: string
  coverUrl: string
  tags: string
  slug?: string
  viewMode?: 'split-phone' | 'split-desktop'
  onClose?: () => void
}

export function WorkbenchPhonePreview({
  title,
  summary,
  content,
  category,
  coverUrl,
  tags,
  slug,
  viewMode = 'split-phone',
}: WorkbenchPhonePreviewProps) {
  // 简易渲染正文 Markdown 与 HTML，支持公众号卡片与高级图文
  const renderedHtml = useMemo(() => {
    const raw = content.trim()
    if (!raw) return '<p class="text-zinc-500 italic text-center py-8">正文内容空空如也，快在左侧开始排版创作吧...</p>'

    // 简单 Markdown 解析并保留 HTML 样式标签
    let html = raw
      // 标题
      .replace(/^### (.*$)/gim, '<h3 class="phone-h3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="phone-h2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="phone-h1">$1</h1>')
      // 粗体与斜体
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/~~(.*?)~~/gim, '<del>$1</del>')
      // 图片: 转为带样式外框与标题的真实图像
      .replace(/!\[([^\]]*)\]\((.*?)\)/gim, '<figure class="article-image-box"><img src="$2" alt="$1" class="phone-img" /><figcaption class="article-image-caption">$1</figcaption></figure>')
      // 引用
      .replace(/^\> (.*$)/gim, '<blockquote class="phone-quote">$1</blockquote>')

    // 混合排版：避免破坏已有的 HTML 块标签
    const chunks = html.split(/\n{2,}/)
    return chunks.map(chunk => {
      const trimmed = chunk.trim()
      if (!trimmed) return ''
      if (/^<(?:div|p|section|blockquote|table|ul|ol|h[1-6]|figure|article|hr|pre)[\s>]/i.test(trimmed)) {
        return trimmed
      }
      return `<p class="phone-p">${trimmed.replace(/\n/g, '<br>')}</p>`
    }).filter(Boolean).join('\n')
  }, [content])

  const tagList = useMemo(() => {
    return tags
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean)
  }, [tags])

  const isDesktop = viewMode === 'split-desktop'

  return (
    <aside
      className={`shrink-0 border-l border-border bg-muted/20 flex flex-col items-center justify-start p-4 sm:p-6 overflow-y-auto select-none transition-all ${
        isDesktop ? 'w-full lg:w-[600px] xl:w-[700px]' : 'w-full lg:w-[410px]'
      }`}
    >
      <div className='flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-3'>
        {isDesktop ? (
          <>
            <Monitor className='size-3.5 text-primary' />
            <span>桌面宽屏官网真实仿真预览</span>
          </>
        ) : (
          <>
            <Smartphone className='size-3.5 text-primary' />
            <span>微信公众号手机真实仿真预览</span>
          </>
        )}
      </div>

      {isDesktop ? (
        /* 桌面端浏览器外框 */
        <div className='w-full max-w-2xl h-[720px] rounded-xl border border-border/80 bg-background shadow-2xl overflow-hidden flex flex-col relative ring-1 ring-border/50'>
          {/* 浏览器顶栏与地址栏 */}
          <div className='h-10 border-b border-border/50 bg-muted/40 px-3 flex items-center justify-between shrink-0'>
            <div className='flex items-center gap-1.5'>
              <div className='w-2.5 h-2.5 rounded-full bg-rose-500/80' />
              <div className='w-2.5 h-2.5 rounded-full bg-amber-500/80' />
              <div className='w-2.5 h-2.5 rounded-full bg-emerald-500/80' />
            </div>
            <div className='flex-1 mx-4 px-3 py-1 rounded-md bg-background border border-border/60 text-[11px] text-muted-foreground font-mono flex items-center gap-1.5 truncate'>
              <Globe className='size-3 shrink-0 text-primary' />
              <span className='truncate'>https://www.nsyoo.com/article.html?slug={slug || 'article-preview'}</span>
            </div>
            <div className='text-[10px] text-muted-foreground font-semibold px-1.5 py-0.5 rounded bg-muted'>
              DESKTOP
            </div>
          </div>

          {/* 桌面端内容视窗 */}
          <div className='flex-1 overflow-y-auto p-6 sm:p-8 phone-scroll'>
            {/* 分类徽章 */}
            <div className='mb-3'>
              <span className='text-[11px] font-semibold text-primary px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20'>
                {category || '上手教程'}
              </span>
            </div>

            {/* 文章主标题 */}
            <h1 className='text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight text-foreground'>
              {title.trim() ? title : '新文章标题预览'}
            </h1>

            {/* 桌面端作者与元数据 */}
            <div className='mt-3 mb-6 flex items-center gap-2.5 text-xs text-muted-foreground flex-wrap pb-4 border-b border-border/40'>
              <span className='font-semibold text-foreground'>天才猫团队</span>
              <span>·</span>
              <span>官方专栏</span>
              <span>·</span>
              <span>阅读约 3 分钟</span>
            </div>

            {/* 封面大图 */}
            {coverUrl && (
              <div className='mb-6 rounded-xl overflow-hidden border border-border/60 shadow-md'>
                <img src={coverUrl} alt='封面' className='w-full max-h-72 object-cover' />
              </div>
            )}

            {/* 导读金句 */}
            {summary && (
              <div className='mb-6 p-4 rounded-xl bg-primary/10 border-l-4 border-primary text-sm leading-relaxed text-foreground/90 shadow-sm'>
                <p className='font-semibold text-xs text-primary mb-1 tracking-wide uppercase'>摘要导读</p>
                {summary}
              </div>
            )}

            {/* 正文渲染内容 */}
            <div
              className='phone-article-body text-sm leading-relaxed space-y-4'
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />

            {/* 标签 */}
            {tagList.length > 0 && (
              <div className='mt-8 pt-4 border-t border-border/40 flex items-center gap-2 flex-wrap'>
                {tagList.map((tag) => (
                  <span
                    key={tag}
                    className='text-xs px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground border border-border/40'
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* iPhone 15 仿真手机外框 */
        <div className='w-[360px] h-[720px] rounded-[48px] border-[10px] border-zinc-900 bg-background shadow-2xl overflow-hidden flex flex-col relative ring-1 ring-border/50'>
        {/* 顶部灵动岛 */}
        <div className='h-7 bg-zinc-950 flex items-center justify-center shrink-0 relative'>
          <div className='w-24 h-4 bg-black rounded-full' />
          <div className='absolute left-6 text-[10px] font-semibold text-zinc-400 font-mono'>09:41</div>
          <div className='absolute right-6 flex items-center gap-1 text-[10px] text-zinc-400 font-mono'>
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* 微信公众号顶栏 */}
        <div className='h-11 border-b border-border/40 bg-zinc-900/90 text-white px-3 flex items-center justify-between shrink-0'>
          <div className='flex items-center gap-1 text-xs'>
            <ChevronLeft className='size-4' />
            <span className='font-medium text-[11px] truncate max-w-[140px]'>天才猫官方专栏</span>
          </div>
          <div className='flex items-center gap-3 text-zinc-300'>
            <MoreHorizontal className='size-4' />
          </div>
        </div>

        {/* 手机内容可滚动视窗 */}
        <div className='flex-1 overflow-y-auto p-4 text-zinc-200 phone-scroll'>
          {/* 文章标题 */}
          <h1 className='text-xl font-bold leading-tight tracking-tight text-foreground'>
            {title.trim() ? title : '新文章标题预览'}
          </h1>

          {/* 微信作者与元信息栏 */}
          <div className='mt-2.5 mb-4 flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap'>
            <span className='text-primary font-semibold'>天才猫团队</span>
            <span>·</span>
            <span>{category || '上手教程'}</span>
            <span>·</span>
            <span>今天</span>
          </div>

          {/* 封面大图 */}
          {coverUrl && (
            <div className='mb-4 rounded-xl overflow-hidden border border-border/60 shadow-sm'>
              <img src={coverUrl} alt='封面' className='w-full h-40 object-cover' />
            </div>
          )}

          {/* 导读金句引言 */}
          {summary && (
            <div className='mb-4 p-3 rounded-xl bg-primary/10 border-l-4 border-primary text-xs leading-relaxed text-foreground/90'>
              <p className='font-medium text-[11px] text-primary mb-1'>导读</p>
              {summary}
            </div>
          )}

          {/* 正文渲染内容 */}
          <div
            className='phone-article-body text-xs sm:text-[13px] leading-relaxed space-y-3'
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />

          {/* 标签 */}
          {tagList.length > 0 && (
            <div className='mt-6 pt-4 border-t border-border/40 flex items-center gap-1.5 flex-wrap'>
              {tagList.map((tag) => (
                <span
                  key={tag}
                  className='text-[10px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/40'
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 微信底栏互动（阅读、赞、在看、分享） */}
          <div className='mt-6 pt-4 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <span className='flex items-center gap-1'>
                <Eye className='size-3' />
                <span>阅读 10万+</span>
              </span>
              <span className='flex items-center gap-1 text-primary'>
                <Heart className='size-3 fill-current' />
                <span>在看 2,480</span>
              </span>
            </div>
            <div className='flex items-center gap-1 cursor-pointer hover:text-foreground transition-all'>
              <Share2 className='size-3' />
              <span>分享</span>
            </div>
          </div>
        </div>
      </div>
      )}
    </aside>
  )
}
