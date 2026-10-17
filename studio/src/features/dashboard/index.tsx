import { Link, useNavigate } from '@tanstack/react-router'
import {
  Layers,
  Boxes,
  Download,
  LayoutTemplate,
  Plus,
  Zap,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  Clock,
  FileEdit,
  TrendingUp,
  FileText,
  Music,
  Image,
  Sparkles,
} from 'lucide-react'
import { useCatalog, useLanding } from '@/lib/queries'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function formatRelativeTime(timestamp?: number | string) {
  if (!timestamp) return '刚刚'
  const time = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime()
  if (Number.isNaN(time)) return '刚刚'
  const diffSec = Math.floor((Date.now() - time) / 1000)
  if (diffSec < 60) return '刚刚'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} 分钟前`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} 小时前`
  if (diffSec < 86400 * 30) return `${Math.floor(diffSec / 86400)} 天前`
  return new Date(time).toLocaleDateString('zh-CN')
}

export function Dashboard() {
  const navigate = useNavigate()
  const { data: catalog, isLoading: isCatalogLoading } = useCatalog()
  const { data: landing, isLoading: isLandingLoading } = useLanding()

  const softwareList = catalog?.software || []
  const releasesList = catalog?.releases || []
  const categoriesList = catalog?.categories || []
  const articlesList = catalog?.articles || []
  const musicList = catalog?.music || []
  const galleryList = catalog?.gallery || []
  const photoWallList = catalog?.photoWall || []

  // 1. 下载数据与各软件下载占比
  const totalDownloads = releasesList.reduce((acc, r) => acc + (r.downloadCount || 0), 0)
  const publishedReleases = releasesList.filter((r) => r.status === 'published')

  const softwareDownloadStats = softwareList.map((sw) => {
    const swReleases = releasesList.filter((r) => r.softwareId === sw.slug || r.softwareId === sw.id)
    const downloads = swReleases.reduce((sum, r) => sum + (r.downloadCount || 0), 0)
    const percentage = totalDownloads > 0 ? Math.round((downloads / totalDownloads) * 100) : 0
    return {
      id: sw.id || sw.slug,
      name: sw.name,
      slug: sw.slug,
      downloads,
      percentage,
      releaseCount: swReleases.length,
    }
  }).sort((a, b) => b.downloads - a.downloads)

  // 2. 草稿待发布数量汇总 (软件 + 版本 + 文章 + 音乐 + 画廊 + 照片墙)
  const draftSoftwareCount = softwareList.filter((s) => s.status === 'draft').length
  const draftReleasesCount = releasesList.filter((r) => r.status === 'draft').length
  const draftArticlesCount = articlesList.filter((a) => a.status === 'draft').length
  const draftMusicCount = musicList.filter((m) => m.status === 'draft').length
  const draftGalleryCount = galleryList.filter((g) => g.status === 'draft').length
  const totalDraftCount =
    draftSoftwareCount +
    draftReleasesCount +
    draftArticlesCount +
    draftMusicCount +
    draftGalleryCount

  // 3. 最近 5 次操作记录 (跨模块根据 updatedAt 提取)
  interface ActivityItem {
    id: string
    type: string
    title: string
    subtitle: string
    timestamp: number
    icon: any
    link: string
  }

  const allActivities: ActivityItem[] = []

  releasesList.forEach((rel) => {
    const sw = softwareList.find((s) => s.slug === rel.softwareId || s.id === rel.softwareId)
    const time = typeof rel.updatedAt === 'number' ? rel.updatedAt : typeof rel.createdAt === 'number' ? rel.createdAt : 0
    if (time > 0) {
      allActivities.push({
        id: `rel-${rel.id}`,
        type: '版本发布',
        title: `${sw?.name || rel.softwareId} v${rel.version}`,
        subtitle: rel.label || rel.fileName || '安装包发布',
        timestamp: time,
        icon: Boxes,
        link: '/releases',
      })
    }
  })

  softwareList.forEach((sw) => {
    const time = typeof sw.updatedAt === 'number' ? sw.updatedAt : typeof sw.createdAt === 'number' ? sw.createdAt : 0
    if (time > 0) {
      allActivities.push({
        id: `sw-${sw.id || sw.slug}`,
        type: '软件资料',
        title: sw.name,
        subtitle: sw.tagline || sw.slug,
        timestamp: time,
        icon: Layers,
        link: `/software/${sw.id || sw.slug}`,
      })
    }
  })

  articlesList.forEach((art) => {
    const time = typeof art.updatedAt === 'number' ? art.updatedAt : typeof art.createdAt === 'number' ? art.createdAt : 0
    if (time > 0) {
      allActivities.push({
        id: `art-${art.id}`,
        type: '文章动态',
        title: art.title,
        subtitle: art.category || '文章发布',
        timestamp: time,
        icon: FileText,
        link: '/content',
      })
    }
  })

  galleryList.forEach((gal) => {
    const time = typeof gal.updatedAt === 'number' ? gal.updatedAt : typeof gal.createdAt === 'number' ? gal.createdAt : 0
    if (time > 0) {
      allActivities.push({
        id: `gal-${gal.id}`,
        type: '画廊更新',
        title: gal.title || '图片素材',
        subtitle: gal.description || '画廊图片',
        timestamp: time,
        icon: Image,
        link: '/content',
      })
    }
  })

  musicList.forEach((mus) => {
    const time = typeof mus.updatedAt === 'number' ? mus.updatedAt : typeof mus.createdAt === 'number' ? mus.createdAt : 0
    if (time > 0) {
      allActivities.push({
        id: `mus-${mus.id}`,
        type: '音乐更新',
        title: mus.title,
        subtitle: mus.artist || '音频文件',
        timestamp: time,
        icon: Music,
        link: '/content',
      })
    }
  })

  const recentActivities = allActivities
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)

  // 4. 当前首页模式
  const activeLandingId = landing?.homeLanding || 'portal'
  const activeLandingTitle =
    landing?.pages?.find((p) => p.id === activeLandingId)?.title || activeLandingId

  const recentReleases = [...releasesList]
    .sort((a, b) => {
      const timeA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt || 0).getTime()
      const timeB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt || 0).getTime()
      return timeB - timeA
    })
    .slice(0, 5)

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 pt-0 md:gap-8 md:p-8'>
      {/* 顶部标题与主要操作 */}
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>仪表盘</h1>
          <p className='text-sm text-muted-foreground'>
            天才猫软件中心与多落地页分发总览
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            size='sm'
            onClick={() => navigate({ to: '/software/new' as any })}
          >
            <Plus className='mr-2 size-4' />
            发布新软件
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={() => navigate({ to: '/releases', search: { action: 'upload' } as any })}
          >
            <Boxes className='mr-2 size-4' />
            上传新版本
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={() => navigate({ to: '/hotupdate' })}
          >
            <Zap className='mr-2 size-4 text-primary' />
            在线热更
          </Button>
        </div>
      </div>

      {/* Overview Cards (5 Grid) */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
        <Card className='border-border/60 bg-card/60 backdrop-blur-sm'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>软件产品总数</CardTitle>
            <Layers className='size-4 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {isCatalogLoading ? '--' : softwareList.length}
            </div>
            <p className='text-xs text-muted-foreground'>
              涵盖 {categoriesList.length} 个分类
            </p>
          </CardContent>
        </Card>

        <Card className='border-border/60 bg-card/60 backdrop-blur-sm'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>已发布安装包</CardTitle>
            <Boxes className='size-4 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {isCatalogLoading ? '--' : publishedReleases.length}
            </div>
            <p className='text-xs text-muted-foreground'>
              共 {releasesList.length} 个版本记录
            </p>
          </CardContent>
        </Card>

        <Card className='border-border/60 bg-card/60 backdrop-blur-sm'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>累计下载次数</CardTitle>
            <Download className='size-4 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {isCatalogLoading ? '--' : totalDownloads.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>全渠道安装包下载汇总</p>
          </CardContent>
        </Card>

        {/* 草稿待发布数量卡片 */}
        <Card className='border-border/60 bg-card/60 backdrop-blur-sm'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>草稿待发布</CardTitle>
            <FileEdit className='size-4 text-amber-500' />
          </CardHeader>
          <CardContent>
            <div className='flex items-baseline gap-2'>
              <span className='text-2xl font-bold text-amber-500'>
                {isCatalogLoading ? '--' : totalDraftCount}
              </span>
              <span className='text-xs text-muted-foreground'>项草稿</span>
            </div>
            <p className='text-xs text-muted-foreground'>
              含软件 {draftSoftwareCount}、文章 {draftArticlesCount}、素材 {draftGalleryCount + draftMusicCount}
            </p>
          </CardContent>
        </Card>

        <Card className='border-border/60 bg-card/60 backdrop-blur-sm'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>当前首页落地页</CardTitle>
            <LayoutTemplate className='size-4 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2'>
              <span className='truncate text-xl font-bold'>
                {isLandingLoading ? '--' : activeLandingTitle}
              </span>
              <Badge variant='outline' className='text-xs'>
                /{activeLandingId}
              </Badge>
            </div>
            <p className='mt-1 text-xs text-muted-foreground'>
              可在「落地页配置」随时切换首页
            </p>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-4 md:grid-cols-7'>
        {/* Left Column (Col-4): 下载占比与最近版本 */}
        <div className='space-y-4 md:col-span-4'>
          {/* 各软件下载占比趋势 */}
          <Card className='border-border/60 bg-card/60'>
            <CardHeader className='flex flex-row items-center justify-between pb-3'>
              <div>
                <CardTitle className='flex items-center gap-2 text-base font-semibold'>
                  <TrendingUp className='size-4 text-primary' />
                  各软件下载量占比与分布
                </CardTitle>
                <CardDescription>各产品在全站总下载中的分发份额</CardDescription>
              </div>
              <Badge variant='secondary' className='font-mono text-xs'>
                共 {totalDownloads.toLocaleString()} 次
              </Badge>
            </CardHeader>
            <CardContent>
              {softwareDownloadStats.length === 0 ? (
                <div className='py-8 text-center text-sm text-muted-foreground'>
                  暂无软件下载数据
                </div>
              ) : (
                <div className='space-y-3.5'>
                  {softwareDownloadStats.slice(0, 5).map((item, idx) => (
                    <div key={item.id} className='space-y-1.5'>
                      <div className='flex items-center justify-between text-xs font-medium'>
                        <div className='flex items-center gap-2 min-w-0'>
                          <span className='flex size-4 items-center justify-center rounded-full bg-secondary text-[10px] text-muted-foreground'>
                            {idx + 1}
                          </span>
                          <span className='truncate'>{item.name}</span>
                          <span className='text-[11px] text-muted-foreground font-normal'>
                            ({item.releaseCount} 个安装包)
                          </span>
                        </div>
                        <div className='flex items-center gap-2 shrink-0 font-mono'>
                          <span className='text-foreground'>{item.downloads.toLocaleString()} 次</span>
                          <span className='text-muted-foreground font-semibold'>
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className='h-2 w-full overflow-hidden rounded-full bg-secondary/80'>
                        <div
                          className='h-full bg-gradient-to-r from-primary to-amber-400 transition-all duration-500 ease-out rounded-full'
                          style={{ width: `${Math.max(item.percentage, 3)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Releases */}
          <Card className='border-border/60 bg-card/60'>
            <CardHeader className='flex flex-row items-center justify-between pb-3'>
              <div>
                <CardTitle className='text-base font-semibold'>最近发布的版本</CardTitle>
                <CardDescription>各软件最近发布的安装包记录</CardDescription>
              </div>
              <Button variant='ghost' size='sm' asChild>
                <Link to='/releases'>
                  查看全部
                  <ArrowUpRight className='ml-1 size-4' />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentReleases.length === 0 ? (
                <div className='py-8 text-center text-sm text-muted-foreground'>
                  暂无版本发布记录
                </div>
              ) : (
                <div className='space-y-2.5'>
                  {recentReleases.map((rel) => {
                    const sw = softwareList.find((s) => s.slug === rel.softwareId || s.id === rel.softwareId)
                    return (
                      <div
                        key={rel.id}
                        className='flex items-center justify-between rounded-lg border border-border/40 p-2.5 text-sm hover:bg-secondary/20 transition-colors'
                      >
                        <div className='flex items-center gap-3 min-w-0'>
                          <div className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-semibold text-primary'>
                            {sw?.name?.[0] || '软'}
                          </div>
                          <div className='min-w-0'>
                            <div className='flex items-center gap-2'>
                              <span className='font-semibold truncate text-sm'>
                                {sw?.name || rel.softwareId}
                              </span>
                              <Badge variant='secondary' className='text-[11px] px-1.5 py-0'>
                                v{rel.version}
                              </Badge>
                              {rel.isLatest && (
                                <Badge className='bg-primary/20 text-primary border-primary/30 text-[10px] px-1 py-0'>
                                  最新
                                </Badge>
                              )}
                            </div>
                            <p className='truncate text-xs text-muted-foreground'>
                              {rel.label || rel.fileName || '安装包'} · {rel.platform || 'windows'}
                            </p>
                          </div>
                        </div>
                        <div className='text-right shrink-0 pl-2'>
                          <span className='font-mono text-xs text-muted-foreground'>
                            {rel.downloadCount || 0} 次下载
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Col-3): 最近 5 次操作记录与快捷直达 */}
        <div className='space-y-4 md:col-span-3'>
          {/* 最近 5 次操作记录 */}
          <Card className='border-border/60 bg-card/60'>
            <CardHeader className='flex flex-row items-center justify-between pb-3'>
              <div>
                <CardTitle className='flex items-center gap-2 text-base font-semibold'>
                  <Clock className='size-4 text-primary' />
                  最近 5 次管理操作
                </CardTitle>
                <CardDescription>根据全站最新更新时间汇总</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <div className='py-8 text-center text-sm text-muted-foreground'>
                  暂无近期操作
                </div>
              ) : (
                <div className='space-y-3'>
                  {recentActivities.map((act) => {
                    const IconComponent = act.icon
                    return (
                      <div
                        key={act.id}
                        className='flex items-start gap-3 rounded-lg border border-border/40 p-2.5 hover:bg-secondary/30 transition-colors'
                      >
                        <div className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5'>
                          <IconComponent className='size-4' />
                        </div>
                        <div className='min-w-0 flex-1'>
                          <div className='flex items-center justify-between gap-1'>
                            <span className='truncate text-xs font-semibold text-foreground'>
                              {act.title}
                            </span>
                            <span className='shrink-0 text-[11px] text-muted-foreground'>
                              {formatRelativeTime(act.timestamp)}
                            </span>
                          </div>
                          <div className='flex items-center gap-1.5 mt-0.5'>
                            <Badge variant='outline' className='text-[10px] px-1 py-0 h-4'>
                              {act.type}
                            </Badge>
                            <span className='truncate text-xs text-muted-foreground'>
                              {act.subtitle}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 前台快速直达 */}
          <Card className='border-border/60 bg-card/60'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base font-semibold'>前台快速直达</CardTitle>
              <CardDescription>一键在新标签页中预览前台页面效果</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 gap-2'>
                <Button variant='outline' size='sm' className='justify-start text-xs' asChild>
                  <a href='/' target='_blank' rel='noreferrer'>
                    <ExternalLink className='mr-1.5 size-3.5 text-muted-foreground' />
                    综合门户
                  </a>
                </Button>
                <Button variant='outline' size='sm' className='justify-start text-xs' asChild>
                  <a href='/download.html' target='_blank' rel='noreferrer'>
                    <ExternalLink className='mr-1.5 size-3.5 text-muted-foreground' />
                    软件下载站
                  </a>
                </Button>
                <Button variant='outline' size='sm' className='justify-start text-xs' asChild>
                  <a href='/articles.html' target='_blank' rel='noreferrer'>
                    <ExternalLink className='mr-1.5 size-3.5 text-muted-foreground' />
                    文章教程
                  </a>
                </Button>
                <Button variant='outline' size='sm' className='justify-start text-xs' asChild>
                  <a href='/music.html' target='_blank' rel='noreferrer'>
                    <ExternalLink className='mr-1.5 size-3.5 text-muted-foreground' />
                    音乐频道
                  </a>
                </Button>
                <Button variant='outline' size='sm' className='justify-start text-xs' asChild>
                  <a href='/gallery.html' target='_blank' rel='noreferrer'>
                    <ExternalLink className='mr-1.5 size-3.5 text-muted-foreground' />
                    图片画廊
                  </a>
                </Button>
                <Button variant='outline' size='sm' className='justify-start text-xs' asChild>
                  <a href='/photo-wall.html' target='_blank' rel='noreferrer'>
                    <ExternalLink className='mr-1.5 size-3.5 text-muted-foreground' />
                    照片墙
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
