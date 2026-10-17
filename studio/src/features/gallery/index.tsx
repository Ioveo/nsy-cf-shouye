import { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Image as ImageIcon,
  Plus,
  Upload,
  Edit2,
  Trash2,
  CheckCircle2,
  Circle,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { useCatalog } from '@/hooks/use-catalog'
import { api } from '@/lib/api'
// @ts-ignore
import { uploadAssetFile } from '@r2'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GalleryEditorDialog } from './gallery-editor-dialog'

export function GalleryFeature() {
  const queryClient = useQueryClient()
  const { data: catalog, isLoading } = useCatalog()

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<any | null>(null)

  // Batch upload state
  const [isBatchUploading, setIsBatchUploading] = useState(false)
  const [batchProgress, setBatchProgress] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const batchInputRef = useRef<HTMLInputElement>(null)

  const galleryList = (catalog as any)?.gallery || []

  function handleOpenCreate() {
    setEditingPhoto(null)
    setEditorOpen(true)
  }

  function handleOpenEdit(photo: any) {
    setEditingPhoto(photo)
    setEditorOpen(true)
  }

  // Batch upload (serial)
  async function handleBatchUpload(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (list.length === 0) return
    setIsBatchUploading(true)
    let successCount = 0

    try {
      for (let i = 0; i < list.length; i++) {
        const file = list[i]
        setBatchProgress(`正在上传并登记 ${i + 1}/${list.length}：${file.name}`)

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
      setIsBatchUploading(false)
      setBatchProgress('')
    }
  }

  // Selection toggle
  function handleToggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  function handleSelectAll() {
    if (selectedIds.length === galleryList.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(galleryList.map((g: any) => g.id))
    }
  }

  // Batch action (serial)
  async function handleBatchAction(action: 'publish' | 'hide' | 'delete') {
    if (selectedIds.length === 0) return
    if (action === 'delete' && !confirm(`确定要批量删除选中的 ${selectedIds.length} 张图片吗？`)) return

    try {
      for (const id of selectedIds) {
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
      toast.success(`批量操作已完成 (${selectedIds.length} 项)`)
      setSelectedIds([])
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    } catch (e: any) {
      toast.error(`批量操作异常：${e.message}`)
    }
  }

  // Single delete
  async function handleDelete(photo: any) {
    if (!confirm(`确定要删除图片「${photo.title || '该图片'}」吗？`)) return
    try {
      const res = await api.post('/api/admin/gallery', { action: 'delete', id: photo.id })
      if (res.success) {
        toast.success('图片已删除')
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '删除失败')
      }
    } catch (e: any) {
      toast.error(`删除异常：${e.message}`)
    }
  }

  return (
    <div className='space-y-6'>
      {/* 头部标题与批量操作 */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
            <ImageIcon className='size-6 text-primary' />
            <span>画廊相册管理</span>
          </h1>
          <p className='text-xs text-muted-foreground mt-1'>
            管理视觉设计作品集与官方高清壁纸，支持多图拖拽批量上传。
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            className='gap-2'
            disabled={isBatchUploading}
            onClick={() => batchInputRef.current?.click()}
          >
            {isBatchUploading ? <Loader2 className='size-4 animate-spin' /> : <Upload className='size-4' />}
            <span>批量上传图片</span>
          </Button>
          <input
            ref={batchInputRef}
            type='file'
            accept='image/*'
            multiple
            className='hidden'
            onChange={(e) => {
              if (e.target.files) handleBatchUpload(e.target.files)
            }}
          />
          <Button onClick={handleOpenCreate} className='gap-2'>
            <Plus className='size-4' />
            <span>添加单张</span>
          </Button>
        </div>
      </div>

      {/* 批量上传进度条 */}
      {isBatchUploading && (
        <div className='p-3 rounded-lg border bg-primary/10 flex items-center gap-2 text-xs text-primary font-medium animate-pulse'>
          <Loader2 className='size-4 animate-spin shrink-0' />
          <span>{batchProgress}</span>
        </div>
      )}

      {/* 批量操作控制条 */}
      {galleryList.length > 0 && (
        <div className='flex items-center justify-between p-2.5 rounded-lg border bg-muted/30 text-xs'>
          <div className='flex items-center gap-2'>
            <Button
              size='sm'
              variant='ghost'
              className='h-7 text-xs gap-1.5'
              onClick={handleSelectAll}
            >
              {selectedIds.length === galleryList.length ? (
                <CheckCircle2 className='size-3.5 text-primary' />
              ) : (
                <Circle className='size-3.5 text-muted-foreground' />
              )}
              <span>全选 ({selectedIds.length}/{galleryList.length})</span>
            </Button>
          </div>

          {selectedIds.length > 0 && (
            <div className='flex items-center gap-1.5'>
              <Button
                size='sm'
                variant='outline'
                className='h-7 text-xs'
                onClick={() => handleBatchAction('publish')}
              >
                批量设为公开
              </Button>
              <Button
                size='sm'
                variant='outline'
                className='h-7 text-xs'
                onClick={() => handleBatchAction('hide')}
              >
                批量设为草稿
              </Button>
              <Button
                size='sm'
                variant='destructive'
                className='h-7 text-xs'
                onClick={() => handleBatchAction('delete')}
              >
                批量删除
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 骨架屏 / 画廊网格 */}
      {isLoading ? (
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
          <div className='aspect-square bg-muted/40 animate-pulse rounded-lg' />
          <div className='aspect-square bg-muted/40 animate-pulse rounded-lg' />
          <div className='aspect-square bg-muted/40 animate-pulse rounded-lg' />
          <div className='aspect-square bg-muted/40 animate-pulse rounded-lg' />
        </div>
      ) : galleryList.length === 0 ? (
        <div
          className='rounded-lg border-2 border-dashed p-12 text-center hover:bg-muted/10 transition-colors cursor-pointer'
          onClick={() => batchInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            if (e.dataTransfer.files) handleBatchUpload(e.dataTransfer.files)
          }}
        >
          <Upload className='mx-auto size-10 text-muted-foreground/40 mb-3' />
          <h3 className='text-sm font-semibold'>画廊空空如也</h3>
          <p className='text-xs text-muted-foreground mt-1 mb-4'>
            点击此处或拖拽多张图片到此窗口，自动批量上传并发布
          </p>
          <Button size='sm' className='gap-1.5 pointer-events-none'>
            <Upload className='size-3.5' />
            <span>选择本地多图上传</span>
          </Button>
        </div>
      ) : (
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
          {galleryList.map((g: any) => {
            const isSelected = selectedIds.includes(g.id)

            return (
              <div
                key={g.id}
                className='group relative rounded-lg border bg-card overflow-hidden flex flex-col justify-between hover:shadow-md transition-all'
              >
                {/* 勾选框 */}
                <button
                  type='button'
                  onClick={() => handleToggleSelect(g.id)}
                  className='absolute top-2 left-2 z-10 size-6 rounded-md bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20'
                >
                  {isSelected ? (
                    <CheckCircle2 className='size-4 text-primary fill-current' />
                  ) : (
                    <Circle className='size-4 text-white/70' />
                  )}
                </button>

                {/* 图片展示 */}
                <div className='aspect-square w-full bg-muted/40 overflow-hidden relative'>
                  <img
                    src={g.imageUrl || g.thumbUrl}
                    alt={g.title}
                    className='size-full object-cover transition-transform duration-300 group-hover:scale-105'
                    loading='lazy'
                  />
                  {g.featured && (
                    <span className='absolute top-2 right-2 px-1.5 py-0.5 rounded bg-amber-500/90 text-black text-[10px] font-bold flex items-center gap-0.5'>
                      <Sparkles className='size-2.5' />
                      <span>精选</span>
                    </span>
                  )}
                </div>

                {/* 底部信息与操作 */}
                <div className='p-2.5 border-t bg-card flex items-center justify-between text-xs'>
                  <div className='min-w-0 flex-1 pr-2'>
                    <div className='font-medium truncate'>{g.title || '未命名图片'}</div>
                    <div className='text-[10px] text-muted-foreground truncate mt-0.5'>
                      {Array.isArray(g.tags) ? g.tags.join(' / ') : '画廊'}
                    </div>
                  </div>
                  <div className='flex items-center gap-0.5 shrink-0'>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='size-7'
                      onClick={() => handleOpenEdit(g)}
                      title='编辑'
                    >
                      <Edit2 className='size-3.5' />
                    </Button>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='size-7 text-destructive'
                      onClick={() => handleDelete(g)}
                      title='删除'
                    >
                      <Trash2 className='size-3.5' />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 单图编辑对话框 */}
      {editorOpen && (
        <GalleryEditorDialog
          open={editorOpen}
          photo={editingPhoto}
          photosCount={galleryList.length}
          onClose={() => setEditorOpen(false)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['catalog'] })}
        />
      )}
    </div>
  )
}
