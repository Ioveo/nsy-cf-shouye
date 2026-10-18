import { useState, useRef } from 'react'
import { toast } from 'sonner'
import {
  LayoutGrid,
  Upload,
  Video,
  ImageIcon,
  Sparkles,
  Loader2,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// @ts-ignore
import { uploadAssetFile } from '@r2'
import { ArticlesBentoConfig, ArticlesBentoItem } from './types'

interface ArticleBentoTabProps {
  bento: ArticlesBentoConfig
  articles: any[]
  onChangeBento: (next: ArticlesBentoConfig) => void
}

export function ArticleBentoTab({
  bento,
  articles,
  onChangeBento,
}: ArticleBentoTabProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function updatePick(index: number, patch: Partial<ArticlesBentoItem>) {
    const nextPicks = [...(bento.picks || [])]
    nextPicks[index] = { ...(nextPicks[index] || {}), ...patch }
    onChangeBento({ ...bento, picks: nextPicks })
  }

  function handleSelectArticle(index: number, articleIdOrSlug: string) {
    const target = articles.find((a) => a.id === articleIdOrSlug || a.slug === articleIdOrSlug)
    if (!target) return
    updatePick(index, {
      title: target.title || '',
      tag: target.category || '特稿',
      author: target.author || '特稿记者',
      reads: (target.reads || target.views_count || '10万') + '',
      articleIndex: index,
      mediaUrl: target.cover_image || undefined,
    })
    toast.success(`已自动填入文章「${target.title}」信息`)
  }

  async function handleMediaUpload(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    const isVid = file.type.startsWith('video')
    try {
      const res = await uploadAssetFile(file, {
        kind: isVid ? 'video' : 'image',
        folder: 'articles',
      })
      if (res.success && res.url) {
        updatePick(index, {
          mediaType: isVid ? 'video' : 'image',
          mediaUrl: res.url,
        })
        toast.success('精选封面已上传至 R2！')
      } else {
        toast.error(res.msg || '上传失败')
      }
    } catch (err: any) {
      toast.error(`上传异常：${err.message}`)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const p0 = bento.picks?.[0] || {
    tag: '城市',
    title: '霓虹雨夜',
    author: '陈默',
    reads: '12.8万',
    mediaType: 'video',
    mediaUrl: '',
  }

  return (
    <div className='space-y-6'>
      {/* 栏目头部标题设置 */}
      <div className='rounded-xl border bg-card p-5 space-y-4 shadow-xs'>
        <div className='border-b pb-3'>
          <h3 className='font-semibold text-sm flex items-center gap-2'>
            <LayoutGrid className='size-4 text-primary' />
            <span>便当格精选栏目 (Bento Grid · 4 Picks)</span>
          </h3>
          <p className='text-xs text-muted-foreground mt-0.5'>
            前台采用 1 张大卡 (左侧跨双行) + 3 张中卡 (右侧堆叠) 异步非对称高级便当网格排版。
          </p>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>主标题</Label>
            <Input
              value={bento.title}
              onChange={(e) => onChangeBento({ ...bento, title: e.target.value })}
              placeholder='编辑精选'
              className='h-9 text-xs'
            />
          </div>
          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>副标题 (Subtitle)</Label>
            <Input
              value={bento.subtitle}
              onChange={(e) => onChangeBento({ ...bento, subtitle: e.target.value })}
              placeholder="EDITORS' PICKS"
              className='h-9 text-xs'
            />
          </div>
        </div>
      </div>

      {/* 精选卡片 01: 大卡跨行 */}
      <div className='rounded-xl border-2 border-primary/20 bg-card p-5 space-y-4 shadow-xs'>
        <div className='flex items-center justify-between border-b pb-3'>
          <div>
            <h4 className='font-semibold text-sm flex items-center gap-2 text-primary'>
              <Sparkles className='size-4' />
              <span>精选位 01 · 巨幕大卡 (左侧双跨行封面)</span>
            </h4>
            <p className='text-xs text-muted-foreground mt-0.5'>
              支持背景视频或高分辨率图片，常驻焦点位置。
            </p>
          </div>
          {/* 从已发布文章快速选取 */}
          {articles.length > 0 && (
            <select
              onChange={(e) => handleSelectArticle(0, e.target.value)}
              className='h-8 rounded-md border border-input bg-background px-2.5 text-xs text-muted-foreground'
              defaultValue=''
            >
              <option value='' disabled>
                从已发布文章快速填入...
              </option>
              {articles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-3'>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <Label className='text-xs font-medium'>分类标签</Label>
                <Input
                  value={p0.tag}
                  onChange={(e) => updatePick(0, { tag: e.target.value })}
                  placeholder='城市'
                  className='h-8 text-xs mt-1'
                />
              </div>
              <div>
                <Label className='text-xs font-medium'>阅读数</Label>
                <Input
                  value={p0.reads}
                  onChange={(e) => updatePick(0, { reads: e.target.value })}
                  placeholder='12.8万'
                  className='h-8 text-xs mt-1'
                />
              </div>
            </div>
            <div>
              <Label className='text-xs font-medium'>特稿标题</Label>
              <Input
                value={p0.title}
                onChange={(e) => updatePick(0, { title: e.target.value })}
                placeholder='霓虹雨夜'
                className='h-8 text-xs mt-1'
              />
            </div>
            <div>
              <Label className='text-xs font-medium'>驻站作者</Label>
              <Input
                value={p0.author}
                onChange={(e) => updatePick(0, { author: e.target.value })}
                placeholder='陈默'
                className='h-8 text-xs mt-1'
              />
            </div>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label className='text-xs font-medium'>背景视频 / 封面图片 URL</Label>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='h-7 text-[11px] gap-1'
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? <Loader2 className='size-3 animate-spin' /> : <Upload className='size-3' />}
                <span>上传到 R2</span>
              </Button>
              <input
                ref={fileInputRef}
                type='file'
                accept='video/*,image/*'
                className='hidden'
                onChange={(e) => handleMediaUpload(0, e)}
              />
            </div>
            <Input
              value={p0.mediaUrl || ''}
              onChange={(e) => updatePick(0, { mediaUrl: e.target.value })}
              placeholder='https://.../video.mp4'
              className='h-8 text-xs font-mono'
            />
            {p0.mediaUrl && (
              <div className='rounded-lg border overflow-hidden aspect-video bg-black/40 relative'>
                {p0.mediaType === 'image' || p0.mediaUrl.endsWith('.jpg') || p0.mediaUrl.endsWith('.png') ? (
                  <img src={p0.mediaUrl} alt='Pick 01' className='w-full h-full object-cover' />
                ) : (
                  <video src={p0.mediaUrl} muted loop autoPlay playsInline className='w-full h-full object-cover' />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 精选卡片 02 ~ 04: 右侧 3 连卡 */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        {[1, 2, 3].map((idx) => {
          const item = bento.picks?.[idx] || {
            tag: idx === 1 ? '自然' : '文化',
            title: idx === 1 ? '火山口' : idx === 2 ? '樱落时分' : '龙',
            author: idx === 1 ? '顾晓' : idx === 2 ? '林晚' : '陈默',
            reads: '15万',
            color1: idx === 1 ? '#ff5c38' : idx === 2 ? '#e86a9a' : '#1fae62',
            color2: idx === 1 ? '#ff9a5c' : idx === 2 ? '#ffd3e0' : '#a9f0c9',
          }

          return (
            <div key={idx} className='rounded-xl border bg-card p-4 space-y-3 shadow-xs'>
              <div className='flex items-center justify-between border-b pb-2'>
                <span className='font-semibold text-xs flex items-center gap-1.5'>
                  <FileText className='size-3.5 text-primary' />
                  <span>精选位 0{idx + 1}</span>
                </span>
                {articles.length > 0 && (
                  <select
                    onChange={(e) => handleSelectArticle(idx, e.target.value)}
                    className='h-6 rounded border border-input bg-background px-1 text-[11px] text-muted-foreground'
                    defaultValue=''
                  >
                    <option value='' disabled>
                      快速填入...
                    </option>
                    {articles.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <Label className='text-[11px] text-muted-foreground'>标题</Label>
                <Input
                  value={item.title}
                  onChange={(e) => updatePick(idx, { title: e.target.value })}
                  className='h-8 text-xs mt-1'
                />
              </div>

              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <Label className='text-[11px] text-muted-foreground'>分类</Label>
                  <Input
                    value={item.tag}
                    onChange={(e) => updatePick(idx, { tag: e.target.value })}
                    className='h-8 text-xs mt-1'
                  />
                </div>
                <div>
                  <Label className='text-[11px] text-muted-foreground'>作者</Label>
                  <Input
                    value={item.author}
                    onChange={(e) => updatePick(idx, { author: e.target.value })}
                    className='h-8 text-xs mt-1'
                  />
                </div>
              </div>

              <div>
                <Label className='text-[11px] text-muted-foreground'>阅读量</Label>
                <Input
                  value={item.reads}
                  onChange={(e) => updatePick(idx, { reads: e.target.value })}
                  className='h-8 text-xs mt-1'
                />
              </div>

              {/* 渐变底色配置 */}
              <div className='grid grid-cols-2 gap-2 pt-2 border-t'>
                <div>
                  <Label className='text-[10px] text-muted-foreground'>渐变主色</Label>
                  <div className='flex items-center gap-1.5 mt-1'>
                    <input
                      type='color'
                      value={item.color1 || '#ff5c38'}
                      onChange={(e) => updatePick(idx, { color1: e.target.value })}
                      className='size-7 rounded border cursor-pointer'
                    />
                    <Input
                      value={item.color1 || '#ff5c38'}
                      onChange={(e) => updatePick(idx, { color1: e.target.value })}
                      className='h-7 text-[11px] font-mono px-1.5'
                    />
                  </div>
                </div>
                <div>
                  <Label className='text-[10px] text-muted-foreground'>渐变辅色</Label>
                  <div className='flex items-center gap-1.5 mt-1'>
                    <input
                      type='color'
                      value={item.color2 || '#ff9a5c'}
                      onChange={(e) => updatePick(idx, { color2: e.target.value })}
                      className='size-7 rounded border cursor-pointer'
                    />
                    <Input
                      value={item.color2 || '#ff9a5c'}
                      onChange={(e) => updatePick(idx, { color2: e.target.value })}
                      className='h-7 text-[11px] font-mono px-1.5'
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
