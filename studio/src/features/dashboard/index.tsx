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

export function Dashboard() {
  const navigate = useNavigate()
  const { data: catalog, isLoading: isCatalogLoading } = useCatalog()
  const { data: landing, isLoading: isLandingLoading } = useLanding()

  const softwareList = catalog?.software || []
  const releasesList = catalog?.releases || []
  const categoriesList = catalog?.categories || []

  const totalDownloads = releasesList.reduce((acc, r) => acc + (r.downloadCount || 0), 0)
  const publishedReleases = releasesList.filter((r) => r.status === 'published')
  const recentReleases = [...releasesList]
    .sort((a, b) => {
      const timeA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt || 0).getTime()
      const timeB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt || 0).getTime()
      return timeB - timeA
    })
    .slice(0, 5)

  const activeLandingId = landing?.homeLanding || 'portal'
  const activeLandingTitle =
    landing?.pages?.find((p) => p.id === activeLandingId)?.title || activeLandingId

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 pt-0 md:gap-8 md:p-8'>
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

      {/* Overview Cards */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
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
        {/* Recent Releases */}
        <Card className='border-border/60 bg-card/60 md:col-span-4'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle>最近发布的版本</CardTitle>
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
              <div className='space-y-3'>
                {recentReleases.map((rel) => {
                  const sw = softwareList.find((s) => s.slug === rel.softwareId)
                  return (
                    <div
                      key={rel.id}
                      className='flex items-center justify-between rounded-lg border border-border/40 p-3 text-sm'
                    >
                      <div className='flex items-center gap-3 min-w-0'>
                        <div className='flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold'>
                          {sw?.name?.[0] || '软'}
                        </div>
                        <div className='min-w-0'>
                          <div className='flex items-center gap-2'>
                            <span className='font-semibold truncate'>
                              {sw?.name || rel.softwareId}
                            </span>
                            <Badge variant='secondary' className='text-xs'>
                              v{rel.version}
                            </Badge>
                            {rel.isLatest && (
                              <Badge className='bg-primary/20 text-primary border-primary/30 text-xs'>
                                最新
                              </Badge>
                            )}
                          </div>
                          <p className='truncate text-xs text-muted-foreground'>
                            {rel.label || rel.fileName || '安装包'} · {rel.platform || 'windows'}
                          </p>
                        </div>
                      </div>
                      <div className='text-right shrink-0'>
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

        {/* Software Matrix & Quick Links */}
        <Card className='border-border/60 bg-card/60 md:col-span-3'>
          <CardHeader>
            <CardTitle>软件矩阵总览</CardTitle>
            <CardDescription>当前管理的软件产品</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {softwareList.length === 0 ? (
              <div className='py-8 text-center text-sm text-muted-foreground'>
                暂无软件，点击上方按钮新增
              </div>
            ) : (
              <div className='space-y-2'>
                {softwareList.slice(0, 6).map((sw) => {
                  const count = releasesList.filter((r) => r.softwareId === sw.slug).length
                  return (
                    <div
                      key={sw.slug}
                      className='flex items-center justify-between rounded-md p-2 hover:bg-secondary/40'
                    >
                      <div className='min-w-0 flex-1 pr-2'>
                        <div className='font-medium truncate'>{sw.name}</div>
                        <div className='text-xs text-muted-foreground truncate'>
                          {sw.tagline || sw.slug}
                        </div>
                      </div>
                      <Badge variant='outline' className='text-xs shrink-0'>
                        {count} 个包
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}

            <div className='border-t border-border/40 pt-4'>
              <h4 className='mb-2 text-xs font-semibold text-muted-foreground'>
                前台快速直达
              </h4>
              <div className='flex flex-wrap gap-2'>
                <Button variant='outline' size='sm' asChild>
                  <a href='/' target='_blank' rel='noreferrer'>
                    首页 <ExternalLink className='ml-1 size-3' />
                  </a>
                </Button>
                <Button variant='outline' size='sm' asChild>
                  <a href='/download.html' target='_blank' rel='noreferrer'>
                    软件中心 <ExternalLink className='ml-1 size-3' />
                  </a>
                </Button>
                <Button variant='outline' size='sm' asChild>
                  <a href='/desktop.html' target='_blank' rel='noreferrer'>
                    桌面 2.0 <ExternalLink className='ml-1 size-3' />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
