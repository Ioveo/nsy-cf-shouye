import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Software } from '@/lib/queries'
import { WorkbenchHeader } from './workbench-header'
import { WorkbenchToolbar } from './workbench-toolbar'
import { WorkbenchCanvas } from './workbench-canvas'
import { WorkbenchProperties } from './workbench-properties'
import { WorkbenchPhonePreview } from './workbench-phone-preview'
import type { WorkbenchViewMode } from './types'

interface ArticleWorkbenchProps {
  article: any | null
  softwareList: Software[]
  articlesCount: number
  onClose: () => void
  onSaved: () => void
}

export function ArticleWorkbench({
  article,
  softwareList,
  articlesCount,
  onClose,
  onSaved,
}: ArticleWorkbenchProps) {
  const [title, setTitle] = useState(article?.title || '')
  const [slug, setSlug] = useState(article?.slug || '')
  const [summary, setSummary] = useState(article?.summary || '')
  const [category, setCategory] = useState(article?.category || '上手教程')
  const [tags, setTags] = useState(Array.isArray(article?.tags) ? article.tags.join(', ') : '')
  const [coverUrl, setCoverUrl] = useState(article?.coverUrl || '')
  const [content, setContent] = useState(article?.content || '')
  const [softwareIds, setSoftwareIds] = useState<string[]>(article?.softwareIds || [])
  const [featured, setFeatured] = useState(Boolean(article?.featured))
  const [status, setStatus] = useState<'published' | 'draft'>(article?.status || 'published')
  const [seoTitle, setSeoTitle] = useState(article?.seoTitle || '')
  const [seoDescription, setSeoDescription] = useState(article?.seoDescription || '')

  const [viewMode, setViewMode] = useState<WorkbenchViewMode>('split-phone')
  const [propertiesOpen, setPropertiesOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 恢复上次自动暂存草稿 (新建模式下)
  useEffect(() => {
    if (article) return
    const draft = localStorage.getItem('studio_article_workbench_draft')
    if (draft) {
      try {
        const d = JSON.parse(draft)
        if (d.title || d.content) {
          setTitle(d.title || '')
          setSlug(d.slug || '')
          setSummary(d.summary || '')
          setCategory(d.category || '上手教程')
          setTags(d.tags || '')
          setCoverUrl(d.coverUrl || '')
          setContent(d.content || '')
          setSoftwareIds(d.softwareIds || [])
          setFeatured(Boolean(d.featured))
          setStatus(d.status || 'published')
          setSeoTitle(d.seoTitle || '')
          setSeoDescription(d.seoDescription || '')
          setLastSavedAt(d.savedAt || Date.now())
          toast.info('已恢复上次未发布的本地草稿内容')
        }
      } catch {}
    }
  }, [article])

  // 定时自动本地暂存
  useEffect(() => {
    if (article) return
    const timer = setInterval(() => {
      if (title.trim() || content.trim()) {
        const now = Date.now()
        localStorage.setItem(
          'studio_article_workbench_draft',
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
            savedAt: now,
          })
        )
        setLastSavedAt(now)
      }
    }, 20000)
    return () => clearInterval(timer)
  }, [article, title, slug, summary, category, tags, coverUrl, content, softwareIds, featured, status, seoTitle, seoDescription])

  // 插入辅助：包裹选中文本
  function handleInsertWrap(prefix: string, suffix: string, defaultText: string) {
    const ta = textareaRef.current
    if (!ta) {
      setContent((prev) => prev + prefix + defaultText + suffix)
      return
    }
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = ta.value.substring(start, end)
    const replacement = prefix + (selected || defaultText) + suffix
    const nextVal = ta.value.substring(0, start) + replacement + ta.value.substring(end)
    setContent(nextVal)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : defaultText.length))
    }, 50)
  }

  // 插入标题前缀
  function handleInsertHeading(prefix: string) {
    const ta = textareaRef.current
    if (!ta) {
      setContent((prev) => prev + '\n' + prefix)
      return
    }
    const start = ta.selectionStart
    const lineStart = ta.value.lastIndexOf('\n', start - 1) + 1
    const nextVal = ta.value.substring(0, lineStart) + prefix + ta.value.substring(lineStart)
    setContent(nextVal)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + prefix.length, start + prefix.length)
    }, 50)
  }

  // 直接在光标处插入内容
  function handleInsertText(text: string) {
    const ta = textareaRef.current
    if (!ta) {
      setContent((prev) => prev + text)
      return
    }
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const nextVal = ta.value.substring(0, start) + text + ta.value.substring(end)
    setContent(nextVal)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + text.length, start + text.length)
    }, 50)
  }

  // 根据标题自动生成别名
  function handleAutoGenerateSlug() {
    if (!title.trim()) {
      toast.error('请先填写文章主标题')
      return
    }
    const s = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-')
      .replace(/^-+|-+$/g, '')
    const finalSlug = s || `post-${Date.now()}`
    setSlug(finalSlug)
    toast.success(`已生成 URL 别名: ${finalSlug}`)
  }

  // 提交保存至 D1 数据库
  async function handleSave() {
    if (!title.trim()) {
      toast.error('文章主标题不能为空')
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
        category: category.trim() || '上手教程',
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
        toast.success(article ? '文章已成功同步至 D1 数据库' : '文章已成功发布至 D1 数据库')
        localStorage.removeItem('studio_article_workbench_draft')
        onSaved()
        onClose()
      } else {
        toast.error(res.msg || '保存到 D1 数据库失败')
      }
    } catch (err: any) {
      toast.error(`保存异常：${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  // 快捷键 Ctrl + S / Cmd + S
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [title, slug, summary, category, tags, coverUrl, content, softwareIds, featured, status, seoTitle, seoDescription])

  // 返回确认
  function handleBack() {
    if ((title.trim() || content.trim()) && !article) {
      if (!confirm('当前草稿尚未提交到数据库，确定要退出工作台吗？（本地已自动暂存）')) {
        return
      }
    }
    onClose()
  }

  // 在浏览器新标签页中打开真实前台网页预览
  function handleOpenExternalPreview() {
    const slugOrId = encodeURIComponent(slug.trim() || article?.slug || article?.id || 'preview')
    const previewFlag = status === 'draft' ? '&preview=1' : ''
    window.open(`/article.html?slug=${slugOrId}${previewFlag}`, '_blank')
  }

  return (
    <div className='fixed inset-0 z-50 bg-background text-foreground flex flex-col overflow-hidden animate-in fade-in duration-200'>
      {/* 1. 顶栏导航与操作控制 */}
      <WorkbenchHeader
        isEditing={Boolean(article)}
        title={title}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        viewMode={viewMode}
        propertiesOpen={propertiesOpen}
        onBack={handleBack}
        onSave={handleSave}
        onViewModeChange={setViewMode}
        onToggleProperties={() => setPropertiesOpen((prev) => !prev)}
        onOpenExternalPreview={handleOpenExternalPreview}
      />

      {/* 2. 主体创作排版区 */}
      <div className='flex-1 flex overflow-hidden relative'>
        {/* 左侧/中栏：排版工具条 + 创作画布 */}
        <div className='flex-1 flex flex-col min-w-0 overflow-hidden'>
          <WorkbenchToolbar
            onInsertWrap={handleInsertWrap}
            onInsertHeading={handleInsertHeading}
            onInsertText={handleInsertText}
          />

          <WorkbenchCanvas
            ref={textareaRef}
            title={title}
            summary={summary}
            content={content}
            onTitleChange={setTitle}
            onSummaryChange={setSummary}
            onContentChange={setContent}
            onInsertText={handleInsertText}
          />
        </div>

        {/* 右侧：微信手机端真实仿真 或 桌面端仿真预览 */}
        {viewMode !== 'focus' && (
          <WorkbenchPhonePreview
            title={title}
            summary={summary}
            content={content}
            category={category}
            coverUrl={coverUrl}
            tags={tags}
            slug={slug}
            viewMode={viewMode}
          />
        )}
      </div>

      {/* 3. 右侧滑出属性抽屉 */}
      <WorkbenchProperties
        open={propertiesOpen}
        onClose={() => setPropertiesOpen(false)}
        category={category}
        slug={slug}
        tags={tags}
        coverUrl={coverUrl}
        softwareIds={softwareIds}
        featured={featured}
        status={status}
        seoTitle={seoTitle}
        seoDescription={seoDescription}
        softwareList={softwareList}
        onCategoryChange={setCategory}
        onSlugChange={setSlug}
        onTagsChange={setTags}
        onCoverUrlChange={setCoverUrl}
        onSoftwareIdsChange={setSoftwareIds}
        onFeaturedChange={setFeatured}
        onStatusChange={setStatus}
        onSeoTitleChange={setSeoTitle}
        onSeoDescriptionChange={setSeoDescription}
        onAutoGenerateSlug={handleAutoGenerateSlug}
      />
    </div>
  )
}
