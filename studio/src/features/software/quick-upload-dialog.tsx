import { useState, useRef } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
// @ts-ignore
import { uploadReleaseFile } from '@r2'
import type { Software } from '@/lib/queries'
import { parsePackageFileName } from './package-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface QuickUploadDialogProps {
  open: boolean
  softwareList: Software[]
  onOpenChange: (open: boolean) => void
}

export function QuickUploadDialog({
  open,
  softwareList,
  onOpenChange,
}: QuickUploadDialogProps) {
  const queryClient = useQueryClient()
  const [swSlug, setSwSlug] = useState(softwareList[0]?.slug || '')
  const [version, setVersion] = useState('')
  const [changelog, setChangelog] = useState('')
  const [platform, setPlatform] = useState('windows')
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(picked: File) {
    setFile(picked)
    const parsed = parsePackageFileName(picked.name)
    if (parsed.version && (!version || version.trim() === '' || version === '1.0.0')) {
      setVersion(parsed.version)
      toast.info(`已自动识别版本号：v${parsed.version}`)
    }
    if (parsed.platform && parsed.platform !== 'other') {
      setPlatform(parsed.platform)
    }
  }

  async function handleQuickUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!swSlug) {
      toast.error('请选择所属软件')
      return
    }
    if (!version.trim()) {
      toast.error('版本号不能为空')
      return
    }
    if (!file) {
      toast.error('请选择安装包文件')
      return
    }

    setIsUploading(true)
    const toastId = toast.loading(`正在上传安装包 ${file.name}...`)
    try {
      const uploadRes = await uploadReleaseFile(file, {
        softwareId: swSlug,
        version: version.trim(),
        changelog: changelog.trim() || '版本发布',
        isLatest: true,
        platform,
      })

      if (!uploadRes || !uploadRes.success) {
        throw new Error(uploadRes?.msg || '上传发布失败')
      }

      // Find created release to update platform
      const refreshedCatalog = await api.post('/api/admin/catalog')
      const allRels = (refreshedCatalog.catalog?.software || []).flatMap((s: any) => s.releases || [])
      const createdRel = allRels.find(
        (r: any) =>
          (r.softwareId === swSlug || r.softwareSlug === swSlug) &&
          r.version === version.trim() &&
          r.fileName === file.name
      )

      if (createdRel) {
        await api.post('/api/admin/releases/update', {
          releaseId: createdRel.id,
          action: 'edit',
          version: version.trim(),
          changelog: changelog.trim() || '版本发布',
          status: 'published',
          fileName: file.name,
          isLatest: true,
          platform,
          label: `${platform} 安装包`,
        })
      }

      toast.success(`版本 v${version} 上传并发布成功！`, { id: toastId })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      onOpenChange(false)
    } catch (err: any) {
      toast.error(`上传异常：${err.message}`, { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Upload className='size-5 text-primary' />
            <span>极速上传新安装包</span>
          </DialogTitle>
          <DialogDescription>
            为已有软件快速发布新版本安装包，直传 R2 存储
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleQuickUpload} className='space-y-4 py-2'>
          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>所属软件</Label>
            <select
              value={swSlug}
              onChange={(e) => setSwSlug(e.target.value)}
              className='w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs'
            >
              {softwareList.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name} ({s.slug})
                </option>
              ))}
            </select>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium'>新版本号</Label>
              <Input
                placeholder='例如 1.2.0'
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className='h-9 text-xs'
              />
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium'>操作系统平台</Label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className='w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs'
              >
                <option value='windows'>Windows</option>
                <option value='macos'>macOS</option>
                <option value='linux'>Linux</option>
                <option value='android'>Android</option>
                <option value='portable'>Portable 便携包</option>
              </select>
            </div>
          </div>

          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>安装包文件</Label>
            <input
              ref={fileInputRef}
              type='file'
              className='hidden'
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileSelect(e.target.files[0])
              }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (e.dataTransfer.files?.[0]) {
                  handleFileSelect(e.dataTransfer.files[0])
                }
              }}
              className='flex flex-col items-center justify-center gap-1.5 p-4 border border-dashed border-border/80 rounded-lg bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors'
            >
              <Upload className='size-5 text-muted-foreground' />
              <span className='text-xs text-foreground font-medium text-center'>
                {file ? `${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)` : '拖入或点击选择安装包文件 (exe / dmg / AppImage / zip)'}
              </span>
            </div>
          </div>

          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>更新日志</Label>
            <Textarea
              placeholder='写几句版本更新亮点...'
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              className='text-xs min-h-[60px]'
            />
          </div>

          <DialogFooter className='gap-2 sm:gap-0 pt-2'>
            <Button type='button' variant='outline' size='sm' onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type='submit' size='sm' disabled={isUploading} className='gap-1.5'>
              {isUploading ? <Loader2 className='size-3.5 animate-spin' /> : <Upload className='size-3.5' />}
              <span>{isUploading ? '正在上传分片...' : '开始上传发布'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
