import { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Image as ImageIcon,
  Search,
  Upload,
  Check,
  Loader2,
  FolderOpen,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
// @ts-ignore
import { uploadAssetFile, formatBytes } from '@r2'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface R2AssetItem {
  id: string
  key: string
  fileName?: string
  fileSize?: number
  kind: string
  url?: string
  publicUrl?: string
  createdAt?: string | number
  updatedAt?: string | number
}

interface R2AssetPickerDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (url: string, fileName?: string) => void
  title?: string
  description?: string
  selectButtonText?: string
}

export function R2AssetPickerDialog({
  open,
  onClose,
  onSelect,
  title = '从 R2 媒体库选择图片',
  description = '浏览已存放在 Cloudflare R2 对象存储中的精美图片资源，一键引用入文。',
  selectButtonText = '插入此图',
}: R2AssetPickerDialogProps) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedUrl, setSelectedUrl] = useState<string>('')
  const [selectedName, setSelectedName] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery<{ success: boolean; assets: R2AssetItem[] }>({
    queryKey: ['r2-images-picker', search],
    queryFn: async () => {
      const res = await api.post('/api/admin/assets/list', {
        kind: 'image',
        search: search.trim(),
        pageSize: 60,
      })
      return res as { success: boolean; assets: R2AssetItem[] }
    },
    enabled: open,
  })

  const assets = (data?.assets || []).filter((item) => Boolean(item.url || item.publicUrl))

  async function handleDirectUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    const toastId = toast.loading(`正在上传 ${file.name} 到 R2...`)
    try {
      const res = await uploadAssetFile(file, { kind: 'image', folder: 'articles' })
      if (res.success && res.url) {
        toast.success('上传成功并登记入库', { id: toastId })
        queryClient.invalidateQueries({ queryKey: ['r2-images-picker'] })
        queryClient.invalidateQueries({ queryKey: ['assets'] })
        setSelectedUrl(res.url)
        setSelectedName(file.name)
      } else {
        toast.error(res.msg || '上传失败', { id: toastId })
      }
    } catch (err: any) {
      toast.error(`上传异常: ${err.message}`, { id: toastId })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleConfirm() {
    if (!selectedUrl) {
      toast.error('请先选择一张图片')
      return
    }
    onSelect(selectedUrl, selectedName || '图片')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className='max-w-3xl max-h-[85vh] p-0 flex flex-col overflow-hidden'>
        <DialogHeader className='p-5 border-b border-border bg-muted/20'>
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <DialogTitle className='text-base font-bold flex items-center gap-2'>
                <ImageIcon className='size-4 text-primary' />
                <span>{title}</span>
              </DialogTitle>
              <DialogDescription className='text-xs'>
                {description}
              </DialogDescription>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className='h-8 text-xs gap-1.5'
              >
                {isUploading ? <Loader2 className='size-3.5 animate-spin' /> : <Upload className='size-3.5' />}
                <span>上传新图到 R2</span>
              </Button>
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={handleDirectUpload}
              />
            </div>
          </div>

          <div className='relative mt-3'>
            <Search className='size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='搜索 R2 图片名称或路径...'
              className='h-8 pl-8 text-xs bg-background'
            />
          </div>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto p-5'>
          {isLoading ? (
            <div className='py-16 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2'>
              <Loader2 className='size-5 animate-spin text-primary' />
              <span>正在从 Cloudflare R2 检索图片资源...</span>
            </div>
          ) : assets.length === 0 ? (
            <div className='py-16 text-center text-muted-foreground text-xs space-y-3'>
              <FolderOpen className='size-8 mx-auto opacity-40' />
              <p>暂无符合条件的 R2 图片资源</p>
              <Button
                type='button'
                variant='secondary'
                size='sm'
                onClick={() => fileInputRef.current?.click()}
                className='h-7 text-xs'
              >
                立即上传第一张图片
              </Button>
            </div>
          ) : (
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
              {assets.map((asset) => {
                const url = asset.url || asset.publicUrl || ''
                const isSelected = selectedUrl === url
                return (
                  <div
                    key={asset.id || asset.key}
                    onClick={() => {
                      setSelectedUrl(url)
                      setSelectedName(asset.fileName || asset.key)
                    }}
                    onDoubleClick={() => {
                      onSelect(url, asset.fileName || asset.key)
                      onClose()
                    }}
                    className={`group relative rounded-xl border p-1.5 cursor-pointer transition-all flex flex-col bg-card hover:border-primary/60 hover:shadow-md ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                        : 'border-border/70'
                    }`}
                  >
                    <div className='aspect-video rounded-lg overflow-hidden bg-muted/40 relative flex items-center justify-center'>
                      <img
                        src={url}
                        alt={asset.fileName || 'R2 图片'}
                        className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
                        loading='lazy'
                      />
                      {isSelected && (
                        <div className='absolute top-1.5 right-1.5 bg-primary text-primary-foreground size-5 rounded-full flex items-center justify-center shadow'>
                          <Check className='size-3 stroke-[3]' />
                        </div>
                      )}
                    </div>
                    <div className='mt-2 px-1'>
                      <p className='text-[11px] font-medium text-foreground truncate' title={asset.fileName || asset.key}>
                        {asset.fileName || asset.key.split('/').pop()}
                      </p>
                      <div className='flex items-center justify-between text-[10px] text-muted-foreground mt-0.5'>
                        <span>{asset.fileSize ? formatBytes(asset.fileSize) : 'R2 存储'}</span>
                        <span className='text-primary/80 group-hover:underline'>双击选择</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className='p-4 border-t border-border bg-muted/10 flex items-center justify-between'>
          <div className='text-xs text-muted-foreground truncate max-w-sm'>
            {selectedUrl ? (
              <span className='text-foreground font-medium flex items-center gap-1.5'>
                <Sparkles className='size-3.5 text-primary' />
                已选：{selectedName || selectedUrl.split('/').pop()}
              </span>
            ) : (
              '点击图片选中，或双击直接插入'
            )}
          </div>
          <div className='flex items-center gap-2'>
            <Button type='button' variant='outline' size='sm' onClick={onClose} className='h-8 text-xs'>
              取消
            </Button>
            <Button
              type='button'
              size='sm'
              disabled={!selectedUrl}
              onClick={handleConfirm}
              className='h-8 text-xs gap-1.5'
            >
              <Check className='size-3.5' />
              <span>{selectButtonText}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
