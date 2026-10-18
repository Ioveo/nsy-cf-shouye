import React from 'react'
import {
  Palette,
  Sparkles,
  LayoutGrid,
  BarChart3,
  Megaphone,
} from 'lucide-react'
import type { SoftwareCenterConfig } from '@/lib/queries'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ConfigFormProps {
  config: SoftwareCenterConfig
  onChange: (next: SoftwareCenterConfig) => void
}

export function ConfigForm({ config, onChange }: ConfigFormProps) {
  function update(patch: Partial<SoftwareCenterConfig>) {
    onChange({ ...config, ...patch })
  }

  return (
    <div className='space-y-4'>
      <Tabs defaultValue='appearance' className='w-full'>
        <TabsList className='grid grid-cols-5 w-full'>
          <TabsTrigger value='appearance' className='text-xs flex items-center gap-1.5'>
            <Palette className='size-3.5' />
            <span>外观</span>
          </TabsTrigger>
          <TabsTrigger value='hero' className='text-xs flex items-center gap-1.5'>
            <Sparkles className='size-3.5' />
            <span>首屏</span>
          </TabsTrigger>
          <TabsTrigger value='sections' className='text-xs flex items-center gap-1.5'>
            <BarChart3 className='size-3.5' />
            <span>板块</span>
          </TabsTrigger>
          <TabsTrigger value='grid' className='text-xs flex items-center gap-1.5'>
            <LayoutGrid className='size-3.5' />
            <span>列表</span>
          </TabsTrigger>
          <TabsTrigger value='announcement' className='text-xs flex items-center gap-1.5'>
            <Megaphone className='size-3.5' />
            <span>公告</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. 外观设置 */}
        <TabsContent value='appearance' className='space-y-4 pt-2'>
          <div className='rounded-lg border p-4 space-y-3 bg-card/40'>
            <div>
              <Label className='text-sm font-semibold'>强调主色 (Accent Color)</Label>
              <p className='text-xs text-muted-foreground mt-0.5'>
                控制前台按钮光效、高亮文字、渐变边框与徽标颜色。
              </p>
            </div>
            <RadioGroup
              value={config.accent || 'cyan'}
              onValueChange={(val) => update({ accent: val as any })}
              className='grid grid-cols-3 gap-3 pt-1'
            >
              <Label
                htmlFor='accent-cyan'
                className={`flex flex-col items-center justify-between rounded-md border-2 p-3 hover:bg-accent cursor-pointer ${
                  config.accent === 'cyan' ? 'border-[#00f2fe] bg-[#00f2fe]/5' : 'border-muted'
                }`}
              >
                <RadioGroupItem value='cyan' id='accent-cyan' className='sr-only' />
                <div className='size-6 rounded-full bg-[#00f2fe] shadow-sm mb-2' />
                <span className='text-xs font-medium'>极光青 (默认)</span>
              </Label>

              <Label
                htmlFor='accent-gold'
                className={`flex flex-col items-center justify-between rounded-md border-2 p-3 hover:bg-accent cursor-pointer ${
                  config.accent === 'gold' ? 'border-[#f5c86e] bg-[#f5c86e]/5' : 'border-muted'
                }`}
              >
                <RadioGroupItem value='gold' id='accent-gold' className='sr-only' />
                <div className='size-6 rounded-full bg-[#f5c86e] shadow-sm mb-2' />
                <span className='text-xs font-medium'>流光暖金</span>
              </Label>

              <Label
                htmlFor='accent-violet'
                className={`flex flex-col items-center justify-between rounded-md border-2 p-3 hover:bg-accent cursor-pointer ${
                  config.accent === 'violet' ? 'border-[#a78bfa] bg-[#a78bfa]/5' : 'border-muted'
                }`}
              >
                <RadioGroupItem value='violet' id='accent-violet' className='sr-only' />
                <div className='size-6 rounded-full bg-[#a78bfa] shadow-sm mb-2' />
                <span className='text-xs font-medium'>魅影紫</span>
              </Label>
            </RadioGroup>
          </div>
        </TabsContent>

        {/* 2. 首屏 Hero 设置 */}
        <TabsContent value='hero' className='space-y-4 pt-2'>
          <div className='rounded-lg border p-4 space-y-4 bg-card/40'>
            <div>
              <Label className='text-sm font-semibold'>Hero 轮播模式</Label>
              <p className='text-xs text-muted-foreground mt-0.5'>
                指定顶部大幅展示位的内容来源。
              </p>
            </div>
            <RadioGroup
              value={config.hero?.mode || 'featured'}
              onValueChange={(val) =>
                update({ hero: { ...config.hero, mode: val as any } })
              }
              className='grid grid-cols-2 gap-3'
            >
              <Label
                htmlFor='hero-featured'
                className={`flex flex-col rounded-md border-2 p-3 hover:bg-accent cursor-pointer ${
                  config.hero?.mode === 'featured' ? 'border-primary bg-primary/5' : 'border-muted'
                }`}
              >
                <RadioGroupItem value='featured' id='hero-featured' className='sr-only' />
                <span className='text-sm font-medium'>主推软件自动 (默认)</span>
                <span className='text-xs text-muted-foreground mt-1'>
                  自动提取打上“主推”标记的软件并轮播其最新版本
                </span>
              </Label>

              <Label
                htmlFor='hero-promotions'
                className={`flex flex-col rounded-md border-2 p-3 hover:bg-accent cursor-pointer ${
                  config.hero?.mode === 'promotions' ? 'border-primary bg-primary/5' : 'border-muted'
                }`}
              >
                <RadioGroupItem value='promotions' id='hero-promotions' className='sr-only' />
                <span className='text-sm font-medium'>统一推广位投放</span>
                <span className='text-xs text-muted-foreground mt-1'>
                  在“推广位管理”中精细配置宣传图、角标和活动跳转
                </span>
              </Label>
            </RadioGroup>

            <div className='flex items-center justify-between border-t pt-3'>
              <div>
                <Label htmlFor='hero-search' className='text-sm font-medium'>
                  显示大搜索框
                </Label>
                <p className='text-xs text-muted-foreground'>
                  在分类胶囊旁常驻搜索框
                </p>
              </div>
              <Switch
                id='hero-search'
                checked={config.hero?.showSearch !== false}
                onCheckedChange={(val) =>
                  update({ hero: { ...config.hero, showSearch: val } })
                }
              />
            </div>

            <div className='flex items-center justify-between border-t pt-3'>
              <div>
                <Label htmlFor='hero-autoplay' className='text-sm font-medium'>
                  自动轮播间隔 (秒)
                </Label>
                <p className='text-xs text-muted-foreground'>
                  支持 2 至 60 秒轮播切换
                </p>
              </div>
              <Input
                id='hero-autoplay'
                type='number'
                min={2}
                max={60}
                value={config.hero?.autoplaySeconds || 6}
                onChange={(e) =>
                  update({
                    hero: {
                      ...config.hero,
                      autoplaySeconds: Math.max(2, Math.min(60, Number(e.target.value) || 6)),
                    },
                  })
                }
                className='w-20 h-8 text-right'
              />
            </div>
          </div>
        </TabsContent>

        {/* 3. 板块与统计条设置 */}
        <TabsContent value='sections' className='space-y-4 pt-2'>
          <div className='rounded-lg border p-4 space-y-4 bg-card/40'>
            <div className='flex items-center justify-between'>
              <div>
                <Label className='text-sm font-semibold'>4联核心数据概览条</Label>
                <p className='text-xs text-muted-foreground'>
                  展示收录软件、累计下载、本月更新、平台架构
                </p>
              </div>
              <Switch
                checked={config.stats?.show !== false}
                onCheckedChange={(val) =>
                  update({ stats: { ...config.stats, show: val } })
                }
              />
            </div>

            {config.stats?.show !== false && (
              <div className='border-t pt-3 space-y-3'>
                <div className='flex items-center justify-between'>
                  <Label htmlFor='stats-hide-below' className='text-xs'>
                    自动隐藏阈值 (数值低于 N 时不显示该项)
                  </Label>
                  <Input
                    id='stats-hide-below'
                    type='number'
                    min={0}
                    value={config.stats?.hideBelow || 0}
                    onChange={(e) =>
                      update({
                        stats: {
                          ...config.stats,
                          hideBelow: Math.max(0, Number(e.target.value) || 0),
                        },
                      })
                    }
                    className='w-20 h-8 text-right'
                  />
                </div>
              </div>
            )}

            <div className='border-t pt-4 flex items-center justify-between'>
              <div>
                <Label className='text-sm font-semibold'>新品首发横滑栏</Label>
                <p className='text-xs text-muted-foreground'>
                  以横向滑动卡片展示近期发布的软件
                </p>
              </div>
              <Switch
                checked={config.newArrivals?.show !== false}
                onCheckedChange={(val) =>
                  update({ newArrivals: { ...config.newArrivals, show: val } })
                }
              />
            </div>

            {config.newArrivals?.show !== false && (
              <div className='grid grid-cols-2 gap-3 pl-2'>
                <div>
                  <Label className='text-xs'>新品天数周期</Label>
                  <Input
                    type='number'
                    min={1}
                    max={365}
                    value={config.newArrivals?.days || 30}
                    onChange={(e) =>
                      update({
                        newArrivals: {
                          ...config.newArrivals,
                          days: Math.max(1, Number(e.target.value) || 30),
                        },
                      })
                    }
                    className='h-8 mt-1'
                  />
                </div>
                <div>
                  <Label className='text-xs'>最多收录条数</Label>
                  <Input
                    type='number'
                    min={1}
                    max={20}
                    value={config.newArrivals?.max || 8}
                    onChange={(e) =>
                      update({
                        newArrivals: {
                          ...config.newArrivals,
                          max: Math.max(1, Number(e.target.value) || 8),
                        },
                      })
                    }
                    className='h-8 mt-1'
                  />
                </div>
              </div>
            )}

            <div className='border-t pt-4 flex items-center justify-between'>
              <div>
                <Label className='text-sm font-semibold'>右侧热度排行榜</Label>
                <p className='text-xs text-muted-foreground'>
                  展示下载总榜与最近更新动态
                </p>
              </div>
              <Switch
                checked={config.ranking?.show !== false}
                onCheckedChange={(val) =>
                  update({ ranking: { ...config.ranking, show: val } })
                }
              />
            </div>
          </div>
        </TabsContent>

        {/* 4. 列表与排版密度设置 */}
        <TabsContent value='grid' className='space-y-4 pt-2'>
          <div className='rounded-lg border p-4 space-y-4 bg-card/40'>
            <div>
              <Label className='text-sm font-semibold'>卡片展示密度 (Density)</Label>
              <p className='text-xs text-muted-foreground mt-0.5'>
                决定全部软件矩阵的展示模式。
              </p>
            </div>
            <RadioGroup
              value={config.density || 'comfortable'}
              onValueChange={(val) => update({ density: val as any })}
              className='grid grid-cols-3 gap-3'
            >
              <Label
                htmlFor='density-comfortable'
                className={`flex flex-col items-center justify-between rounded-md border-2 p-3 hover:bg-accent cursor-pointer ${
                  config.density === 'comfortable' ? 'border-primary bg-primary/5' : 'border-muted'
                }`}
              >
                <RadioGroupItem value='comfortable' id='density-comfortable' className='sr-only' />
                <span className='text-xs font-semibold'>标准 3 列卡片</span>
                <span className='text-[11px] text-muted-foreground mt-1 text-center'>
                  大图高质感 (默认)
                </span>
              </Label>

              <Label
                htmlFor='density-compact'
                className={`flex flex-col items-center justify-between rounded-md border-2 p-3 hover:bg-accent cursor-pointer ${
                  config.density === 'compact' ? 'border-primary bg-primary/5' : 'border-muted'
                }`}
              >
                <RadioGroupItem value='compact' id='density-compact' className='sr-only' />
                <span className='text-xs font-semibold'>紧凑 4 列卡片</span>
                <span className='text-[11px] text-muted-foreground mt-1 text-center'>
                  高密度收录
                </span>
              </Label>

              <Label
                htmlFor='density-list'
                className={`flex flex-col items-center justify-between rounded-md border-2 p-3 hover:bg-accent cursor-pointer ${
                  config.density === 'list' ? 'border-primary bg-primary/5' : 'border-muted'
                }`}
              >
                <RadioGroupItem value='list' id='density-list' className='sr-only' />
                <span className='text-xs font-semibold'>单列信息行</span>
                <span className='text-[11px] text-muted-foreground mt-1 text-center'>
                  列表快捷下载
                </span>
              </Label>
            </RadioGroup>

            <div className='flex items-center justify-between border-t pt-3'>
              <div>
                <Label htmlFor='page-size' className='text-sm font-medium'>
                  每页默认加载条数
                </Label>
                <p className='text-xs text-muted-foreground'>
                  超出部分支持点击“加载更多”
                </p>
              </div>
              <Input
                id='page-size'
                type='number'
                min={4}
                max={60}
                value={config.pageSize || 12}
                onChange={(e) =>
                  update({ pageSize: Math.max(4, Math.min(60, Number(e.target.value) || 12)) })
                }
                className='w-20 h-8 text-right'
              />
            </div>
          </div>
        </TabsContent>

        {/* 5. 顶部公告条设置 */}
        <TabsContent value='announcement' className='space-y-4 pt-2'>
          <div className='rounded-lg border p-4 space-y-4 bg-card/40'>
            <div className='flex items-center justify-between'>
              <div>
                <Label className='text-sm font-semibold'>开启全站顶部公告条</Label>
                <p className='text-xs text-muted-foreground'>
                  在软件中心最顶端显示横幅通告或重大活动链接
                </p>
              </div>
              <Switch
                checked={Boolean(config.announcement?.show)}
                onCheckedChange={(val) =>
                  update({
                    announcement: {
                      ...(config.announcement || { text: '', href: '', tone: 'info' }),
                      show: val,
                    },
                  })
                }
              />
            </div>

            {config.announcement?.show && (
              <div className='space-y-3 border-t pt-3'>
                <div>
                  <Label htmlFor='ann-text' className='text-xs font-medium'>
                    公告文案
                  </Label>
                  <Input
                    id='ann-text'
                    placeholder='例如：天才猫桌面 2.0 震撼发布，全新黑科技支持...'
                    value={config.announcement?.text || ''}
                    onChange={(e) =>
                      update({
                        announcement: {
                          ...(config.announcement || { show: true, href: '', tone: 'info' }),
                          text: e.target.value,
                        },
                      })
                    }
                    className='h-8 mt-1'
                  />
                </div>

                <div>
                  <Label htmlFor='ann-href' className='text-xs font-medium'>
                    跳转链接 (可选)
                  </Label>
                  <Input
                    id='ann-href'
                    placeholder='/desktop.html 或 https://...'
                    value={config.announcement?.href || ''}
                    onChange={(e) =>
                      update({
                        announcement: {
                          ...(config.announcement || { show: true, text: '', tone: 'info' }),
                          href: e.target.value,
                        },
                      })
                    }
                    className='h-8 mt-1'
                  />
                </div>

                <div>
                  <Label className='text-xs font-medium'>公告基调色 (Tone)</Label>
                  <div className='grid grid-cols-3 gap-2 mt-1.5'>
                    {(['info', 'warning', 'success'] as const).map((t) => (
                      <button
                        key={t}
                        type='button'
                        onClick={() =>
                          update({
                            announcement: {
                              ...(config.announcement || { show: true, text: '', href: '' }),
                              tone: t,
                            },
                          })
                        }
                        className={`py-1.5 px-3 text-xs rounded border transition-all ${
                          config.announcement?.tone === t
                            ? 'border-primary bg-primary/10 font-medium'
                            : 'border-muted text-muted-foreground'
                        }`}
                      >
                        {t === 'info' ? '青色提示' : t === 'warning' ? '暖黄警示' : '翠绿成功'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
