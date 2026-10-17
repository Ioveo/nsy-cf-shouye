import {
  Sparkles,
  CheckCircle2,
  Circle,
  AlertCircle,
  Download,
  GripVertical,
  Monitor,
} from 'lucide-react'
import type { Software } from '@/lib/queries'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface WizardStepPublishProps {
  featured: boolean
  setFeatured: (val: boolean) => void
  featuredOrder: number
  setFeaturedOrder: (val: number) => void
  landingUrl: string
  setLandingUrl: (val: string) => void
  status: 'active' | 'draft' | 'disabled'
  setStatus: (val: 'active' | 'draft' | 'disabled') => void
  landingPages: Array<{ id: string; title: string; path: string }>
  currentSoftware: {
    name: string
    slug: string
    tagline: string
    iconUrl: string
    coverUrl: string
  }
  featuredSoftwareList: Software[]
  onReorderFeatured?: (fromIdx: number, toIdx: number) => void
}

export function WizardStepPublish({
  featured,
  setFeatured,
  featuredOrder,
  setFeaturedOrder,
  landingUrl,
  setLandingUrl,
  status,
  setStatus,
  landingPages,
  currentSoftware,
  featuredSoftwareList,
  onReorderFeatured,
}: WizardStepPublishProps) {
  return (
    <div className='grid gap-6 md:grid-cols-3 animate-in fade-in-50 duration-200'>
      <div className='md:col-span-2 space-y-6'>
        {/* 展示规则与主推设置 */}
        <div className='rounded-xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm space-y-6'>
          <div>
            <h3 className='text-base font-semibold text-foreground flex items-center gap-2'>
              <Sparkles className='size-4 text-primary' />
              <span>展示规则与主推设置</span>
            </h3>
            <p className='text-xs text-muted-foreground mt-0.5'>
              设置主推属性、首屏轮播排位，以及是否指向专属落地页。
            </p>
          </div>

          {/* 主推开关 */}
          <div className='flex items-center justify-between rounded-lg border border-border/60 bg-background/60 p-4'>
            <div className='space-y-0.5'>
              <Label className='text-sm font-medium flex items-center gap-1.5'>
                <span>设为主推软件 (Featured)</span>
                {featured && (
                  <Badge className='bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0'>
                    已启用
                  </Badge>
                )}
              </Label>
              <p className='text-xs text-muted-foreground'>
                开启后将展示在软件下载中心首屏大轮播图与首页主推推荐位。
              </p>
            </div>
            <Switch checked={featured} onCheckedChange={setFeatured} />
          </div>

          {/* 主推排序与实时直观预览 */}
          <div className={cn(
            'space-y-4 rounded-lg border p-4 transition-all',
            featured ? 'border-primary/20 bg-primary/5' : 'border-border/60 bg-muted/20'
          )}>
            <div className='flex items-center justify-between'>
              <div>
                <Label htmlFor='sw-order' className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                  <span>主推排序权重 (Featured Order)</span>
                  {!featured && (
                    <Badge variant='outline' className='text-[10px] text-muted-foreground'>
                      开启开关后生效
                    </Badge>
                  )}
                </Label>
                <p className='text-[11px] text-muted-foreground mt-0.5'>
                  数字越小排序越靠前（例如 1、2、3），前台首屏轮播优先展现排序靠前项。
                </p>
              </div>
              <Input
                id='sw-order'
                type='number'
                value={featuredOrder}
                onChange={(e) => setFeaturedOrder(Number(e.target.value) || 0)}
                className='h-8 text-xs bg-background/90 w-24 text-center font-mono'
              />
            </div>

              {/* 直观预览：首屏推广卡片效果 */}
              <div className='pt-2 border-t border-primary/10'>
                <div className='text-xs font-medium text-foreground mb-2 flex items-center gap-1.5'>
                  <Monitor className='size-3.5 text-primary' />
                  <span>首屏主推卡片直观预览</span>
                </div>
                <div className='relative overflow-hidden rounded-xl border border-border/80 bg-background/90 shadow-md p-4'>
                  {currentSoftware.coverUrl && (
                    <div className='absolute inset-0 z-0 opacity-15 overflow-hidden'>
                      <img
                        src={currentSoftware.coverUrl}
                        alt='preview cover'
                        className='size-full object-cover blur-xs'
                      />
                    </div>
                  )}
                  <div className='relative z-10 flex items-center gap-3'>
                    <div className='size-12 rounded-xl overflow-hidden border border-border/80 bg-background shadow-xs shrink-0 flex items-center justify-center'>
                      {currentSoftware.iconUrl ? (
                        <img src={currentSoftware.iconUrl} alt='icon' className='size-full object-cover' />
                      ) : (
                        <span className='font-bold text-primary text-sm'>{currentSoftware.name[0] || '软'}</span>
                      )}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        <span className='font-semibold text-sm truncate'>{currentSoftware.name || '软件名称'}</span>
                        <Badge className='bg-cyan-500/15 text-cyan-400 border-cyan-500/30 text-[10px] px-1 py-0'>
                          推荐
                        </Badge>
                      </div>
                      <p className='text-xs text-muted-foreground truncate mt-0.5'>
                        {currentSoftware.tagline || '软件一句话介绍与核心价值主张'}
                      </p>
                    </div>
                    <Button size='sm' className='h-8 text-xs gap-1.5 shrink-0 pointer-events-none'>
                      <Download className='size-3.5' /> 极速下载
                    </Button>
                  </div>
                </div>
              </div>

              {/* 当前所有主推软件排序参照 */}
              {featuredSoftwareList.length > 0 && (
                <div className='pt-2 border-t border-primary/10 space-y-2'>
                  <span className='text-[11px] font-medium text-muted-foreground'>
                    当前已有主推项目列表（共 {featuredSoftwareList.length} 项）：
                  </span>
                  <div className='space-y-1.5 max-h-36 overflow-y-auto rounded-lg border border-border/40 bg-background/50 p-2'>
                    {featuredSoftwareList.map((fsw, idx) => (
                      <div
                        key={fsw.slug}
                        draggable={Boolean(onReorderFeatured)}
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', String(idx))}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault()
                          const fromIdx = Number(e.dataTransfer.getData('text/plain'))
                          if (!isNaN(fromIdx) && onReorderFeatured) {
                            onReorderFeatured(fromIdx, idx)
                          }
                        }}
                        className='flex items-center justify-between p-1.5 rounded text-xs bg-muted/40 hover:bg-muted/70 transition-colors'
                      >
                        <div className='flex items-center gap-2 truncate'>
                          <GripVertical className='size-3 text-muted-foreground cursor-grab shrink-0' />
                          <span className='font-mono text-[11px] text-muted-foreground w-4'>#{idx + 1}</span>
                          <span className='font-medium truncate'>{fsw.name}</span>
                        </div>
                        <Badge variant='outline' className='font-mono text-[10px] px-1.5 py-0'>
                          权重: {fsw.featuredOrder ?? idx}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* 专属落地页 */}
          <div className='space-y-2'>
            <Label htmlFor='sw-landing' className='text-xs font-medium'>
              专属落地页 (Landing URL)
            </Label>
            <div className='flex items-center gap-2'>
              <select
                value={landingUrl}
                onChange={(e) => setLandingUrl(e.target.value)}
                className='h-9 rounded-md border border-input bg-background/80 px-3 py-1 text-xs shadow-xs flex-1'
              >
                <option value=''>默认详情页 (/software.html?slug={currentSoftware.slug || '...'})</option>
                {landingPages.map((page) => (
                  <option key={page.id} value={page.path}>
                    {page.title} ({page.path})
                  </option>
                ))}
              </select>
            </div>
            <p className='text-[11px] text-muted-foreground'>
              如选择专属落地页（如 <code>/desktop.html</code>），前台用户点击【了解详情】将直接跳转至该页面。
            </p>
          </div>

          {/* 发布状态 */}
          <div className='space-y-2 pt-2 border-t border-border/40'>
            <Label className='text-xs font-medium'>发布状态</Label>
            <div className='grid grid-cols-2 gap-3'>
              <button
                type='button'
                onClick={() => setStatus('active')}
                className={cn(
                  'flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all',
                  status === 'active'
                    ? 'border-emerald-500/60 bg-emerald-500/10 text-foreground'
                    : 'border-border/40 bg-background/40 text-muted-foreground hover:bg-background/60'
                )}
              >
                <span className='font-semibold text-xs flex items-center gap-1.5 text-emerald-400'>
                  <CheckCircle2 className='size-3.5' /> 正式上架 (Active)
                </span>
                <span className='text-[11px] text-muted-foreground'>
                  前台软件中心与下载直接可见
                </span>
              </button>

              <button
                type='button'
                onClick={() => setStatus('draft')}
                className={cn(
                  'flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all',
                  status === 'draft'
                    ? 'border-amber-500/60 bg-amber-500/10 text-foreground'
                    : 'border-border/40 bg-background/40 text-muted-foreground hover:bg-background/60'
                )}
              >
                <span className='font-semibold text-xs flex items-center gap-1.5 text-amber-400'>
                  <Circle className='size-3.5' /> 保存为草稿 (Draft)
                </span>
                <span className='text-[11px] text-muted-foreground'>
                  前台暂不公开，仅后台可见
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧发布检查清单 */}
      <div className='space-y-6'>
        <div className='rounded-xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm space-y-4'>
          <h3 className='text-sm font-semibold'>发布前检查清单</h3>
          <div className='space-y-3 text-xs'>
            <div className='flex items-center gap-2'>
              {currentSoftware.name ? (
                <CheckCircle2 className='size-4 text-emerald-400 shrink-0' />
              ) : (
                <AlertCircle className='size-4 text-red-400 shrink-0' />
              )}
              <span>软件名称已填写 ({currentSoftware.name || '未填写'})</span>
            </div>
            <div className='flex items-center gap-2'>
              {currentSoftware.slug ? (
                <CheckCircle2 className='size-4 text-emerald-400 shrink-0' />
              ) : (
                <AlertCircle className='size-4 text-red-400 shrink-0' />
              )}
              <span>Slug 唯一标识已生成</span>
            </div>
            <div className='flex items-center gap-2'>
              {currentSoftware.iconUrl ? (
                <CheckCircle2 className='size-4 text-emerald-400 shrink-0' />
              ) : (
                <AlertCircle className='size-4 text-amber-400 shrink-0' />
              )}
              <span>已上传应用图标 (Icon)</span>
            </div>
            <div className='flex items-center gap-2'>
              {currentSoftware.coverUrl ? (
                <CheckCircle2 className='size-4 text-emerald-400 shrink-0' />
              ) : (
                <Circle className='size-4 text-muted-foreground shrink-0' />
              )}
              <span>16:9 封面推广大图 ({currentSoftware.coverUrl ? '已设置' : '可选'})</span>
            </div>
            <div className='flex items-center gap-2'>
              {featured ? (
                <CheckCircle2 className='size-4 text-cyan-400 shrink-0' />
              ) : (
                <Circle className='size-4 text-muted-foreground shrink-0' />
              )}
              <span>首屏主推状态 ({featured ? `已启用，权重 ${featuredOrder}` : '未启用'})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
