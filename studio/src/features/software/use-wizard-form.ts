import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
// @ts-ignore
import { uploadReleaseFile, uploadAssetFile, formatBytes } from '@r2'
import type { Software, Category, Release } from '@/lib/queries'
import type { HighlightItem } from './wizard-step-basic'
import type { PendingPackage } from './wizard-step-packages'
import { parsePackageFileName } from './package-utils'

export function useWizardForm(
  existingSoftware: Software | null | undefined,
  categories: Category[],
  softwareList: Software[],
  setCurrentStep: (step: number) => void
) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Step 1: Basic info
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
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

  // Save states
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [isCreatingCat, setIsCreatingCat] = useState(false)

  // Load existing data
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

  function handleAddPackages(files: FileList | File[]) {
    const list = Array.from(files)
    if (list.length === 0) return

    let detectedVer: string | null = null

    const items: PendingPackage[] = list.map((f) => {
      const parsed = parsePackageFileName(f.name)
      if (!detectedVer && parsed.version) {
        detectedVer = parsed.version
      }
      return {
        id: Math.random().toString(36).substring(2, 9),
        file: f,
        platform: parsed.platform,
        label: parsed.label,
        arch: parsed.arch,
        status: 'pending',
      }
    })

    setPendingPackages((prev) => [...prev, ...items])

    if (detectedVer) {
      if (!version || version === '1.0.0' || version.trim() === '') {
        setVersion(detectedVer)
        toast.info(`检测到文件名包含版本号 v${detectedVer}，已自动同步发布版本号`)
      } else if (version !== detectedVer) {
        toast.warning(
          `检测到文件名包含版本号 v${detectedVer}，与当前输入的 v${version} 不一致，已为您保留当前输入。如需更新请在版本号输入框修改。`,
          { duration: 6000 }
        )
      }
    }
  }

  const isSlugDuplicate = softwareList.some(
    (s) => s.slug === slug.trim() && s.id !== existingSoftware?.id && s.slug !== existingSoftware?.slug
  )
  const hasName = Boolean(name.trim())
  const hasValidSlug = Boolean(slug.trim()) && !isSlugDuplicate
  const hasCategory = Boolean(categoryId)
  const hasTagline = Boolean(tagline.trim()) && tagline.trim().length <= 40
  const hasIcon = Boolean(iconUrl.trim())
  const hasPackages = pendingPackages.length > 0 || existingReleases.length > 0

  // 基础档案和应用图标具备即可保存与上架，安装包支持首发即附带或上架后随时通过快捷发布补充
  const requiredPassed = hasName && hasValidSlug && hasCategory && hasIcon

  const missingRequiredList: string[] = []
  if (!hasName) missingRequiredList.push('软件名称')
  if (!hasValidSlug) missingRequiredList.push(isSlugDuplicate ? 'Slug 唯一性' : 'Slug 标识')
  if (!hasCategory) missingRequiredList.push('所属分类')
  if (!hasIcon) missingRequiredList.push('软件图标')

  async function performSave(targetStatus: 'active' | 'draft') {
    if (!name.trim()) {
      toast.error('请填写【软件名称】')
      setCurrentStep(1)
      return
    }
    if (!slug.trim()) {
      toast.error('请填写【Slug 标识】')
      setCurrentStep(1)
      return
    }
    if (isSlugDuplicate) {
      toast.error(`软件标识 ${slug.trim()} 已被其它软件占用，请更改`)
      setCurrentStep(1)
      return
    }
    if (targetStatus === 'active' && !iconUrl.trim()) {
      toast.error('请在【媒体素材】中上传【应用图标】')
      setCurrentStep(2)
      return
    }

    const isDraft = targetStatus === 'draft'
    if (isDraft) setIsSavingDraft(true)
    else setIsPublishing(true)

    try {
      const swId = existingSoftware?.id || slug.trim()
      const payload = {
        id: swId,
        slug: slug.trim(),
        name: name.trim(),
        categoryId: categoryId || categories[0]?.id || 'tools',
        tagline: tagline.trim() || `${name.trim()} 官方下载`,
        description: description.trim(),
        requirements: requirements.trim(),
        developer: developer.trim(),
        website: website.trim(),
        priceLabel: priceLabel.trim() || '免费',
        iconUrl: iconUrl.trim(),
        coverUrl: coverUrl.trim(),
        screenshots,
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

      // Upload pending packages serially (Rule 4: for ... await)
      if (pendingPackages.length > 0) {
        const swActualId = swRes.catalog?.software?.find((s: any) => s.slug === slug.trim())?.id || swId
        for (let i = 0; i < pendingPackages.length; i++) {
          const pkg = pendingPackages[i]
          setPendingPackages((prev) =>
            prev.map((item, idx) => (idx === i ? { ...item, status: 'uploading' } : item))
          )

          const isLatestPkg = i === 0 && existingReleases.length === 0
          const uploadRes = await uploadReleaseFile(pkg.file, {
            softwareId: swActualId,
            version: version.trim() || '1.0.0',
            changelog: changelog.trim(),
            isLatest: isLatestPkg,
            platform: pkg.platform,
          })

          if (uploadRes.success) {
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

      await api.post('/api/admin/software', {
        ...payload,
        status: targetStatus,
      })

      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      toast.success(
        isDraft
          ? '草稿已保存（前台不可见）'
          : pendingPackages.length > 0
          ? `软件与 ${pendingPackages.length} 个安装包已成功上架发布！`
          : '软件已成功上架发布！'
      )
      if (!isDraft && pendingPackages.length === 0 && existingReleases.length === 0) {
        toast.info('提示：当前尚未添加安装包，您可随时通过【快捷上传】补充安装包文件。', { duration: 6000 })
      }
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
      const res = await api.post('/api/admin/catalog', {
        action: 'addCategory',
        category: {
          id: newCatName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: newCatName.trim(),
          sortOrder: categories.length + 1,
        },
      })
      if (res.success) {
        toast.success(`分类「${newCatName}」创建成功`)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
        setNewCatName('')
        setCategoryModalOpen(false)
      } else {
        toast.error(res.msg || '创建分类失败')
      }
    } catch (e: any) {
      toast.error(`操作异常：${e.message}`)
    } finally {
      setIsCreatingCat(false)
    }
  }

  return {
    name, setName,
    slug, setSlug,
    isSlugManuallyEdited, setIsSlugManuallyEdited,
    categoryId, setCategoryId,
    tagline, setTagline,
    description, setDescription,
    requirements, setRequirements,
    developer, setDeveloper,
    website, setWebsite,
    priceLabel, setPriceLabel,
    highlights, setHighlights,
    iconUrl, setIconUrl,
    coverUrl, setCoverUrl,
    screenshots, setScreenshots,
    isUploadingIcon,
    isUploadingCover,
    isUploadingScreenshots,
    version, setVersion,
    changelog, setChangelog,
    pendingPackages, setPendingPackages,
    existingReleases,
    featured, setFeatured,
    featuredOrder, setFeaturedOrder,
    landingUrl, setLandingUrl,
    status, setStatus,
    isSavingDraft,
    isPublishing,
    categoryModalOpen, setCategoryModalOpen,
    newCatName, setNewCatName,
    isCreatingCat,
    isSlugDuplicate,
    requiredPassed,
    handleIconUpload,
    handleCoverUpload,
    handleScreenshotsUpload,
    handleAddPackages,
    performSave,
    handleCreateCategory,
  }
}
