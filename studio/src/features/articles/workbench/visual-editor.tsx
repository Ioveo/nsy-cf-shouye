import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { createEditor, createToolbar, IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import '@wangeditor/editor/dist/css/style.css'
import { toast } from 'sonner'
// @ts-ignore
import { uploadAssetFile } from '@r2'

export interface VisualEditorHandle {
  insertHtml: (html: string) => void
  getHtml: () => string
  setHtml: (html: string) => void
  focus: () => void
}

interface VisualEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

/**
 * 自动检测并转换原生 Markdown 到 HTML
 * 确保历史 Markdown 文章在可视化编辑器中也能优雅排版
 */
function markdownToHtmlIfRaw(text: string): string {
  if (!text || !text.trim()) return '<p></p>'
  if (/<(?:p|div|section|table|h[1-6]|ul|ol|blockquote|article|figure)[\s>]/i.test(text)) {
    return text
  }
  let html = text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/~~(.*?)~~/gim, '<del>$1</del>')
    .replace(/!\[([^\]]*)\]\((.*?)\)/gim, '<p><img src="$2" alt="$1" style="max-width: 100%; border-radius: 8px;" /></p>')
    .replace(/^\> (.*$)/gim, '<blockquote><p>$1</p></blockquote>')

  const chunks = html.split(/\n{2,}/)
  return chunks
    .map((chunk) => {
      const trimmed = chunk.trim()
      if (!trimmed) return ''
      if (/^<(?:div|p|section|blockquote|table|ul|ol|h[1-6]|figure|article|hr|pre)[\s>]/i.test(trimmed)) {
        return trimmed
      }
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`
    })
    .filter(Boolean)
    .join('')
}

export const VisualEditor = forwardRef<VisualEditorHandle, VisualEditorProps>(
  function VisualEditor({ value, onChange, placeholder, className = '' }, ref) {
    const toolbarContainerRef = useRef<HTMLDivElement>(null)
    const editorContainerRef = useRef<HTMLDivElement>(null)
    const editorInstanceRef = useRef<IDomEditor | null>(null)
    const latestHtmlRef = useRef<string>(value)
    const initialHtmlRef = useRef<string>(markdownToHtmlIfRaw(value))

    // 暴露方法给父级（如插入模板、引用卡片等）
    useImperativeHandle(ref, () => ({
      insertHtml(html: string) {
        if (editorInstanceRef.current) {
          editorInstanceRef.current.focus()
          editorInstanceRef.current.dangerouslyInsertHtml(html)
          const newHtml = editorInstanceRef.current.getHtml()
          latestHtmlRef.current = newHtml
          onChange(newHtml)
        }
      },
      getHtml() {
        return editorInstanceRef.current ? editorInstanceRef.current.getHtml() : value
      },
      setHtml(html: string) {
        if (editorInstanceRef.current) {
          editorInstanceRef.current.setHtml(html)
          latestHtmlRef.current = html
          onChange(html)
        }
      },
      focus() {
        editorInstanceRef.current?.focus()
      },
    }))

    // 初始化 WangEditor 5 实例
    useEffect(() => {
      let isDestroyed = false

      if (editorContainerRef.current && toolbarContainerRef.current) {
        const editorConfig: Partial<IEditorConfig> = {
          placeholder: placeholder || '从这里开始可视化撰写... 支持类似 Word / 微信公众号的表格、图片拖拽缩放、颜色与排版组件。',
          MENU_CONF: {
            uploadImage: {
              server: '',
              async customUpload(file: File, insertFn: (url: string, alt: string, href: string) => void) {
                const toastId = toast.loading(`正在上传图片 ${file.name}...`)
                try {
                  const res = await uploadAssetFile(file, { kind: 'image', folder: 'articles' })
                  if (res.success && res.url) {
                    toast.success('图片上传成功', { id: toastId })
                    const alt = file.name.replace(/\.[^.]+$/, '')
                    insertFn(res.url, alt, res.url)
                  } else {
                    toast.error(res.msg || '上传图片失败', { id: toastId })
                  }
                } catch (err: any) {
                  toast.error(`上传异常: ${err.message}`, { id: toastId })
                }
              },
            },
            uploadVideo: {
              server: '',
              async customUpload(file: File, insertFn: (url: string, poster: string) => void) {
                const toastId = toast.loading(`正在上传视频 ${file.name}...`)
                try {
                  const res = await uploadAssetFile(file, { kind: 'file', folder: 'articles' })
                  if (res.success && res.url) {
                    toast.success('视频上传成功', { id: toastId })
                    insertFn(res.url, '')
                  } else {
                    toast.error(res.msg || '上传视频失败', { id: toastId })
                  }
                } catch (err: any) {
                  toast.error(`上传异常: ${err.message}`, { id: toastId })
                }
              },
            },
          },
          onChange(ed: IDomEditor) {
            if (isDestroyed) return
            const html = ed.getHtml()
            latestHtmlRef.current = html
            onChange(html)
          },
        }

        const toolbarConfig: Partial<IToolbarConfig> = {
          excludeKeys: ['fullScreen'],
        }

        const editor = createEditor({
          selector: editorContainerRef.current,
          html: initialHtmlRef.current,
          config: editorConfig,
          mode: 'default',
        })

        createToolbar({
          editor,
          selector: toolbarContainerRef.current,
          config: toolbarConfig,
          mode: 'default',
        })

        editorInstanceRef.current = editor
      }

      return () => {
        isDestroyed = true
        if (editorInstanceRef.current) {
          editorInstanceRef.current.destroy()
          editorInstanceRef.current = null
        }
      }
    }, [])

    // 响应外部内容变化（如草稿恢复或切换模式时）
    useEffect(() => {
      if (editorInstanceRef.current && value !== latestHtmlRef.current) {
        latestHtmlRef.current = value
        if (editorInstanceRef.current.getHtml() !== value) {
          editorInstanceRef.current.setHtml(value || '<p></p>')
        }
      }
    }, [value])

    return (
      <div className={`wang-editor-wrapper flex flex-col rounded-xl border border-border/80 bg-background shadow-xs overflow-hidden ${className}`}>
        {/* 1. 顶部零代码可视化工具栏 */}
        <div
          ref={toolbarContainerRef}
          className='wang-toolbar-container border-b border-border/70 bg-muted/40 sticky top-0 z-10 select-none'
        />

        {/* 2. 富文本可编辑沉浸区域 */}
        <div
          ref={editorContainerRef}
          className='wang-editor-content article-viewer flex-1 min-h-[500px] p-4 sm:p-6 bg-transparent text-foreground focus:outline-none'
        />
      </div>
    )
  }
)
