import { useState, useRef } from 'react'
import { toast } from 'sonner'
import {
  Upload,
  Video,
  ImageIcon,
  Sparkles,
  Loader2,
  Bookmark,
  Layers,
  Tag,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
// @ts-ignore
import { uploadAssetFile } from '@r2'
import { ArticlesHeroConfig } from './types'

interface ArticleHeroTabProps {
  brand: { logo: string; issue: string }
  hero: ArticlesHeroConfig
  onChangeBrand: (next: { logo: string; issue: string }) => void
  onChangeHero: (next: ArticlesHeroConfig) => void
}

export function ArticleHeroTab({
  brand,
  hero,
  onChangeBrand,
  onChangeHero,
}: ArticleHeroTabProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function updateHeroField<K extends keyof ArticlesHeroConfig>(key: K, value: ArticlesHeroConfig[K]) {
    onChangeHero({ ...hero, [key]: value })
  }

  function updateStat(index: number, field: 'label' | 'value', val: string) {
    const nextStats = [...(hero.stats || [])]
    if (!nextStats[index]) nextStats[index] = { label: '', value: '' }
    nextStats[index] = { ...nextStats[index], [field]: val }
    updateHeroField('stats', nextStats)
  }

  function updateFloatCard(field: 'tag' | 'title' | 'subtitle' | 'reads', val: string) {
    onChangeHero({
      ...hero,
      floatCard: {
        ...(hero.floatCard || { tag: '', title: '', subtitle: '', reads: '' }),
        [field]: val,
      },
    })
  }

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    const isVid = hero.mediaType === 'video'
    try {
      const res = await uploadAssetFile(file, {
        kind: isVid ? 'video' : 'image',
        folder: 'articles',
      })
      if (res.success && res.url) {
        updateHeroField('mediaUrl', res.url)
        toast.success(`${isVid ? '封面视频' : '封面图片'}已上传至 R2，已自动填入！`)
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

  return (
    <div className='space-y-6'>
      {/* 1. 杂志品牌与刊号 */}
      <div className='rounded-xl border bg-card p-5 space-y-4 shadow-xs'>
        <div className='border-b pb-3'>
          <h3 className='font-semibold text-sm flex items-center gap-2'>
            <Bookmark className='size-4 text-primary' />
            <span>杂志品牌与刊号 (Logo & Issue Tag)</span>
          </h3>
          <p className='text-xs text-muted-foreground mt-0.5'>
            展示于页面顶栏左上角与页脚，如「白卷 VOL.1」。
          </p>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>杂志品牌名 (Logo Text)</Label>
            <Input
              value={brand.logo}
              onChange={(e) => onChangeBrand({ ...brand, logo: e.target.value })}
              placeholder='白卷'
              className='h-9 text-xs'
            />
          </div>
          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>刊号徽章 (Issue Tag)</Label>
            <Input
              value={brand.issue}
              onChange={(e) => onChangeBrand({ ...brand, issue: e.target.value })}
              placeholder='VOL.1'
              className='h-9 text-xs'
            />
          </div>
        </div>
      </div>

      {/* 2. Hero 媒体卡片设置 (视频/图片 + R2 上传) */}
      <div className='rounded-xl border bg-card p-5 space-y-4 shadow-xs'>
        <div className='flex items-center justify-between border-b pb-3 flex-wrap gap-2'>
          <div>
            <h3 className='font-semibold text-sm flex items-center gap-2'>
              <Video className='size-4 text-cyan-500' />
              <span>Hero 巨幕右侧视觉媒体 (视频 / 高清封面)</span>
            </h3>
            <p className='text-xs text-muted-foreground mt-0.5'>
              支持一键切换视频与静态图片，支持直接上传本地 MP4 视频或超清壁纸至 Cloudflare R2。
            </p>
          </div>
          {/* 切换类型 */}
          <div className='flex items-center rounded-lg border p-1 bg-muted/30'>
            <button
              type='button'
              onClick={() => updateHeroField('mediaType', 'video')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-medium transition-all ${
                hero.mediaType === 'video'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Video className='size-3.5' />
              <span>视频背景</span>
            </button>
            <button
              type='button'
              onClick={() => updateHeroField('mediaType', 'image')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-medium transition-all ${
                hero.mediaType === 'image'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ImageIcon className='size-3.5' />
              <span>静态大图</span>
            </button>
          </div>
        </div>

        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <Input
              value={hero.mediaUrl}
              onChange={(e) => updateHeroField('mediaUrl', e.target.value)}
              placeholder={hero.mediaType === 'video' ? 'https://.../video.mp4' : 'https://.../cover.jpg'}
              className='h-9 text-xs font-mono flex-1'
            />
            <input
              ref={fileInputRef}
              type='file'
              accept={hero.mediaType === 'video' ? 'video/mp4,video/webm' : 'image/*'}
              className='hidden'
              onChange={handleMediaUpload}
            />
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='h-9 gap-1.5 shrink-0 text-xs'
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? <Loader2 className='size-3.5 animate-spin' /> : <Upload className='size-3.5' />}
              <span>上传到 R2</span>
            </Button>
          </div>

          {/* 实时媒体预览 */}
          {hero.mediaUrl && (
            <div className='rounded-lg border overflow-hidden max-w-sm aspect-video bg-black/40 relative'>
              {hero.mediaType === 'video' ? (
                <video src={hero.mediaUrl} muted loop autoPlay playsInline className='w-full h-full object-cover' />
              ) : (
                <img src={hero.mediaUrl} alt='Hero Preview' className='w-full h-full object-cover' />
              )}
              <span className='absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] backdrop-blur-xs'>
                {hero.mediaType === 'video' ? '视频播放中' : '静态图片'}
              </span>
            </div>
          )}
        </div>

        {/* 浮动玻璃卡片与旋转印章 */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t'>
          <div className='space-y-3'>
            <h4 className='text-xs font-semibold text-muted-foreground flex items-center gap-1.5'>
              <Layers className='size-3.5' />
              <span>浮动玻璃卡片 (Glass Floating Badge)</span>
            </h4>
            <div className='grid grid-cols-2 gap-2'>
              <div>
                <Label className='text-[11px] text-muted-foreground'>分类标签 (Tag)</Label>
                <Input
                  value={hero.floatCard?.tag || ''}
                  onChange={(e) => updateFloatCard('tag', e.target.value)}
                  placeholder='城市'
                  className='h-8 text-xs mt-1'
                />
              </div>
              <div>
                <Label className='text-[11px] text-muted-foreground'>阅读量标注</Label>
                <Input
                  value={hero.floatCard?.reads || ''}
                  onChange={(e) => updateFloatCard('reads', e.target.value)}
                  placeholder='▶ 12.8万'
                  className='h-8 text-xs mt-1'
                />
              </div>
            </div>
            <div>
              <Label className='text-[11px] text-muted-foreground'>特稿标题</Label>
              <Input
                value={hero.floatCard?.title || ''}
                onChange={(e) => updateFloatCard('title', e.target.value)}
                placeholder='霓虹雨夜'
                className='h-8 text-xs mt-1'
              />
            </div>
            <div>
              <Label className='text-[11px] text-muted-foreground'>副标题 / 作者</Label>
              <Input
                value={hero.floatCard?.subtitle || ''}
                onChange={(e) => updateFloatCard('subtitle', e.target.value)}
                placeholder='Neon Noir · 陈默'
                className='h-8 text-xs mt-1'
              />
            </div>
          </div>

          <div className='space-y-3'>
            <h4 className='text-xs font-semibold text-muted-foreground flex items-center gap-1.5'>
              <Sparkles className='size-3.5 text-amber-500' />
              <span>旋转徽章印章 (Hero Badge Stamp)</span>
            </h4>
            <div className='space-y-1.5'>
              <Label className='text-[11px] text-muted-foreground'>印章文字 (换行隔开两行)</Label>
              <Textarea
                rows={3}
                value={hero.badgeText}
                onChange={(e) => updateHeroField('badgeText', e.target.value)}
                placeholder={'本期\n特稿'}
                className='text-xs font-mono'
              />
              <p className='text-[10px] text-muted-foreground'>
                页面右上角 360° 缓慢旋转的黄色复古圆形印章。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Hero 文本排版与引导按钮 */}
      <div className='rounded-xl border bg-card p-5 space-y-4 shadow-xs'>
        <div className='border-b pb-3'>
          <h3 className='font-semibold text-sm flex items-center gap-2'>
            <Tag className='size-4 text-primary' />
            <span>Hero 顶部主标题、导言与行动按钮</span>
          </h3>
          <p className='text-xs text-muted-foreground mt-0.5'>
            设置今日卷首徽章、巨型标题、黄色高亮字及双按钮行为。
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>顶部小胶囊徽章 (Eyebrow)</Label>
            <Input
              value={hero.eyebrow}
              onChange={(e) => updateHeroField('eyebrow', e.target.value)}
              placeholder='本期特稿 · FEATURED'
              className='h-9 text-xs'
            />
          </div>
          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>标题高亮词 (Highlight Word · 黄底倾斜卡片)</Label>
            <Input
              value={hero.highlight}
              onChange={(e) => updateHeroField('highlight', e.target.value)}
              placeholder='世界'
              className='h-9 text-xs font-bold text-amber-600 bg-amber-50/50 dark:bg-amber-950/20'
            />
          </div>
        </div>

        <div className='space-y-1.5'>
          <Label className='text-xs font-medium'>主标题前缀 (Title · 换行自动折行)</Label>
          <Input
            value={hero.title}
            onChange={(e) => updateHeroField('title', e.target.value)}
            placeholder={'用眼睛\n读'}
            className='h-9 text-xs'
          />
        </div>

        <div className='space-y-1.5'>
          <Label className='text-xs font-medium'>导言长句 (Lede Paragraph)</Label>
          <Textarea
            rows={3}
            value={hero.lede}
            onChange={(e) => updateHeroField('lede', e.target.value)}
            placeholder='十五位撰稿人，十五个现场。从霓虹雨夜到云海日出——白卷把远方折成可以翻阅的形状。'
            className='text-xs'
          />
        </div>

        {/* 双 CTA 按钮 */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t'>
          <div className='space-y-2'>
            <Label className='text-xs font-medium text-primary'>主按钮 (Primary CTA)</Label>
            <div className='grid grid-cols-2 gap-2'>
              <Input
                value={hero.ctaPrimaryText}
                onChange={(e) => updateHeroField('ctaPrimaryText', e.target.value)}
                placeholder='开始阅读 →'
                className='h-8 text-xs'
              />
              <Input
                value={hero.ctaPrimaryHref}
                onChange={(e) => updateHeroField('ctaPrimaryHref', e.target.value)}
                placeholder='#sec-picks'
                className='h-8 text-xs font-mono'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label className='text-xs font-medium text-muted-foreground'>副按钮 (Secondary CTA)</Label>
            <div className='grid grid-cols-2 gap-2'>
              <Input
                value={hero.ctaSecondaryText}
                onChange={(e) => updateHeroField('ctaSecondaryText', e.target.value)}
                placeholder='浏览全部'
                className='h-8 text-xs'
              />
              <Input
                value={hero.ctaSecondaryHref}
                onChange={(e) => updateHeroField('ctaSecondaryHref', e.target.value)}
                placeholder='#sec-grid'
                className='h-8 text-xs font-mono'
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. 统计数据条目 (3 Items) */}
      <div className='rounded-xl border bg-card p-5 space-y-4 shadow-xs'>
        <div className='border-b pb-3'>
          <h3 className='font-semibold text-sm flex items-center gap-2'>
            <Eye className='size-4 text-emerald-500' />
            <span>Hero 底部三格数据统计 (Key Metrics)</span>
          </h3>
          <p className='text-xs text-muted-foreground mt-0.5'>
            前台醒目展示的核心数据，如「15 深度特稿」、「06 驻站作者」、「32万 本月读者」。
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
          {(hero.stats || []).map((stat, i) => (
            <div key={i} className='rounded-lg border p-3 bg-muted/20 space-y-2'>
              <span className='text-[10px] font-mono text-muted-foreground'>指标 0{i + 1}</span>
              <div>
                <Label className='text-[11px] text-muted-foreground'>数值 (Value)</Label>
                <Input
                  value={stat.value}
                  onChange={(e) => updateStat(i, 'value', e.target.value)}
                  placeholder={i === 0 ? '15' : i === 1 ? '06' : '32万'}
                  className='h-8 text-xs font-bold mt-1'
                />
              </div>
              <div>
                <Label className='text-[11px] text-muted-foreground'>文字标签 (Label)</Label>
                <Input
                  value={stat.label}
                  onChange={(e) => updateStat(i, 'label', e.target.value)}
                  placeholder={i === 0 ? '深度特稿' : i === 1 ? '驻站作者' : '本月读者'}
                  className='h-8 text-xs mt-1'
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
