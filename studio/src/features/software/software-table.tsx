import { Link } from '@tanstack/react-router'
import {
  Layers,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  ExternalLink,
  Loader2,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Monitor,
  Apple,
  Terminal,
  FolderArchive,
  Smartphone,
  Eye,
} from 'lucide-react'
import type { Software, Category, Release } from '@/lib/queries'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SoftwareTableProps {
  isLoading: boolean
  softwareList: Software[]
  categories: Category[]
  releases: Release[]
  isSavingOrder: boolean
  onToggleFeatured: (sw: Software, nextFeatured: boolean) => void
  onToggleStatus: (sw: Software) => void
  onMove: (index: number, direction: 'up' | 'down') => void
  onOpenDelete: (sw: Software) => void
  onOpenPreview: (sw: Software) => void
}

function renderPlatformIcon(platform: string) {
  const p = platform.toLowerCase()
  if (p.includes('win')) return <Monitor className='size-3 text-sky-400' />
  if (p.includes('mac') || p.includes('darwin')) return <Apple className='size-3 text-neutral-300' />
  if (p.includes('linux')) return <Terminal className='size-3 text-amber-400' />
  if (p.includes('android')) return <Smartphone className='size-3 text-emerald-400' />
  return <FolderArchive className='size-3 text-muted-foreground' />
}

function formatDate(ts?: number | string) {
  if (!ts) return '-'
  const d = new Date(Number(ts) || ts)
  if (isNaN(d.getTime())) return '-'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function SoftwareTable({
  isLoading,
  softwareList,
  categories,
  releases,
  isSavingOrder,
  onToggleFeatured,
  onToggleStatus,
  onMove,
  onOpenDelete,
  onOpenPreview,
}: SoftwareTableProps) {
  // Helper to compute first released timestamp
  function getFirstReleasedAt(sw: Software, swReleases: Release[]): number {
    if (sw.firstReleasedAt) {
      const t = typeof sw.firstReleasedAt === 'number' ? sw.firstReleasedAt : new Date(sw.firstReleasedAt).getTime()
      if (!isNaN(t) && t > 0) return t
    }
    const validTimes = swReleases
      .map((r) => (typeof r.createdAt === 'number' ? r.createdAt : new Date(r.createdAt || 0).getTime()))
      .filter((t) => !isNaN(t) && t > 0)
    if (validTimes.length > 0) {
      return Math.min(...validTimes)
    }
    if (sw.createdAt) {
      const t = typeof sw.createdAt === 'number' ? sw.createdAt : new Date(sw.createdAt).getTime()
      if (!isNaN(t) && t > 0) return t
    }
    return 0
  }

  // Calculate stats for each software
  function getSoftwareStats(sw: Software) {
    const swReleases = (sw.releases || releases.filter((r) => r.softwareId === sw.slug || r.softwareId === sw.id)) || []
    const totalDownloads = swReleases.reduce((sum, r) => sum + (Number(r.downloadCount) || 0), 0)
    const latestRel = swReleases.find((r) => r.isLatest) || swReleases[0]
    const platforms = Array.from(
      new Set(
        swReleases
          .map((r) => r.platform || 'windows')
          .filter(Boolean)
      )
    )
    const firstReleasedAt = getFirstReleasedAt(sw, swReleases)
    const isNew = firstReleasedAt > 0 && (Date.now() - firstReleasedAt <= 30 * 86400 * 1000)

    return {
      totalDownloads,
      latestVersion: latestRel ? `v${latestRel.version}` : '待上传',
      platforms,
      releaseCount: swReleases.length,
      firstReleasedAt,
      isNew,
    }
  }

  return (
    <div className='rounded-xl border border-border/60 bg-card/60 overflow-hidden backdrop-blur-sm'>
      <div className='overflow-x-auto'>
        <table className='w-full text-left text-sm'>
          <thead className='border-b border-border/60 bg-muted/40 text-xs font-semibold uppercase text-muted-foreground'>
            <tr>
              <th className='px-4 py-3'>图标 & 软件名称</th>
              <th className='px-4 py-3'>分类</th>
              <th className='px-4 py-3'>支持平台</th>
              <th className='px-4 py-3'>最新版本</th>
              <th className='px-4 py-3 text-center'>新品</th>
              <th className='px-4 py-3 text-center'>总下载</th>
              <th className='px-4 py-3 text-center'>首屏主推</th>
              <th className='px-4 py-3 text-center'>状态</th>
              <th className='px-4 py-3'>更新时间</th>
              <th className='px-4 py-3 text-right'>操作</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-border/40'>
            {isLoading ? (
              <tr>
                <td colSpan={10} className='px-4 py-12 text-center text-muted-foreground'>
                  <Loader2 className='mx-auto size-6 animate-spin text-primary' />
                  <p className='mt-2 text-xs'>加载软件列表中...</p>
                </td>
              </tr>
            ) : softwareList.length === 0 ? (
              <tr>
                <td colSpan={10} className='px-4 py-12 text-center text-muted-foreground'>
                  <div className='flex flex-col items-center justify-center gap-2'>
                    <Layers className='size-8 text-muted-foreground/40' />
                    <p className='text-sm'>未找到符合条件的软件</p>
                    <Button
                      variant='outline'
                      size='sm'
                      asChild
                      className='mt-2 gap-1.5'
                    >
                      <Link to='/software/new'>
                        <Plus className='size-3.5' /> 发布第一个软件
                      </Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              softwareList.map((sw, index) => {
                const cat = categories.find((c) => c.id === sw.categoryId)
                const stats = getSoftwareStats(sw)
                const isDraft = sw.status === 'draft'
                const isDisabled = sw.status === 'disabled'
                const isActive = sw.status === 'active' || (!sw.status && !isDraft && !isDisabled)

                return (
                  <tr key={sw.slug} className='hover:bg-muted/30 transition-colors'>
                    {/* Name & Icon */}
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-3'>
                        <div className='relative size-10 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-background/80 shadow-xs flex items-center justify-center'>
                          {sw.iconUrl || sw.icon ? (
                            <img
                              src={sw.iconUrl || sw.icon}
                              alt={sw.name}
                              className='size-full object-cover'
                            />
                          ) : (
                            <div className='font-bold text-primary'>
                              {sw.name[0] || '软'}
                            </div>
                          )}
                        </div>
                        <div className='min-w-0'>
                          <div className='font-semibold text-foreground flex items-center gap-1.5'>
                            <span className='truncate'>{sw.name}</span>
                            {sw.landingUrl && (
                              <a
                                href={sw.landingUrl}
                                target='_blank'
                                rel='noreferrer'
                                className='text-muted-foreground hover:text-primary'
                                title={`专属详情页: ${sw.landingUrl}`}
                              >
                                <ExternalLink className='size-3' />
                              </a>
                            )}
                          </div>
                          <div className='font-mono text-xs text-muted-foreground flex items-center gap-2'>
                            <span>{sw.slug}</span>
                            {sw.tagline && (
                              <span className='truncate max-w-[180px] text-muted-foreground/80' title={sw.tagline}>
                                · {sw.tagline}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className='px-4 py-3'>
                      <Badge variant='outline' className='text-xs'>
                        {cat?.name || sw.categoryId || '通用'}
                      </Badge>
                    </td>

                    {/* Platform Badges */}
                    <td className='px-4 py-3'>
                      <div className='flex flex-wrap items-center gap-1'>
                        {stats.platforms.length === 0 ? (
                          <span className='text-xs text-muted-foreground'>无安装包</span>
                        ) : (
                          stats.platforms.map((p) => (
                            <span
                              key={p}
                              className='inline-flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono'
                              title={p}
                            >
                              {renderPlatformIcon(p)}
                              <span>{p}</span>
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    {/* Latest Version */}
                    <td className='px-4 py-3'>
                      <Badge
                        variant='secondary'
                        className='font-mono text-xs font-medium'
                      >
                        {stats.latestVersion}
                      </Badge>
                    </td>

                    {/* 新品 (UPGRADE_PLAN_V3 Requirement: 30天内首发自动显示，只读) */}
                    <td className='px-4 py-3 text-center'>
                      {stats.isNew ? (
                        <Badge
                          variant='outline'
                          className='border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[11px] font-medium'
                          title={stats.firstReleasedAt ? `首发于 ${new Date(stats.firstReleasedAt).toLocaleDateString('zh-CN')} (30天内新品)` : '新品'}
                        >
                          新品
                        </Badge>
                      ) : (
                        <span className='text-xs text-muted-foreground/40'>-</span>
                      )}
                    </td>

                    {/* Total Downloads */}
                    <td className='px-4 py-3 text-center font-mono text-xs font-semibold text-foreground'>
                      {stats.totalDownloads.toLocaleString()}
                    </td>

                    {/* Featured Switch */}
                    <td className='px-4 py-3 text-center'>
                      <div className='flex items-center justify-center gap-1.5'>
                        <Switch
                          checked={Boolean(sw.featured)}
                          onCheckedChange={(val) => onToggleFeatured(sw, val)}
                        />
                        {sw.featured && (
                          <span title={`已设为主推 (排序: ${sw.featuredOrder || 0})`}>
                            <Sparkles className='size-3 text-primary animate-pulse' />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className='px-4 py-3 text-center'>
                      {isActive && (
                        <Badge variant='outline' className='border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-xs'>
                          已上架
                        </Badge>
                      )}
                      {isDraft && (
                        <Badge variant='outline' className='border-amber-500/40 text-amber-400 bg-amber-500/10 text-xs'>
                          草稿
                        </Badge>
                      )}
                      {isDisabled && (
                        <Badge variant='outline' className='border-muted text-muted-foreground text-xs'>
                          已下架
                        </Badge>
                      )}
                    </td>

                    {/* Updated At */}
                    <td className='px-4 py-3 text-xs text-muted-foreground whitespace-nowrap'>
                      {formatDate(sw.updatedAt || sw.createdAt)}
                    </td>

                    {/* Actions & Reordering */}
                    <td className='px-4 py-3 text-right'>
                      <div className='flex items-center justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='size-7 p-0'
                          disabled={isSavingOrder || index === 0}
                          onClick={() => onMove(index, 'up')}
                          title='上移排序'
                        >
                          <ArrowUp className='size-3.5' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='size-7 p-0'
                          disabled={isSavingOrder || index === softwareList.length - 1}
                          onClick={() => onMove(index, 'down')}
                          title='下移排序'
                        >
                          <ArrowDown className='size-3.5' />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='sm' className='size-7 p-0'>
                              <MoreHorizontal className='size-3.5' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end' className='w-40'>
                            <DropdownMenuItem asChild>
                              <Link to='/software/$id' params={{ id: sw.id || sw.slug }}>
                                <Edit2 className='mr-2 size-3.5' /> 编辑向导
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onOpenPreview(sw)}>
                              <Eye className='mr-2 size-3.5' /> 详情页预览
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                const url = `${window.location.origin}/software.html?slug=${sw.slug}`
                                navigator.clipboard.writeText(url)
                              }}
                            >
                              <ExternalLink className='mr-2 size-3.5' /> 复制外链
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                to='/site/promotions'
                                search={{
                                  createEntity: 'software',
                                  id: sw.id || sw.slug,
                                }}
                              >
                                <Sparkles className='mr-2 size-3.5 text-primary' /> 加入推广位
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onToggleStatus(sw)}>
                              <span className={isActive ? 'text-amber-400' : 'text-emerald-400'}>
                                {isActive ? '下架软件' : '恢复上架'}
                              </span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onOpenDelete(sw)}
                              className='text-destructive focus:text-destructive'
                            >
                              <Trash2 className='mr-2 size-3.5' /> 删除软件
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
