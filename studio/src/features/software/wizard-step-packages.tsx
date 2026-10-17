import { useRef } from 'react'
import {
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
// @ts-ignore
import { formatBytes } from '@r2'
import type { Release } from '@/lib/queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

export interface PendingPackage {
  id: string
  file: File
  platform: string
  label: string
  arch: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

export const PLATFORM_OPTIONS = [
  { value: 'windows', label: 'Windows (exe/msi)' },
  { value: 'portable', label: 'Portable (绿色便携/zip)' },
  { value: 'macos', label: 'macOS (dmg/pkg)' },
  { value: 'linux', label: 'Linux (AppImage/deb/rpm)' },
  { value: 'android', label: 'Android (apk)' },
  { value: 'other', label: 'Other (其它)' },
]

interface WizardStepPackagesProps {
  version: string
  setVersion: (val: string) => void
  changelog: string
  setChangelog: (val: string) => void
  pendingPackages: PendingPackage[]
  setPendingPackages: (pkgs: PendingPackage[]) => void
  existingReleases: Release[]
  onAddPackages: (files: FileList) => void
}

export function WizardStepPackages({
  version,
  setVersion,
  changelog,
  setChangelog,
  pendingPackages,
  setPendingPackages,
  existingReleases,
  onAddPackages,
}: WizardStepPackagesProps) {
  const packageInputRef = useRef<HTMLInputElement>(null)

  return (
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
          <Badge variant='outline' className='text-xs'>
            步骤 3 / 4
          </Badge>
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
              onAddPackages(e.dataTransfer.files)
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
              if (e.target.files?.length) onAddPackages(e.target.files)
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
  )
}
