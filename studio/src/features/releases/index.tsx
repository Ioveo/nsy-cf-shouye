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
import { ConfirmDialog } from '@/components/confirm-dialog'

const PLATFORMS = [
  { value: 'windows', label: 'Windows (exe/msi)' },
  { value: 'portable', label: 'Portable (绿色便携版/zip)' },
  { value: 'macos', label: 'macOS (dmg/pkg)' },
  { value: 'linux', label: 'Linux (AppImage/deb/rpm)' },
  { value: 'android', label: 'Android (apk)' },
  { value: 'other', label: 'Other (其它格式)' },
]

export function ReleasesFeature() {
  const queryClient = useQueryClient()
  const { data: catalog, isLoading } = useCatalog()

  const [search, setSearch] = useState('')
  const [filterSoftware, setFilterSoftware] = useState<string>('all')
  const [filterPlatform, setFilterPlatform] = useState<string>('all')

  // Upload drawer state
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false)
  const [uploadSoftware, setUploadSoftware] = useState('')
  const [uploadVersion, setUploadVersion] = useState('')
  const [uploadPlatform, setUploadPlatform] = useState('windows')
  const [uploadLabel, setUploadLabel] = useState('')
  const [uploadArch, setUploadArch] = useState('x64')
  const [uploadIsLatest, setUploadIsLatest] = useState(true)
  const [uploadChangelog, setUploadChangelog] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Edit drawer state
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

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    const detected = detectPlatform(file.name)
    setUploadPlatform(detected)
    if (!uploadLabel) {
      if (detected === 'portable') setUploadLabel('绿色便携版')
      else if (detected === 'windows') setUploadLabel('Windows 安装包')
      else if (detected === 'macos') setUploadLabel('macOS 安装包')
      else if (detected === 'linux') setUploadLabel('Linux 软件包')
      else setUploadLabel(file.name)
    }
  }

  function openUploadDrawer(defaultSoftwareId?: string) {
    setUploadSoftware(defaultSoftwareId || softwareList[0]?.slug || '')
    setUploadVersion('')
    setUploadPlatform('windows')
    setUploadLabel('')
    setUploadArch('x64')
    setUploadIsLatest(true)
    setUploadChangelog('')
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setUploadDrawerOpen(true)
  }

  async function handleUploadRelease(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile) {
      toast.error('请选择安装包文件')
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

      // Calls protected r2-upload.js module (handles chunked or single upload with progress)
      const res = await uploadReleaseFile(selectedFile, {
        softwareId: swId,
        version: uploadVersion.trim(),
        changelog: uploadChangelog.trim(),
        isLatest: uploadIsLatest,
      })

      if (res.success) {
        toast.success('版本安装包上传成功！')
        // Find created release ID to update platform/label if needed
        const newCatalogRes = await api.post('/api/admin/catalog')
        const newReleases = newCatalogRes.catalog?.releases || []
        const created = newReleases.find(
          (r: Release) => r.softwareId === uploadSoftware && r.version === uploadVersion.trim()
        )
        if (created) {
          await api.post('/api/admin/releases/update', {
            releaseId: created.id,
            action: 'edit',
            version: uploadVersion.trim(),
            changelog: uploadChangelog.trim(),
            status: 'published',
            fileName: selectedFile.name,
            isLatest: uploadIsLatest,
            platform: uploadPlatform,
            label: uploadLabel.trim() || selectedFile.name,
            arch: uploadArch,
          })
        }

        setUploadDrawerOpen(false)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '上传发布失败')
      }
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
        toast.success(`已将 v${rel.version} 设为最新版本`)
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

  async function handleRegisterFile(e: React.FormEvent) {
    e.preventDefault()
    if (!regSoftware || !regVersion.trim() || !regFileKey.trim()) {
      toast.error('软件、版本号和 R2 File Key 均为必填')
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
  }

  // Filtered releases
  const filteredReleases = releasesList.filter((r) => {
    const sw = softwareList.find((s) => s.slug === r.softwareId)
    const matchSearch =
      r.version.toLowerCase().includes(search.toLowerCase()) ||
      (r.fileName || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.label || '').toLowerCase().includes(search.toLowerCase()) ||
      (sw?.name || '').toLowerCase().includes(search.toLowerCase())
    const matchSoftware = filterSoftware === 'all' || r.softwareId === filterSoftware
    const matchPlatform = filterPlatform === 'all' || (r.platform || 'windows') === filterPlatform
    return matchSearch && matchSoftware && matchPlatform
  })

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 pt-0 md:gap-6 md:p-8'>
      {/* Header */}
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>版本管理</h1>
          <p className='text-sm text-muted-foreground'>
            支持 8 路分片断点续传（最高 10GB）、多平台包发布、安装包同 ID 替换与下载审计
          </p>
        </div>
        <div className='flex items-center gap-2'>
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

      {/* Releases Table */}
      <div className='rounded-xl border border-border/60 bg-card/60 overflow-hidden backdrop-blur-sm'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-sm'>
            <thead className='border-b border-border/60 bg-muted/40 text-xs font-semibold uppercase text-muted-foreground'>
              <tr>
                <th className='px-4 py-3'>归属软件</th>
                <th className='px-4 py-3'>版本号</th>
                <th className='px-4 py-3'>平台 & 包标签</th>
                <th className='px-4 py-3'>文件名 & 大小</th>
                <th className='px-4 py-3 text-center'>下载量</th>
                <th className='px-4 py-3 text-center'>状态</th>
                <th className='px-4 py-3 text-right'>操作</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border/40'>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className='px-4 py-8 text-center text-muted-foreground'>
                    <Loader2 className='mx-auto size-5 animate-spin text-primary' />
                    <p className='mt-2 text-xs'>加载版本列表中...</p>
                  </td>
                </tr>
              ) : filteredReleases.length === 0 ? (
                <tr>
                  <td colSpan={7} className='px-4 py-8 text-center text-muted-foreground'>
                    未找到版本记录，点击上方按钮上传新版本
                  </td>
                </tr>
              ) : (
                filteredReleases.map((rel) => {
                  const sw = softwareList.find((s) => s.slug === rel.softwareId)
                  return (
                    <tr key={rel.id} className='hover:bg-muted/30 transition-colors'>
                      <td className='px-4 py-3 font-medium'>
                        <div className='font-semibold'>{sw?.name || rel.softwareId}</div>
                        <div className='font-mono text-xs text-muted-foreground'>
                          {rel.softwareId}
                        </div>
                      </td>
                      <td className='px-4 py-3'>
                        <div className='flex items-center gap-1.5'>
                          <span className='font-mono font-bold'>v{rel.version}</span>
                          {rel.isLatest && (
                            <Badge className='bg-primary/20 text-primary border-primary/30 text-xs'>
                              最新
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className='px-4 py-3'>
                        <div className='flex items-center gap-1.5'>
                          <Badge variant='outline' className='text-xs'>
                            {rel.platform || 'windows'}
                          </Badge>
                          <span className='text-xs font-medium'>
                            {rel.label || '默认安装包'}
                          </span>
                        </div>
                      </td>
                      <td className='px-4 py-3'>
                        <div className='font-mono text-xs truncate max-w-xs'>
                          {rel.fileName || '未知文件名'}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          {formatBytes(rel.fileSize)}
                        </div>
                      </td>
                      <td className='px-4 py-3 text-center font-mono text-xs'>
                        {rel.downloadCount || 0}
                      </td>
                      <td className='px-4 py-3 text-center'>
                        <Badge
                          variant={rel.status === 'published' ? 'secondary' : 'outline'}
                          className='text-xs cursor-pointer'
                          onClick={() => handleToggleStatus(rel)}
                          title='点击切换发布/隐藏'
                        >
                          {rel.status === 'published' ? '已发布' : '草稿/隐藏'}
                        </Badge>
                      </td>
                      <td className='px-4 py-3 text-right'>
                        <div className='flex items-center justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='size-8 p-0'
                            onClick={() => openEditDrawer(rel)}
                            title='编辑版本信息'
                          >
                            <Edit2 className='size-4' />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='sm' className='size-8 p-0'>
                                <MoreHorizontal className='size-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem
                                onClick={() => {
                                  window.open(`/download/${rel.id}`, '_blank')
                                }}
                              >
                                <HardDriveDownload className='mr-2 size-4 text-primary' />
                                测试直接下载
                              </DropdownMenuItem>
                              {!rel.isLatest && (
                                <DropdownMenuItem onClick={() => handleSetLatest(rel)}>
                                  <CheckCircle2 className='mr-2 size-4 text-primary' />
                                  设为最新版本
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleToggleStatus(rel)}>
                                {rel.status === 'published' ? (
                                  <>
                                    <EyeOff className='mr-2 size-4' />
                                    设为隐藏
                                  </>
                                ) : (
                                  <>
                                    <Eye className='mr-2 size-4' />
                                    立即发布
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => triggerReplaceFile(rel)}>
                                <RefreshCw className='mr-2 size-4 text-amber-500' />
                                替换安装包文件...
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className='text-destructive focus:text-destructive'
                                onClick={() => {
                                  setDeletingRelease(rel)
                                  setDeleteR2File(true)
                                  setDeleteConfirmOpen(true)
                                }}
                              >
                                <Trash2 className='mr-2 size-4' />
                                删除版本
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Release Drawer (Offcanvas Sheet) */}
      <Sheet open={uploadDrawerOpen} onOpenChange={setUploadDrawerOpen}>
        <SheetContent side='right' className='sm:max-w-lg overflow-y-auto w-full'>
          <SheetHeader>
            <SheetTitle>发布新版本安装包</SheetTitle>
            <SheetDescription>
              支持任意大小文件（≤10MB 直传，＞10MB 自动启用 8 路并行分片上传至 Cloudflare R2）。
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleUploadRelease} className='space-y-4 py-4 text-sm'>
            <div className='grid gap-2'>
              <Label htmlFor='upload-sw'>归属软件产品 *</Label>
              <select
                id='upload-sw'
                value={uploadSoftware}
                onChange={(e) => setUploadSoftware(e.target.value)}
                className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm'
              >
                {softwareList.map((sw) => (
                  <option key={sw.slug} value={sw.slug}>
                    {sw.name} ({sw.slug})
                  </option>
                ))}
              </select>
            </div>

            <div className='grid gap-2'>
              <Label>选择安装包文件 *</Label>
              <div
                className='rounded-lg border-2 border-dashed border-border/80 p-4 text-center cursor-pointer hover:border-primary/50 transition-colors bg-secondary/10'
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type='file'
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className='hidden'
                />
                {selectedFile ? (
                  <div className='space-y-1'>
                    <p className='font-semibold text-foreground truncate'>
                      {selectedFile.name}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      大小: {formatBytes(selectedFile.size)}
                    </p>
                    <p className='text-xs text-primary'>点击可更换文件</p>
                  </div>
                ) : (
                  <div className='space-y-1 py-2'>
                    <Upload className='mx-auto size-6 text-muted-foreground' />
                    <p className='text-xs text-muted-foreground'>
                      点击选择或拖拽安装包到此处
                    </p>
                    <p className='text-[10px] text-muted-foreground/80'>
                      支持 zip, 7z, exe, msi, dmg, pkg, deb, rpm 等
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='grid gap-2'>
                <Label htmlFor='upload-ver'>版本号 (Version) *</Label>
                <Input
                  id='upload-ver'
                  placeholder='例如: 2.0.1'
                  value={uploadVersion}
                  onChange={(e) => setUploadVersion(e.target.value)}
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='upload-platform'>平台类型</Label>
                <select
                  id='upload-platform'
                  value={uploadPlatform}
                  onChange={(e) => setUploadPlatform(e.target.value)}
                  className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm'
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='grid gap-2'>
                <Label htmlFor='upload-label'>安装包标签 (Label)</Label>
                <Input
                  id='upload-label'
                  placeholder='例如: 绿色便携版, 标准安装版'
                  value={uploadLabel}
                  onChange={(e) => setUploadLabel(e.target.value)}
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='upload-arch'>架构 (Arch)</Label>
                <select
                  id='upload-arch'
                  value={uploadArch}
                  onChange={(e) => setUploadArch(e.target.value)}
                  className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm'
                >
                  <option value='x64'>x64 (64位)</option>
                  <option value='arm64'>arm64 (Apple Silicon)</option>
                  <option value='universal'>Universal (通用架构)</option>
                  <option value='x86'>x86 (32位)</option>
                </select>
              </div>
            </div>

            <div className='flex items-center gap-2 pt-1'>
              <input
                type='checkbox'
                id='upload-latest'
                checked={uploadIsLatest}
                onChange={(e) => setUploadIsLatest(e.target.checked)}
                className='size-4 rounded border-input text-primary focus:ring-primary'
              />
              <Label htmlFor='upload-latest' className='cursor-pointer text-xs'>
                设为该软件的最新版本 (推荐，前台主下载按钮将指向此版本)
              </Label>
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='upload-changelog'>更新日志 (Changelog)</Label>
              <Textarea
                id='upload-changelog'
                rows={4}
                placeholder='写明本次版本的更新内容...'
                value={uploadChangelog}
                onChange={(e) => setUploadChangelog(e.target.value)}
              />
            </div>

            <SheetFooter className='border-t border-border/40 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setUploadDrawerOpen(false)}
                disabled={isUploading}
              >
                取消
              </Button>
              <Button type='submit' disabled={isUploading || !selectedFile}>
                {isUploading ? (
                  <>
                    <Loader2 className='mr-2 size-4 animate-spin' />
                    正在上传...
                  </>
                ) : (
                  '开始上传并发布'
                )}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Edit Release Drawer */}
      <Sheet open={editDrawerOpen} onOpenChange={setEditDrawerOpen}>
        <SheetContent side='right' className='sm:max-w-lg overflow-y-auto w-full'>
          <SheetHeader>
            <SheetTitle>编辑版本属性</SheetTitle>
            <SheetDescription>
              编辑版本号、平台类型、包标签、展示名称与更新日志。
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSaveEdit} className='space-y-4 py-4 text-sm'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='grid gap-2'>
                <Label htmlFor='edit-ver'>版本号 *</Label>
                <Input
                  id='edit-ver'
                  value={editVersion}
                  onChange={(e) => setEditVersion(e.target.value)}
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='edit-platform'>平台类型</Label>
                <select
                  id='edit-platform'
                  value={editPlatform}
                  onChange={(e) => setEditPlatform(e.target.value)}
                  className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm'
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='grid gap-2'>
                <Label htmlFor='edit-label'>安装包标签 (Label)</Label>
                <Input
                  id='edit-label'
                  placeholder='如: 绿色便携版, 标准安装包'
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='edit-arch'>架构 (Arch)</Label>
                <select
                  id='edit-arch'
                  value={editArch}
                  onChange={(e) => setEditArch(e.target.value)}
                  className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm'
                >
                  <option value='x64'>x64</option>
                  <option value='arm64'>arm64</option>
                  <option value='universal'>Universal</option>
                  <option value='x86'>x86</option>
                </select>
              </div>
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='edit-fn'>下载文件名 (FileName)</Label>
              <Input
                id='edit-fn'
                value={editFileName}
                onChange={(e) => setEditFileName(e.target.value)}
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='grid gap-2'>
                <Label htmlFor='edit-status'>发布状态</Label>
                <select
                  id='edit-status'
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm'
                >
                  <option value='published'>已发布 (前台可见)</option>
                  <option value='draft'>草稿 / 隐藏</option>
                </select>
              </div>

              <div className='flex items-center gap-2 pt-6'>
                <input
                  type='checkbox'
                  id='edit-latest'
                  checked={editIsLatest}
                  onChange={(e) => setEditIsLatest(e.target.checked)}
                  className='size-4 rounded border-input text-primary focus:ring-primary'
                />
                <Label htmlFor='edit-latest' className='cursor-pointer text-xs'>
                  设为最新版本
                </Label>
              </div>
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='edit-changelog'>更新日志 (Changelog)</Label>
              <Textarea
                id='edit-changelog'
                rows={4}
                value={editChangelog}
                onChange={(e) => setEditChangelog(e.target.value)}
              />
            </div>

            <SheetFooter className='border-t border-border/40 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setEditDrawerOpen(false)}
                disabled={isSavingEdit}
              >
                取消
              </Button>
              <Button type='submit' disabled={isSavingEdit}>
                {isSavingEdit ? (
                  <>
                    <Loader2 className='mr-2 size-4 animate-spin' />
                    正在保存...
                  </>
                ) : (
                  '保存版本信息'
                )}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Replace File Confirm Dialog */}
      <Dialog open={replaceConfirmOpen} onOpenChange={setReplaceConfirmOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>替换已有版本的安装包</DialogTitle>
            <DialogDescription>
              替换将保留当前版本号（v{replacingRelease?.version}）和下载链接（/download/
              {replacingRelease?.id}），仅更新底层存储文件。
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div
              className='rounded-lg border-2 border-dashed border-border/80 p-4 text-center cursor-pointer hover:border-primary/50 transition-colors bg-secondary/10'
              onClick={() => replaceInputRef.current?.click()}
            >
              <input
                type='file'
                ref={replaceInputRef}
                onChange={(e) => setReplaceFile(e.target.files?.[0] || null)}
                className='hidden'
              />
              {replaceFile ? (
                <div className='space-y-1'>
                  <p className='font-semibold text-foreground truncate'>{replaceFile.name}</p>
                  <p className='text-xs text-muted-foreground'>
                    大小: {formatBytes(replaceFile.size)}
                  </p>
                </div>
              ) : (
                <div className='space-y-1 py-2'>
                  <RefreshCw className='mx-auto size-6 text-muted-foreground' />
                  <p className='text-xs text-muted-foreground'>点击选择新的替换安装包文件</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setReplaceConfirmOpen(false)}
              disabled={isReplacing}
            >
              取消
            </Button>
            <Button
              onClick={executeReplaceFile}
              disabled={isReplacing || !replaceFile}
              className='bg-amber-600 hover:bg-amber-700 text-white'
            >
              {isReplacing ? <Loader2 className='size-4 animate-spin' /> : '确认替换安装包'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Release Confirm Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title='删除版本安装包确认'
        desc={
          <div className='space-y-3 text-sm'>
            <p>
              确定要删除软件「{deletingRelease?.softwareId}」的版本 v
              {deletingRelease?.version} 吗？
            </p>
            <div className='flex items-center gap-2 rounded-md border border-destructive/30 p-2.5 bg-destructive/10'>
              <input
                type='checkbox'
                id='del-r2'
                checked={deleteR2File}
                onChange={(e) => setDeleteR2File(e.target.checked)}
                className='size-4 rounded border-destructive text-destructive'
              />
              <Label htmlFor='del-r2' className='cursor-pointer text-xs text-foreground'>
                同时物理删除 Cloudflare R2 中的对应文件 ({deletingRelease?.fileKey})
              </Label>
            </div>
          </div>
        }
        confirmText='确认删除'
        cancelBtnText='取消'
        destructive
        isLoading={isDeleting}
        handleConfirm={executeDeleteRelease}
      />

      {/* Register R2 File Dialog */}
      <Dialog open={registerModalOpen} onOpenChange={setRegisterModalOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>登记已在 R2 存储的文件</DialogTitle>
            <DialogDescription>
              直接关联已上传到 R2 的安装包文件到 catalog 中，无需重复上传。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegisterFile} className='space-y-3 py-2 text-sm'>
            <div className='grid gap-1.5'>
              <Label>归属软件 *</Label>
              <select
                value={regSoftware}
                onChange={(e) => setRegSoftware(e.target.value)}
                className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm'
              >
                {softwareList.map((sw) => (
                  <option key={sw.slug} value={sw.slug}>
                    {sw.name} ({sw.slug})
                  </option>
                ))}
              </select>
            </div>
            <div className='grid gap-1.5'>
              <Label>版本号 *</Label>
              <Input
                placeholder='如 2.0.0'
                value={regVersion}
                onChange={(e) => setRegVersion(e.target.value)}
              />
            </div>
            <div className='grid gap-1.5'>
              <Label>R2 File Key *</Label>
              <Input
                placeholder='如 releases/desktop/desktop-2.0.0.exe'
                value={regFileKey}
                onChange={(e) => setRegFileKey(e.target.value)}
                className='font-mono text-xs'
              />
            </div>
            <div className='grid gap-1.5'>
              <Label>展示文件名</Label>
              <Input
                placeholder='可选，默认为 Key 文件名'
                value={regFileName}
                onChange={(e) => setRegFileName(e.target.value)}
              />
            </div>
            <div className='grid grid-cols-2 gap-2'>
              <div className='grid gap-1.5'>
                <Label>平台</Label>
                <select
                  value={regPlatform}
                  onChange={(e) => setRegPlatform(e.target.value)}
                  className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm'
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className='grid gap-1.5'>
                <Label>文件大小 (Bytes)</Label>
                <Input
                  type='number'
                  value={regFileSize}
                  onChange={(e) => setRegFileSize(Number(e.target.value))}
                />
              </div>
            </div>
            <DialogFooter className='pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setRegisterModalOpen(false)}
                disabled={isRegistering}
              >
                取消
              </Button>
              <Button type='submit' disabled={isRegistering}>
                {isRegistering ? <Loader2 className='size-4 animate-spin' /> : '登记版本'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
