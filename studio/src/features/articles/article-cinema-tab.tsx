import { useState, useRef } from 'react'
import { toast } from 'sonner'
import {
  Film,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Video,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
// @ts-ignore
import { uploadAssetFile } from '@r2'
import { ArticlesCinemaConfig, ArticlesCinemaSlide } from './types'

interface ArticleCinemaTabProps {
  cinema: ArticlesCinemaConfig
  onChangeCinema: (next: ArticlesCinemaConfig) => void
}

export function ArticleCinemaTab({
  cinema,
  onChangeCinema,
}: ArticleCinemaTabProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeSlideIdx = useRef<number>(0)

  const slides = cinema.slides || []

  function updateSlide(index: number, patch: Partial<ArticlesCinemaSlide>) {
    const nextSlides = [...slides]
    nextSlides[index] = { ...nextSlides[index], ...patch }
    onChangeCinema({ ...cinema, slides: nextSlides })
  }

  function handleAddSlide() {
    const newSlide: ArticlesCinemaSlide = {
      videoUrl: 'https://muse.ai/files/1331075203424773/1432998841610842/xq500iv9v5g5t769vpxqq7gw/noir.mp4',
      watermark: 'FEATURE',
      tag: '特稿',
      title: '新建特稿影像',
      desc: '请在此输入该影像特稿的描述文字...',
      articleIndex: slides.length,
    }
    onChangeCinema({ ...cinema, slides: [...slides, newSlide] })
    toast.success('已添加新影像特稿胶片')
  }

  function handleDeleteSlide(index: number) {
    if (slides.length <= 1) {
      toast.error('影像滑轨至少保留 1 个胶片展示')
      return
    }
    const nextSlides = slides.filter((_, i) => i !== index)
    onChangeCinema({ ...cinema, slides: nextSlides })
    toast.success('已删除该胶片')
  }

  function handleMoveSlide(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= slides.length) return
    const nextSlides = [...slides]
    const temp = nextSlides[index]
    nextSlides[index] = nextSlides[targetIndex]
    nextSlides[targetIndex] = temp
    onChangeCinema({ ...cinema, slides: nextSlides })
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const idx = activeSlideIdx.current
    if (!file || idx === null) return
    setUploadingIndex(idx)
    try {
      const res = await uploadAssetFile(file, {
        kind: 'video',
        folder: 'articles',
      })
      if (res.success && res.url) {
        updateSlide(idx, { videoUrl: res.url })
        toast.success(`视频已成功上传并更新至胶片 0${idx + 1}！`)
      } else {
        toast.error(res.msg || '上传失败')
      }
    } catch (err: any) {
      toast.error(`上传异常：${err.message}`)
    } finally {
      setUploadingIndex(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function triggerUpload(index: number) {
    activeSlideIdx.current = index
    fileInputRef.current?.click()
  }

  return (
    <div className='space-y-6'>
      <input
        ref={fileInputRef}
        type='file'
        accept='video/mp4,video/webm'
        className='hidden'
        onChange={handleUpload}
      />

      {/* 栏目头部标题设置 */}
      <div className='rounded-xl border bg-card p-5 space-y-4 shadow-xs'>
        <div className='flex items-center justify-between border-b pb-3 flex-wrap gap-2'>
          <div>
            <h3 className='font-semibold text-sm flex items-center gap-2'>
              <Film className='size-4 text-cyan-500' />
              <span>电影滑轨 · 影像特稿 (Cinema Reel)</span>
            </h3>
            <p className='text-xs text-muted-foreground mt-0.5'>
              前台配备动态 Ken Burns 缩放漫游、半透明水印字与进度条的巨幕视频滑轨。
            </p>
          </div>
          <Button onClick={handleAddSlide} size='sm' className='gap-1.5 text-xs'>
            <Plus className='size-3.5' />
            <span>添加影像胶片</span>
          </Button>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>主标题</Label>
            <Input
              value={cinema.title}
              onChange={(e) => onChangeCinema({ ...cinema, title: e.target.value })}
              placeholder='影像特稿'
              className='h-9 text-xs'
            />
          </div>
          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>副标题 (Subtitle)</Label>
            <Input
              value={cinema.subtitle}
              onChange={(e) => onChangeCinema({ ...cinema, subtitle: e.target.value })}
              placeholder='FILM STORIES'
              className='h-9 text-xs'
            />
          </div>
        </div>
      </div>

      {/* 胶片列表 */}
      <div className='space-y-4'>
        {slides.map((slide, idx) => (
          <div key={idx} className='rounded-xl border bg-card p-5 space-y-4 shadow-xs relative'>
            <div className='flex items-center justify-between border-b pb-3'>
              <div className='flex items-center gap-2'>
                <span className='font-mono font-bold text-sm text-primary'>#{idx + 1}</span>
                <span className='font-semibold text-sm'>{slide.title || '未命名特稿'}</span>
                <span className='text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground'>
                  {slide.tag || '特稿'}
                </span>
              </div>
              <div className='flex items-center gap-1'>
                <Button
                  size='icon'
                  variant='ghost'
                  className='size-7'
                  disabled={idx === 0}
                  onClick={() => handleMoveSlide(idx, 'up')}
                >
                  <ArrowUp className='size-3.5' />
                </Button>
                <Button
                  size='icon'
                  variant='ghost'
                  className='size-7'
                  disabled={idx === slides.length - 1}
                  onClick={() => handleMoveSlide(idx, 'down')}
                >
                  <ArrowDown className='size-3.5' />
                </Button>
                <Button
                  size='icon'
                  variant='ghost'
                  className='size-7 text-destructive hover:text-destructive'
                  onClick={() => handleDeleteSlide(idx)}
                >
                  <Trash2 className='size-3.5' />
                </Button>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-3'>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <Label className='text-xs font-medium'>标题</Label>
                    <Input
                      value={slide.title}
                      onChange={(e) => updateSlide(idx, { title: e.target.value })}
                      placeholder='霓虹雨夜'
                      className='h-8 text-xs mt-1'
                    />
                  </div>
                  <div>
                    <Label className='text-xs font-medium'>分类标签</Label>
                    <Input
                      value={slide.tag}
                      onChange={(e) => updateSlide(idx, { tag: e.target.value })}
                      placeholder='城市 · 特稿'
                      className='h-8 text-xs mt-1'
                    />
                  </div>
                </div>

                <div>
                  <Label className='text-xs font-medium'>巨型英文字水印 (Watermark Word)</Label>
                  <Input
                    value={slide.watermark}
                    onChange={(e) => updateSlide(idx, { watermark: e.target.value })}
                    placeholder='NEON'
                    className='h-8 text-xs font-mono uppercase mt-1'
                  />
                </div>

                <div>
                  <Label className='text-xs font-medium'>特稿简述段落</Label>
                  <Textarea
                    rows={3}
                    value={slide.desc}
                    onChange={(e) => updateSlide(idx, { desc: e.target.value })}
                    placeholder='雨把城市洗成一块巨大的霓虹底片...'
                    className='text-xs mt-1'
                  />
                </div>
              </div>

              {/* 视频地址与上传预览 */}
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <Label className='text-xs font-medium'>背景视频 URL (MP4/WebM)</Label>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='h-7 text-[11px] gap-1'
                    disabled={uploadingIndex === idx}
                    onClick={() => triggerUpload(idx)}
                  >
                    {uploadingIndex === idx ? (
                      <Loader2 className='size-3 animate-spin' />
                    ) : (
                      <Upload className='size-3' />
                    )}
                    <span>上传 MP4 到 R2</span>
                  </Button>
                </div>

                <Input
                  value={slide.videoUrl}
                  onChange={(e) => updateSlide(idx, { videoUrl: e.target.value })}
                  placeholder='https://.../video.mp4'
                  className='h-8 text-xs font-mono'
                />

                {slide.videoUrl && (
                  <div className='rounded-lg border overflow-hidden aspect-video bg-black/40 relative'>
                    <video src={slide.videoUrl} muted loop autoPlay playsInline className='w-full h-full object-cover' />
                    <span className='absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white font-mono text-[10px]'>
                      {slide.watermark}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
