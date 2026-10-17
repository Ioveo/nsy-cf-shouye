import { useState, useRef } from 'react'
import {
  FolderArchive,
  Upload,
  Search,
  Trash2,
  Copy,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  FileCode,
  Music,
  FileBox,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
// @ts-ignore
import { uploadAssetFile, formatBytes } from '@r2'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface Asset {
  id: string
  key: string
  fileName?: string
  fileSize?: number
  kind: string
  url?: string
  publicUrl?: string
  createdAt?: string | number
}

export function AssetsFeature() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState('all')

  // Upload drawer state
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false)
  const [uploadKind, setUploadKind] = useState('image')
  const [uploadFolder, setUploadFolder] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Delete state
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Query assets
  const { data: assetRes, isLoading } = useQuery<{ success: boolean; assets: Asset[] }>({
    queryKey: ['assets', kindFilter, search],
    queryFn: async () => {
      return api.post('/api/admin/assets/list', {
        kind: kindFilter === 'all' ? '' : kindFilter,
        search: search.trim(),
        pageSize: 100,
      })
    },
  })

  const assets = assetRes?.assets || []

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile) {
      toast.error('请选择文件')
      return
    }

    setIsUploading(true)
    try {
      const res = await uploadAssetFile(selectedFile, {
        kind: uploadKind,
        folder: uploadFolder.trim(),
      })
      if (res.success) {
        toast.success('资源上传成功并已登记入库')
        setUploadDrawerOpen(false)
        setSelectedFile(null)
        queryClient.invalidateQueries({ queryKey: ['assets'] })
      } else {
        toast.error(res.msg || '上传失败')
      }
    } catch (err: any) {
      toast.error(`上传异常：${err.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  async function executeDelete(force = false) {
    if (!deletingAsset) return
    setIsDeleting(true)
    try {
      const res = await api.post('/api/admin/assets/delete', {
        assetId: deletingAsset.id,
        force,
      })
      if (res.success) {
        toast.success('资源已删除')
        setDeleteConfirmOpen(false)
        setDeletingAsset(null)
        queryClient.invalidateQueries({ queryKey: ['assets'] })
      } else if (res.references?.length) {
        const refs = res.references.map((r: any) => `${r.type}: ${r.title || r.id}`).join(', ')
        if (confirm(`该资源正被以下内容引用：\n${refs}\n\n是否仍要强制删除？`)) {
          executeDelete(true)
        }
      } else {
        toast.error(res.msg || '删除失败')
      }
    } catch (err: any) {
      toast.error(`删除异常：${err.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url)
    toast.success('资源链接已复制到剪贴板')
  }

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 pt-0 md:gap-6 md:p-8'>
      {/* Header */}
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>资源库管理</h1>
          <p className='text-sm text-muted-foreground'>
            管理 Cloudflare R2 存储桶中的图片、音频、安装包与静态站点素材
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button size='sm' onClick={() => setUploadDrawerOpen(true)}>
            <Upload className='mr-2 size-4' />
            上传新资源
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-1 items-center gap-2 max-w-md'>
          <div className='relative w-full'>
            <Search className='absolute left-2.5 top-2.5 size-4 text-muted-foreground' />
            <Input
              placeholder='搜索资源名称或文件路径 Key...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9 bg-card/60'
            />
          </div>
        </div>

        <div className='flex items-center gap-2'>
          {['all', 'image', 'audio', 'software', 'site'].map((k) => (
            <Button
              key={k}
              variant={kindFilter === k ? 'secondary' : 'ghost'}
              size='sm'
              onClick={() => setKindFilter(k)}
              className='text-xs'
            >
              {k === 'all'
                ? '全部'
                : k === 'image'
                ? '图片'
                : k === 'audio'
                ? '音频'
                : k === 'software'
                ? '安装包'
                : '站点素材'}
            </Button>
          ))}
        </div>
      </div>

      {/* Asset Grid / Table */}
      <div className='rounded-xl border border-border/60 bg-card/60 overflow-hidden backdrop-blur-sm'>
        <table className='w-full text-left text-sm'>
          <thead className='border-b border-border/60 bg-muted/40 text-xs font-semibold uppercase text-muted-foreground'>
            <tr>
              <th className='px-4 py-3'>资源预览 / 名称</th>
              <th className='px-4 py-3'>类型</th>
              <th className='px-4 py-3'>R2 路径 (Key)</th>
              <th className='px-4 py-3'>大小</th>
              <th className='px-4 py-3 text-right'>操作</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-border/40'>
            {isLoading ? (
              <tr>
                <td colSpan={5} className='px-4 py-8 text-center text-muted-foreground'>
                  <Loader2 className='mx-auto size-5 animate-spin text-primary' />
                  <p className='mt-2 text-xs'>加载资源列表中...</p>
                </td>
              </tr>
            ) : assets.length === 0 ? (
              <tr>
                <td colSpan={5} className='px-4 py-8 text-center text-sm text-muted-foreground'>
                  暂无资源记录
                </td>
              </tr>
            ) : (
              assets.map((a) => {
                const targetUrl = a.url || a.publicUrl || `/${a.key}`
                const isImg = a.kind === 'image' || /\.(png|jpe?g|webp|gif|svg)$/i.test(a.key)

                return (
                  <tr key={a.id || a.key} className='hover:bg-muted/30 transition-colors'>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-3'>
                        <div className='flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-secondary/30 overflow-hidden'>
                          {isImg ? (
                            <img
                              src={targetUrl}
                              alt={a.fileName || ''}
                              className='size-full object-cover'
                              onError={(e) => {
                                (e.target as any).style.display = 'none'
                              }}
                            />
                          ) : a.kind === 'audio' ? (
                            <Music className='size-5 text-primary' />
                          ) : (
                            <FileBox className='size-5 text-muted-foreground' />
                          )}
                        </div>
                        <div className='min-w-0 max-w-xs'>
                          <div className='font-semibold text-foreground truncate'>
                            {a.fileName || a.key.split('/').pop()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <Badge variant='outline' className='text-xs'>
                        {a.kind}
                      </Badge>
                    </td>
                    <td className='px-4 py-3 font-mono text-xs text-muted-foreground truncate max-w-xs'>
                      {a.key}
                    </td>
                    <td className='px-4 py-3 font-mono text-xs text-muted-foreground'>
                      {formatBytes(a.fileSize)}
                    </td>
                    <td className='px-4 py-3 text-right'>
                      <div className='flex items-center justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='size-8 p-0'
                          onClick={() => copyUrl(targetUrl)}
                          title='复制链接'
                        >
                          <Copy className='size-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='size-8 p-0'
                          onClick={() => window.open(targetUrl, '_blank')}
                          title='新窗口打开'
                        >
                          <ExternalLink className='size-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='size-8 p-0 text-destructive'
                          onClick={() => {
                            setDeletingAsset(a)
                            setDeleteConfirmOpen(true)
                          }}
                          title='删除'
                        >
                          <Trash2 className='size-4' />
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

      {/* Upload Asset Drawer */}
      <Sheet open={uploadDrawerOpen} onOpenChange={setUploadDrawerOpen}>
        <SheetContent side='right' className='sm:max-w-md'>
          <SheetHeader>
            <SheetTitle>上传新资源到 R2</SheetTitle>
            <SheetDescription>
              支持单次或分片上传，自动分类归档并生成可用直链。
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleUpload} className='space-y-4 py-4 text-sm'>
            <div className='grid gap-2'>
              <Label>选择文件 *</Label>
              <div
                className='rounded-lg border-2 border-dashed border-border/80 p-4 text-center cursor-pointer hover:border-primary/50 transition-colors bg-secondary/10'
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type='file'
                  ref={fileInputRef}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className='hidden'
                />
                {selectedFile ? (
                  <div className='space-y-1'>
                    <p className='font-semibold text-foreground truncate'>
                      {selectedFile.name}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {formatBytes(selectedFile.size)}
                    </p>
                  </div>
                ) : (
                  <div className='space-y-1 py-2'>
                    <Upload className='mx-auto size-6 text-muted-foreground' />
                    <p className='text-xs text-muted-foreground'>点击选择要上传的文件</p>
                  </div>
                )}
              </div>
            </div>

            <div className='grid gap-1.5'>
              <Label htmlFor='asset-kind'>资源分类 (Kind)</Label>
              <select
                id='asset-kind'
                value={uploadKind}
                onChange={(e) => setUploadKind(e.target.value)}
                className='h-9 rounded-md border border-input bg-background px-3 py-1 text-xs'
              >
                <option value='image'>图片 (image)</option>
                <option value='audio'>音频 (audio)</option>
                <option value='software'>安装包 (software)</option>
                <option value='site'>站点资源 (site)</option>
                <option value='other'>其它 (other)</option>
              </select>
            </div>

            <div className='grid gap-1.5'>
              <Label htmlFor='asset-folder'>子目录 (Folder, 可选)</Label>
              <Input
                id='asset-folder'
                placeholder='例如: covers, music, banner'
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
                className='font-mono text-xs'
              />
            </div>

            <SheetFooter className='pt-4'>
              <Button type='submit' disabled={isUploading || !selectedFile}>
                {isUploading ? (
                  <>
                    <Loader2 className='mr-2 size-4 animate-spin' />
                    正在上传...
                  </>
                ) : (
                  '开始上传'
                )}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title='删除资源确认'
        desc={`确定要从 R2 存储桶中删除资源「${deletingAsset?.fileName || deletingAsset?.key}」吗？`}
        confirmText='确认删除'
        cancelBtnText='取消'
        destructive
        isLoading={isDeleting}
        handleConfirm={() => executeDelete(false)}
      />
    </div>
  )
}
