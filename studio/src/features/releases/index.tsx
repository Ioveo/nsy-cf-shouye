import { useState, useRef } from 'react'
import {
  Boxes,
  Plus,
  Search,
  Upload,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  Eye,
  EyeOff,
  MoreHorizontal,
  FileCheck2,
  Loader2,
  HardDriveDownload,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Monitor,
  Apple,
  Terminal,
  FolderArchive,
  Smartphone,
  Layers,
  Copy,
  Sparkles,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCatalog, Release, Software } from '@/lib/queries'
import { api } from '@/lib/api'
// @ts-ignore
import { uploadReleaseFile, replaceReleaseFile, formatBytes } from '@r2'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const PLATFORMS = [
  { value: 'windows', label: 'Windows (exe/msi)' },
  { value: 'portable', label: 'Portable (绿色便携版/zip)' },
  { value: 'macos', label: 'macOS (dmg/pkg)' },
  { value: 'linux', label: 'Linux (AppImage/deb/rpm)' },
  { value: 'android', label: 'Android (apk)' },
  { value: 'other', label: 'Other (其它格式)' },
]

interface PendingUploadItem {
  id: string
  file: File
  platform: string
  label: string
  arch: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

export function ReleasesFeature() {
  const queryClient = useQueryClient()
  const { data: catalog, isLoading } = useCatalog()

  const [search, setSearch] = useState('')
  const [filterSoftware, setFilterSoftware] = useState<string>('all')
  const [filterPlatform, setFilterPlatform] = useState<string>('all')

  // Collapsed / Expanded state for software groups and version rows
  const [collapsedSoftwares, setCollapsedSoftwares] = useState<Record<string, boolean>>({})
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({})

  // Multi-package Upload Drawer state (Entry 2)
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false)
  const [uploadSoftware, setUploadSoftware] = useState('')
  const [uploadVersion, setUploadVersion] = useState('')
  const [uploadChangelog, setUploadChangelog] = useState('')
  const [uploadQueue, setUploadQueue] = useState<PendingUploadItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Edit release state
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [editingRelease, setEditingRelease] = useState<Release | null>(null)
  const [editVersion, setEditVersion] = useState('')
  const [editPlatform, setEditPlatform] = useState('')
  const [editLabel, setEditLabel] = useState('')
  const [editArch, setEditArch] = useState('')
  const [editFileName, setEditFileName] = useState('')
  const [editStatus, setEditStatus] = useState('published')
  const [editIsLatest, setEditIsLatest] = useState(false)
  const [editChangelog, setEditChangelog] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Replace file state
  const [replacingRelease, setReplacingRelease] = useState<Release | null>(null)
  const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false)
  const [replaceFile, setReplaceFile] = useState<File | null>(null)
  const [isReplacing, setIsReplacing] = useState(false)
  const replaceInputRef = useRef<HTMLInputElement>(null)

  // Delete state
  const [deletingRelease, setDeletingRelease] = useState<Release | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteR2File, setDeleteR2File] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  // Register existing R2 file state
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [regSoftware, setRegSoftware] = useState('')
  const [regVersion, setRegVersion] = useState('')
  const [regFileKey, setRegFileKey] = useState('')
  const [regFileName, setRegFileName] = useState('')
  const [regFileSize, setRegFileSize] = useState<number>(0)
  const [regPlatform, setRegPlatform] = useState('windows')
  const [regLabel, setRegLabel] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  const softwareList = catalog?.software || []
  const releasesList = catalog?.releases || []

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

  function inferLabel(fileName: string, plat: string): string {
    if (plat === 'portable') return '绿色便携版'
    if (plat === 'windows') return 'Windows 安装包'
    if (plat === 'macos') return 'macOS 安装包'
    if (plat === 'linux') return 'Linux 软件包'
    if (plat === 'android') return 'Android 安装包'
    return fileName
  }

  function handleFilesQueued(files: FileList | File[]) {
    const list = Array.from(files)
    const items: PendingUploadItem[] = list.map((f) => {
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
    setUploadQueue((prev) => [...prev, ...items])
  }

  function openUploadDrawer(defaultSoftwareId?: string) {
    setUploadSoftware(defaultSoftwareId || softwareList[0]?.slug || '')
    setUploadVersion('')
    setUploadChangelog('')
    setUploadQueue([])
    if (fileInputRef.current) fileInputRef.current.value = ''
    setUploadDrawerOpen(true)
  }

  async function handleUploadRelease(e: React.FormEvent) {
    e.preventDefault()
    if (uploadQueue.length === 0) {
      toast.error('请选择或拖入至少一个安装包文件')
      return
    }
    if (!uploadSoftware) {
      toast.error('请选择归属软件')
      return
    }
    if (!uploadVersion.trim()) {
      toast.error('请输入版本号 (如 2.0.1)')
      return
    }

    setIsUploading(true)
    try {
      const targetSw = softwareList.find((s) => s.slug === uploadSoftware || s.id === uploadSoftware)
      const swId = targetSw?.id || targetSw?.slug || uploadSoftware

      // Serial upload (Rule 4: for ... await)
      for (let i = 0; i < uploadQueue.length; i++) {
        const item = uploadQueue[i]
        setUploadQueue((prev) =>
          prev.map((q, idx) => (idx === i ? { ...q, status: 'uploading' } : q))
        )

        const isLatest = i === 0
        const res = await uploadReleaseFile(item.file, {
          softwareId: swId,
          version: uploadVersion.trim(),
          changelog: uploadChangelog.trim(),
          isLatest,
        })

        if (res.success) {
          // Update platform & label metadata
          const newCatalogRes = await api.post('/api/admin/catalog')
          const allRels = (newCatalogRes.catalog?.software || []).flatMap((s: any) => s.releases || [])
          const created = allRels.find(
            (r: any) =>
              (r.softwareId === swId || r.softwareSlug === uploadSoftware) &&
              r.version === uploadVersion.trim() &&
              r.fileName === item.file.name
          )
          if (created) {
            await api.post('/api/admin/releases/update', {
              releaseId: created.id,
              action: 'edit',
              version: uploadVersion.trim(),
              changelog: uploadChangelog.trim(),
              status: 'published',
              fileName: item.file.name,
              isLatest,
              platform: item.platform,
              label: item.label.trim() || item.file.name,
              arch: item.arch,
            })
          }
          setUploadQueue((prev) =>
            prev.map((q, idx) => (idx === i ? { ...q, status: 'done' } : q))
          )
        } else {
          setUploadQueue((prev) =>
            prev.map((q, idx) => (idx === i ? { ...q, status: 'error', error: res.msg } : q))
          )
          toast.error(`安装包 ${item.file.name} 上传失败：${res.msg}`)
        }
      }

      toast.success('版本安装包队列上传完成！')
      setUploadDrawerOpen(false)
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    } catch (err: any) {
      toast.error(`上传异常：${err.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  function openEditDrawer(rel: Release) {
    setEditingRelease(rel)
    setEditVersion(rel.version)
    setEditPlatform(rel.platform || 'windows')
    setEditLabel(rel.label || '')
    setEditArch(rel.arch || 'x64')
    setEditFileName(rel.fileName || '')
    setEditStatus(rel.status || 'published')
    setEditIsLatest(Boolean(rel.isLatest))
    setEditChangelog(rel.changelog || '')
    setEditDrawerOpen(true)
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingRelease) return
    if (!editVersion.trim()) {
      toast.error('版本号不能为空')
      return
    }

    setIsSavingEdit(true)
    try {
      const res = await api.post('/api/admin/releases/update', {
        releaseId: editingRelease.id,
        action: 'edit',
        version: editVersion.trim(),
        changelog: editChangelog.trim(),
        status: editStatus,
        fileName: editFileName.trim(),
        isLatest: editIsLatest,
        platform: editPlatform,
        label: editLabel.trim(),
        arch: editArch,
      })
      if (res.success) {
        toast.success('版本信息已更新')
        setEditDrawerOpen(false)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '更新失败')
      }
    } catch (err: any) {
      toast.error(`更新异常：${err.message}`)
    } finally {
      setIsSavingEdit(false)
    }
  }

  async function handleSetLatest(rel: Release) {
    try {
      const res = await api.post('/api/admin/releases/update', {
        releaseId: rel.id,
        action: 'latest',
      })
      if (res.success) {
        toast.success(`已将 v${rel.version} (${rel.label || rel.platform}) 设为最新版本`)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '设置失败')
      }
    } catch (err: any) {
      toast.error(`设置异常：${err.message}`)
    }
  }

  async function handleToggleStatus(rel: Release) {
    try {
      const res = await api.post('/api/admin/releases/update', {
        releaseId: rel.id,
        action: 'toggle',
      })
      if (res.success) {
        toast.success('版本状态已切换')
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '操作失败')
      }
    } catch (err: any) {
      toast.error(`操作异常：${err.message}`)
    }
  }

  function triggerReplaceFile(rel: Release) {
    setReplacingRelease(rel)
    setReplaceFile(null)
    setReplaceConfirmOpen(true)
  }

  async function executeReplaceFile() {
    if (!replacingRelease || !replaceFile) return
    setIsReplacing(true)
    try {
      const res = await replaceReleaseFile(replaceFile, replacingRelease.id)
      if (res.success) {
        toast.success('安装包文件已成功替换，版本ID保持不变')
        setReplaceConfirmOpen(false)
        setReplacingRelease(null)
        setReplaceFile(null)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '替换安装包失败')
      }
    } catch (err: any) {
      toast.error(`替换异常：${err.message}`)
    } finally {
      setIsReplacing(false)
    }
  }

  async function executeDeleteRelease() {
    if (!deletingRelease) return
    setIsDeleting(true)
    try {
      const res = await api.post('/api/admin/releases/delete', {
        releaseId: deletingRelease.id,
        deleteFile: deleteR2File,
      })
      if (res.success) {
        toast.success(`版本 v${deletingRelease.version} 已删除`)
        setDeleteConfirmOpen(false)
        setDeletingRelease(null)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '删除失败')
      }
    } catch (err: any) {
      toast.error(`删除异常：${err.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtered releases
  const filteredReleases = releasesList.filter((r) => {
    const sw = softwareList.find((s) => s.slug === r.softwareId || s.id === r.softwareId)
    const matchSearch =
      r.version.toLowerCase().includes(search.toLowerCase()) ||
      (r.fileName || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.label || '').toLowerCase().includes(search.toLowerCase()) ||
      (sw?.name || '').toLowerCase().includes(search.toLowerCase())
    const matchSoftware = filterSoftware === 'all' || r.softwareId === filterSoftware
    const matchPlatform = filterPlatform === 'all' || (r.platform || 'windows') === filterPlatform
    return matchSearch && matchSoftware && matchPlatform
  })

  // Group by software and by version (C.4 Requirement)
  const softwareGroups = softwareList
    .map((sw) => {
      const swReleases = filteredReleases.filter(
        (r) => r.softwareId === sw.slug || r.softwareId === sw.id
      )
      // Group by version
      const versionMap = new Map<string, Release[]>()
      for (const r of swReleases) {
        const v = r.version || 'unknown'
        if (!versionMap.has(v)) versionMap.set(v, [])
        versionMap.get(v)!.push(r)
      }
      const versions = Array.from(versionMap.entries()).map(([vNum, pkgs]) => ({
        version: vNum,
        packages: pkgs,
        totalDownloads: pkgs.reduce((sum, p) => sum + (Number(p.downloadCount) || 0), 0),
        isLatest: pkgs.some((p) => p.isLatest),
        status: pkgs.every((p) => p.status === 'published') ? 'published' : 'draft',
        platforms: Array.from(new Set(pkgs.map((p) => p.platform || 'windows'))),
        totalSize: pkgs.reduce((sum, p) => sum + (Number(p.fileSize) || 0), 0),
      }))

      return {
        software: sw,
        versions,
        totalPackages: swReleases.length,
      }
    })
    .filter((g) => g.totalPackages > 0 || (search === '' && filterSoftware === 'all' && filterPlatform === 'all'))

  function renderPlatformIcon(plat: string) {
    switch (plat) {
      case 'windows':
        return <Monitor className='size-3.5 text-sky-400' />
      case 'macos':
        return <Apple className='size-3.5 text-slate-300' />
      case 'linux':
        return <Terminal className='size-3.5 text-amber-400' />
      case 'portable':
        return <FolderArchive className='size-3.5 text-emerald-400' />
      case 'android':
        return <Smartphone className='size-3.5 text-emerald-300' />
      default:
        return <Layers className='size-3.5 text-muted-foreground' />
    }
  }

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 pt-0 md:gap-6 md:p-8'>
      {/* Header */}
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>版本管理</h1>
          <p className='text-sm text-muted-foreground'>
            按软件与版本折叠归集，多平台下载包统一管理、同 ID 替换与 8 路断点续传
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setRegSoftware(softwareList[0]?.slug || '')
              setRegVersion('')
              setRegFileKey('')
              setRegFileName('')
              setRegFileSize(0)
              setRegisterModalOpen(true)
            }}
          >
            <FileCheck2 className='mr-2 size-4 text-primary' />
            登记已有 R2 文件
          </Button>
          <Button size='sm' onClick={() => openUploadDrawer()}>
            <Upload className='mr-2 size-4' />
            上传新版本
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-1 items-center gap-2 max-w-md'>
          <div className='relative w-full'>
            <Search className='absolute left-2.5 top-2.5 size-4 text-muted-foreground' />
            <Input
              placeholder='搜索版本号、文件名、软件名...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9 bg-card/60'
            />
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <select
            value={filterSoftware}
            onChange={(e) => setFilterSoftware(e.target.value)}
            className='h-9 rounded-md border border-input bg-card/60 px-3 py-1 text-xs text-foreground shadow-sm'
          >
            <option value='all'>全部软件</option>
            {softwareList.map((sw) => (
              <option key={sw.slug} value={sw.slug}>
                {sw.name} ({sw.slug})
              </option>
            ))}
          </select>

          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className='h-9 rounded-md border border-input bg-card/60 px-3 py-1 text-xs text-foreground shadow-sm'
          >
            <option value='all'>全部平台</option>
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grouped Releases View (C.4) */}
      <div className='space-y-4'>
        {isLoading ? (
          <div className='rounded-xl border border-border/60 bg-card/40 p-12 text-center text-muted-foreground'>
            <Loader2 className='mx-auto size-6 animate-spin text-primary' />
            <p className='mt-2 text-xs'>加载版本列表中...</p>
          </div>
        ) : softwareGroups.length === 0 ? (
          <div className='rounded-xl border border-border/60 bg-card/40 p-12 text-center text-muted-foreground'>
            <Boxes className='mx-auto size-8 text-muted-foreground/40' />
            <p className='mt-2 text-sm'>未找到匹配的版本记录</p>
            <Button size='sm' variant='outline' onClick={() => openUploadDrawer()} className='mt-3 gap-1.5'>
              <Upload className='size-3.5' /> 上传新版本
            </Button>
          </div>
        ) : (
          softwareGroups.map((group) => {
            const isSwCollapsed = Boolean(collapsedSoftwares[group.software.slug])

            return (
              <div
                key={group.software.slug}
                className='rounded-xl border border-border/60 bg-card/50 overflow-hidden backdrop-blur-sm shadow-xs'
              >
                {/* Software Group Header */}
                <div
                  className='flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-3 cursor-pointer select-none hover:bg-muted/50 transition-colors'
                  onClick={() =>
                    setCollapsedSoftwares((prev) => ({
                      ...prev,
                      [group.software.slug]: !prev[group.software.slug],
                    }))
                  }
                >
                  <div className='flex items-center gap-3'>
                    <button type='button' className='text-muted-foreground'>
                      {isSwCollapsed ? (
                        <ChevronRight className='size-4' />
                      ) : (
                        <ChevronDown className='size-4' />
                      )}
                    </button>
                    <div className='size-7 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-xs text-primary'>
                      {group.software.name[0] || '软'}
                    </div>
                    <div>
                      <span className='font-semibold text-foreground text-sm'>
                        {group.software.name}
                      </span>
                      <span className='ml-2 font-mono text-xs text-muted-foreground'>
                        ({group.software.slug})
                      </span>
                    </div>
                  </div>

                  <div className='flex items-center gap-2' onClick={(e) => e.stopPropagation()}>
                    <Badge variant='outline' className='text-xs'>
                      {group.versions.length} 个版本 · {group.totalPackages} 个包
                    </Badge>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-7 text-xs gap-1'
                      onClick={() => openUploadDrawer(group.software.slug)}
                    >
                      <Plus className='size-3.5' /> 发布新版
                    </Button>
                  </div>
                </div>

                {/* Software Releases Content */}
                {!isSwCollapsed && (
                  <div className='divide-y divide-border/30'>
                    {group.versions.length === 0 ? (
                      <div className='p-6 text-center text-xs text-muted-foreground'>
                        暂无发布版本
                      </div>
                    ) : (
                      group.versions.map((verGroup) => {
                        const verKey = `${group.software.slug}-${verGroup.version}`
                        const isExpanded = Boolean(expandedVersions[verKey])

                        return (
                          <div key={verKey} className='transition-colors'>
                            {/* Consolidated Version Row */}
                            <div
                              className='flex flex-wrap items-center justify-between gap-3 p-3.5 hover:bg-muted/20 cursor-pointer select-none'
                              onClick={() =>
                                setExpandedVersions((prev) => ({
                                  ...prev,
                                  [verKey]: !prev[verKey],
                                }))
                              }
                            >
                              <div className='flex items-center gap-3'>
                                <button type='button' className='text-muted-foreground'>
                                  {isExpanded ? (
                                    <ChevronDown className='size-3.5' />
                                  ) : (
                                    <ChevronRight className='size-3.5' />
                                  )}
                                </button>
                                <span className='font-mono font-bold text-foreground text-sm'>
                                  v{verGroup.version}
                                </span>
                                {verGroup.isLatest && (
                                  <Badge className='bg-primary/20 text-primary border-primary/30 text-[10px] gap-1 font-normal'>
                                    <Sparkles className='size-3' /> 最新版
                                  </Badge>
                                )}
                                <div className='flex flex-wrap items-center gap-1.5 ml-2'>
                                  {verGroup.packages.map((pkg) => (
                                    <span
                                      key={pkg.id}
                                      className='inline-flex items-center gap-1 rounded bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground font-mono'
                                      title={`${pkg.label || pkg.platform}: ${pkg.fileName} (${formatBytes(pkg.fileSize)})`}
                                    >
                                      {renderPlatformIcon(pkg.platform || 'windows')}
                                      <span>{pkg.label || pkg.platform}</span>
                                      <span className='text-[10px] text-muted-foreground/70'>
                                        {formatBytes(pkg.fileSize)}
                                      </span>
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className='flex items-center gap-4 text-xs' onClick={(e) => e.stopPropagation()}>
                                <div className='text-muted-foreground flex items-center gap-1'>
                                  <span>总下载:</span>
                                  <span className='font-mono font-semibold text-foreground'>
                                    {verGroup.totalDownloads.toLocaleString()}
                                  </span>
                                </div>
                                <Badge
                                  variant={verGroup.status === 'published' ? 'secondary' : 'outline'}
                                  className='text-xs'
                                >
                                  {verGroup.status === 'published' ? '已发布' : '草稿'}
                                </Badge>
                              </div>
                            </div>

                            {/* Expanded Individual Packages Table */}
                            {isExpanded && (
                              <div className='bg-muted/15 border-t border-border/30 px-6 py-3'>
                                <table className='w-full text-left text-xs'>
                                  <thead className='border-b border-border/30 text-muted-foreground text-[11px] uppercase'>
                                    <tr>
                                      <th className='pb-2'>平台 & 标签</th>
                                      <th className='pb-2'>安装包文件</th>
                                      <th className='pb-2'>架构</th>
                                      <th className='pb-2 text-center'>下载量</th>
                                      <th className='pb-2 text-center'>状态</th>
                                      <th className='pb-2 text-right'>操作</th>
                                    </tr>
                                  </thead>
                                  <tbody className='divide-y divide-border/20'>
                                    {verGroup.packages.map((pkg) => (
                                      <tr key={pkg.id} className='hover:bg-background/40'>
                                        <td className='py-2.5'>
                                          <div className='flex items-center gap-1.5'>
                                            {renderPlatformIcon(pkg.platform || 'windows')}
                                            <span className='font-medium text-foreground'>
                                              {pkg.label || pkg.platform}
                                            </span>
                                            <Badge variant='outline' className='text-[10px] font-mono'>
                                              {pkg.platform}
                                            </Badge>
                                          </div>
                                        </td>
                                        <td className='py-2.5 font-mono text-muted-foreground'>
                                          <span className='text-foreground'>{pkg.fileName}</span>
                                          <span className='ml-2 text-muted-foreground/70'>
                                            ({formatBytes(pkg.fileSize)})
                                          </span>
                                        </td>
                                        <td className='py-2.5 font-mono text-muted-foreground'>
                                          {pkg.arch || 'x64'}
                                        </td>
                                        <td className='py-2.5 text-center font-mono font-medium'>
                                          {pkg.downloadCount || 0}
                                        </td>
                                        <td className='py-2.5 text-center'>
                                          <Badge
                                            variant={pkg.status === 'published' ? 'secondary' : 'outline'}
                                            className='text-[10px] cursor-pointer'
                                            onClick={() => handleToggleStatus(pkg)}
                                            title='点击切换状态'
                                          >
                                            {pkg.status === 'published' ? '已发布' : '隐藏'}
                                          </Badge>
                                        </td>
                                        <td className='py-2.5 text-right'>
                                          <div className='flex items-center justify-end gap-1'>
                                            <Button
                                              variant='ghost'
                                              size='sm'
                                              className='size-7 p-0'
                                              onClick={() => openEditDrawer(pkg)}
                                              title='编辑'
                                            >
                                              <Edit2 className='size-3.5' />
                                            </Button>

                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button variant='ghost' size='sm' className='size-7 p-0'>
                                                  <MoreHorizontal className='size-3.5' />
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align='end'>
                                                <DropdownMenuItem
                                                  onClick={() => {
                                                    const url = `${window.location.origin}/download/${pkg.id}`
                                                    navigator.clipboard.writeText(url)
                                                    toast.success('下载链接已复制')
                                                  }}
                                                >
                                                  <Copy className='mr-2 size-3.5' />
                                                  复制下载直链
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                  onClick={() => window.open(`/download/${pkg.id}`, '_blank')}
                                                >
                                                  <HardDriveDownload className='mr-2 size-3.5 text-primary' />
                                                  测试直接下载
                                                </DropdownMenuItem>

                                                {!pkg.isLatest && (
                                                  <DropdownMenuItem onClick={() => handleSetLatest(pkg)}>
                                                    <CheckCircle2 className='mr-2 size-3.5 text-primary' />
                                                    设为最新版本
                                                  </DropdownMenuItem>
                                                )}

                                                <DropdownMenuItem onClick={() => triggerReplaceFile(pkg)}>
                                                  <RefreshCw className='mr-2 size-3.5 text-amber-500' />
                                                  替换安装包文件...
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />

                                                <DropdownMenuItem
                                                  className='text-destructive focus:text-destructive'
                                                  onClick={() => {
                                                    setDeletingRelease(pkg)
                                                    setDeleteR2File(true)
                                                    setDeleteConfirmOpen(true)
                                                  }}
                                                >
                                                  <Trash2 className='mr-2 size-3.5' />
                                                  删除此包
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Multi-package Upload Drawer (Sheet) */}
      <Sheet open={uploadDrawerOpen} onOpenChange={setUploadDrawerOpen}>
        <SheetContent side='right' className='sm:max-w-xl overflow-y-auto w-full'>
          <SheetHeader>
            <SheetTitle>发布新版本安装包</SheetTitle>
            <SheetDescription>
              支持拖入多个平台安装包统一发布，8 路分片断点续传（最高 10GB）。
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleUploadRelease} className='space-y-4 py-4 text-xs'>
            <div className='grid gap-1.5'>
              <Label className='text-xs'>归属软件产品 *</Label>
              <select
                value={uploadSoftware}
                onChange={(e) => setUploadSoftware(e.target.value)}
                className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm'
              >
                {softwareList.map((sw) => (
                  <option key={sw.slug} value={sw.slug}>
                    {sw.name} ({sw.slug})
                  </option>
                ))}
              </select>
            </div>

            <div className='grid gap-1.5'>
              <Label htmlFor='upload-ver' className='text-xs'>
                发布版本号 (如 2.0.1) *
              </Label>
              <Input
                id='upload-ver'
                placeholder='例如：2.0.1'
                value={uploadVersion}
                onChange={(e) => setUploadVersion(e.target.value)}
                className='h-8 text-xs'
              />
            </div>

            <div className='grid gap-1.5'>
              <Label htmlFor='upload-notes' className='text-xs'>
                更新日志说明
              </Label>
              <Textarea
                id='upload-notes'
                placeholder='例如：&#10;1. 修复已知漏洞&#10;2. 性能提升 30%'
                rows={3}
                value={uploadChangelog}
                onChange={(e) => setUploadChangelog(e.target.value)}
                className='text-xs font-mono'
              />
            </div>

            {/* Dropzone for packages */}
            <div className='grid gap-1.5'>
              <Label className='text-xs'>选择或拖入安装包文件 *</Label>
              <div
                className='rounded-lg border-2 border-dashed border-border/80 p-5 text-center cursor-pointer hover:border-primary/50 transition-colors bg-secondary/10'
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (e.dataTransfer.files?.length) {
                    handleFilesQueued(e.dataTransfer.files)
                  }
                }}
              >
                <input
                  type='file'
                  ref={fileInputRef}
                  multiple
                  onChange={(e) => {
                    if (e.target.files?.length) handleFilesQueued(e.target.files)
                  }}
                  className='hidden'
                />
                <div className='space-y-1 py-1'>
                  <Upload className='mx-auto size-6 text-muted-foreground' />
                  <p className='text-xs text-muted-foreground'>
                    点击选择或拖拽多个安装包到此处
                  </p>
                  <p className='text-[10px] text-muted-foreground/70'>
                    支持 zip, 7z, exe, msi, dmg, pkg, AppImage, deb 等格式
                  </p>
                </div>
              </div>
            </div>

            {/* Queued packages */}
            {uploadQueue.length > 0 && (
              <div className='space-y-2'>
                <Label className='text-xs font-semibold'>
                  待上传文件列表 ({uploadQueue.length})
                </Label>
                <div className='space-y-2 max-h-56 overflow-y-auto'>
                  {uploadQueue.map((item, idx) => (
                    <div
                      key={item.id}
                      className='flex items-center gap-2 rounded-lg border border-border/60 bg-background/80 p-2.5 text-xs'
                    >
                      <div className='min-w-0 flex-1'>
                        <p className='font-semibold truncate text-foreground'>{item.file.name}</p>
                        <p className='text-muted-foreground'>{formatBytes(item.file.size)}</p>
                      </div>

                      <select
                        value={item.platform}
                        onChange={(e) => {
                          const next = [...uploadQueue]
                          next[idx].platform = e.target.value
                          setUploadQueue(next)
                        }}
                        className='h-7 rounded border border-input bg-card px-1.5 text-xs'
                      >
                        {PLATFORMS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>

                      <Input
                        placeholder='包标签'
                        value={item.label}
                        onChange={(e) => {
                          const next = [...uploadQueue]
                          next[idx].label = e.target.value
                          setUploadQueue(next)
                        }}
                        className='h-7 w-28 text-xs'
                      />

                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='size-7 p-0 text-red-400 hover:text-red-300'
                        onClick={() => setUploadQueue(uploadQueue.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className='size-3.5' />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <SheetFooter className='pt-4'>
              <Button
                type='submit'
                disabled={isUploading || uploadQueue.length === 0 || !uploadVersion.trim()}
                className='w-full bg-primary text-primary-foreground font-semibold shadow-sm'
              >
                {isUploading ? <Loader2 className='size-3.5 animate-spin mr-1' /> : <Upload className='size-3.5 mr-1' />}
                开始上传并发布
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Edit Release Drawer */}
      <Sheet open={editDrawerOpen} onOpenChange={setEditDrawerOpen}>
        <SheetContent side='right' className='sm:max-w-md overflow-y-auto w-full'>
          <SheetHeader>
            <SheetTitle>编辑版本元数据</SheetTitle>
            <SheetDescription>
              修改版本号、包标签、平台分类及更新日志。
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSaveEdit} className='space-y-4 py-4 text-xs'>
            <div className='grid gap-1.5'>
              <Label className='text-xs'>版本号 *</Label>
              <Input
                value={editVersion}
                onChange={(e) => setEditVersion(e.target.value)}
                className='h-8 text-xs'
              />
            </div>

            <div className='grid gap-1.5'>
              <Label className='text-xs'>支持平台 *</Label>
              <select
                value={editPlatform}
                onChange={(e) => setEditPlatform(e.target.value)}
                className='h-8 rounded border border-input bg-card px-2 text-xs'
              >
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className='grid gap-1.5'>
              <Label className='text-xs'>包展示名称 (Label)</Label>
              <Input
                value={editLabel}
                placeholder='例如：绿色便携版、Windows 安装版'
                onChange={(e) => setEditLabel(e.target.value)}
                className='h-8 text-xs'
              />
            </div>

            <div className='grid gap-1.5'>
              <Label className='text-xs'>系统架构 (Arch)</Label>
              <Input
                value={editArch}
                placeholder='例如：x64, arm64, universal'
                onChange={(e) => setEditArch(e.target.value)}
                className='h-8 text-xs'
              />
            </div>

            <div className='grid gap-1.5'>
              <Label className='text-xs'>文件名</Label>
              <Input
                value={editFileName}
                onChange={(e) => setEditFileName(e.target.value)}
                className='h-8 text-xs'
              />
            </div>

            <div className='grid gap-1.5'>
              <Label className='text-xs'>发布状态</Label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className='h-8 rounded border border-input bg-card px-2 text-xs'
              >
                <option value='published'>已发布 (公开可见)</option>
                <option value='draft'>草稿 / 隐藏</option>
                <option value='disabled'>已停用</option>
              </select>
            </div>

            <div className='grid gap-1.5'>
              <Label className='text-xs'>更新日志</Label>
              <Textarea
                rows={4}
                value={editChangelog}
                onChange={(e) => setEditChangelog(e.target.value)}
                className='text-xs font-mono'
              />
            </div>

            <SheetFooter className='pt-2'>
              <Button type='submit' disabled={isSavingEdit} className='w-full'>
                {isSavingEdit ? <Loader2 className='size-3.5 animate-spin mr-1' /> : null}
                保存更改
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Replace Package File Dialog */}
      <Dialog open={replaceConfirmOpen} onOpenChange={setReplaceConfirmOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <RefreshCw className='size-5 text-amber-500' />
              替换安装包文件
            </DialogTitle>
            <DialogDescription className='space-y-2 text-xs'>
              <p>
                当前版本：<span className='font-semibold text-foreground'>v{replacingRelease?.version}</span> (
                {replacingRelease?.fileName})
              </p>
              <p className='text-muted-foreground'>
                替换文件后，版本的 ID 和下载链接保持完全一致，无需更改前台链接或重新登记。
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3 py-2 text-xs'>
            <input
              type='file'
              ref={replaceInputRef}
              className='hidden'
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) setReplaceFile(f)
              }}
            />
            <Button
              type='button'
              variant='outline'
              onClick={() => replaceInputRef.current?.click()}
              className='w-full'
            >
              <Upload className='size-3.5 mr-1.5' />
              {replaceFile ? `已选: ${replaceFile.name}` : '选择新安装包文件'}
            </Button>
            {replaceFile && (
              <p className='text-[11px] text-muted-foreground'>
                大小: {formatBytes(replaceFile.size)}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              disabled={isReplacing}
              onClick={() => setReplaceConfirmOpen(false)}
            >
              取消
            </Button>
            <Button
              disabled={isReplacing || !replaceFile}
              onClick={executeReplaceFile}
              className='bg-amber-600 hover:bg-amber-500 text-white'
            >
              {isReplacing ? <Loader2 className='size-3.5 animate-spin mr-1' /> : null}
              确认替换
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Release Confirm Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-destructive'>
              <AlertTriangle className='size-5' />
              确认删除版本
            </DialogTitle>
            <DialogDescription>
              确定要删除版本「v{deletingRelease?.version}」吗？
            </DialogDescription>
          </DialogHeader>

          <div className='py-2 text-xs space-y-2'>
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={deleteR2File}
                onChange={(e) => setDeleteR2File(e.target.checked)}
                className='size-4 rounded border-input'
              />
              <span>同时删除 Cloudflare R2 存储桶中的对应文件</span>
            </label>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              disabled={isDeleting}
              onClick={() => setDeleteConfirmOpen(false)}
            >
              取消
            </Button>
            <Button
              variant='destructive'
              disabled={isDeleting}
              onClick={executeDeleteRelease}
            >
              {isDeleting ? <Loader2 className='size-3.5 animate-spin mr-1' /> : null}
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Register existing R2 file Modal */}
      <Dialog open={registerModalOpen} onOpenChange={setRegisterModalOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>登记已有 R2 文件</DialogTitle>
            <DialogDescription>
              如果安装包已在 Cloudflare R2 存储桶中，可直接录入文件路径进行发布。
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!regSoftware || !regVersion.trim() || !regFileKey.trim()) {
                toast.error('软件、版本号和 R2 路径均为必填')
                return
              }
              setIsRegistering(true)
              try {
                const res = await api.post('/api/admin/releases/register', {
                  softwareId: regSoftware,
                  version: regVersion.trim(),
                  fileKey: regFileKey.trim(),
                  fileName: regFileName.trim() || regFileKey.split('/').pop(),
                  fileSize: Number(regFileSize) || 0,
                  platform: regPlatform,
                  label: regLabel.trim(),
                  isLatest: false,
                })
                if (res.success) {
                  toast.success('R2 已有文件登记成功')
                  setRegisterModalOpen(false)
                  queryClient.invalidateQueries({ queryKey: ['catalog'] })
                } else {
                  toast.error(res.msg || '登记失败')
                }
              } catch (err: any) {
                toast.error(`登记异常：${err.message}`)
              } finally {
                setIsRegistering(false)
              }
            }}
            className='space-y-3 py-2 text-xs'
          >
            <div className='space-y-1'>
              <Label className='text-xs'>归属软件 *</Label>
              <select
                value={regSoftware}
                onChange={(e) => setRegSoftware(e.target.value)}
                className='h-8 w-full rounded border border-input bg-card px-2 text-xs'
              >
                {softwareList.map((sw) => (
                  <option key={sw.slug} value={sw.slug}>
                    {sw.name}
                  </option>
                ))}
              </select>
            </div>

            <div className='space-y-1'>
              <Label className='text-xs'>版本号 *</Label>
              <Input
                value={regVersion}
                placeholder='例如：2.0.0'
                onChange={(e) => setRegVersion(e.target.value)}
                className='h-8 text-xs'
              />
            </div>

            <div className='space-y-1'>
              <Label className='text-xs'>R2 文件 Key (路径) *</Label>
              <Input
                value={regFileKey}
                placeholder='例如：software/desktop/2.0.0/setup.exe'
                onChange={(e) => setRegFileKey(e.target.value)}
                className='h-8 text-xs'
              />
            </div>

            <div className='space-y-1'>
              <Label className='text-xs'>平台分类</Label>
              <select
                value={regPlatform}
                onChange={(e) => setRegPlatform(e.target.value)}
                className='h-8 w-full rounded border border-input bg-card px-2 text-xs'
              >
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className='pt-2'>
              <Button
                type='button'
                variant='outline'
                disabled={isRegistering}
                onClick={() => setRegisterModalOpen(false)}
              >
                取消
              </Button>
              <Button type='submit' disabled={isRegistering}>
                {isRegistering ? <Loader2 className='size-3.5 animate-spin mr-1' /> : null}
                确认登记
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
