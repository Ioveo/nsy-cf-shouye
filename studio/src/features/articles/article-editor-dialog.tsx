import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  Loader2,
  Upload,
  Eye,
  Save,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { api } from '@/lib/api'
// @ts-ignore
import { uploadAssetFile } from '@r2'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Software } from '@/lib/queries'
import { ArticlePreviewDialog } from './article-preview-dialog'

interface ArticleEditorDialogProps {
  open: boolean
  article: any | null
  softwareList: Software[]
  articlesCount: number
  onClose: () => void
  onSaved: () => void
}

export function ArticleEditorDialog({
  open,
  article,
  softwareList,
  articlesCount,
  onClose,
  onSaved,
}: ArticleEditorDialogProps) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [summary, setSummary] = useState('')
  const [category, setCategory] = useState('产品教程')
  const [tags, setTags] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [content, setContent] = useState('')
  const [softwareIds, setSoftwareIds] = useState<string[]>([])
  const [featured, setFeatured] = useState(false)
  const [status, setStatus] = useState('published')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // Initialize or reset form state
  useEffect(() => {
    if (!open) return
    if (article) {
      setTitle(article.title || '')
      setSlug(article.slug || '')
      setSummary(article.summary || '')
      setCategory(article.category || '产品教程')
      setTags(Array.isArray(article.tags) ? article.tags.join(', ') : '')
      setCoverUrl(article.coverUrl || '')
      setContent(article.content || '')
      setSoftwareIds(article.softwareIds || [])
      setFeatured(Boolean(article.featured))
      setStatus(article.status || 'published')
      setSeoTitle(article.seoTitle || '')
      setSeoDescription(article.seoDescription || '')
    } else {
      const draft = localStorage.getItem('studio_article_draft')
      if (draft) {
        try {
          const d = JSON.parse(draft)
          setTitle(d.title || '')
          setSlug(d.slug || '')
          setSummary(d.summary || '')
          setCategory(d.category || '产品教程')
          setTags(d.tags || '')
          setCoverUrl(d.coverUrl || '')
          setContent(d.content || '')
          setSoftwareIds(d.softwareIds || [])
          setFeatured(Boolean(d.featured))
          setStatus(d.status || 'published')
          setSeoTitle(d.seoTitle || '')
          setSeoDescription(d.seoDescription || '')
          toast.info('已恢复上次自动暂存的草稿内容')
        } catch {
          resetFields()
        }
      } else {
        resetFields()
      }
    }
  }, [open, article])

  function resetFields() {
    setTitle('')
    setSlug('')
    setSummary('')
    setCategory('产品教程')
    setTags('')
    setCoverUrl('')
    setContent('')
    setSoftwareIds([])
    setFeatured(false)
    setStatus('published')
    setSeoTitle('')
    setSeoDescription('')
  }

  // Auto-save draft to localStorage every 30s
  useEffect(() => {
    if (!open || article) return
    const timer = setInterval(() => {
      if (title.trim() || content.trim()) {
        localStorage.setItem(
          'studio_article_draft',
          JSON.stringify({
            title,
            slug,
            summary,
            category,
            tags,
            coverUrl,
            content,
            softwareIds,
            featured,
            status,
            seoTitle,
            seoDescription,
            savedAt: Date.now(),
          })
        )
      }
    }, 30000)
    return () => clearInterval(timer)
  }, [open, article, title, slug, summary, category, tags, coverUrl, content, softwareIds, featured, status, seoTitle, seoDescription])

  // Save handler
  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!title.trim()) {
      toast.error('文章标题不能为空')
      return
    }

    setIsSaving(true)
    try {
      const finalSlug = slug.trim() || `post-${Date.now()}`
      const tagsArray = tags
        .split(/[,，\s]+/)
        .map((t) => t.trim())
        .filter(Boolean)

      const payload = {
        id: article?.id || '',
        title: title.trim(),
        slug: finalSlug,
        summary: summary.trim(),
        content: content.trim(),
        category: category.trim() || '产品教程',
        tags: tagsArray,
        softwareIds,
        featured,
        status,
        coverUrl: coverUrl.trim(),
        seoTitle: seoTitle.trim(),
        seoDescription: seoDescription.trim(),
        sortOrder: article?.sortOrder ?? articlesCount,
      }

      const res = await api.post('/api/admin/articles', payload)
      if (res.success) {
        toast.success(article ? '文章已更新' : '文章发表成功')
        localStorage.removeItem('studio_article_draft')
        onSaved()
        onClose()
      } else {
        toast.error(res.msg || '保存文章失败')
      }
    } catch (err: any) {
      toast.error(`保存异常：${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Ctrl/Cmd + S listener
  useEffect(() => {
    if (!open) return
    const onStudioSave = () => {
      handleSave()
    }
    window.addEventListener('studio:save', onStudioSave)
    return () => window.removeEventListener('studio:save', onStudioSave)
  }, [open, title, slug, summary, category, tags, coverUrl, content, softwareIds, featured, status, seoTitle, seoDescription])

  // Beforeunload protection
  useEffect(() => {
    if (!open) return
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (title.trim() || content.trim()) {
        e.preventDefault()
        e.returnValue = '文章编辑尚未保存，确定要离开吗？'
        return e.returnValue
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [open, title, content])

  // Markdown image upload helper
  async function handleUploadMarkdownImage(file: File) {
    const toastId = toast.loading(`正在上传图片 ${file.name}...`)
    try {
      const res = await uploadAssetFile(file, { kind: 'image', folder: 'articles' })
      if (res.success && res.url) {
        toast.success('图片上传成功', { id: toastId })
        const snippet = `\n![${file.name.replace(/\.[^.]+$/, '')}](${res.url})\n`
        insertTextIntoTextarea(snippet)
      } else {
        toast.error(res.msg || '上传失败', { id: toastId })
      }
    } catch (err: any) {
      toast.error(`上传异常：${err.message}`, { id: toastId })
    }
  }

  function insertTextIntoTextarea(text: string) {
    const ta = textareaRef.current
    if (!ta) {
      setContent((prev) => prev + text)
      return
    }
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const nextContent = content.substring(0, start) + text + content.substring(end)
    setContent(nextContent)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + text.length, start + text.length)
    }, 50)
  }

  // Cover image upload
  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingCover(true)
    try {
      const res = await uploadAssetFile(file, { kind: 'image', folder: 'articles' })
      if (res.success && res.url) {
        setCoverUrl(res.url)
        toast.success('封面上传成功')
      } else {
        toast.error(res.msg || '封面上传失败')
      }
    } catch (err: any) {
      toast.error(`上传异常: ${err.message}`)
    } finally {
      setIsUploadingCover(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{article ? '编辑文章' : '撰写新文章'}</DialogTitle>
            <DialogDescription>
              支持 Markdown 排版、图片拖拽/剪贴板粘贴直接上传以及实时免保存同步预览。
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className='space-y-4 py-2 text-xs'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <Label className='text-xs'>文章标题 *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder='如：天才猫桌面 2.0 效率进阶指南'
                  className='h-8 text-xs'
                  required
                />
              </div>
              <div className='space-y-1.5'>
                <Label className='text-xs'>URL 别名 (Slug)</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder='留空将自动生成'
                  className='h-8 text-xs font-mono'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='space-y-1.5'>
                <Label className='text-xs'>所属分类</Label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder='如：产品教程 / 版本发布 / 效率指南'
                  className='h-8 text-xs'
                />
              </div>
              <div className='space-y-1.5'>
                <Label className='text-xs'>文章标签 (逗号分隔)</Label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder='如：NTFS, 抽屉, 快捷键'
                  className='h-8 text-xs'
                />
              </div>
              <div className='space-y-1.5'>
                <Label className='text-xs'>发布状态</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className='h-8 w-full rounded-md border border-input bg-background px-3 text-xs'
                >
                  <option value='published'>公开已发布</option>
                  <option value='draft'>草稿箱 (仅后台可见)</option>
                </select>
              </div>
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs'>文章摘要 / 引言</Label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder='简要介绍本文的核心价值主张（1-2句）'
                className='text-xs min-h-[60px]'
              />
            </div>

            <div className='space-y-1.5'>
              <div className='flex items-center justify-between'>
                <Label className='text-xs'>封面图片 URL</Label>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  className='h-6 text-[11px] gap-1'
                  disabled={isUploadingCover}
                  onClick={() => coverInputRef.current?.click()}
                >
                  {isUploadingCover ? <Loader2 className='size-3 animate-spin' /> : <Upload className='size-3' />}
                  <span>上传新封面</span>
                </Button>
                <input
                  ref={coverInputRef}
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={handleCoverUpload}
                />
              </div>
              <Input
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder='https://...'
                className='h-8 text-xs font-mono'
              />
            </div>

            <div className='space-y-1.5'>
              <div className='flex items-center justify-between'>
                <Label className='text-xs font-semibold'>
                  正文内容 (Markdown 支持拖拽/粘贴图片直接上传)
                </Label>
                <Button
                  type='button'
                  size='sm'
                  variant='ghost'
                  className='h-6 text-[11px] gap-1 text-primary'
                  onClick={() => setPreviewOpen(true)}
                >
                  <Eye className='size-3' />
                  <span>实时预览</span>
                </Button>
              </div>
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={(e) => {
                  const items = e.clipboardData?.items
                  if (items) {
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.startsWith('image/')) {
                        const file = items[i].getAsFile()
                        if (file) {
                          e.preventDefault()
                          handleUploadMarkdownImage(file)
                          break
                        }
                      }
                    }
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const files = e.dataTransfer.files
                  if (files && files.length > 0 && files[0].type.startsWith('image/')) {
                    handleUploadMarkdownImage(files[0])
                  }
                }}
                placeholder='编写 Markdown 正文... 支持 ## 标题、列表、代码块、引用与图片'
                className='min-h-[260px] font-mono text-xs leading-relaxed'
              />
            </div>

            <div className='flex items-center justify-between p-3 rounded-lg border bg-muted/20'>
              <div className='space-y-0.5'>
                <Label className='text-xs font-medium'>设为主推置顶文章</Label>
                <p className='text-[11px] text-muted-foreground'>
                  开启后将在专栏与软件关联推荐位优先展示
                </p>
              </div>
              <Switch checked={featured} onCheckedChange={setFeatured} />
            </div>

            <DialogFooter className='gap-2 sm:gap-0 pt-2'>
              <Button type='button' variant='outline' size='sm' onClick={onClose}>
                取消
              </Button>
              <Button type='submit' size='sm' disabled={isSaving} className='gap-1.5'>
                {isSaving ? <Loader2 className='size-3.5 animate-spin' /> : <Save className='size-3.5' />}
                <span>{article ? '保存修改' : '立即发布'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 实时免刷新预览模态框 */}
      <ArticlePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        articleData={{
          title,
          summary,
          content,
          category,
          coverUrl,
        }}
      />
    </>
  )
}
