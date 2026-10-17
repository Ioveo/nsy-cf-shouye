import { useRef } from 'react'
import {
  Upload,
  Loader2,
  Trash2,
  MoveUp,
  MoveDown,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface WizardStepMediaProps {
  iconUrl: string
  setIconUrl: (url: string) => void
  isUploadingIcon: boolean
  onIconUpload: (file: File) => void
  coverUrl: string
  setCoverUrl: (url: string) => void
  isUploadingCover: boolean
  onCoverUpload: (file: File) => void
  screenshots: string[]
  setScreenshots: (urls: string[]) => void
  isUploadingScreenshots: boolean
  onScreenshotsUpload: (files: FileList) => void
}

export function WizardStepMedia({
  iconUrl,
  setIconUrl,
  isUploadingIcon,
  onIconUpload,
  coverUrl,
  setCoverUrl,
  isUploadingCover,
  onCoverUpload,
  screenshots,
  setScreenshots,
  isUploadingScreenshots,
  onScreenshotsUpload,
}: WizardStepMediaProps) {
  const iconInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const screenshotInputRef = useRef<HTMLInputElement>(null)

  // Drag and drop reordering for screenshots
  function handleScreenshotDrop(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= screenshots.length || toIdx >= screenshots.length) return
    const next = [...screenshots]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    setScreenshots(next)
  }

  return (
    <div className='space-y-6 animate-in fade-in-50 duration-200'>
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Icon Box */}
        <div className='rounded-xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm space-y-4'>
          <div>
            <h3 className='text-sm font-semibold'>软件图标 (Icon)</h3>
            <p className='text-xs text-muted-foreground mt-0.5'>
              建议尺寸 512x512 PNG，正方形高清透明底图
            </p>
          </div>

          <div className='flex items-center gap-4'>
            <div className='relative size-20 shrink-0 overflow-hidden rounded-2xl border border-border/80 bg-background/80 shadow-md flex items-center justify-center'>
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
                  if (file) onIconUpload(file)
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

        {/* Cover Box (16:9 裁切预览，标注"用于头部推广") */}
        <div className='rounded-xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-sm font-semibold flex items-center gap-2'>
                <span>封面图 (16:9 比例)</span>
                <Badge className='bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0 font-normal'>
                  用于头部推广
                </Badge>
              </h3>
              <p className='text-xs text-muted-foreground mt-0.5'>
                用于软件中心首屏轮播与主推卡片背景（16:9 裁切预览）
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
                  <span className='text-xs'>16:9 裁切效果预览</span>
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
                  if (file) onCoverUpload(file)
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

      {/* Screenshots Gallery Box (支持拖拽排序与批量上传) */}
      <div className='rounded-xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm space-y-4'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div>
            <h3 className='text-base font-semibold text-foreground flex items-center gap-2'>
              <span>软件运行截图画廊 ({screenshots.length}/12)</span>
              <Badge variant='outline' className='text-[10px] text-muted-foreground'>
                支持拖拽排序
              </Badge>
            </h3>
            <p className='text-xs text-muted-foreground mt-0.5'>
              前台详情页横向无缝灯箱画廊展示，支持拖入图片批量上传及卡片拖拽交换排序。
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
                if (e.target.files?.length) onScreenshotsUpload(e.target.files)
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
              onScreenshotsUpload(e.dataTransfer.files)
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
                  key={`${url}-${idx}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', String(idx))
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const fromIdx = Number(e.dataTransfer.getData('text/plain'))
                    if (!isNaN(fromIdx)) {
                      handleScreenshotDrop(fromIdx, idx)
                    }
                  }}
                  className='group relative aspect-video rounded-lg overflow-hidden border border-border/60 bg-background/80 shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/60 transition-all'
                  title='可拖拽此卡片直接调整前后排序'
                >
                  <img src={url} alt={`shot-${idx}`} className='size-full object-cover pointer-events-none' />
                  <div className='absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 backdrop-blur-xs'>
                    {idx > 0 && (
                      <Button
                        type='button'
                        variant='secondary'
                        size='sm'
                        className='size-7 p-0'
                        title='前移'
                        onClick={(e) => {
                          e.stopPropagation()
                          handleScreenshotDrop(idx, idx - 1)
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
                        onClick={(e) => {
                          e.stopPropagation()
                          handleScreenshotDrop(idx, idx + 1)
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
                      onClick={(e) => {
                        e.stopPropagation()
                        setScreenshots(screenshots.filter((_, i) => i !== idx))
                      }}
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
  )
}
