import { forwardRef } from 'react'
import { toast } from 'sonner'
import { FileText, Clock, Sparkles } from 'lucide-react'
// @ts-ignore
import { uploadAssetFile } from '@r2'

interface WorkbenchCanvasProps {
  title: string
  summary: string
  content: string
  onTitleChange: (v: string) => void
  onSummaryChange: (v: string) => void
  onContentChange: (v: string) => void
  onInsertText: (text: string) => void
}

export const WorkbenchCanvas = forwardRef<HTMLTextAreaElement, WorkbenchCanvasProps>(
  function WorkbenchCanvas(
    {
      title,
      summary,
      content,
      onTitleChange,
      onSummaryChange,
      onContentChange,
      onInsertText,
    },
    ref
  ) {
    // 拖拽图片上传
    async function handleDrop(e: React.DragEvent<HTMLTextAreaElement>) {
      e.preventDefault()
      const files = e.dataTransfer.files
      if (files && files.length > 0 && files[0].type.startsWith('image/')) {
        await uploadAndInsertImage(files[0])
      }
    }

    // 剪贴板粘贴图片上传
    async function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
      const items = e.clipboardData?.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile()
          if (file) {
            e.preventDefault()
            await uploadAndInsertImage(file)
            break
          }
        }
      }
    }

    async function uploadAndInsertImage(file: File) {
      const toastId = toast.loading(`正在上传图片 ${file.name}...`)
      try {
        const res = await uploadAssetFile(file, { kind: 'image', folder: 'articles' })
        if (res.success && res.url) {
          toast.success('图片上传成功', { id: toastId })
          const snippet = `\n\n![${file.name.replace(/\.[^.]+$/, '')}](${res.url})\n\n`
          onInsertText(snippet)
        } else {
          toast.error(res.msg || '上传图片失败', { id: toastId })
        }
      } catch (err: any) {
        toast.error(`上传异常: ${err.message}`, { id: toastId })
      }
    }

    const wordCount = content.trim().length
    const readingTime = Math.max(1, Math.ceil(wordCount / 400))

    return (
      <div className='flex-1 overflow-y-auto px-4 py-8 sm:px-8 flex justify-center bg-background'>
        <div className='w-full max-w-3xl space-y-6'>
          {/* 大标题输入区 */}
          <div className='space-y-2'>
            <input
              type='text'
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder='输入文章主标题...'
              className='w-full bg-transparent text-2xl sm:text-3xl font-extrabold tracking-tight placeholder:text-muted-foreground/40 border-0 focus:outline-none focus:ring-0 px-0'
              autoFocus
            />
          </div>

          {/* 导读 / 摘要输入区 */}
          <div className='p-3.5 rounded-xl border border-border/80 bg-muted/20 focus-within:border-primary/40 focus-within:bg-muted/30 transition-all'>
            <div className='flex items-center justify-between mb-1.5'>
              <span className='text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5'>
                <Sparkles className='size-3 text-primary' />
                <span>导读 / 引言摘要</span>
              </span>
              <span className='text-[10px] text-muted-foreground font-mono'>
                {summary.length} / 160 字
              </span>
            </div>
            <textarea
              value={summary}
              onChange={(e) => onSummaryChange(e.target.value)}
              placeholder='简要提炼本文的核心价值与解决的痛点（用于首页卡片与微信分享卡片导读）...'
              rows={2}
              maxLength={200}
              className='w-full bg-transparent text-xs text-foreground leading-relaxed placeholder:text-muted-foreground/50 resize-none border-0 focus:outline-none focus:ring-0 p-0'
            />
          </div>

          {/* 正文输入区（沉浸画布） */}
          <div className='relative min-h-[480px]'>
            <textarea
              ref={ref}
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onPaste={handlePaste}
              placeholder='从这里开始撰写正文... 支持 Markdown 语法、上方快捷工具排版、公众号样式模板，以及直接粘贴/拖入图片。'
              className='w-full min-h-[520px] bg-transparent text-sm sm:text-base leading-relaxed text-foreground placeholder:text-muted-foreground/40 border-0 focus:outline-none focus:ring-0 p-0 resize-none font-mono'
            />
          </div>

          {/* 底栏字数与阅读估时统计 */}
          <div className='pt-6 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground select-none'>
            <div className='flex items-center gap-4'>
              <span className='flex items-center gap-1.5'>
                <FileText className='size-3.5' />
                <span>正文字数：<strong className='text-foreground font-mono'>{wordCount}</strong></span>
              </span>
              <span className='flex items-center gap-1.5'>
                <Clock className='size-3.5' />
                <span>预计阅读：<strong className='text-foreground font-mono'>{readingTime}</strong> 分钟</span>
              </span>
            </div>
            <div className='text-[11px] text-muted-foreground/80 hidden sm:block'>
              支持 Ctrl + S / ⌘ + S 极速暂存
            </div>
          </div>
        </div>
      </div>
    )
  }
)
