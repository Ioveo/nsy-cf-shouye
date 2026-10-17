import { useState, useEffect, useRef } from 'react'
import {
  FileText,
  Compass,
  Music,
  Image as ImageIcon,
  Sliders,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Circle,
  Eye,
  Upload,
  Search,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Volume2,
  Play,
  Pause,
  Copy,
  Check,
  FolderArchive,
  LayoutGrid,
  List,
  Save,
  RotateCcw,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCatalog, Software } from '@/lib/queries'
import { api } from '@/lib/api'
// @ts-ignore
import { uploadAssetFile, formatBytes } from '@r2'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export function ContentFeature() {
  const queryClient = useQueryClient()
  const { data: catalog, isLoading } = useCatalog()

  // Tab state: read from URL search params if present
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab')
      if (p && ['articles', 'music', 'gallery', 'photowall', 'carousel', 'nav', 'site'].includes(p)) {
        return p
      }
    }
    return 'articles'
  })

  // Synchronize URL on tab switch
  function handleTabChange(tab: string) {
    setActiveTab(tab)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', tab)
      window.history.replaceState({}, '', url.toString())
    }
  }

  const softwareList: Software[] = catalog?.software || []
  const navList = (catalog as any)?.navigation || []
  const articlesList = (catalog as any)?.articles || []
  const musicList = (catalog as any)?.music || []
  const galleryList = (catalog as any)?.gallery || []
  const photoWallList = (catalog as any)?.photoWall || []
  const carouselList = (catalog as any)?.siteCarousel || []
  const siteSettings = (catalog as any)?.site || {}

  // -------------------------------------------------------------
  // D.1 文章管理 (Articles)
  // -------------------------------------------------------------
  const [artSearch, setArtSearch] = useState('')
  const [artStatusFilter, setArtStatusFilter] = useState('all')
  const [artViewMode, setArtViewMode] = useState<'cards' | 'table'>('table')

  // Article Editor Modal
  const [articleModalOpen, setArticleModalOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<any>(null)
  const [artTitle, setArtTitle] = useState('')
  const [artSlug, setArtSlug] = useState('')
  const [artSummary, setArtSummary] = useState('')
  const [artCategory, setArtCategory] = useState('产品教程')
  const [artTags, setArtTags] = useState('')
  const [artCoverUrl, setArtCoverUrl] = useState('')
  const [artContent, setArtContent] = useState('')
  const [artSoftwareIds, setArtSoftwareIds] = useState<string[]>([])
  const [artFeatured, setArtFeatured] = useState(false)
  const [artStatus, setArtStatus] = useState('published')
  const [artSeoTitle, setArtSeoTitle] = useState('')
  const [artSeoDescription, setArtSeoDescription] = useState('')
  const [isSavingArticle, setIsSavingArticle] = useState(false)
  const [isUploadingArtCover, setIsUploadingArtCover] = useState(false)
  const [artPreviewOpen, setArtPreviewOpen] = useState(false)

  const artTextareaRef = useRef<HTMLTextAreaElement>(null)
  const artCoverInputRef = useRef<HTMLInputElement>(null)

  // Filtered articles
  const filteredArticles = articlesList.filter((a: any) => {
    const matchSearch =
      (a.title || '').toLowerCase().includes(artSearch.toLowerCase()) ||
      (a.summary || '').toLowerCase().includes(artSearch.toLowerCase()) ||
      (a.slug || '').toLowerCase().includes(artSearch.toLowerCase())
    const matchStatus = artStatusFilter === 'all' || (a.status || 'published') === artStatusFilter
    return matchSearch && matchStatus
  })

  // Open editor
  function openArticleEditor(art?: any) {
    if (art) {
      setEditingArticle(art)
      setArtTitle(art.title || '')
      setArtSlug(art.slug || '')
      setArtSummary(art.summary || '')
      setArtCategory(art.category || '产品教程')
      setArtTags(Array.isArray(art.tags) ? art.tags.join(', ') : (art.tags || ''))
      setArtCoverUrl(art.coverUrl || '')
      setArtContent(art.content || '')
      setArtSoftwareIds(art.softwareIds || [])
      setArtFeatured(Boolean(art.featured))
      setArtStatus(art.status || 'published')
      setArtSeoTitle(art.seoTitle || '')
      setArtSeoDescription(art.seoDescription || '')
    } else {
      setEditingArticle(null)
      setArtTitle('')
      setArtSlug('')
      setArtSummary('')
      setArtCategory('产品教程')
      setArtTags('教程, 软件介绍')
      setArtCoverUrl('')
      setArtContent('')
      setArtSoftwareIds([])
      setArtFeatured(false)
      setArtStatus('published')
      setArtSeoTitle('')
      setArtSeoDescription('')

      // Check localStorage for unsaved draft
      const draft = localStorage.getItem('studio_article_draft')
      if (draft) {
        try {
          const parsed = JSON.parse(draft)
          if (parsed.title || parsed.content) {
            toast('发现上次未提交的本地草稿', {
              action: {
                label: '恢复草稿',
                onClick: () => {
                  setArtTitle(parsed.title || '')
                  setArtSlug(parsed.slug || '')
                  setArtContent(parsed.content || '')
                  setArtSummary(parsed.summary || '')
                },
              },
            })
          }
        } catch {}
      }
    }
    setArticleModalOpen(true)
  }

  // Auto-save draft to localStorage every 30s
  useEffect(() => {
    if (!articleModalOpen) return
    const timer = setInterval(() => {
      if (artTitle || artContent) {
        localStorage.setItem(
          'studio_article_draft',
          JSON.stringify({
            title: artTitle,
            slug: artSlug,
            summary: artSummary,
            content: artContent,
            savedAt: Date.now(),
          })
        )
      }
    }, 30000)
    return () => clearInterval(timer)
  }, [articleModalOpen, artTitle, artSlug, artSummary, artContent])

  // Ctrl/⌘+S shortcut to save article
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        if (articleModalOpen) {
          e.preventDefault()
          handleSaveArticle()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [articleModalOpen, artTitle, artSlug, artContent, artSummary, artCategory, artTags, artCoverUrl, artSoftwareIds, artFeatured, artStatus, artSeoTitle, artSeoDescription])

  // Handle image upload in article Markdown (paste or drop)
  async function insertImageAtCursor(file: File) {
    if (!file || !file.type.startsWith('image/')) return
    const textarea = artTextareaRef.current
    const placeholder = `![正在上传 ${file.name}...]()\n`
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = textarea.value
      setArtContent(text.substring(0, start) + placeholder + text.substring(end))
    }

    try {
      const res = await uploadAssetFile(file, { kind: 'image', folder: 'article' })
      if (res.success && res.url) {
        setArtContent((prev) =>
          prev.replace(placeholder, `![${file.name.replace(/\.[^.]+$/, '')}](${res.url})\n`)
        )
        toast.success('图片已上传并插入 Markdown')
      } else {
        setArtContent((prev) => prev.replace(placeholder, ''))
        toast.error(res.msg || '图片上传失败')
      }
    } catch (e: any) {
      setArtContent((prev) => prev.replace(placeholder, ''))
      toast.error(`上传异常：${e.message}`)
    }
  }

  // Handle paste in markdown textarea
  function handleArticlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) {
          e.preventDefault()
          insertImageAtCursor(file)
          break
        }
      }
    }
  }

  // Handle drop in markdown textarea
  function handleArticleDrop(e: React.DragEvent<HTMLTextAreaElement>) {
    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          e.preventDefault()
          insertImageAtCursor(files[i])
        }
      }
    }
  }

  // Save Article
  async function handleSaveArticle(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!artTitle.trim()) {
      toast.error('文章标题不能为空')
      return
    }

    setIsSavingArticle(true)
    try {
      const finalSlug = artSlug.trim() || `post-${Date.now()}`
      const tagsArray = artTags
        .split(/[,，\s]+/)
        .map((t) => t.trim())
        .filter(Boolean)

      const payload = {
        id: editingArticle?.id || '',
        title: artTitle.trim(),
        slug: finalSlug,
        summary: artSummary.trim(),
        content: artContent.trim(),
        category: artCategory.trim() || '产品教程',
        tags: tagsArray,
        softwareIds: artSoftwareIds,
        featured: artFeatured,
        status: artStatus,
        coverUrl: artCoverUrl.trim(),
        seoTitle: artSeoTitle.trim(),
        seoDescription: artSeoDescription.trim(),
        sortOrder: editingArticle?.sortOrder ?? articlesList.length,
      }

      const res = await api.post('/api/admin/articles', payload)
      if (res.success) {
        toast.success(editingArticle ? '文章已更新' : '文章发表成功')
        localStorage.removeItem('studio_article_draft')
        setArticleModalOpen(false)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '保存文章失败')
      }
    } catch (err: any) {
      toast.error(`保存异常：${err.message}`)
    } finally {
      setIsSavingArticle(false)
    }
  }

  // 文章编辑未保存离开警告
  useEffect(() => {
    if (!articleModalOpen) return
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (artTitle.trim() || artContent.trim()) {
        e.preventDefault()
        e.returnValue = '文章编辑尚未保存，确定要离开吗？'
        return e.returnValue
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [articleModalOpen, artTitle, artContent])

  // 监听全局 ⌘S / Ctrl+S 快捷键保存文章
  useEffect(() => {
    if (!articleModalOpen) return
    const onStudioSave = () => {
      handleSaveArticle()
    }
    window.addEventListener('studio:save', onStudioSave)
    return () => window.removeEventListener('studio:save', onStudioSave)
  }, [articleModalOpen, artTitle, artSlug, artSummary, artContent, artCategory, artTags, artSoftwareIds, artFeatured, artStatus, artCoverUrl, artSeoTitle, artSeoDescription])

  // Toggle Article featured
  async function handleToggleArtFeatured(art: any, featured: boolean) {
    try {
      const payload = {
        ...art,
        featured,
      }
      const res = await api.post('/api/admin/articles', payload)
      if (res.success) {
        toast.success(featured ? '文章已置顶' : '取消置顶')
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '设置失败')
      }
    } catch (e: any) {
      toast.error(`设置异常：${e.message}`)
    }
  }

  // Delete Article
  async function handleDeleteArticle(art: any) {
    if (!confirm(`确定要删除文章「${art.title}」吗？`)) return
    try {
      const res = await api.post('/api/admin/articles/delete', { id: art.id })
      if (res.success) {
        toast.success(`文章「${art.title}」已删除`)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '删除失败')
      }
    } catch (e: any) {
      toast.error(`删除异常：${e.message}`)
    }
  }

  // -------------------------------------------------------------
  // D.2 音乐频道 (Music)
  // -------------------------------------------------------------
  const [musicDrawerOpen, setMusicDrawerOpen] = useState(false)
  const [editingMusic, setEditingMusic] = useState<any>(null)
  const [musicTitle, setMusicTitle] = useState('')
  const [musicArtist, setMusicArtist] = useState('')
  const [musicAlbum, setMusicAlbum] = useState('')
  const [musicAudioUrl, setMusicAudioUrl] = useState('')
  const [musicCoverUrl, setMusicCoverUrl] = useState('')
  const [musicLyric, setMusicLyric] = useState('')
  const [musicNeteaseId, setMusicNeteaseId] = useState('')
  const [musicFeatured, setMusicFeatured] = useState(false)
  const [musicStatus, setMusicStatus] = useState('published')
  const [isSavingMusic, setIsSavingMusic] = useState(false)
  const [isUploadingAudio, setIsUploadingAudio] = useState(false)

  // In-page audition player state
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)

  function openMusicDrawer(item?: any) {
    if (item) {
      setEditingMusic(item)
      setMusicTitle(item.title || '')
      setMusicArtist(item.artist || '')
      setMusicAlbum(item.album || '')
      setMusicAudioUrl(item.audioUrl || '')
      setMusicCoverUrl(item.coverUrl || '')
      setMusicLyric(item.lyric || '')
      setMusicNeteaseId(item.neteaseId || '')
      setMusicFeatured(Boolean(item.featured))
      setMusicStatus(item.status || 'published')
    } else {
      setEditingMusic(null)
      setMusicTitle('')
      setMusicArtist('')
      setMusicAlbum('')
      setMusicAudioUrl('')
      setMusicCoverUrl('')
      setMusicLyric('')
      setMusicNeteaseId('')
      setMusicFeatured(false)
      setMusicStatus('published')
    }
    setMusicDrawerOpen(true)
  }

  // Drop / Upload audio file (<=50MB)
  async function handleAudioUpload(file: File) {
    if (file.size > 50 * 1024 * 1024) {
      toast.error('音频文件不能超过 50MB')
      return
    }
    // Auto-parse filename for title and artist (e.g. "周杰伦 - 晴天.mp3")
    const baseName = file.name.replace(/\.[^.]+$/, '')
    if (baseName.includes('-')) {
      const parts = baseName.split('-').map((s) => s.trim())
      if (!musicArtist) setMusicArtist(parts[0])
      if (!musicTitle) setMusicTitle(parts.slice(1).join(' - '))
    } else if (!musicTitle) {
      setMusicTitle(baseName)
    }

    setIsUploadingAudio(true)
    try {
      const res = await uploadAssetFile(file, { kind: 'audio', folder: 'music' })
      if (res.success && res.url) {
        setMusicAudioUrl(res.url)
        toast.success('音频文件上传成功')
      } else {
        toast.error(res.msg || '音频上传失败')
      }
    } catch (e: any) {
      toast.error(`音频上传异常：${e.message}`)
    } finally {
      setIsUploadingAudio(false)
    }
  }

  // Resolve NetEase ID
  function handleResolveNetease() {
    if (!musicNeteaseId.trim()) return
    const url = `/api/music/netease?id=${musicNeteaseId.trim()}`
    setMusicAudioUrl(url)
    toast.success(`已配置网易云解析接口: ${url}`)
  }

  // Save Music (serial)
  async function handleSaveMusic(e: React.FormEvent) {
    e.preventDefault()
    if (!musicTitle.trim()) {
      toast.error('请填写歌曲名称')
      return
    }
    if (!musicAudioUrl.trim() && !musicNeteaseId.trim()) {
      toast.error('请提供音频文件 URL 或网易云 ID')
      return
    }

    setIsSavingMusic(true)
    try {
      const payload = {
        id: editingMusic?.id || '',
        title: musicTitle.trim(),
        artist: musicArtist.trim() || '天才猫',
        album: musicAlbum.trim(),
        audioUrl: musicAudioUrl.trim(),
        coverUrl: musicCoverUrl.trim(),
        lyric: musicLyric.trim(),
        neteaseId: musicNeteaseId.trim(),
        featured: musicFeatured,
        status: musicStatus,
        sortOrder: editingMusic?.sortOrder ?? musicList.length,
      }
      const res = await api.post('/api/admin/music', payload)
      if (res.success) {
        toast.success(editingMusic ? '曲目已更新' : '歌曲已添加')
        setMusicDrawerOpen(false)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '保存音乐失败')
      }
    } catch (e: any) {
      toast.error(`保存异常：${e.message}`)
    } finally {
      setIsSavingMusic(false)
    }
  }

  // Reorder Music (serial)
  async function handleMoveMusic(idx: number, direction: 'up' | 'down') {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= musicList.length) return
    const itemA = musicList[idx]
    const itemB = musicList[targetIdx]
    const orderA = itemA.sortOrder ?? idx
    const orderB = itemB.sortOrder ?? targetIdx

    try {
      // Serial save
      await api.post('/api/admin/music', { ...itemA, sortOrder: orderB })
      await api.post('/api/admin/music', { ...itemB, sortOrder: orderA })
      toast.success('播放排序已更新')
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    } catch (e: any) {
      toast.error(`更新排序异常：${e.message}`)
    }
  }

  // Delete Music
  async function handleDeleteMusic(item: any) {
    if (!confirm(`确定要删除曲目「${item.title}」吗？`)) return
    try {
      const res = await api.post('/api/admin/music', { action: 'delete', id: item.id })
      if (res.success) {
        toast.success(`曲目「${item.title}」已删除`)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '删除失败')
      }
    } catch (e: any) {
      toast.error(`删除异常：${e.message}`)
    }
  }

  // -------------------------------------------------------------
  // D.3 画廊相册 (Gallery)
  // -------------------------------------------------------------
  const [galleryDrawerOpen, setGalleryDrawerOpen] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<any>(null)
  const [photoTitle, setPhotoTitle] = useState('')
  const [photoDesc, setPhotoDesc] = useState('')
  const [photoImageUrl, setPhotoImage] = useState('')
  const [photoTags, setPhotoTags] = useState('')
  const [photoFeatured, setPhotoFeatured] = useState(false)
  const [photoStatus, setPhotoStatus] = useState('published')
  const [isSavingPhoto, setIsSavingPhoto] = useState(false)

  // Batch upload state
  const [isBatchUploadingGallery, setIsBatchUploadingGallery] = useState(false)
  const [galleryUploadProgress, setGalleryUploadProgress] = useState('')
  const [selectedGalleryIds, setSelectedGalleryIds] = useState<string[]>([])
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // Drag & drop batch upload
  async function handleBatchUploadGallery(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (list.length === 0) return
    setIsBatchUploadingGallery(true)
    let successCount = 0

    try {
      // Serial execution: upload asset -> save gallery item
      for (let i = 0; i < list.length; i++) {
        const file = list[i]
        setGalleryUploadProgress(`正在上传并登记 ${i + 1}/${list.length}：${file.name}`)

        const assetRes = await uploadAssetFile(file, { kind: 'image', folder: 'gallery' })
        if (assetRes.success && assetRes.url) {
          await api.post('/api/admin/gallery', {
            title: file.name.replace(/\.[^.]+$/, ''),
            description: '',
            imageUrl: assetRes.url,
            thumbUrl: assetRes.url,
            tags: ['画廊'],
            status: 'published',
            sortOrder: galleryList.length + i,
          })
          successCount++
        }
      }
      toast.success(`成功批量发布 ${successCount} 张画廊图片`)
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    } catch (e: any) {
      toast.error(`批量上传异常：${e.message}`)
    } finally {
      setIsBatchUploadingGallery(false)
      setGalleryUploadProgress('')
    }
  }

  // Save single photo
  async function handleSavePhoto(e: React.FormEvent) {
    e.preventDefault()
    if (!photoImageUrl.trim()) {
      toast.error('图片地址不能为空')
      return
    }

    setIsSavingPhoto(true)
    try {
      const payload = {
        id: editingPhoto?.id || '',
        title: photoTitle.trim() || '未命名图片',
        description: photoDesc.trim(),
        imageUrl: photoImageUrl.trim(),
        thumbUrl: photoImageUrl.trim(),
        tags: photoTags.split(/[,，\s]+/).map((s) => s.trim()).filter(Boolean),
        featured: photoFeatured,
        status: photoStatus,
        sortOrder: editingPhoto?.sortOrder ?? galleryList.length,
      }
      const res = await api.post('/api/admin/gallery', payload)
      if (res.success) {
        toast.success('图片已保存')
        setGalleryDrawerOpen(false)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '保存失败')
      }
    } catch (e: any) {
      toast.error(`保存异常：${e.message}`)
    } finally {
      setIsSavingPhoto(false)
    }
  }

  // Batch delete / publish gallery items (serial)
  async function handleBatchGalleryAction(action: 'publish' | 'hide' | 'delete') {
    if (selectedGalleryIds.length === 0) return
    if (action === 'delete' && !confirm(`确定要批量删除选中的 ${selectedGalleryIds.length} 张图片吗？`)) return

    try {
      for (const id of selectedGalleryIds) {
        if (action === 'delete') {
          await api.post('/api/admin/gallery', { action: 'delete', id })
        } else {
          const item = galleryList.find((g: any) => g.id === id)
          if (item) {
            await api.post('/api/admin/gallery', {
              ...item,
              status: action === 'publish' ? 'published' : 'draft',
            })
          }
        }
      }
      toast.success(`批量操作已完成 (${selectedGalleryIds.length} 项)`)
      setSelectedGalleryIds([])
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    } catch (e: any) {
      toast.error(`批量操作异常：${e.message}`)
    }
  }

  // -------------------------------------------------------------
  // D.4 照片墙 (Photo Wall) & 首页轮播 (Carousel) & 导航 (Navigation)
  // -------------------------------------------------------------
  // Photo wall drawer
  const [photoWallDrawerOpen, setPhotoWallDrawerOpen] = useState(false)
  const [editingPhotoWall, setEditingPhotoWall] = useState<any>(null)
  const [pwTitle, setPwTitle] = useState('')
  const [pwDesc, setPwDesc] = useState('')
  const [pwImageUrl, setPwImageUrl] = useState('')
  const [pwLinkUrl, setPwLinkUrl] = useState('')
  const [pwLinkText, setPwLinkText] = useState('了解更多')
  const [pwStatus, setPwStatus] = useState('published')
  const [isSavingPw, setIsSavingPw] = useState(false)

  // Carousel drawer
  const [carouselDrawerOpen, setCarouselDrawerOpen] = useState(false)
  const [editingCarousel, setEditingCarousel] = useState<any>(null)
  const [carTitle, setCarTitle] = useState('')
  const [carDesc, setCarDesc] = useState('')
  const [carImageUrl, setCarImageUrl] = useState('')
  const [carSuggestion, setCarSuggestion] = useState('')
  const [carStatus, setCarStatus] = useState('published')
  const [isSavingCarousel, setIsSavingCarousel] = useState(false)

  // Navigation drawer
  const [navDrawerOpen, setNavDrawerOpen] = useState(false)
  const [editingNav, setEditingNav] = useState<any>(null)
  const [navLabel, setNavLabel] = useState('')
  const [navHref, setNavHref] = useState('')
  const [navExternal, setNavExternal] = useState(false)
  const [navStatus, setNavStatus] = useState('active')
  const [isSavingNav, setIsSavingNav] = useState(false)

  // Site mode & copy
  const [siteMode, setSiteMode] = useState(siteSettings.siteMode || 'portal')
  const [siteKicker, setSiteKicker] = useState(siteSettings.homeHeroKicker || '')
  const [siteTitle, setSiteTitle] = useState(siteSettings.homeHeroTitle || '')
  const [siteDesc, setSiteDesc] = useState(siteSettings.homeHeroDescription || '')
  const [isSavingSite, setIsSavingSite] = useState(false)

  // Save Site settings
  async function handleSaveSite() {
    setIsSavingSite(true)
    try {
      const res = await api.post('/api/admin/site', {
        ...siteSettings,
        siteMode,
        homeHeroKicker: siteKicker,
        homeHeroTitle: siteTitle,
        homeHeroDescription: siteDesc,
      })
      if (res.success) {
        toast.success('网站文案与模式已更新')
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '保存失败')
      }
    } catch (e: any) {
      toast.error(`保存异常：${e.message}`)
    } finally {
      setIsSavingSite(false)
    }
  }

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 pt-0 md:gap-6 md:p-8'>
      {/* Top Header */}
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>内容与门户管理</h1>
          <p className='text-sm text-muted-foreground'>
            文章教程、音乐音频、画廊相册、照片墙及首页门户配置
          </p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className='space-y-4'>
        <TabsList className='bg-card/60 border border-border/40 p-1 flex-wrap h-auto'>
          <TabsTrigger value='articles' className='text-xs'>
            <FileText className='mr-1.5 size-3.5' />
            文章资讯 ({articlesList.length})
          </TabsTrigger>
          <TabsTrigger value='music' className='text-xs'>
            <Music className='mr-1.5 size-3.5' />
            音乐频道 ({musicList.length})
          </TabsTrigger>
          <TabsTrigger value='gallery' className='text-xs'>
            <ImageIcon className='mr-1.5 size-3.5' />
            画廊相册 ({galleryList.length})
          </TabsTrigger>
          <TabsTrigger value='photowall' className='text-xs'>
            <FolderArchive className='mr-1.5 size-3.5' />
            照片墙 ({photoWallList.length})
          </TabsTrigger>
          <TabsTrigger value='carousel' className='text-xs'>
            <Sliders className='mr-1.5 size-3.5' />
            首页轮播 ({carouselList.length})
          </TabsTrigger>
          <TabsTrigger value='nav' className='text-xs'>
            <Compass className='mr-1.5 size-3.5' />
            顶部导航 ({navList.length})
          </TabsTrigger>
          <TabsTrigger value='site' className='text-xs'>
            <Sparkles className='mr-1.5 size-3.5' />
            模式与文案
          </TabsTrigger>
        </TabsList>

        {/* ========================================================= */}
        {/* TAB 1: 文章管理 (Articles)                                */}
        {/* ========================================================= */}
        <TabsContent value='articles' className='space-y-4'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex flex-1 items-center gap-2 max-w-md'>
              <div className='relative w-full'>
                <Search className='absolute left-2.5 top-2.5 size-4 text-muted-foreground' />
                <Input
                  placeholder='搜索文章标题、摘要、Slug...'
                  value={artSearch}
                  onChange={(e) => setArtSearch(e.target.value)}
                  className='pl-9 bg-card/60 text-xs'
                />
              </div>
            </div>

            <div className='flex flex-wrap items-center gap-2'>
              <select
                value={artStatusFilter}
                onChange={(e) => setArtStatusFilter(e.target.value)}
                className='h-9 rounded-md border border-input bg-card/60 px-3 py-1 text-xs text-foreground shadow-sm'
              >
                <option value='all'>全部状态</option>
                <option value='published'>已发布</option>
                <option value='draft'>草稿</option>
                <option value='disabled'>已隐藏</option>
              </select>

              <div className='flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5 text-xs'>
                <button
                  type='button'
                  onClick={() => setArtViewMode('table')}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    artViewMode === 'table' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
                  )}
                  title='表格视图'
                >
                  <List className='size-3.5' />
                </button>
                <button
                  type='button'
                  onClick={() => setArtViewMode('cards')}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    artViewMode === 'cards' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
                  )}
                  title='卡片视图'
                >
                  <LayoutGrid className='size-3.5' />
                </button>
              </div>

              <Button size='sm' onClick={() => openArticleEditor()} className='gap-1.5'>
                <Plus className='size-3.5' /> 发表新文章
              </Button>
            </div>
          </div>

          {/* Articles Table / Cards */}
          {filteredArticles.length === 0 ? (
            <div className='rounded-xl border border-border/60 bg-card/40 p-12 text-center text-muted-foreground'>
              <FileText className='mx-auto size-8 text-muted-foreground/40' />
              <p className='mt-2 text-sm'>未找到匹配的文章</p>
              <Button size='sm' variant='outline' onClick={() => openArticleEditor()} className='mt-3 gap-1.5'>
                <Plus className='size-3.5' /> 发表第一篇文章
              </Button>
            </div>
          ) : artViewMode === 'table' ? (
            <div className='rounded-xl border border-border/60 bg-card/60 overflow-hidden backdrop-blur-sm'>
              <table className='w-full text-left text-sm'>
                <thead className='border-b border-border/40 bg-muted/40 text-xs uppercase text-muted-foreground'>
                  <tr>
                    <th className='px-4 py-3'>文章标题 & Slug</th>
                    <th className='px-4 py-3'>分类</th>
                    <th className='px-4 py-3'>摘要</th>
                    <th className='px-4 py-3 text-center'>置顶</th>
                    <th className='px-4 py-3 text-center'>状态</th>
                    <th className='px-4 py-3 text-right'>操作</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border/40'>
                  {filteredArticles.map((art: any) => (
                    <tr key={art.id} className='hover:bg-muted/20 text-xs'>
                      <td className='px-4 py-3'>
                        <div className='flex items-center gap-3'>
                          {art.coverUrl && (
                            <img
                              src={art.coverUrl}
                              alt={art.title}
                              className='size-9 rounded object-cover border border-border/60 shrink-0'
                            />
                          )}
                          <div>
                            <span className='font-semibold text-foreground text-sm hover:underline cursor-pointer' onClick={() => openArticleEditor(art)}>
                              {art.title}
                            </span>
                            <p className='font-mono text-muted-foreground text-[11px]'>{art.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className='px-4 py-3'>
                        <Badge variant='outline'>{art.category || '通用'}</Badge>
                      </td>
                      <td className='px-4 py-3 max-w-xs truncate text-muted-foreground'>
                        {art.summary || '无摘要'}
                      </td>
                      <td className='px-4 py-3 text-center'>
                        <Switch
                          checked={Boolean(art.featured)}
                          onCheckedChange={(val) => handleToggleArtFeatured(art, val)}
                        />
                      </td>
                      <td className='px-4 py-3 text-center'>
                        <Badge
                          variant={art.status === 'published' ? 'secondary' : 'outline'}
                          className='text-[10px]'
                        >
                          {art.status === 'published' ? '已发布' : '草稿'}
                        </Badge>
                      </td>
                      <td className='px-4 py-3 text-right'>
                        <div className='flex items-center justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='size-7 p-0'
                            onClick={() => {
                              window.open(`/article.html?slug=${art.slug}`, '_blank')
                            }}
                            title='查看线上文章'
                          >
                            <ExternalLink className='size-3.5' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='size-7 p-0'
                            onClick={() => openArticleEditor(art)}
                            title='编辑'
                          >
                            <Edit2 className='size-3.5' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='size-7 p-0 text-red-400 hover:text-red-300'
                            onClick={() => handleDeleteArticle(art)}
                            title='删除'
                          >
                            <Trash2 className='size-3.5' />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {filteredArticles.map((art: any) => (
                <Card key={art.id} className='border-border/60 bg-card/60 overflow-hidden'>
                  {art.coverUrl && (
                    <div className='aspect-video w-full overflow-hidden bg-muted/20'>
                      <img src={art.coverUrl} alt={art.title} className='size-full object-cover' />
                    </div>
                  )}
                  <CardHeader className='p-4 pb-2'>
                    <div className='flex items-center justify-between gap-2'>
                      <Badge variant='outline' className='text-[10px]'>
                        {art.category || '通用'}
                      </Badge>
                      {art.featured && (
                        <Badge className='bg-primary/20 text-primary border-primary/30 text-[10px]'>
                          置顶
                        </Badge>
                      )}
                    </div>
                    <CardTitle className='text-sm mt-1'>{art.title}</CardTitle>
                    <CardDescription className='text-xs line-clamp-2'>
                      {art.summary || '无摘要说明'}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className='p-4 pt-2 flex items-center justify-between border-t border-border/30 text-xs'>
                    <span className='font-mono text-muted-foreground'>{art.slug}</span>
                    <div className='flex items-center gap-1'>
                      <Button variant='ghost' size='sm' className='size-7 p-0' onClick={() => openArticleEditor(art)}>
                        <Edit2 className='size-3.5' />
                      </Button>
                      <Button variant='ghost' size='sm' className='size-7 p-0 text-red-400' onClick={() => handleDeleteArticle(art)}>
                        <Trash2 className='size-3.5' />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {/* Article Editor Dialog (D.1) */}
          <Dialog open={articleModalOpen} onOpenChange={setArticleModalOpen}>
            <DialogContent className='max-w-5xl h-[92vh] flex flex-col p-0 overflow-hidden bg-background'>
              <DialogHeader className='px-6 py-3 border-b border-border/60 flex flex-row items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <DialogTitle className='text-base font-semibold'>
                    {editingArticle ? `编辑文章 · ${editingArticle.title}` : '发表新文章'}
                  </DialogTitle>
                  <span className='text-xs text-muted-foreground font-mono'>
                    (支持 Ctrl/⌘+S 快捷保存)
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setArtPreviewOpen(true)}
                    className='gap-1.5'
                  >
                    <Eye className='size-3.5 text-primary' /> 实时预览
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    disabled={isSavingArticle}
                    onClick={() => handleSaveArticle()}
                    className='gap-1.5 bg-primary text-primary-foreground font-semibold shadow-sm'
                  >
                    {isSavingArticle ? <Loader2 className='size-3.5 animate-spin' /> : <Save className='size-3.5' />}
                    保存文章
                  </Button>
                </div>
              </DialogHeader>

              <div className='flex-1 overflow-y-auto p-6 space-y-4 text-xs'>
                <div className='grid gap-4 md:grid-cols-3'>
                  <div className='space-y-1.5 md:col-span-2'>
                    <Label className='text-xs'>文章主标题 *</Label>
                    <Input
                      placeholder='例如：天才猫桌面 2.0 深度架构解析与上手指南'
                      value={artTitle}
                      onChange={(e) => {
                        setArtTitle(e.target.value)
                        if (!artSlug) {
                          setArtSlug(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '-').replace(/-+/g, '-'))
                        }
                      }}
                      className='h-8 text-xs'
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <Label className='text-xs'>文章 Slug (唯一URL) *</Label>
                    <Input
                      placeholder='例如：desktop-guide'
                      value={artSlug}
                      onChange={(e) => setArtSlug(e.target.value)}
                      className='h-8 text-xs font-mono'
                    />
                  </div>
                </div>

                <div className='grid gap-4 md:grid-cols-3'>
                  <div className='space-y-1.5'>
                    <Label className='text-xs'>文章分类</Label>
                    <Input
                      placeholder='例如：产品介绍、操作教程、更新日志'
                      value={artCategory}
                      onChange={(e) => setArtCategory(e.target.value)}
                      className='h-8 text-xs'
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <Label className='text-xs'>标签 (逗号分隔)</Label>
                    <Input
                      placeholder='例如：桌面, OCR, 效率'
                      value={artTags}
                      onChange={(e) => setArtTags(e.target.value)}
                      className='h-8 text-xs'
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <Label className='text-xs'>发布状态</Label>
                    <select
                      value={artStatus}
                      onChange={(e) => setArtStatus(e.target.value)}
                      className='h-8 w-full rounded border border-input bg-card px-2 text-xs'
                    >
                      <option value='published'>公开已发布</option>
                      <option value='draft'>草稿箱</option>
                      <option value='disabled'>隐藏下架</option>
                    </select>
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <Label className='text-xs'>文章简要概述 (Summary)</Label>
                  <Textarea
                    rows={2}
                    placeholder='一到两句话概括文章核心主旨...'
                    value={artSummary}
                    onChange={(e) => setArtSummary(e.target.value)}
                    className='text-xs'
                  />
                </div>

                {/* Cover and Associated Software */}
                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='space-y-1.5'>
                    <Label className='text-xs'>封面大图 URL</Label>
                    <div className='flex items-center gap-2'>
                      <input
                        type='file'
                        ref={artCoverInputRef}
                        accept='image/*'
                        className='hidden'
                        onChange={async (e) => {
                          const f = e.target.files?.[0]
                          if (!f) return
                          setIsUploadingArtCover(true)
                          try {
                            const res = await uploadAssetFile(f, { kind: 'image', folder: 'article' })
                            if (res.success && res.url) {
                              setArtCoverUrl(res.url)
                              toast.success('封面已上传')
                            }
                          } finally {
                            setIsUploadingArtCover(false)
                          }
                        }}
                      />
                      <Input
                        placeholder='https://...'
                        value={artCoverUrl}
                        onChange={(e) => setArtCoverUrl(e.target.value)}
                        className='h-8 text-xs flex-1'
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        disabled={isUploadingArtCover}
                        onClick={() => artCoverInputRef.current?.click()}
                        className='h-8 text-xs'
                      >
                        {isUploadingArtCover ? <Loader2 className='size-3 animate-spin mr-1' /> : <Upload className='size-3 mr-1' />}
                        上传封面
                      </Button>
                    </div>
                  </div>

                  <div className='space-y-1.5'>
                    <Label className='text-xs'>关联软件 (前台展示相关推荐)</Label>
                    <div className='flex flex-wrap gap-1.5 p-1.5 rounded border border-border/60 bg-muted/20 min-h-8 max-h-24 overflow-y-auto'>
                      {softwareList.map((sw) => {
                        const checked = artSoftwareIds.includes(sw.id || sw.slug)
                        return (
                          <button
                            key={sw.slug}
                            type='button'
                            onClick={() => {
                              const swId = sw.id || sw.slug
                              setArtSoftwareIds(
                                checked
                                  ? artSoftwareIds.filter((id) => id !== swId)
                                  : [...artSoftwareIds, swId]
                              )
                            }}
                            className={cn(
                              'px-2 py-0.5 rounded text-[10px] font-mono transition-colors border',
                              checked
                                ? 'bg-primary/20 text-primary border-primary/40 font-medium'
                                : 'bg-background/60 text-muted-foreground border-border/40 hover:text-foreground'
                            )}
                          >
                            {sw.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Markdown Editor Area */}
                <div className='space-y-2 pt-2 border-t border-border/40'>
                  <div className='flex flex-wrap items-center justify-between gap-2 bg-muted/40 p-1.5 rounded-lg border border-border/60'>
                    <div className='flex flex-wrap items-center gap-1 text-xs'>
                      <span className='font-semibold text-muted-foreground mr-1'>工具栏:</span>
                      {[
                        { label: 'H2', insert: '## 标题\n' },
                        { label: 'H3', insert: '### 小节\n' },
                        { label: '粗体', insert: '**重点文字**' },
                        { label: '斜体', insert: '*斜体说明*' },
                        { label: '列表', insert: '- 列表项 1\n- 列表项 2\n' },
                        { label: '引用', insert: '> 引用文字说明\n' },
                        { label: '代码', insert: '```js\nconsole.log("hello");\n```\n' },
                        { label: '链接', insert: '[链接文字](https://nsyoo.com)' },
                      ].map((tool, i) => (
                        <button
                          key={i}
                          type='button'
                          onClick={() => {
                            const ta = artTextareaRef.current
                            if (!ta) return
                            const start = ta.selectionStart
                            const end = ta.selectionEnd
                            const text = ta.value
                            setArtContent(text.substring(0, start) + tool.insert + text.substring(end))
                          }}
                          className='px-2 py-0.5 rounded bg-background hover:bg-muted border border-border/40 text-[11px] font-mono'
                        >
                          {tool.label}
                        </button>
                      ))}
                    </div>
                    <span className='text-[11px] text-muted-foreground font-mono'>
                      支持直接粘贴(Ctrl+V)或拖入图片自动上传
                    </span>
                  </div>

                  <Textarea
                    ref={artTextareaRef}
                    rows={14}
                    placeholder='在此撰写正文（Markdown 格式）...&#10;可直接截屏并在此按下 Ctrl+V 粘贴图片，系统将自动上传到 R2 并插入链接。'
                    value={artContent}
                    onPaste={handleArticlePaste}
                    onDrop={handleArticleDrop}
                    onChange={(e) => setArtContent(e.target.value)}
                    className='font-mono text-xs'
                  />
                  <div className='flex items-center justify-between text-[11px] text-muted-foreground'>
                    <span>正文字数：{artContent.length} 字</span>
                    <span>已启用本地草稿自动保护</span>
                  </div>
                </div>

                {/* SEO Fields */}
                <div className='grid gap-4 md:grid-cols-2 pt-2 border-t border-border/40'>
                  <div className='space-y-1.5'>
                    <div className='flex items-center justify-between'>
                      <Label className='text-xs'>SEO 标题 (Title)</Label>
                      <span className='text-[10px] text-muted-foreground'>{artSeoTitle.length}/60</span>
                    </div>
                    <Input
                      placeholder='留空则使用文章主标题'
                      value={artSeoTitle}
                      maxLength={60}
                      onChange={(e) => setArtSeoTitle(e.target.value)}
                      className='h-8 text-xs'
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <div className='flex items-center justify-between'>
                      <Label className='text-xs'>SEO 描述 (Description)</Label>
                      <span className='text-[10px] text-muted-foreground'>{artSeoDescription.length}/160</span>
                    </div>
                    <Input
                      placeholder='留空则使用文章摘要'
                      value={artSeoDescription}
                      maxLength={160}
                      onChange={(e) => setArtSeoDescription(e.target.value)}
                      className='h-8 text-xs'
                    />
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Article Live Preview Modal */}
          <Dialog open={artPreviewOpen} onOpenChange={setArtPreviewOpen}>
            <DialogContent className='max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden bg-background'>
              <DialogHeader className='px-4 py-3 border-b border-border/60 flex flex-row items-center justify-between'>
                <DialogTitle className='text-sm font-semibold'>
                  文章草稿实时预览 · {artTitle || '未命名'}
                </DialogTitle>
              </DialogHeader>
              <div className='flex-1 bg-muted/20 flex items-center justify-center p-2 overflow-hidden'>
                <iframe
                  src='/article.html?preview=1'
                  onLoad={(e) => {
                    const iframe = e.currentTarget
                    iframe.contentWindow?.postMessage(
                      {
                        type: 'studio-preview',
                        article: {
                          title: artTitle || '文章标题预览',
                          slug: artSlug || 'draft',
                          summary: artSummary,
                          content: artContent || '正文草稿内容...',
                          category: artCategory,
                          tags: artTags.split(/[,，\s]+/).filter(Boolean),
                          coverUrl: artCoverUrl,
                          createdAt: Date.now(),
                        },
                      },
                      window.location.origin
                    )
                  }}
                  title='Article Preview'
                  className='size-full border border-border/60 rounded-lg shadow-xl bg-[#07090e]'
                />
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 2: 音乐频道 (Music)                                    */}
        {/* ========================================================= */}
        <TabsContent value='music' className='space-y-4'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div className='text-xs text-muted-foreground'>
              支持上传音频文件（≤50MB）或填入网易云 ID，带前端试听播放器与拖拽排序。
            </div>
            <Button size='sm' onClick={() => openMusicDrawer()} className='gap-1.5'>
              <Plus className='size-3.5' /> 添加新歌曲
            </Button>
          </div>

          <div className='rounded-xl border border-border/60 bg-card/60 overflow-hidden backdrop-blur-sm'>
            <table className='w-full text-left text-sm'>
              <thead className='border-b border-border/40 bg-muted/40 text-xs uppercase text-muted-foreground'>
                <tr>
                  <th className='px-4 py-3'>歌曲</th>
                  <th className='px-4 py-3'>歌手 / 专辑</th>
                  <th className='px-4 py-3'>来源类型</th>
                  <th className='px-4 py-3 text-center'>试听</th>
                  <th className='px-4 py-3 text-center'>状态</th>
                  <th className='px-4 py-3 text-right'>排序与操作</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/40'>
                {musicList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className='px-4 py-10 text-center text-xs text-muted-foreground'>
                      暂无音乐曲目，点击上方按钮添加
                    </td>
                  </tr>
                ) : (
                  musicList.map((m: any, idx: number) => {
                    const isPlaying = playingTrackId === m.id

                    return (
                      <tr key={m.id} className='hover:bg-muted/20 text-xs'>
                        <td className='px-4 py-3'>
                          <div className='flex items-center gap-3'>
                            <div className='size-9 rounded-lg overflow-hidden bg-muted/40 border border-border/60 shrink-0 flex items-center justify-center'>
                              {m.coverUrl ? (
                                <img src={m.coverUrl} alt={m.title} className='size-full object-cover' />
                              ) : (
                                <Music className='size-4 text-muted-foreground' />
                              )}
                            </div>
                            <div>
                              <p className='font-semibold text-foreground text-sm'>{m.title}</p>
                              {m.featured && (
                                <span className='text-[10px] text-amber-400 font-medium'>★ 精选推荐</span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className='px-4 py-3'>
                          <p className='text-foreground font-medium'>{m.artist || '天才猫'}</p>
                          <p className='text-muted-foreground text-[11px]'>{m.album || '默认专辑'}</p>
                        </td>

                        <td className='px-4 py-3'>
                          {m.neteaseId ? (
                            <Badge variant='outline' className='text-[10px] text-red-400 border-red-500/30'>
                              网易云 ID: {m.neteaseId}
                            </Badge>
                          ) : (
                            <Badge variant='outline' className='text-[10px] text-emerald-400 border-emerald-500/30'>
                              R2 直传音频
                            </Badge>
                          )}
                        </td>

                        {/* In-page Audition */}
                        <td className='px-4 py-3 text-center'>
                          <Button
                            variant='outline'
                            size='sm'
                            className='size-7 p-0'
                            onClick={() => {
                              if (isPlaying) {
                                audioPlayerRef.current?.pause()
                                setPlayingTrackId(null)
                              } else {
                                if (audioPlayerRef.current) {
                                  audioPlayerRef.current.src = m.audioUrl || `/api/music/netease?id=${m.neteaseId}`
                                  audioPlayerRef.current.play()
                                  setPlayingTrackId(m.id)
                                }
                              }
                            }}
                            title={isPlaying ? '暂停试听' : '点击试听'}
                          >
                            {isPlaying ? (
                              <Pause className='size-3.5 text-primary' />
                            ) : (
                              <Play className='size-3.5' />
                            )}
                          </Button>
                        </td>

                        <td className='px-4 py-3 text-center'>
                          <Badge
                            variant={m.status === 'published' ? 'secondary' : 'outline'}
                            className='text-[10px]'
                          >
                            {m.status === 'published' ? '已发布' : '隐藏'}
                          </Badge>
                        </td>

                        <td className='px-4 py-3 text-right'>
                          <div className='flex items-center justify-end gap-1'>
                            <Button
                              variant='ghost'
                              size='sm'
                              disabled={idx === 0}
                              className='size-7 p-0'
                              onClick={() => handleMoveMusic(idx, 'up')}
                              title='上移'
                            >
                              <ArrowUp className='size-3.5' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              disabled={idx === musicList.length - 1}
                              className='size-7 p-0'
                              onClick={() => handleMoveMusic(idx, 'down')}
                              title='下移'
                            >
                              <ArrowDown className='size-3.5' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='size-7 p-0'
                              onClick={() => openMusicDrawer(m)}
                              title='编辑'
                            >
                              <Edit2 className='size-3.5' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='size-7 p-0 text-red-400 hover:text-red-300'
                              onClick={() => handleDeleteMusic(m)}
                              title='删除'
                            >
                              <Trash2 className='size-3.5' />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Hidden audio element for auditioning */}
          <audio
            ref={audioPlayerRef}
            onEnded={() => setPlayingTrackId(null)}
            className='hidden'
          />

          {/* Music Edit Drawer */}
          <Sheet open={musicDrawerOpen} onOpenChange={setMusicDrawerOpen}>
            <SheetContent side='right' className='sm:max-w-md overflow-y-auto w-full'>
              <SheetHeader>
                <SheetTitle>{editingMusic ? '编辑歌曲' : '添加音乐'}</SheetTitle>
                <SheetDescription>
                  支持拖入音频文件自动识别，或填入网易云 ID 解析。
                </SheetDescription>
              </SheetHeader>

              <form onSubmit={handleSaveMusic} className='space-y-4 py-4 text-xs'>
                {/* Audio Dropzone */}
                <div className='space-y-1.5'>
                  <Label className='text-xs'>音频文件 (拖入上传 ≤50MB)</Label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const f = e.dataTransfer.files?.[0]
                      if (f) handleAudioUpload(f)
                    }}
                    className='border-2 border-dashed border-border/60 rounded-lg p-4 text-center hover:border-primary/50 transition-colors bg-secondary/10'
                  >
                    <input
                      type='file'
                      accept='audio/*'
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleAudioUpload(f)
                      }}
                      className='hidden'
                      id='audio-upload-input'
                    />
                    <label htmlFor='audio-upload-input' className='cursor-pointer space-y-1 block'>
                      <Volume2 className='mx-auto size-5 text-muted-foreground' />
                      <p className='text-muted-foreground'>
                        {isUploadingAudio ? '正在上传音频...' : '点击选择或拖入音频文件'}
                      </p>
                      {musicAudioUrl && (
                        <p className='text-[11px] text-primary truncate max-w-xs'>
                          已就绪: {musicAudioUrl}
                        </p>
                      )}
                    </label>
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <Label className='text-xs'>歌曲名称 *</Label>
                  <Input
                    placeholder='例如：晴天'
                    value={musicTitle}
                    onChange={(e) => setMusicTitle(e.target.value)}
                    className='h-8 text-xs'
                  />
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <div className='space-y-1.5'>
                    <Label className='text-xs'>歌手</Label>
                    <Input
                      placeholder='例如：周杰伦'
                      value={musicArtist}
                      onChange={(e) => setMusicArtist(e.target.value)}
                      className='h-8 text-xs'
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <Label className='text-xs'>专辑</Label>
                    <Input
                      placeholder='例如：叶惠美'
                      value={musicAlbum}
                      onChange={(e) => setMusicAlbum(e.target.value)}
                      className='h-8 text-xs'
                    />
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <Label className='text-xs'>或填入网易云音乐 ID (二选一)</Label>
                  <div className='flex items-center gap-2'>
                    <Input
                      placeholder='例如：186016'
                      value={musicNeteaseId}
                      onChange={(e) => setMusicNeteaseId(e.target.value)}
                      className='h-8 text-xs font-mono flex-1'
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={handleResolveNetease}
                      className='h-8 text-xs'
                    >
                      解析
                    </Button>
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <Label className='text-xs'>封面大图 URL</Label>
                  <Input
                    placeholder='https://...'
                    value={musicCoverUrl}
                    onChange={(e) => setMusicCoverUrl(e.target.value)}
                    className='h-8 text-xs'
                  />
                </div>

                <div className='space-y-1.5'>
                  <Label className='text-xs'>歌词 (LRC 格式)</Label>
                  <Textarea
                    rows={4}
                    placeholder='[00:00.00] 歌词内容...'
                    value={musicLyric}
                    onChange={(e) => setMusicLyric(e.target.value)}
                    className='text-xs font-mono'
                  />
                </div>

                <div className='flex items-center justify-between pt-2 border-t border-border/40'>
                  <Label className='text-xs'>设为精选推荐 (Featured)</Label>
                  <Switch checked={musicFeatured} onCheckedChange={setMusicFeatured} />
                </div>

                <SheetFooter className='pt-2'>
                  <Button type='submit' disabled={isSavingMusic} className='w-full'>
                    {isSavingMusic ? <Loader2 className='size-3.5 animate-spin mr-1' /> : null}
                    保存歌曲
                  </Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 3: 画廊相册 (Gallery)                                  */}
        {/* ========================================================= */}
        <TabsContent value='gallery' className='space-y-4'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div className='text-xs text-muted-foreground'>
              支持拖入多张图片批量上传与自动登记（串行安全写入），可批量管理与排序。
            </div>

            <div className='flex items-center gap-2'>
              {selectedGalleryIds.length > 0 && (
                <div className='flex items-center gap-1.5 mr-2'>
                  <span className='text-xs text-primary font-semibold'>
                    已选 {selectedGalleryIds.length} 项:
                  </span>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-7 text-xs'
                    onClick={() => handleBatchGalleryAction('publish')}
                  >
                    公开
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-7 text-xs'
                    onClick={() => handleBatchGalleryAction('hide')}
                  >
                    隐藏
                  </Button>
                  <Button
                    variant='destructive'
                    size='sm'
                    className='h-7 text-xs'
                    onClick={() => handleBatchGalleryAction('delete')}
                  >
                    删除
                  </Button>
                </div>
              )}

              <input
                type='file'
                ref={galleryInputRef}
                multiple
                accept='image/*'
                className='hidden'
                onChange={(e) => {
                  if (e.target.files?.length) handleBatchUploadGallery(e.target.files)
                }}
              />
              <Button
                size='sm'
                disabled={isBatchUploadingGallery}
                onClick={() => galleryInputRef.current?.click()}
                className='gap-1.5'
              >
                {isBatchUploadingGallery ? (
                  <Loader2 className='size-3.5 animate-spin' />
                ) : (
                  <Upload className='size-3.5' />
                )}
                批量上传图片
              </Button>
            </div>
          </div>

          {/* Batch upload progress banner */}
          {isBatchUploadingGallery && (
            <div className='rounded-lg border border-primary/40 bg-primary/10 p-3 text-xs text-primary flex items-center gap-2'>
              <Loader2 className='size-4 animate-spin shrink-0' />
              <span>{galleryUploadProgress}</span>
            </div>
          )}

          {/* Drag drop area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (e.dataTransfer.files?.length) {
                handleBatchUploadGallery(e.dataTransfer.files)
              }
            }}
            className='border-2 border-dashed border-border/60 rounded-xl p-4 text-center hover:border-primary/50 transition-colors bg-secondary/5'
          >
            <p className='text-xs text-muted-foreground'>
              拖拽多张图片到此处直接批量上传并自动登记到画廊
            </p>
          </div>

          {/* Gallery Waterfall Grid */}
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'>
            {galleryList.map((item: any, idx: number) => {
              const isSelected = selectedGalleryIds.includes(item.id)

              return (
                <div
                  key={item.id}
                  className={cn(
                    'group relative rounded-xl overflow-hidden border bg-card/60 transition-all shadow-xs',
                    isSelected ? 'border-primary ring-2 ring-primary/40' : 'border-border/60 hover:border-border'
                  )}
                >
                  <div className='aspect-square w-full overflow-hidden bg-muted/20 relative'>
                    <img src={item.imageUrl} alt={item.title} className='size-full object-cover' />
                    {/* Select checkbox */}
                    <input
                      type='checkbox'
                      checked={isSelected}
                      onChange={(e) => {
                        setSelectedGalleryIds(
                          e.target.checked
                            ? [...selectedGalleryIds, item.id]
                            : selectedGalleryIds.filter((id) => id !== item.id)
                        )
                      }}
                      className='absolute top-2 left-2 size-4 rounded bg-background/80 z-10'
                    />
                    {/* Hover overlay actions */}
                    <div className='absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 backdrop-blur-xs'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='size-7 p-0'
                        onClick={() => {
                          setEditingPhoto(item)
                          setPhotoTitle(item.title || '')
                          setPhotoDesc(item.description || '')
                          setPhotoImage(item.imageUrl || '')
                          setPhotoTags(Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''))
                          setPhotoFeatured(Boolean(item.featured))
                          setPhotoStatus(item.status || 'published')
                          setGalleryDrawerOpen(true)
                        }}
                      >
                        <Edit2 className='size-3.5' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='size-7 p-0 text-red-400'
                        onClick={async () => {
                          if (!confirm(`确定要删除「${item.title}」吗？`)) return
                          await api.post('/api/admin/gallery', { action: 'delete', id: item.id })
                          queryClient.invalidateQueries({ queryKey: ['catalog'] })
                        }}
                      >
                        <Trash2 className='size-3.5' />
                      </Button>
                    </div>
                  </div>

                  <div className='p-2 text-xs'>
                    <p className='font-semibold text-foreground truncate'>{item.title}</p>
                    <p className='text-[10px] text-muted-foreground truncate'>{item.description || '无说明'}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Single Photo Edit Drawer */}
          <Sheet open={galleryDrawerOpen} onOpenChange={setGalleryDrawerOpen}>
            <SheetContent side='right' className='sm:max-w-md'>
              <SheetHeader>
                <SheetTitle>编辑画廊图片信息</SheetTitle>
              </SheetHeader>
              <form onSubmit={handleSavePhoto} className='space-y-4 py-4 text-xs'>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>图片标题</Label>
                  <Input value={photoTitle} onChange={(e) => setPhotoTitle(e.target.value)} className='h-8 text-xs' />
                </div>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>描述说明</Label>
                  <Textarea rows={3} value={photoDesc} onChange={(e) => setPhotoDesc(e.target.value)} className='text-xs' />
                </div>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>标签 (逗号分隔)</Label>
                  <Input value={photoTags} onChange={(e) => setPhotoTags(e.target.value)} className='h-8 text-xs' />
                </div>
                <div className='flex items-center justify-between pt-2'>
                  <Label className='text-xs'>精选图片</Label>
                  <Switch checked={photoFeatured} onCheckedChange={setPhotoFeatured} />
                </div>
                <SheetFooter className='pt-2'>
                  <Button type='submit' disabled={isSavingPhoto} className='w-full'>
                    {isSavingPhoto ? <Loader2 className='size-3.5 animate-spin mr-1' /> : null}
                    保存图片信息
                  </Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 4: 照片墙 (Photo Wall)                                 */}
        {/* ========================================================= */}
        <TabsContent value='photowall' className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='text-xs text-muted-foreground'>
              前台 /photo-wall.html 照片墙卡片，可关联跳转链接与引导说明。
            </div>
            <Button
              size='sm'
              onClick={() => {
                setEditingPhotoWall(null)
                setPwTitle('')
                setPwDesc('')
                setPwImageUrl('')
                setPwLinkUrl('')
                setPwLinkText('了解更多')
                setPwStatus('published')
                setPhotoWallDrawerOpen(true)
              }}
              className='gap-1.5'
            >
              <Plus className='size-3.5' /> 添加照片墙卡片
            </Button>
          </div>

          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
            {photoWallList.map((pw: any) => (
              <Card key={pw.id} className='border-border/60 bg-card/60 overflow-hidden'>
                <div className='aspect-4/3 w-full overflow-hidden bg-muted/20'>
                  {pw.imageUrl && (
                    <img src={pw.imageUrl} alt={pw.title} className='size-full object-cover' />
                  )}
                </div>
                <CardHeader className='p-3 pb-1'>
                  <CardTitle className='text-xs font-semibold'>{pw.title}</CardTitle>
                  <CardDescription className='text-[11px] truncate'>{pw.description || '无说明'}</CardDescription>
                </CardHeader>
                <CardFooter className='p-3 pt-1 flex items-center justify-between text-xs border-t border-border/30'>
                  <span className='text-[10px] text-muted-foreground truncate max-w-[120px]'>{pw.linkUrl || '-'}</span>
                  <div className='flex items-center gap-1'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='size-7 p-0'
                      onClick={() => {
                        setEditingPhotoWall(pw)
                        setPwTitle(pw.title || '')
                        setPwDesc(pw.description || '')
                        setPwImageUrl(pw.imageUrl || '')
                        setPwLinkUrl(pw.linkUrl || '')
                        setPwLinkText(pw.linkText || '了解更多')
                        setPwStatus(pw.status || 'published')
                        setPhotoWallDrawerOpen(true)
                      }}
                    >
                      <Edit2 className='size-3.5' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='size-7 p-0 text-red-400'
                      onClick={async () => {
                        if (!confirm(`确定要删除「${pw.title}」吗？`)) return
                        await api.post('/api/admin/photo-wall', { action: 'delete', id: pw.id })
                        queryClient.invalidateQueries({ queryKey: ['catalog'] })
                      }}
                    >
                      <Trash2 className='size-3.5' />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Photo Wall Drawer */}
          <Sheet open={photoWallDrawerOpen} onOpenChange={setPhotoWallDrawerOpen}>
            <SheetContent side='right' className='sm:max-w-md'>
              <SheetHeader>
                <SheetTitle>{editingPhotoWall ? '编辑照片墙' : '添加照片墙卡片'}</SheetTitle>
              </SheetHeader>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!pwImageUrl.trim()) {
                    toast.error('图片地址为必填')
                    return
                  }
                  setIsSavingPw(true)
                  try {
                    await api.post('/api/admin/photo-wall', {
                      id: editingPhotoWall?.id || '',
                      title: pwTitle.trim() || '未命名照片',
                      description: pwDesc.trim(),
                      imageUrl: pwImageUrl.trim(),
                      linkUrl: pwLinkUrl.trim(),
                      linkText: pwLinkText.trim(),
                      status: pwStatus,
                      sortOrder: editingPhotoWall?.sortOrder ?? photoWallList.length,
                    })
                    toast.success('照片墙卡片已保存')
                    setPhotoWallDrawerOpen(false)
                    queryClient.invalidateQueries({ queryKey: ['catalog'] })
                  } finally {
                    setIsSavingPw(false)
                  }
                }}
                className='space-y-4 py-4 text-xs'
              >
                <div className='space-y-1.5'>
                  <Label className='text-xs'>图片地址 *</Label>
                  <Input value={pwImageUrl} onChange={(e) => setPwImageUrl(e.target.value)} className='h-8 text-xs' />
                </div>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>卡片标题</Label>
                  <Input value={pwTitle} onChange={(e) => setPwTitle(e.target.value)} className='h-8 text-xs' />
                </div>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>说明文字</Label>
                  <Textarea rows={3} value={pwDesc} onChange={(e) => setPwDesc(e.target.value)} className='text-xs' />
                </div>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>跳转链接</Label>
                  <Input value={pwLinkUrl} onChange={(e) => setPwLinkUrl(e.target.value)} className='h-8 text-xs' />
                </div>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>按钮文字</Label>
                  <Input value={pwLinkText} onChange={(e) => setPwLinkText(e.target.value)} className='h-8 text-xs' />
                </div>
                <SheetFooter className='pt-2'>
                  <Button type='submit' disabled={isSavingPw} className='w-full'>
                    {isSavingPw ? <Loader2 className='size-3.5 animate-spin mr-1' /> : null}
                    保存
                  </Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 5: 首页轮播 (Carousel)                                 */}
        {/* ========================================================= */}
        <TabsContent value='carousel' className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='text-xs text-muted-foreground'>
              综合门户模式下的顶部大轮播 Banner 列表。
            </div>
            <Button
              size='sm'
              onClick={() => {
                setEditingCarousel(null)
                setCarTitle('')
                setCarDesc('')
                setCarImageUrl('')
                setCarSuggestion('')
                setCarStatus('published')
                setCarouselDrawerOpen(true)
              }}
              className='gap-1.5'
            >
              <Plus className='size-3.5' /> 添加轮播项
            </Button>
          </div>

          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {carouselList.map((item: any, idx: number) => (
              <Card key={item.id} className='border-border/60 bg-card/60 overflow-hidden'>
                <div className='aspect-video w-full overflow-hidden bg-muted/20'>
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.title} className='size-full object-cover' />
                  )}
                </div>
                <CardHeader className='p-3 pb-1'>
                  <CardTitle className='text-sm font-semibold'>{item.title}</CardTitle>
                  <CardDescription className='text-xs line-clamp-2'>{item.description || '无介绍'}</CardDescription>
                </CardHeader>
                <CardFooter className='p-3 pt-1 flex items-center justify-between text-xs border-t border-border/30'>
                  <span className='font-mono text-muted-foreground text-[10px]'>排序: {item.sortOrder ?? idx}</span>
                  <div className='flex items-center gap-1'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='size-7 p-0'
                      onClick={() => {
                        setEditingCarousel(item)
                        setCarTitle(item.title || '')
                        setCarDesc(item.description || '')
                        setCarImageUrl(item.imageUrl || '')
                        setCarSuggestion(item.suggestion || '')
                        setCarStatus(item.status || 'published')
                        setCarouselDrawerOpen(true)
                      }}
                    >
                      <Edit2 className='size-3.5' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='size-7 p-0 text-red-400'
                      onClick={async () => {
                        if (!confirm(`确定要删除轮播项「${item.title}」吗？`)) return
                        await api.post('/api/admin/site-carousel', { action: 'delete', id: item.id })
                        queryClient.invalidateQueries({ queryKey: ['catalog'] })
                      }}
                    >
                      <Trash2 className='size-3.5' />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Carousel Drawer */}
          <Sheet open={carouselDrawerOpen} onOpenChange={setCarouselDrawerOpen}>
            <SheetContent side='right' className='sm:max-w-md'>
              <SheetHeader>
                <SheetTitle>{editingCarousel ? '编辑轮播' : '添加轮播'}</SheetTitle>
              </SheetHeader>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!carTitle.trim() || !carImageUrl.trim()) {
                    toast.error('标题与图片地址为必填')
                    return
                  }
                  setIsSavingCarousel(true)
                  try {
                    await api.post('/api/admin/site-carousel', {
                      id: editingCarousel?.id || '',
                      title: carTitle.trim(),
                      description: carDesc.trim(),
                      imageUrl: carImageUrl.trim(),
                      suggestion: carSuggestion.trim(),
                      status: carStatus,
                      sortOrder: editingCarousel?.sortOrder ?? carouselList.length,
                    })
                    toast.success('轮播项已保存')
                    setCarouselDrawerOpen(false)
                    queryClient.invalidateQueries({ queryKey: ['catalog'] })
                  } finally {
                    setIsSavingCarousel(false)
                  }
                }}
                className='space-y-4 py-4 text-xs'
              >
                <div className='space-y-1.5'>
                  <Label className='text-xs'>轮播标题 *</Label>
                  <Input value={carTitle} onChange={(e) => setCarTitle(e.target.value)} className='h-8 text-xs' />
                </div>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>图片地址 (16:9 比例) *</Label>
                  <Input value={carImageUrl} onChange={(e) => setCarImageUrl(e.target.value)} className='h-8 text-xs' />
                </div>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>详细文案</Label>
                  <Textarea rows={3} value={carDesc} onChange={(e) => setCarDesc(e.target.value)} className='text-xs' />
                </div>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>底部建议提示词</Label>
                  <Input value={carSuggestion} onChange={(e) => setCarSuggestion(e.target.value)} className='h-8 text-xs' />
                </div>
                <SheetFooter className='pt-2'>
                  <Button type='submit' disabled={isSavingCarousel} className='w-full'>
                    {isSavingCarousel ? <Loader2 className='size-3.5 animate-spin mr-1' /> : null}
                    保存
                  </Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 6: 顶部导航管理 (Navigation)                            */}
        {/* ========================================================= */}
        <TabsContent value='nav' className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='text-xs text-muted-foreground'>
              全站顶部悬浮导航链接，可排序、配置新窗口打开与可见性。
            </div>
            <Button
              size='sm'
              onClick={() => {
                setEditingNav(null)
                setNavLabel('')
                setNavHref('')
                setNavExternal(false)
                setNavStatus('active')
                setNavDrawerOpen(true)
              }}
              className='gap-1.5'
            >
              <Plus className='size-3.5' /> 添加导航项
            </Button>
          </div>

          <div className='rounded-xl border border-border/60 bg-card/60 overflow-hidden backdrop-blur-sm'>
            <table className='w-full text-left text-sm'>
              <thead className='border-b border-border/40 bg-muted/40 text-xs uppercase text-muted-foreground'>
                <tr>
                  <th className='px-4 py-3'>导航文字</th>
                  <th className='px-4 py-3'>目标路径 / URL</th>
                  <th className='px-4 py-3 text-center'>新窗口打开</th>
                  <th className='px-4 py-3 text-center'>状态</th>
                  <th className='px-4 py-3 text-right'>排序与操作</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/40'>
                {navList.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className='hover:bg-muted/20 text-xs'>
                    <td className='px-4 py-3 font-semibold text-foreground'>{item.label}</td>
                    <td className='px-4 py-3 font-mono text-muted-foreground'>{item.href}</td>
                    <td className='px-4 py-3 text-center'>
                      {item.external ? <Badge variant='outline' className='text-[10px]'>新标签页</Badge> : '-'}
                    </td>
                    <td className='px-4 py-3 text-center'>
                      <Badge variant={item.status === 'active' ? 'secondary' : 'outline'} className='text-[10px]'>
                        {item.status === 'active' ? '启用' : '停用'}
                      </Badge>
                    </td>
                    <td className='px-4 py-3 text-right'>
                      <div className='flex items-center justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='sm'
                          disabled={idx === 0}
                          className='size-7 p-0'
                          onClick={async () => {
                            const prev = navList[idx - 1]
                            await api.post('/api/admin/navigation', { ...item, sortOrder: prev.sortOrder ?? idx - 1 })
                            await api.post('/api/admin/navigation', { ...prev, sortOrder: item.sortOrder ?? idx })
                            queryClient.invalidateQueries({ queryKey: ['catalog'] })
                          }}
                        >
                          <ArrowUp className='size-3.5' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          disabled={idx === navList.length - 1}
                          className='size-7 p-0'
                          onClick={async () => {
                            const next = navList[idx + 1]
                            await api.post('/api/admin/navigation', { ...item, sortOrder: next.sortOrder ?? idx + 1 })
                            await api.post('/api/admin/navigation', { ...next, sortOrder: item.sortOrder ?? idx })
                            queryClient.invalidateQueries({ queryKey: ['catalog'] })
                          }}
                        >
                          <ArrowDown className='size-3.5' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='size-7 p-0'
                          onClick={() => {
                            setEditingNav(item)
                            setNavLabel(item.label || '')
                            setNavHref(item.href || '')
                            setNavExternal(Boolean(item.external))
                            setNavStatus(item.status || 'active')
                            setNavDrawerOpen(true)
                          }}
                        >
                          <Edit2 className='size-3.5' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='size-7 p-0 text-red-400'
                          onClick={async () => {
                            if (!confirm(`确定要删除导航「${item.label}」吗？`)) return
                            await api.post('/api/admin/navigation/delete', { id: item.id })
                            queryClient.invalidateQueries({ queryKey: ['catalog'] })
                          }}
                        >
                          <Trash2 className='size-3.5' />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Navigation Drawer */}
          <Sheet open={navDrawerOpen} onOpenChange={setNavDrawerOpen}>
            <SheetContent side='right' className='sm:max-w-md'>
              <SheetHeader>
                <SheetTitle>{editingNav ? '编辑导航项' : '添加导航项'}</SheetTitle>
              </SheetHeader>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!navLabel.trim() || !navHref.trim()) {
                    toast.error('导航文字与路径为必填')
                    return
                  }
                  setIsSavingNav(true)
                  try {
                    await api.post('/api/admin/navigation', {
                      id: editingNav?.id || '',
                      label: navLabel.trim(),
                      href: navHref.trim(),
                      external: navExternal,
                      status: navStatus,
                      sortOrder: editingNav?.sortOrder ?? navList.length,
                    })
                    toast.success('导航项已保存')
                    setNavDrawerOpen(false)
                    queryClient.invalidateQueries({ queryKey: ['catalog'] })
                  } finally {
                    setIsSavingNav(false)
                  }
                }}
                className='space-y-4 py-4 text-xs'
              >
                <div className='space-y-1.5'>
                  <Label className='text-xs'>导航文字 *</Label>
                  <Input value={navLabel} onChange={(e) => setNavLabel(e.target.value)} className='h-8 text-xs' />
                </div>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>目标路径 / URL *</Label>
                  <Input value={navHref} onChange={(e) => setNavHref(e.target.value)} className='h-8 text-xs font-mono' />
                </div>
                <div className='flex items-center justify-between pt-2'>
                  <Label className='text-xs'>在新标签页打开</Label>
                  <Switch checked={navExternal} onCheckedChange={setNavExternal} />
                </div>
                <SheetFooter className='pt-2'>
                  <Button type='submit' disabled={isSavingNav} className='w-full'>
                    {isSavingNav ? <Loader2 className='size-3.5 animate-spin mr-1' /> : null}
                    保存
                  </Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 7: 站点模式与文案 (Site Settings)                      */}
        {/* ========================================================= */}
        <TabsContent value='site' className='space-y-6'>
          <Card className='border-border/60 bg-card/60 backdrop-blur-sm'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base'>网站全局业务模式</CardTitle>
              <CardDescription className='text-xs'>
                选择前台访问域名根路径 <code>/</code> 时的呈现形态。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-3 sm:grid-cols-3'>
                {[
                  { id: 'portal', title: '综合门户模式', desc: '展示 Raycast 风格指挥中心、全业务生态与最新资讯' },
                  { id: 'software', title: '纯软件下载站模式', desc: '以多平台软件网格与首屏轮播为核心入口' },
                  { id: 'blog', title: '资讯博客模式', desc: '以文章内容、教程与动态日志为主要展示' },
                ].map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSiteMode(m.id)}
                    className={cn(
                      'cursor-pointer rounded-lg border p-4 transition-all',
                      siteMode === m.id
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border/60 bg-secondary/10 hover:border-border'
                    )}
                  >
                    <div className='flex items-center justify-between'>
                      <span className='font-semibold text-sm'>{m.title}</span>
                      {siteMode === m.id && <CheckCircle2 className='size-4 text-primary' />}
                    </div>
                    <p className='mt-1 text-xs text-muted-foreground'>{m.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/60 bg-card/60 backdrop-blur-sm'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base'>首页核心文案 (Hero Copywriting)</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 text-xs'>
              <div className='space-y-1.5'>
                <Label className='text-xs'>Hero 眉标 (Kicker)</Label>
                <Input value={siteKicker} onChange={(e) => setSiteKicker(e.target.value)} className='h-8 text-xs' />
              </div>
              <div className='space-y-1.5'>
                <Label className='text-xs'>Hero 大标题</Label>
                <Input value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} className='h-8 text-xs font-semibold' />
              </div>
              <div className='space-y-1.5'>
                <Label className='text-xs'>Hero 详细说明</Label>
                <Textarea rows={3} value={siteDesc} onChange={(e) => setSiteDesc(e.target.value)} className='text-xs' />
              </div>
            </CardContent>
            <CardFooter className='border-t border-border/30 pt-4 flex justify-end'>
              <Button size='sm' disabled={isSavingSite} onClick={handleSaveSite} className='gap-1.5'>
                {isSavingSite ? <Loader2 className='size-3.5 animate-spin' /> : <Save className='size-3.5' />}
                保存网站设置
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
