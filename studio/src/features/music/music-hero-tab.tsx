import { useState, useRef } from 'react'
import { toast } from 'sonner'
import {
  Upload,
  Video,
  ImageIcon,
  Sparkles,
  Loader2,
  Play,
  Layers,
  Flame,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
// @ts-ignore
import { uploadAssetFile } from '@r2'
import { MusicHeroConfig, MusicMarqueeConfig, MusicManifestoConfig, PRESET_VIDEOS } from './types'

interface MusicHeroTabProps {
  hero: MusicHeroConfig
  marquee: MusicMarqueeConfig
  manifesto: MusicManifestoConfig
  onChangeHero: (next: MusicHeroConfig) => void
  onChangeMarquee: (next: MusicMarqueeConfig) => void
  onChangeManifesto: (next: MusicManifestoConfig) => void
}

export function MusicHeroTab({
  hero,
  marquee,
  manifesto,
  onChangeHero,
  onChangeMarquee,
  onChangeManifesto,
}: MusicHeroTabProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function updateHeroField<K extends keyof MusicHeroConfig>(key: K, value: MusicHeroConfig[K]) {
    onChangeHero({ ...hero, [key]: value })
  }

  function updateHeroStat(index: number, field: 'label' | 'value', val: string) {
    const nextStats = [...(hero.stats || [])]
    if (!nextStats[index]) nextStats[index] = { label: '', value: '' }
    nextStats[index] = { ...nextStats[index], [field]: val }
    updateHeroField('stats', nextStats)
  }

  function updateManifestoStat(index: number, field: 'label' | 'value', val: string) {
    const nextStats = [...(manifesto.stats || [])]
    if (!nextStats[index]) nextStats[index] = { label: '', value: '' }
    nextStats[index] = { ...nextStats[index], [field]: val }
    onChangeManifesto({ ...manifesto, stats: nextStats })
  }

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    const isVid = hero.mediaType === 'video'
    try {
      const res = await uploadAssetFile(file, {
        kind: isVid ? 'video' : 'image',
        folder: 'music',
      })
      if (res.success && res.url) {
        updateHeroField('mediaUrl', res.url)
        toast.success(`${isVid ? '视频' : '壁纸图片'}已上传至 R2，已自动填入！`)
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
      {/* 1. 门面视觉媒体卡片与控制 */}
      <div className='rounded-xl border bg-card p-5 space-y-4 shadow-xs'>
        <div className='flex items-center justify-between border-b pb-3'>
          <div className='space-y-0.5'>
            <h3 className='font-semibold text-sm flex items-center gap-2'>
              <Video className='size-4 text-cyan-500' />
              <span>Hero 巨幕主媒体 (背景视频 / 高清图片)</span>
            </h3>
            <p className='text-xs text-muted-foreground'>
              支持一键切换视频与静态图片，可点击直接上传本地 MP4/WebM 视频或超清壁纸到 R2。
            </p>
          </div>
          {/* 媒体类型切换 */}
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
              <span>MP4 视频</span>
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
              <span>高清图片</span>
            </button>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-12 gap-5 items-start'>
          {/* 媒体地址与上传控制 */}
          <div className='md:col-span-7 space-y-3'>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium'>
                {hero.mediaType === 'video' ? '视频媒体 URL' : '图片封面 URL'} *
              </Label>
              <div className='flex gap-2'>
                <Input
                  value={hero.mediaUrl}
                  onChange={(e) => updateHeroField('mediaUrl', e.target.value)}
                  placeholder={
                    hero.mediaType === 'video'
                      ? 'https://.../video.mp4'
                      : 'https://.../wallpaper.jpg'
                  }
                  className='h-8 text-xs font-mono'
                />
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className='h-8 text-xs shrink-0 gap-1.5'
                >
                  {isUploading ? (
                    <Loader2 className='size-3.5 animate-spin' />
                  ) : (
                    <Upload className='size-3.5' />
                  )}
                  <span>上传至 R2</span>
                </Button>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept={hero.mediaType === 'video' ? 'video/mp4,video/webm' : 'image/*'}
                  className='hidden'
                  onChange={handleMediaUpload}
                />
              </div>
            </div>

            {/* 预设短片快速选择 */}
            {hero.mediaType === 'video' && (
              <div className='space-y-1.5 pt-1'>
                <Label className='text-[11px] text-muted-foreground flex items-center gap-1'>
                  <Sparkles className='size-3 text-cyan-400' />
                  <span>快捷填入官方 15 境电影级短片：</span>
                </Label>
                <div className='flex flex-wrap gap-1.5'>
                  {PRESET_VIDEOS.map((item) => (
                    <Button
                      key={item.label}
                      type='button'
                      size='sm'
                      variant='secondary'
                      className='h-6 text-[11px] px-2 py-0'
                      onClick={() => {
                        updateHeroField('mediaUrl', item.url)
                        toast.success(`已切换为：${item.label}`)
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* 悬浮现在播放挂件文案 */}
            <div className='grid grid-cols-2 gap-3 pt-2 border-t'>
              <div className='space-y-1'>
                <Label className='text-xs'>右侧主打单曲名</Label>
                <Input
                  value={hero.nowPlayingTitle}
                  onChange={(e) => updateHeroField('nowPlayingTitle', e.target.value)}
                  placeholder='如：霓虹雨夜'
                  className='h-8 text-xs'
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-xs'>单曲副标题 / 描述</Label>
                <Input
                  value={hero.nowPlayingSub}
                  onChange={(e) => updateHeroField('nowPlayingSub', e.target.value)}
                  placeholder='如：Neon Rain · 主打单曲'
                  className='h-8 text-xs'
                />
              </div>
            </div>

            <div className='space-y-1 pt-1'>
              <Label className='text-xs'>右下角浮动印章文字</Label>
              <Input
                value={hero.stickerText}
                onChange={(e) => updateHeroField('stickerText', e.target.value)}
                placeholder='支持换行，如：15\nTRACKS'
                className='h-8 text-xs font-mono'
              />
            </div>
          </div>

          {/* 实时媒体预览视窗 */}
          <div className='md:col-span-5'>
            <div className='rounded-lg border bg-neutral-950 p-2 text-center text-xs text-neutral-400'>
              <div className='text-[11px] font-mono mb-1.5 text-left text-neutral-400 flex items-center justify-between'>
                <span>前台视窗实时预览</span>
                <span className='text-[10px] uppercase text-cyan-400'>{hero.mediaType}</span>
              </div>
              <div className='relative w-full aspect-16/10 rounded-md overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center'>
                {hero.mediaUrl ? (
                  hero.mediaType === 'video' ? (
                    <video
                      key={hero.mediaUrl}
                      src={hero.mediaUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <img
                      src={hero.mediaUrl}
                      alt='Hero Cover'
                      className='w-full h-full object-cover'
                    />
                  )
                ) : (
                  <div className='text-neutral-600 flex flex-col items-center gap-1'>
                    <Play className='size-6' />
                    <span>暂未设置媒体</span>
                  </div>
                )}
                <div className='absolute bottom-2 left-2 right-2 bg-neutral-950/80 backdrop-blur-xs rounded p-1.5 text-left border border-white/10 flex items-center justify-between'>
                  <div className='min-w-0 flex-1 mr-2'>
                    <div className='font-bold text-white text-[11px] truncate'>
                      {hero.nowPlayingTitle || '未命名'}
                    </div>
                    <div className='text-[10px] text-neutral-400 truncate'>
                      {hero.nowPlayingSub || '主打单曲'}
                    </div>
                  </div>
                  <div className='text-[9px] bg-cyan-500/20 text-cyan-300 font-mono px-1.5 py-0.5 rounded'>
                    NOW PLAYING
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Hero 文案与操作按钮 */}
      <div className='rounded-xl border bg-card p-5 space-y-4 shadow-xs'>
        <h3 className='font-semibold text-sm flex items-center gap-2 border-b pb-3'>
          <Sparkles className='size-4 text-primary' />
          <span>首屏核心文案与行动按钮 (Hero Typography & CTAs)</span>
        </h3>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
          <div className='space-y-1.5'>
            <Label className='text-xs'>顶部胶囊标签 (Chip)</Label>
            <Input
              value={hero.chip}
              onChange={(e) => updateHeroField('chip', e.target.value)}
              placeholder='如：NEW ALBUM · 新专辑上线'
              className='h-8 text-xs'
            />
          </div>
          <div className='space-y-1.5'>
            <Label className='text-xs'>主标题 (Title)</Label>
            <Input
              value={hero.title}
              onChange={(e) => updateHeroField('title', e.target.value)}
              placeholder='如：白夜'
              className='h-8 text-xs font-semibold'
            />
          </div>
          <div className='space-y-1.5'>
            <Label className='text-xs'>英文标题 (Title EN)</Label>
            <Input
              value={hero.titleEn}
              onChange={(e) => updateHeroField('titleEn', e.target.value)}
              placeholder='如：FIFTEEN REALMS'
              className='h-8 text-xs font-mono'
            />
          </div>
        </div>

        <div className='space-y-1.5'>
          <Label className='text-xs'>首屏描述 (Subtitle, 支持换行)</Label>
          <Textarea
            value={hero.subtitle}
            onChange={(e) => updateHeroField('subtitle', e.target.value)}
            rows={2}
            placeholder='十五首曲子，十五个世界。一张用眼睛听的电子专辑。'
            className='text-xs'
          />
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t'>
          <div className='space-y-2 p-3 rounded-lg border bg-muted/20'>
            <Label className='text-xs font-semibold'>主行动按钮 (Primary CTA)</Label>
            <div className='grid grid-cols-2 gap-2'>
              <Input
                value={hero.ctaPrimaryText}
                onChange={(e) => updateHeroField('ctaPrimaryText', e.target.value)}
                placeholder='文字，如：播放专辑'
                className='h-8 text-xs'
              />
              <Input
                value={hero.ctaPrimaryHref}
                onChange={(e) => updateHeroField('ctaPrimaryHref', e.target.value)}
                placeholder='锚点，如：#tracks'
                className='h-8 text-xs font-mono'
              />
            </div>
          </div>
          <div className='space-y-2 p-3 rounded-lg border bg-muted/20'>
            <Label className='text-xs font-semibold'>次行动按钮 (Secondary CTA)</Label>
            <div className='grid grid-cols-2 gap-2'>
              <Input
                value={hero.ctaSecondaryText}
                onChange={(e) => updateHeroField('ctaSecondaryText', e.target.value)}
                placeholder='文字，如：巡演日程'
                className='h-8 text-xs'
              />
              <Input
                value={hero.ctaSecondaryHref}
                onChange={(e) => updateHeroField('ctaSecondaryHref', e.target.value)}
                placeholder='锚点，如：#tour'
                className='h-8 text-xs font-mono'
              />
            </div>
          </div>
        </div>

        {/* Hero 统计徽标 */}
        <div className='space-y-2 pt-2 border-t'>
          <Label className='text-xs font-semibold'>首屏 3 组数据徽标 (Hero Stats)</Label>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
            {(hero.stats || []).map((s, idx) => (
              <div key={idx} className='p-2.5 rounded-lg border bg-muted/30 flex gap-2 items-center'>
                <div className='w-16 space-y-0.5'>
                  <span className='text-[10px] text-muted-foreground'>数值</span>
                  <Input
                    value={s.value}
                    onChange={(e) => updateHeroStat(idx, 'value', e.target.value)}
                    className='h-7 text-xs font-bold text-center'
                  />
                </div>
                <div className='flex-1 space-y-0.5'>
                  <span className='text-[10px] text-muted-foreground'>标签名称</span>
                  <Input
                    value={s.label}
                    onChange={(e) => updateHeroStat(idx, 'label', e.target.value)}
                    className='h-7 text-xs'
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. 跑马灯与艺术宣言卡片 */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-5'>
        {/* 跑马灯 */}
        <div className='lg:col-span-5 rounded-xl border bg-card p-5 space-y-3 shadow-xs'>
          <h3 className='font-semibold text-sm flex items-center gap-2 border-b pb-3'>
            <Layers className='size-4 text-cyan-500' />
            <span>首屏横向跑马灯 (Marquee Strip)</span>
          </h3>
          <p className='text-xs text-muted-foreground'>
            前台在 Hero 下方滚动的无缝循环文本，以 ◆ 作为自然分割。
          </p>
          <div className='space-y-1.5'>
            <Label className='text-xs'>跑马灯滚动文本</Label>
            <Input
              value={marquee.text}
              onChange={(e) => onChangeMarquee({ ...marquee, text: e.target.value })}
              placeholder='十五境 FIFTEEN REALMS ◆ 白夜 WHITE NIGHT ◆'
              className='h-8 text-xs font-mono'
            />
          </div>
        </div>

        {/* 艺术宣言卡片 */}
        <div className='lg:col-span-7 rounded-xl border bg-card p-5 space-y-4 shadow-xs'>
          <div className='flex items-center justify-between border-b pb-3'>
            <div className='space-y-0.5'>
              <h3 className='font-semibold text-sm flex items-center gap-2'>
                <Flame className='size-4 text-amber-500' />
                <span>艺术宣言巨幅卡片 (Manifesto)</span>
              </h3>
              <p className='text-xs text-muted-foreground'>
                前台居中展示的渐变黑金视觉卡片，突出专辑概念与视听沉浸。
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-muted-foreground'>前台启用</span>
              <Switch
                checked={manifesto.show}
                onCheckedChange={(c) => onChangeManifesto({ ...manifesto, show: c })}
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1'>
              <Label className='text-xs'>徽标文案 (Chip)</Label>
              <Input
                value={manifesto.chip}
                onChange={(e) => onChangeManifesto({ ...manifesto, chip: e.target.value })}
                placeholder='如：MANIFESTO · 宣言'
                className='h-8 text-xs'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>印章徽章 (Badge, 支持换行)</Label>
              <Input
                value={manifesto.badge}
                onChange={(e) => onChangeManifesto({ ...manifesto, badge: e.target.value })}
                placeholder='如：NEW\nALBUM'
                className='h-8 text-xs font-mono'
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1'>
              <Label className='text-xs'>前缀大标题 (Title)</Label>
              <Input
                value={manifesto.title}
                onChange={(e) => onChangeManifesto({ ...manifesto, title: e.target.value })}
                placeholder='如：十五首曲子，'
                className='h-8 text-xs'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-xs'>高亮荧光文字 (Highlight)</Label>
              <Input
                value={manifesto.highlight}
                onChange={(e) => onChangeManifesto({ ...manifesto, highlight: e.target.value })}
                placeholder='如：十五个世界。'
                className='h-8 text-xs text-cyan-400 font-semibold'
              />
            </div>
          </div>

          <div className='space-y-1'>
            <Label className='text-xs'>艺术阐述正文 (Description)</Label>
            <Textarea
              value={manifesto.description}
              onChange={(e) => onChangeManifesto({ ...manifesto, description: e.target.value })}
              rows={2}
              className='text-xs'
            />
          </div>

          <div className='grid grid-cols-3 gap-2 pt-2 border-t'>
            {(manifesto.stats || []).map((s, idx) => (
              <div key={idx} className='p-2 rounded border bg-muted/20 space-y-1'>
                <Input
                  value={s.value}
                  onChange={(e) => updateManifestoStat(idx, 'value', e.target.value)}
                  placeholder='数值'
                  className='h-6 text-xs font-bold text-center'
                />
                <Input
                  value={s.label}
                  onChange={(e) => updateManifestoStat(idx, 'label', e.target.value)}
                  placeholder='说明'
                  className='h-6 text-[10px] text-center'
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
