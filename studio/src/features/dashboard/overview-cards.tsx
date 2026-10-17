import { Layers, Boxes, Download, FileEdit, LayoutTemplate } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface OverviewCardsProps {
  isCatalogLoading: boolean
  isLandingLoading: boolean
  softwareCount: number
  categoryCount: number
  publishedReleasesCount: number
  totalReleasesCount: number
  totalDownloads: number
  totalDraftCount: number
  draftSoftwareCount: number
  draftArticlesCount: number
  draftMediaCount: number
  activeLandingTitle: string
  activeLandingId: string
}

export function OverviewCards({
  isCatalogLoading,
  isLandingLoading,
  softwareCount,
  categoryCount,
  publishedReleasesCount,
  totalReleasesCount,
  totalDownloads,
  totalDraftCount,
  draftSoftwareCount,
  draftArticlesCount,
  draftMediaCount,
  activeLandingTitle,
  activeLandingId,
}: OverviewCardsProps) {
  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
      <Card className='border-border/60 bg-card/60 backdrop-blur-sm'>
        <CardHeader className='flex flex-row items-center justify-between pb-2'>
          <CardTitle className='text-sm font-medium'>软件产品总数</CardTitle>
          <Layers className='size-4 text-primary' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {isCatalogLoading ? '--' : softwareCount}
          </div>
          <p className='text-xs text-muted-foreground'>
            涵盖 {categoryCount} 个分类
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
            {isCatalogLoading ? '--' : publishedReleasesCount}
          </div>
          <p className='text-xs text-muted-foreground'>
            共 {totalReleasesCount} 个版本记录
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
            含软件 {draftSoftwareCount}、文章 {draftArticlesCount}、素材 {draftMediaCount}
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
  )
}
