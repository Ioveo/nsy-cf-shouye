import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Layers,
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Eye,
  CheckCircle2,
  Circle,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Laptop,
  Smartphone,
  Loader2,
  X,
  Image as ImageIcon,
  FileCode,
  Package,
  Check,
} from 'lucide-react'
import { useCatalog, useLanding, Software, Release } from '@/lib/queries'
import { api } from '@/lib/api'
// @ts-ignore
import { uploadReleaseFile, uploadAssetFile, formatBytes } from '@r2'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface HighlightItem {
  title: string
  text: string
}

interface PendingPackage {
  id: string
  file: File
  platform: string
  label: string
  arch: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

const PLATFORM_OPTIONS = [
  { value: 'windows', label: 'Windows (exe/msi)' },
  { value: 'portable', label: 'Portable (绿色便携/zip)' },
  { value: 'macos', label: 'macOS (dmg/pkg)' },
  { value: 'linux', label: 'Linux (AppImage/deb/rpm)' },
  { value: 'android', label: 'Android (apk)' },
  { value: 'other', label: 'Other (其它)' },
]

export function SoftwareWizard() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { id?: string }
  const queryClient = useQueryClient()
  const { data: catalog, isLoading } = useCatalog()
  const { data: landingData } = useLanding()

  const softwareList = catalog?.software || []
  const categories = catalog?.categories || []
  const existingSoftware = params.id
    ? softwareList.find((s) => s.id === params.id || s.slug === params.id)
    : null

  // Wizard Step: 1 = Basic, 2 = Media, 3 = Packages, 4 = Publish
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1: Basic info
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [descTab, setDescTab] = useState<'write' | 'preview'>('write')
  const [requirements, setRequirements] = useState('Windows 10 / 11 64位')
  const [developer, setDeveloper] = useState('天才猫')
  const [website, setWebsite] = useState('')
  const [priceLabel, setPriceLabel] = useState('免费')
  const [highlights, setHighlights] = useState<HighlightItem[]>([
    { title: '', text: '' },
  ])

  // Step 2: Media
  const [iconUrl, setIconUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [isUploadingIcon, setIsUploadingIcon] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [isUploadingScreenshots, setIsUploadingScreenshots] = useState(false)

  // Step 3: Packages & Version
  const [version, setVersion] = useState('1.0.0')
  const [changelog, setChangelog] = useState('首发版本发布')
  const [pendingPackages, setPendingPackages] = useState<PendingPackage[]>([])
  const [existingReleases, setExistingReleases] = useState<Release[]>([])

  // Step 4: Publish & Display
  const [featured, setFeatured] = useState(false)
  const [featuredOrder, setFeaturedOrder] = useState(0)
  const [landingUrl, setLandingUrl] = useState('')
  const [status, setStatus] = useState<'active' | 'draft' | 'disabled'>('active')

  // Global operations
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')

  // Inline Category modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [isCreatingCat, setIsCreatingCat] = useState(false)

  // File refs
  const iconInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const screenshotInputRef = useRef<HTMLInputElement>(null)
  const packageInputRef = useRef<HTMLInputElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Load existing data when editing
  useEffect(() => {
    if (existingSoftware) {
      setName(existingSoftware.name || '')
      setSlug(existingSoftware.slug || '')
      setIsSlugManuallyEdited(true)
      setCategoryId(existingSoftware.categoryId || categories[0]?.id || '')
      setTagline(existingSoftware.tagline || '')
      setDescription(existingSoftware.description || '')
      setRequirements(existingSoftware.requirements || 'Windows 10 / 11 64位')
      setDeveloper(existingSoftware.developer || '天才猫')
      setWebsite(existingSoftware.website || '')
      setPriceLabel(existingSoftware.priceLabel || '免费')
      setIconUrl(existingSoftware.iconUrl || existingSoftware.icon || '')
      setCoverUrl(existingSoftware.coverUrl || '')
      setScreenshots(
        Array.isArray(existingSoftware.screenshots)
          ? existingSoftware.screenshots
          : typeof existingSoftware.screenshots === 'string'
          ? (existingSoftware.screenshots as string).split('\n').filter(Boolean)
          : []
      )
      setHighlights(
        Array.isArray(existingSoftware.highlights) && existingSoftware.highlights.length > 0
          ? existingSoftware.highlights
          : [{ title: '', text: '' }]
      )
      setFeatured(Boolean(existingSoftware.featured))
      setFeaturedOrder(existingSoftware.featuredOrder || 0)
      setLandingUrl(existingSoftware.landingUrl || '')
      setStatus((existingSoftware.status as any) || 'active')

      const rels = (existingSoftware.releases || []).slice()
      setExistingReleases(rels)
      if (rels.length > 0) {
        setVersion(rels[0].version || '1.0.0')
      }
    } else if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id)
    }
  }, [existingSoftware, categories])

  // Slug auto-generation from name
  function handleNameChange(newName: string) {
    setName(newName)
    if (!isSlugManuallyEdited) {
      const generated = newName
        .trim()
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      setSlug(generated)
    }
  }

  // Slug duplicate check
  const isSlugDuplicate = softwareList.some(
    (s) => s.slug === slug.trim() && s.id !== existingSoftware?.id && s.slug !== existingSoftware?.slug
  )

  // Detect platform from filename
  function detectPlatform(fileName: string): string {
    const lower = fileName.toLowerCase()
    if (lower.includes('portable') || lower.includes('绿色') || lower.includes('免安装')) return 'portable'
    if (lower.endsWith('.dmg') || lower.endsWith('.pkg')) return 'macos'
    if (lower.endsWith('.appimage') || lower.endsWith('.deb') || lower.endsWith('.rpm') || lower.endsWith('.tar.gz')) return 'linux'
    if (lower.endsWith('.apk')) return 'android'
    if (lower.endsWith('.exe') || lower.endsWith('.msi')) return 'windows'
    if (lower.endsWith('.zip') || lower.endsWith('.7z')) return 'portable'
    return 'other'
  }

  function inferLabel(fileName: string, platform: string): string {
    if (platform === 'portable') return '绿色便携版'
    if (platform === 'windows') return 'Windows 安装版'
    if (platform === 'macos') return 'macOS 版'
    if (platform === 'linux') return 'Linux 版'
    if (platform === 'android') return 'Android 版'
    return fileName
  }

  // Handle Icon upload
  async function handleIconUpload(file: File) {
    setIsUploadingIcon(true)
    try {
      const targetFolder = `software-${slug.trim() || 'app'}`
      const res = await uploadAssetFile(file, { kind: 'image', folder: targetFolder })
      if (res.success && res.url) {
        setIconUrl(res.url)
        toast.success('图标已上传')
      } else {
        toast.error(res.msg || '图标上传失败')
      }
    } catch (e: any) {
      toast.error(`图标上传异常：${e.message}`)
    } finally {
      setIsUploadingIcon(false)
    }
  }

  // Handle Cover upload
  async function handleCoverUpload(file: File) {
    setIsUploadingCover(true)
    try {
      const targetFolder = `software-${slug.trim() || 'app'}`
      const res = await uploadAssetFile(file, { kind: 'image', folder: targetFolder })
      if (res.success && res.url) {
        setCoverUrl(res.url)
        toast.success('封面大图已上传')
      } else {
        toast.error(res.msg || '封面上传失败')
      }
    } catch (e: any) {
      toast.error(`封面上传异常：${e.message}`)
    } finally {
      setIsUploadingCover(false)
    }
  }

  // Handle Screenshots multiple upload
  async function handleScreenshotsUpload(files: FileList | File[]) {
    const list = Array.from(files)
    if (screenshots.length + list.length > 12) {
      toast.error('截图最多支持 12 张')
      return
    }
    setIsUploadingScreenshots(true)
    const targetFolder = `software-${slug.trim() || 'app'}`
    const uploadedUrls: string[] = []

    try {
      // Serial upload as per rule
      for (let i = 0; i < list.length; i++) {
        const file = list[i]
        const res = await uploadAssetFile(file, { kind: 'image', folder: targetFolder })
        if (res.success && res.url) {
          uploadedUrls.push(res.url)
        } else {
          toast.error(`第 ${i + 1} 张上传失败: ${res.msg || '未知错误'}`)
        }
      }
      if (uploadedUrls.length > 0) {
        setScreenshots((prev) => [...prev, ...uploadedUrls].slice(0, 12))
        toast.success(`成功上传 ${uploadedUrls.length} 张截图`)
      }
    } catch (e: any) {
      toast.error(`截图上传异常：${e.message}`)
    } finally {
      setIsUploadingScreenshots(false)
    }
  }

  // Add package files to pending list
  function handleAddPackages(files: FileList | File[]) {
    const items: PendingPackage[] = Array.from(files).map((f) => {
      const plat = detectPlatform(f.name)
      return {
        id: Math.random().toString(36).substring(2, 9),
        file: f,
        platform: plat,
        label: inferLabel(f.name, plat),
        arch: 'x64',
        status: 'pending',
      }
    })
    setPendingPackages((prev) => [...prev, ...items])
  }

  // Checklist computation
  const hasName = Boolean(name.trim())
  const hasValidSlug = Boolean(slug.trim()) && !isSlugDuplicate
  const hasCategory = Boolean(categoryId)
  const hasTagline = Boolean(tagline.trim()) && tagline.trim().length <= 40
  const hasIcon = Boolean(iconUrl.trim())
  const hasPackages = pendingPackages.length > 0 || existingReleases.length > 0

  const hasCover = Boolean(coverUrl.trim())
  const hasThreeScreenshots = screenshots.length >= 3
  const hasDescriptionRich = description.trim().length >= 50
  const hasThreeHighlights = highlights.filter((h) => h.title.trim() && h.text.trim()).length >= 3

  const requiredPassed =
    hasName && hasValidSlug && hasCategory && hasTagline && hasIcon && hasPackages

  const missingRequiredList: string[] = []
  if (!hasName) missingRequiredList.push('软件名称')
  if (!hasValidSlug) missingRequiredList.push(isSlugDuplicate ? 'Slug 唯一性' : 'Slug 标识')
  if (!hasCategory) missingRequiredList.push('所属分类')
  if (!hasTagline) missingRequiredList.push(tagline.trim().length > 40 ? 'Tagline 字数 ≤40' : '一句话介绍')
  if (!hasIcon) missingRequiredList.push('软件图标')
  if (!hasPackages) missingRequiredList.push('安装包 (至少 1 个)')

  // PostMessage for Preview
  const currentSoftwarePayload = {
    id: existingSoftware?.id || slug.trim(),
    slug: slug.trim(),
    name: name.trim() || '软件名称预览',
    categoryId: categoryId || 'general',
    categoryName: categories.find((c) => c.id === categoryId)?.name || '未分类',
    tagline: tagline.trim() || '一句话亮点介绍',
    description: description.trim() || '软件介绍详细内容...',
    requirements: requirements.trim(),
    developer: developer.trim(),
    website: website.trim(),
    priceLabel: priceLabel.trim() || '免费',
    iconUrl: iconUrl || '/favicon.ico',
    coverUrl: coverUrl || '',
    screenshots: screenshots,
    highlights: highlights.filter((h) => h.title.trim() || h.text.trim()),
    featured,
    featuredOrder,
    landingUrl,
    status: status || 'draft',
    releases: [
      ...pendingPackages.map((p, idx) => ({
        id: `pending-${idx}`,
        version: version.trim() || '1.0.0',
        fileName: p.file.name,
        fileSize: p.file.size,
        size: formatBytes(p.file.size),
        platform: p.platform,
        label: p.label,
        arch: p.arch,
        changelog: changelog.trim(),
        isLatest: idx === 0 && existingReleases.length === 0,
        status: 'published',
      })),
      ...existingReleases,
    ],
  }

  function handleIframeLoad() {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'studio-preview',
          software: currentSoftwarePayload,
        },
        window.location.origin
      )
    }
  }

  // Save implementation (Strictly serial)
  async function performSave(targetStatus: 'active' | 'draft') {
    if (!name.trim()) {
      toast.error('请填写软件名称')
      setCurrentStep(1)
      return
    }
    if (!slug.trim()) {
      toast.error('请填写软件标识 (Slug)')
      setCurrentStep(1)
      return
    }
    if (isSlugDuplicate) {
      toast.error(`软件标识 ${slug.trim()} 已被占用，请更改`)
      setCurrentStep(1)
      return
    }

    if (targetStatus === 'active' && !requiredPassed) {
      toast.error(`无法发布，缺少必填项：${missingRequiredList.join('、')}`)
      return
    }

    const isDraft = targetStatus === 'draft'
    if (isDraft) setIsSavingDraft(true)
    else setIsPublishing(true)

    try {
      // Step 1: Save base software object
      const swId = existingSoftware?.id || slug.trim()
      const payload = {
        id: swId,
        slug: slug.trim(),
        name: name.trim(),
        categoryId: categoryId || categories[0]?.id || 'tools',
        tagline: tagline.trim(),
        description: description.trim(),
        requirements: requirements.trim(),
        developer: developer.trim(),
        website: website.trim(),
        priceLabel: priceLabel.trim() || '免费',
        iconUrl: iconUrl.trim(),
        coverUrl: coverUrl.trim(),
        screenshots: screenshots,
        highlights: highlights.filter((h) => h.title.trim() || h.text.trim()),
        featured,
        featuredOrder: Number(featuredOrder) || 0,
        landingUrl: landingUrl.trim(),
        status: targetStatus,
        sortOrder: existingSoftware?.sortOrder ?? softwareList.length,
      }

      const swRes = await api.post('/api/admin/software', payload)
      if (!swRes.success) {
        toast.error(swRes.msg || '保存软件失败')
        return
      }

      // Step 2: Upload pending packages serially (Rule 4: for ... await)
      if (pendingPackages.length > 0) {
        const swActualId = swRes.catalog?.software?.find((s: any) => s.slug === slug.trim())?.id || swId
        for (let i = 0; i < pendingPackages.length; i++) {
          const pkg = pendingPackages[i]
          // Mark uploading
          setPendingPackages((prev) =>
            prev.map((item, idx) => (idx === i ? { ...item, status: 'uploading' } : item))
          )

          const isLatestPkg = i === 0 && existingReleases.length === 0
          const uploadRes = await uploadReleaseFile(pkg.file, {
            softwareId: swActualId,
            version: version.trim() || '1.0.0',
            changelog: changelog.trim(),
            isLatest: isLatestPkg,
          })

          if (uploadRes.success) {
            // Find newly created release in catalog to update platform/label/arch
            const refreshedCatalog = await api.post('/api/admin/catalog')
            const allRels = (refreshedCatalog.catalog?.software || []).flatMap((s: any) => s.releases || [])
            const createdRel = allRels.find(
              (r: any) =>
                (r.softwareId === swActualId || r.softwareSlug === slug.trim()) &&
                r.version === (version.trim() || '1.0.0') &&
                r.fileName === pkg.file.name
            )

            if (createdRel) {
              await api.post('/api/admin/releases/update', {
                releaseId: createdRel.id,
                action: 'edit',
                version: version.trim() || '1.0.0',
                changelog: changelog.trim(),
                status: 'published',
                fileName: pkg.file.name,
                isLatest: isLatestPkg,
                platform: pkg.platform,
                label: pkg.label.trim() || pkg.file.name,
                arch: pkg.arch,
              })
            }

            setPendingPackages((prev) =>
              prev.map((item, idx) => (idx === i ? { ...item, status: 'done' } : item))
            )
          } else {
            setPendingPackages((prev) =>
              prev.map((item, idx) =>
                idx === i ? { ...item, status: 'error', error: uploadRes.msg } : item
              )
            )
            toast.error(`安装包 ${pkg.file.name} 上传失败：${uploadRes.msg}`)
          }
        }
      }

      // Step 3: Ensure final software properties and status are synced
      await api.post('/api/admin/software', {
        ...payload,
        status: targetStatus,
      })

      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      toast.success(
        isDraft ? '草稿已保存（前台不可见）' : '软件已成功上架发布！'
      )
      navigate({ to: '/software' })
    } catch (err: any) {
      toast.error(`保存异常：${err.message}`)
    } finally {
      if (isDraft) setIsSavingDraft(false)
      else setIsPublishing(false)
    }
  }

  async function handleCreateCategory() {
    if (!newCatName.trim()) return
    setIsCreatingCat(true)
    try {
      const res = await api.post('/api/admin/categories', {
        name: newCatName.trim(),
        sortOrder: categories.length,
      })
      if (res.success) {
        toast.success(`分类「${newCatName.trim()}」已创建`)
        const newId = res.catalog?.categories?.find((c: any) => c.name === newCatName.trim())?.id
        if (newId) setCategoryId(newId)
        setNewCatName('')
        setCategoryModalOpen(false)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '创建分类失败')
      }
    } catch (e: any) {
      toast.error(`创建异常：${e.message}`)
    } finally {
      setIsCreatingCat(false)
    }
  }

  return (
    <div className='flex min-h-[calc(100vh-4rem)] flex-col pb-24'>
      {/* Top Header */}
      <div className='border-b border-border/60 bg-card/40 px-6 py-4 backdrop-blur-md'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => navigate({ to: '/software' })}
              className='gap-1 text-muted-foreground hover:text-foreground'
            >
              <ArrowLeft className='size-4' />
              返回软件列表
            </Button>
            <div className='h-4 w-px bg-border' />
            <h1 className='text-lg font-semibold tracking-tight'>
              {existingSoftware ? `编辑软件 · ${existingSoftware.name}` : '发布新软件向导'}
            </h1>
            <Badge
              variant='outline'
              className={cn(
                'text-xs font-normal',
                status === 'active'
                  ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                  : 'border-amber-500/40 text-amber-400 bg-amber-500/10'
              )}
            >
              {status === 'active' ? '上架状态' : '草稿状态'}
            </Badge>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPreviewOpen(true)}
              className='gap-1.5'
            >
              <Eye className='size-4 text-primary' />
              实时预览
            </Button>
          </div>
        </div>

        {/* Step Tabs */}
        <div className='mt-6 flex items-center justify-between gap-2 overflow-x-auto pb-1 text-sm'>
          {[
            { num: 1, label: '1. 基本信息', done: hasName && hasValidSlug && hasCategory && hasTagline },
            { num: 2, label: '2. 视觉图片', done: hasIcon && (hasCover || screenshots.length > 0) },
            { num: 3, label: '3. 安装包发布', done: hasPackages },
            { num: 4, label: '4. 展示与发布', done: requiredPassed },
          ].map((s) => (
            <button
              key={s.num}
              type='button'
              onClick={() => setCurrentStep(s.num)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 px-3 transition-all min-w-[140px]',
                currentStep === s.num
                  ? 'border-primary/60 bg-primary/10 text-primary font-medium shadow-sm'
                  : 'border-border/40 bg-card/20 text-muted-foreground hover:bg-card/40 hover:text-foreground'
              )}
            >
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full text-xs font-semibold',
                  currentStep === s.num
                    ? 'bg-primary text-primary-foreground'
                    : s.done
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {s.done ? <Check className='size-3' /> : s.num}
              </span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className='mx-auto w-full max-w-6xl p-6'>
        {/* STEP 1: Basic Information */}
        {currentStep === 1 && (
          <div className='space-y-6 animate-in fade-in-50 duration-200'>
            <div className='rounded-xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm space-y-6'>
              <div>
                <h3 className='text-base font-semibold text-foreground'>软件核心标识</h3>
                <p className='text-xs text-muted-foreground mt-0.5'>
                  名称与唯一标识（Slug），系统将基于 Slug 生成详情页与下载专属路由。
                </p>
              </div>

              <div className='grid gap-6 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='sw-name' className='flex items-center gap-1.5'>
                    软件名称 <span className='text-red-400'>*</span>
                  </Label>
                  <Input
                    id='sw-name'
                    placeholder='例如：天才猫桌面 2.0、DY运营助手...'
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className='bg-background/80'
                  />
                </div>

                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label htmlFor='sw-slug' className='flex items-center gap-1.5'>
                      软件标识 (Slug) <span className='text-red-400'>*</span>
                    </Label>
                    {isSlugDuplicate && (
                      <span className='text-xs text-red-400 flex items-center gap-1'>
                        <AlertCircle className='size-3' /> 已被占用
                      </span>
                    )}
                  </div>
                  <Input
                    id='sw-slug'
                    placeholder='例如：desktop, live-tool...'
                    value={slug}
                    onChange={(e) => {
                      setIsSlugManuallyEdited(true)
                      setSlug(e.target.value)
                    }}
                    className={cn('bg-background/80', isSlugDuplicate && 'border-red-500 focus-visible:ring-red-500')}
                  />
                  <p className='text-[11px] text-muted-foreground'>
                    公开详情页：<code>/software.html?slug={slug || '<slug>'}</code>
                  </p>
                </div>
              </div>

              <div className='grid gap-6 md:grid-cols-2'>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label className='flex items-center gap-1.5'>
                      所属分类 <span className='text-red-400'>*</span>
                    </Label>
                    <button
                      type='button'
                      onClick={() => setCategoryModalOpen(true)}
                      className='text-xs text-primary hover:underline flex items-center gap-1'
                    >
                      <Plus className='size-3' /> 新建分类
                    </button>
                  </div>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className='w-full h-9 rounded-md border border-input bg-background/80 px-3 py-1 text-sm shadow-sm'
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.slug || cat.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label htmlFor='sw-tagline' className='flex items-center gap-1.5'>
                      一句话介绍 (Tagline) <span className='text-red-400'>*</span>
                    </Label>
                    <span
                      className={cn(
                        'text-xs',
                        tagline.length > 40 ? 'text-red-400 font-semibold' : 'text-muted-foreground'
                      )}
                    >
                      {tagline.length}/40 字
                    </span>
                  </div>
                  <Input
                    id='sw-tagline'
                    placeholder='简明扼要概括最强卖点，用于列表卡片和轮播...'
                    value={tagline}
                    maxLength={50}
                    onChange={(e) => setTagline(e.target.value)}
                    className={cn('bg-background/80', tagline.length > 40 && 'border-red-500')}
                  />
                </div>
              </div>

              {/* Description Markdown */}
              <div className='space-y-2 pt-2 border-t border-border/40'>
                <div className='flex items-center justify-between'>
                  <Label className='flex items-center gap-1.5'>
                    软件详细介绍 (Markdown 支持)
                  </Label>
                  <div className='flex items-center rounded-md border border-border/60 bg-muted/40 p-0.5 text-xs'>
                    <button
                      type='button'
                      onClick={() => setDescTab('write')}
                      className={cn(
                        'px-2.5 py-1 rounded transition-colors',
                        descTab === 'write' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                      )}
                    >
                      编辑
                    </button>
                    <button
                      type='button'
                      onClick={() => setDescTab('preview')}
                      className={cn(
                        'px-2.5 py-1 rounded transition-colors',
                        descTab === 'preview' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                      )}
                    >
                      实时预览
                    </button>
                  </div>
                </div>

                {descTab === 'write' ? (
                  <Textarea
                    placeholder='支持详细功能说明、使用指南、快捷键及安全声明（支持 Markdown 语法）...'
                    value={description}
                    rows={7}
                    onChange={(e) => setDescription(e.target.value)}
                    className='bg-background/80 font-mono text-xs'
                  />
                ) : (
                  <div className='min-h-[160px] rounded-md border border-input bg-background/50 p-4 text-xs prose prose-invert max-w-none'>
                    {description ? (
                      <div className='whitespace-pre-line text-foreground/90'>{description}</div>
                    ) : (
                      <span className='text-muted-foreground italic'>暂无内容</span>
                    )}
                  </div>
                )}
                <p className='text-[11px] text-muted-foreground'>
                  当前字数：{description.length} 字（建议 ≥50 字以获得最佳详情页呈现）
                </p>
              </div>

              {/* Highlights */}
              <div className='space-y-3 pt-2 border-t border-border/40'>
                <div className='flex items-center justify-between'>
                  <div>
                    <Label className='text-sm font-medium'>核心特性亮点 (Highlights)</Label>
                    <p className='text-xs text-muted-foreground'>
                      展示于软件详情页醒目网格区域（建议 3-4 条）。
                    </p>
                  </div>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setHighlights([...highlights, { title: '', text: '' }])}
                    className='gap-1 text-xs'
                  >
                    <Plus className='size-3.5' /> 添加亮点
                  </Button>
                </div>

                <div className='space-y-2.5'>
                  {highlights.map((hl, idx) => (
                    <div
                      key={idx}
                      className='flex items-start gap-2 rounded-lg border border-border/60 bg-background/60 p-3'
                    >
                      <span className='mt-2 text-xs font-semibold text-muted-foreground size-5 flex items-center justify-center rounded-full bg-muted/60'>
                        {idx + 1}
                      </span>
                      <div className='flex-1 grid gap-2 md:grid-cols-3'>
                        <Input
                          placeholder='亮点标题（如：离线高精OCR）'
                          value={hl.title}
                          onChange={(e) => {
                            const next = [...highlights]
                            next[idx].title = e.target.value
                            setHighlights(next)
                          }}
                          className='h-8 text-xs bg-background/90'
                        />
                        <Input
                          placeholder='亮点说明（如：毫秒级响应，无需网络连接）'
                          value={hl.text}
                          onChange={(e) => {
                            const next = [...highlights]
                            next[idx].text = e.target.value
                            setHighlights(next)
                          }}
                          className='h-8 text-xs bg-background/90 md:col-span-2'
                        />
                      </div>
                      <div className='flex items-center gap-1'>
                        {idx > 0 && (
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            className='size-7 p-0'
                            onClick={() => {
                              const next = [...highlights]
                              const temp = next[idx]
                              next[idx] = next[idx - 1]
                              next[idx - 1] = temp
                              setHighlights(next)
                            }}
                          >
                            <MoveUp className='size-3.5' />
                          </Button>
                        )}
                        {idx < highlights.length - 1 && (
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            className='size-7 p-0'
                            onClick={() => {
                              const next = [...highlights]
                              const temp = next[idx]
                              next[idx] = next[idx + 1]
                              next[idx + 1] = temp
                              setHighlights(next)
                            }}
                          >
                            <MoveDown className='size-3.5' />
                          </Button>
                        )}
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='size-7 p-0 text-red-400 hover:text-red-300'
                          onClick={() => setHighlights(highlights.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className='size-3.5' />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirements & Dev Info */}
              <div className='grid gap-4 md:grid-cols-4 pt-2 border-t border-border/40'>
                <div className='space-y-1.5 md:col-span-2'>
                  <Label htmlFor='sw-req' className='text-xs'>系统要求</Label>
                  <Input
                    id='sw-req'
                    placeholder='例如：Windows 10 / 11 64位, macOS 12+'
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    className='h-8 text-xs bg-background/80'
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='sw-dev' className='text-xs'>开发者 / 团队</Label>
                  <Input
                    id='sw-dev'
                    placeholder='例如：天才猫'
                    value={developer}
                    onChange={(e) => setDeveloper(e.target.value)}
                    className='h-8 text-xs bg-background/80'
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='sw-price' className='text-xs'>价格标签</Label>
                  <Input
                    id='sw-price'
                    placeholder='例如：免费、付费授权'
                    value={priceLabel}
                    onChange={(e) => setPriceLabel(e.target.value)}
                    className='h-8 text-xs bg-background/80'
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Media & Images */}
        {currentStep === 2 && (
          <div className='space-y-6 animate-in fade-in-50 duration-200'>
            {/* Icon & Cover */}
            <div className='grid gap-6 md:grid-cols-2'>
              {/* Icon Box */}
              <div className='rounded-xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='text-sm font-semibold flex items-center gap-1.5'>
                      软件图标 <span className='text-red-400'>*</span>
                    </h3>
                    <p className='text-xs text-muted-foreground mt-0.5'>
                      推荐 256×256 像素方形 PNG / SVG 图标
                    </p>
                  </div>
                  {iconUrl && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => setIconUrl('')}
                      className='text-xs text-red-400 hover:text-red-300'
                    >
                      清空
                    </Button>
                  )}
                </div>

                <div className='flex items-center gap-4'>
                  <div className='relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border/80 bg-background/80 shadow-md flex items-center justify-center'>
                    {iconUrl ? (
                      <img src={iconUrl} alt='icon' className='size-full object-cover' />
                    ) : (
                      <ImageIcon className='size-8 text-muted-foreground/40' />
                    )}
                    {isUploadingIcon && (
                      <div className='absolute inset-0 bg-background/70 backdrop-blur-xs flex items-center justify-center'>
                        <Loader2 className='size-6 animate-spin text-primary' />
                      </div>
                    )}
                  </div>

                  <div className='flex-1 space-y-2'>
                    <input
                      ref={iconInputRef}
                      type='file'
                      accept='image/*'
                      className='hidden'
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleIconUpload(file)
                      }}
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      disabled={isUploadingIcon}
                      onClick={() => iconInputRef.current?.click()}
                      className='gap-1.5 w-full'
                    >
                      <Upload className='size-3.5' />
                      {iconUrl ? '重新上传图标' : '上传图标文件'}
                    </Button>
                    <Input
                      placeholder='或粘贴图标 URL...'
                      value={iconUrl}
                      onChange={(e) => setIconUrl(e.target.value)}
                      className='h-8 text-xs bg-background/80'
                    />
                  </div>
                </div>
              </div>

              {/* Cover Box */}
              <div className='rounded-xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='text-sm font-semibold'>封面大图 (16:9 比例)</h3>
                    <p className='text-xs text-muted-foreground mt-0.5'>
                      用于软件中心首屏轮播与主推卡片背景
                    </p>
                  </div>
                  {coverUrl && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => setCoverUrl('')}
                      className='text-xs text-red-400 hover:text-red-300'
                    >
                      清空
                    </Button>
                  )}
                </div>

                <div className='space-y-3'>
                  <div className='relative w-full aspect-video overflow-hidden rounded-xl border border-border/80 bg-background/80 shadow-md flex items-center justify-center'>
                    {coverUrl ? (
                      <img src={coverUrl} alt='cover' className='size-full object-cover' />
                    ) : (
                      <div className='flex flex-col items-center gap-1 text-muted-foreground/40'>
                        <ImageIcon className='size-8' />
                        <span className='text-xs'>16:9 比例预览</span>
                      </div>
                    )}
                    {isUploadingCover && (
                      <div className='absolute inset-0 bg-background/70 backdrop-blur-xs flex items-center justify-center'>
                        <Loader2 className='size-6 animate-spin text-primary' />
                      </div>
                    )}
                  </div>

                  <div className='flex items-center gap-2'>
                    <input
                      ref={coverInputRef}
                      type='file'
                      accept='image/*'
                      className='hidden'
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleCoverUpload(file)
                      }}
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      disabled={isUploadingCover}
                      onClick={() => coverInputRef.current?.click()}
                      className='gap-1.5 shrink-0'
                    >
                      <Upload className='size-3.5' /> 上传封面
                    </Button>
                    <Input
                      placeholder='或粘贴封面 URL...'
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      className='h-8 text-xs bg-background/80 flex-1'
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Screenshots Gallery Box */}
            <div className='rounded-xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm space-y-4'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <div>
                  <h3 className='text-base font-semibold text-foreground'>
                    软件运行截图画廊 ({screenshots.length}/12)
                  </h3>
                  <p className='text-xs text-muted-foreground mt-0.5'>
                    前台详情页横向无缝灯箱画廊展示，可拖入多张图片批量上传与自由排序。建议至少 3 张。
                  </p>
                </div>
                <div>
                  <input
                    ref={screenshotInputRef}
                    type='file'
                    accept='image/*'
                    multiple
                    className='hidden'
                    onChange={(e) => {
                      if (e.target.files?.length) handleScreenshotsUpload(e.target.files)
                    }}
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={isUploadingScreenshots || screenshots.length >= 12}
                    onClick={() => screenshotInputRef.current?.click()}
                    className='gap-1.5'
                  >
                    {isUploadingScreenshots ? (
                      <Loader2 className='size-3.5 animate-spin' />
                    ) : (
                      <Upload className='size-3.5' />
                    )}
                    批量上传截图
                  </Button>
                </div>
              </div>

              {/* Drag drop zone for screenshots */}
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (e.dataTransfer.files?.length) {
                    handleScreenshotsUpload(e.dataTransfer.files)
                  }
                }}
                className='border-2 border-dashed border-border/60 rounded-xl p-4 text-center hover:border-primary/50 transition-colors bg-background/20'
              >
                {screenshots.length === 0 ? (
                  <div className='py-6 flex flex-col items-center justify-center gap-2 text-muted-foreground'>
                    <ImageIcon className='size-8 text-muted-foreground/40' />
                    <p className='text-xs'>拖拽图片到此处，或点击右上角批量上传截图</p>
                  </div>
                ) : (
                  <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
                    {screenshots.map((url, idx) => (
                      <div
                        key={idx}
                        className='group relative aspect-video rounded-lg overflow-hidden border border-border/60 bg-background/80 shadow-sm'
                      >
                        <img src={url} alt={`shot-${idx}`} className='size-full object-cover' />
                        <div className='absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 backdrop-blur-xs'>
                          {idx > 0 && (
                            <Button
                              type='button'
                              variant='secondary'
                              size='sm'
                              className='size-7 p-0'
                              title='前移'
                              onClick={() => {
                                const next = [...screenshots]
                                const temp = next[idx]
                                next[idx] = next[idx - 1]
                                next[idx - 1] = temp
                                setScreenshots(next)
                              }}
                            >
                              <MoveUp className='size-3.5 -rotate-90' />
                            </Button>
                          )}
                          {idx < screenshots.length - 1 && (
                            <Button
                              type='button'
                              variant='secondary'
                              size='sm'
                              className='size-7 p-0'
                              title='后移'
                              onClick={() => {
                                const next = [...screenshots]
                                const temp = next[idx]
                                next[idx] = next[idx + 1]
                                next[idx + 1] = temp
                                setScreenshots(next)
                              }}
                            >
                              <MoveDown className='size-3.5 -rotate-90' />
                            </Button>
                          )}
                          <Button
                            type='button'
                            variant='destructive'
                            size='sm'
                            className='size-7 p-0'
                            title='删除'
                            onClick={() => setScreenshots(screenshots.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className='size-3.5' />
                          </Button>
                        </div>
                        <span className='absolute bottom-1 left-1.5 px-1.5 py-0.5 rounded text-[10px] bg-background/80 font-mono text-muted-foreground'>
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Packages & Releases */}
        {currentStep === 3 && (
          <div className='space-y-6 animate-in fade-in-50 duration-200'>
            <div className='rounded-xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm space-y-6'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <div>
                  <h3 className='text-base font-semibold text-foreground flex items-center gap-1.5'>
                    发布安装包 <span className='text-red-400'>*</span>
                  </h3>
                  <p className='text-xs text-muted-foreground mt-0.5'>
                    支持拖入多个平台的安装包（Windows / macOS / 便携绿色版 / Linux），系统支持 8 路分片断点续传。
                  </p>
                </div>
              </div>

              {/* Version & Changelog inputs */}
              <div className='grid gap-6 md:grid-cols-3'>
                <div className='space-y-2'>
                  <Label htmlFor='rel-version' className='text-xs'>
                    发布版本号 <span className='text-red-400'>*</span>
                  </Label>
                  <Input
                    id='rel-version'
                    placeholder='例如：2.1.0'
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className='bg-background/80'
                  />
                </div>

                <div className='space-y-2 md:col-span-2'>
                  <Label htmlFor='rel-changelog' className='text-xs'>
                    更新说明 (Changelog)
                  </Label>
                  <Textarea
                    id='rel-changelog'
                    placeholder='每行一条，例如：&#10;1. 优化内存占用&#10;2. 支持多平台同步'
                    rows={2}
                    value={changelog}
                    onChange={(e) => setChangelog(e.target.value)}
                    className='bg-background/80 text-xs font-mono'
                  />
                </div>
              </div>

              {/* Dropzone for package files */}
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (e.dataTransfer.files?.length) {
                    handleAddPackages(e.dataTransfer.files)
                  }
                }}
                className='border-2 border-dashed border-border/60 rounded-xl p-6 text-center hover:border-primary/50 transition-colors bg-background/20'
              >
                <input
                  ref={packageInputRef}
                  type='file'
                  multiple
                  className='hidden'
                  onChange={(e) => {
                    if (e.target.files?.length) handleAddPackages(e.target.files)
                  }}
                />
                <div className='flex flex-col items-center justify-center gap-2'>
                  <Package className='size-10 text-primary/60' />
                  <p className='text-sm font-medium'>拖入安装包文件到此处</p>
                  <p className='text-xs text-muted-foreground'>
                    支持 .zip, .exe, .msi, .dmg, .pkg, .appimage, .deb, .7z 等格式
                  </p>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => packageInputRef.current?.click()}
                    className='mt-2 gap-1.5'
                  >
                    <Plus className='size-3.5' /> 选择安装包文件
                  </Button>
                </div>
              </div>

              {/* Pending packages list */}
              {pendingPackages.length > 0 && (
                <div className='space-y-3'>
                  <Label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                    待上传安装包队列 ({pendingPackages.length})
                  </Label>
                  <div className='space-y-2'>
                    {pendingPackages.map((pkg, idx) => (
                      <div
                        key={pkg.id}
                        className='flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-background/80 p-3 text-xs'
                      >
                        <div className='size-7 rounded bg-muted/60 flex items-center justify-center font-bold text-muted-foreground'>
                          {idx + 1}
                        </div>
                        <div className='min-w-[180px] flex-1'>
                          <p className='font-semibold text-foreground truncate max-w-xs' title={pkg.file.name}>
                            {pkg.file.name}
                          </p>
                          <p className='text-muted-foreground'>{formatBytes(pkg.file.size)}</p>
                        </div>

                        {/* Platform select */}
                        <div className='w-40'>
                          <select
                            value={pkg.platform}
                            onChange={(e) => {
                              const next = [...pendingPackages]
                              next[idx].platform = e.target.value
                              setPendingPackages(next)
                            }}
                            className='h-8 w-full rounded border border-input bg-card px-2 py-0 text-xs'
                          >
                            {PLATFORM_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Label input */}
                        <div className='w-36'>
                          <Input
                            placeholder='包标签（如：绿色版）'
                            value={pkg.label}
                            onChange={(e) => {
                              const next = [...pendingPackages]
                              next[idx].label = e.target.value
                              setPendingPackages(next)
                            }}
                            className='h-8 text-xs bg-card'
                          />
                        </div>

                        {/* Arch input */}
                        <div className='w-24'>
                          <Input
                            placeholder='架构 (x64)'
                            value={pkg.arch}
                            onChange={(e) => {
                              const next = [...pendingPackages]
                              next[idx].arch = e.target.value
                              setPendingPackages(next)
                            }}
                            className='h-8 text-xs bg-card'
                          />
                        </div>

                        {/* Status */}
                        <div>
                          {pkg.status === 'uploading' && (
                            <Badge variant='outline' className='text-amber-400 border-amber-500/40 bg-amber-500/10 gap-1'>
                              <Loader2 className='size-3 animate-spin' /> 上传中
                            </Badge>
                          )}
                          {pkg.status === 'done' && (
                            <Badge variant='outline' className='text-emerald-400 border-emerald-500/40 bg-emerald-500/10 gap-1'>
                              <CheckCircle2 className='size-3' /> 已完成
                            </Badge>
                          )}
                          {pkg.status === 'error' && (
                            <Badge variant='outline' className='text-red-400 border-red-500/40 bg-red-500/10 gap-1'>
                              <AlertCircle className='size-3' /> 失败
                            </Badge>
                          )}
                          {pkg.status === 'pending' && (
                            <Badge variant='secondary' className='text-muted-foreground'>
                              等待发布
                            </Badge>
                          )}
                        </div>

                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='size-7 p-0 text-red-400 hover:text-red-300'
                          onClick={() => setPendingPackages(pendingPackages.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className='size-3.5' />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing releases table if editing */}
              {existingReleases.length > 0 && (
                <div className='space-y-3 pt-4 border-t border-border/40'>
                  <Label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                    已有已发布的安装包 ({existingReleases.length})
                  </Label>
                  <div className='rounded-lg border border-border/60 bg-background/40 overflow-hidden'>
                    <table className='w-full text-left text-xs'>
                      <thead className='border-b border-border/40 bg-muted/20 text-muted-foreground'>
                        <tr>
                          <th className='p-2.5'>版本</th>
                          <th className='p-2.5'>平台 & 标签</th>
                          <th className='p-2.5'>文件名 & 大小</th>
                          <th className='p-2.5'>下载量</th>
                          <th className='p-2.5'>最新</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-border/20'>
                        {existingReleases.map((r) => (
                          <tr key={r.id}>
                            <td className='p-2.5 font-semibold text-foreground'>{r.version}</td>
                            <td className='p-2.5'>
                              <Badge variant='outline' className='text-[10px]'>
                                {r.platform || 'windows'} · {r.label || r.fileName}
                              </Badge>
                            </td>
                            <td className='p-2.5 text-muted-foreground'>
                              {r.fileName} ({r.size || formatBytes(r.fileSize)})
                            </td>
                            <td className='p-2.5'>{r.downloadCount || 0}</td>
                            <td className='p-2.5'>
                              {r.isLatest ? (
                                <Badge className='bg-primary/20 text-primary border-primary/40 text-[10px]'>
                                  最新版
                                </Badge>
                              ) : (
                                <span className='text-muted-foreground'>-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Display & Publish */}
        {currentStep === 4 && (
          <div className='grid gap-6 md:grid-cols-3 animate-in fade-in-50 duration-200'>
            <div className='md:col-span-2 space-y-6'>
              <div className='rounded-xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm space-y-6'>
                <div>
                  <h3 className='text-base font-semibold text-foreground'>展示规则与落地页</h3>
                  <p className='text-xs text-muted-foreground mt-0.5'>
                    设置主推属性、是否展示在首页轮播，以及是否指向专属落地页。
                  </p>
                </div>

                <div className='flex items-center justify-between rounded-lg border border-border/60 bg-background/60 p-4'>
                  <div className='space-y-0.5'>
                    <Label className='text-sm font-medium'>设为主推软件 (Featured)</Label>
                    <p className='text-xs text-muted-foreground'>
                      开启后将展示在软件下载中心首屏大轮播图与首页主推区域。
                    </p>
                  </div>
                  <Switch checked={featured} onCheckedChange={setFeatured} />
                </div>

                {featured && (
                  <div className='space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-4'>
                    <Label htmlFor='sw-order' className='text-xs font-semibold text-primary'>
                      主推排序权重 (Featured Order)
                    </Label>
                    <Input
                      id='sw-order'
                      type='number'
                      value={featuredOrder}
                      onChange={(e) => setFeaturedOrder(Number(e.target.value) || 0)}
                      className='h-8 text-xs bg-background/90 max-w-xs'
                    />
                    <p className='text-[11px] text-muted-foreground'>
                      数字越小排序越靠前（例如 1、2、3），轮播图前 5 个有效。
                    </p>
                  </div>
                )}

                <div className='space-y-2'>
                  <Label htmlFor='sw-landing' className='text-xs font-medium'>
                    专属落地页 (Landing URL)
                  </Label>
                  <div className='flex items-center gap-2'>
                    <select
                      value={landingUrl}
                      onChange={(e) => setLandingUrl(e.target.value)}
                      className='h-9 rounded-md border border-input bg-background/80 px-3 py-1 text-xs shadow-sm flex-1'
                    >
                      <option value=''>默认详情页 (/software.html?slug={slug || '...'})</option>
                      {(landingData?.pages || []).map((page) => (
                        <option key={page.id} value={page.path}>
                          {page.title} ({page.path})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className='text-[11px] text-muted-foreground'>
                    如选择专属落地页（如 <code>/desktop.html</code>），前台用户点击【了解详情】将直接跳转至该页面。
                  </p>
                </div>

                <div className='space-y-2 pt-2 border-t border-border/40'>
                  <Label className='text-xs font-medium'>发布状态</Label>
                  <div className='grid grid-cols-2 gap-3'>
                    <button
                      type='button'
                      onClick={() => setStatus('active')}
                      className={cn(
                        'flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all',
                        status === 'active'
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-foreground'
                          : 'border-border/40 bg-background/40 text-muted-foreground hover:bg-background/60'
                      )}
                    >
                      <span className='font-semibold text-xs flex items-center gap-1.5 text-emerald-400'>
                        <CheckCircle2 className='size-3.5' /> 正式上架 (Active)
                      </span>
                      <span className='text-[11px] text-muted-foreground'>
                        前台软件中心与下载直接可见
                      </span>
                    </button>

                    <button
                      type='button'
                      onClick={() => setStatus('draft')}
                      className={cn(
                        'flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all',
                        status === 'draft'
                          ? 'border-amber-500/60 bg-amber-500/10 text-foreground'
                          : 'border-border/40 bg-background/40 text-muted-foreground hover:bg-background/60'
                      )}
                    >
                      <span className='font-semibold text-xs flex items-center gap-1.5 text-amber-400'>
                        <Circle className='size-3.5' /> 保存为草稿 (Draft)
                      </span>
                      <span className='text-[11px] text-muted-foreground'>
                        仅后台可见，前台不可见
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Checklist Card */}
            <div className='space-y-6'>
              <div className='rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm space-y-4'>
                <div className='flex items-center justify-between border-b border-border/40 pb-3'>
                  <h4 className='text-sm font-semibold flex items-center gap-1.5'>
                    <Sparkles className='size-4 text-primary' /> 发布前检查清单
                  </h4>
                  <Badge
                    variant='outline'
                    className={cn(
                      'text-xs',
                      requiredPassed ? 'border-emerald-500/40 text-emerald-400' : 'border-amber-500/40 text-amber-400'
                    )}
                  >
                    {requiredPassed ? '就绪可发布' : '缺少必填项'}
                  </Badge>
                </div>

                {/* Required checklist */}
                <div className='space-y-2'>
                  <p className='text-xs font-semibold uppercase text-muted-foreground'>必填项</p>
                  <ul className='space-y-1.5 text-xs'>
                    {[
                      { label: '软件名称已填写', ok: hasName },
                      { label: 'Slug 标识有效且唯一', ok: hasValidSlug },
                      { label: '已选择所属分类', ok: hasCategory },
                      { label: '一句话介绍 ≤40 字', ok: hasTagline },
                      { label: '软件图标已上传', ok: hasIcon },
                      { label: '安装包已准备 (≥1个)', ok: hasPackages },
                    ].map((item, i) => (
                      <li key={i} className='flex items-center gap-2'>
                        {item.ok ? (
                          <CheckCircle2 className='size-3.5 text-emerald-400 shrink-0' />
                        ) : (
                          <Circle className='size-3.5 text-muted-foreground shrink-0' />
                        )}
                        <span className={item.ok ? 'text-foreground' : 'text-muted-foreground'}>
                          {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended checklist */}
                <div className='space-y-2 pt-2 border-t border-border/30'>
                  <p className='text-xs font-semibold uppercase text-muted-foreground'>优化建议</p>
                  <ul className='space-y-1.5 text-xs'>
                    {[
                      { label: '封面大图已上传 (用于主推轮播)', ok: hasCover },
                      { label: '运行截图丰富 (≥3 张)', ok: hasThreeScreenshots },
                      { label: '详细简介充实 (≥50 字)', ok: hasDescriptionRich },
                      { label: '特性亮点明确 (≥3 条)', ok: hasThreeHighlights },
                    ].map((item, i) => (
                      <li key={i} className='flex items-center gap-2'>
                        {item.ok ? (
                          <CheckCircle2 className='size-3.5 text-emerald-400/80 shrink-0' />
                        ) : (
                          <Circle className='size-3.5 text-muted-foreground/60 shrink-0' />
                        )}
                        <span className={item.ok ? 'text-foreground/90' : 'text-muted-foreground/80'}>
                          {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {!requiredPassed && (
                  <div className='rounded-lg bg-amber-500/10 border border-amber-500/30 p-2.5 text-[11px] text-amber-300 flex items-start gap-1.5'>
                    <AlertCircle className='size-3.5 shrink-0 mt-0.5' />
                    <span>尚缺：{missingRequiredList.join('、')}。全部完成后可正式上架。</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Fixed Action Bar */}
      <div className='fixed bottom-0 left-0 right-0 z-30 border-t border-border/80 bg-background/80 px-6 py-3 backdrop-blur-md shadow-lg md:left-64'>
        <div className='mx-auto flex max-w-6xl items-center justify-between gap-4'>
          <div className='flex items-center gap-2'>
            {currentStep > 1 && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setCurrentStep((prev) => prev - 1)}
              >
                上一步
              </Button>
            )}
            {currentStep < 4 && (
              <Button
                type='button'
                variant='default'
                size='sm'
                onClick={() => setCurrentStep((prev) => prev + 1)}
              >
                下一步
              </Button>
            )}
          </div>

          <div className='flex items-center gap-2.5'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={isSavingDraft || isPublishing}
              onClick={() => performSave('draft')}
              className='gap-1.5'
            >
              {isSavingDraft ? <Loader2 className='size-3.5 animate-spin' /> : null}
              保存为草稿
            </Button>

            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setPreviewOpen(true)}
              className='gap-1.5'
            >
              <Eye className='size-3.5 text-primary' />
              预览
            </Button>

            <Button
              type='button'
              size='sm'
              disabled={!requiredPassed || isPublishing || isSavingDraft}
              onClick={() => performSave('active')}
              className='gap-1.5 bg-primary text-primary-foreground font-semibold shadow-sm'
            >
              {isPublishing ? <Loader2 className='size-3.5 animate-spin' /> : <CheckCircle2 className='size-3.5' />}
              上架发布
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Dialog Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className='max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden bg-background'>
          <DialogHeader className='px-4 py-3 border-b border-border/60 flex flex-row items-center justify-between'>
            <div className='flex items-center gap-3'>
              <DialogTitle className='text-sm font-semibold'>详情页草稿实时预览</DialogTitle>
              <Badge variant='outline' className='text-xs text-primary border-primary/40'>
                {currentSoftwarePayload.name}
              </Badge>
            </div>
            <div className='flex items-center gap-2'>
              <div className='flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5 text-xs'>
                <button
                  type='button'
                  onClick={() => setPreviewDevice('desktop')}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded transition-colors',
                    previewDevice === 'desktop' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
                  )}
                >
                  <Laptop className='size-3.5' /> 桌面端
                </button>
                <button
                  type='button'
                  onClick={() => setPreviewDevice('mobile')}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded transition-colors',
                    previewDevice === 'mobile' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
                  )}
                >
                  <Smartphone className='size-3.5' /> 移动端 (390px)
                </button>
              </div>
            </div>
          </DialogHeader>

          <div className='flex-1 bg-muted/20 flex items-center justify-center p-2 overflow-hidden'>
            <iframe
              ref={iframeRef}
              src='/software.html?preview=1'
              onLoad={handleIframeLoad}
              title='Software Preview'
              className={cn(
                'h-full border border-border/60 rounded-lg shadow-xl transition-all duration-300 bg-[#07090e]',
                previewDevice === 'desktop' ? 'w-full' : 'w-[390px]'
              )}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* New Category Dialog */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>新建软件分类</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div className='space-y-2'>
              <Label htmlFor='new-cat-name'>分类名称</Label>
              <Input
                id='new-cat-name'
                placeholder='例如：AI智能工具、开发插件...'
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCategoryModalOpen(false)}>
              取消
            </Button>
            <Button disabled={isCreatingCat || !newCatName.trim()} onClick={handleCreateCategory}>
              {isCreatingCat ? <Loader2 className='size-3.5 animate-spin mr-1' /> : null}
              确定创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
