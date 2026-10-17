import { ExternalLink, Eye, Monitor } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function SoftwareCenterPreviewCard() {
  return (
    <Card className='border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden'>
      <CardHeader className='flex flex-row items-center justify-between pb-3'>
        <div className='space-y-1'>
          <CardTitle className='flex items-center gap-2 text-base font-semibold'>
            <Monitor className='size-4 text-primary' />
            <span>软件中心预览</span>
            <Badge variant='outline' className='text-[10px] px-1.5 py-0 border-primary/30 text-primary'>
              实时
            </Badge>
          </CardTitle>
          <CardDescription>
            前台软件下载落地页实时缩略渲染（/download.html）
          </CardDescription>
        </div>
        <Button variant='outline' size='sm' className='gap-1.5 text-xs' asChild>
          <a href='/download.html' target='_blank' rel='noreferrer'>
            <ExternalLink className='size-3.5' />
            <span>打开前台</span>
          </a>
        </Button>
      </CardHeader>
      <CardContent className='p-4 pt-0'>
        <div className='relative w-full h-[380px] rounded-xl overflow-hidden border border-border/60 bg-background/95 shadow-inner'>
          <div className='absolute top-2 right-2 z-10 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-full border border-border/60 text-[11px] text-muted-foreground'>
            <span className='size-1.5 rounded-full bg-emerald-400 animate-pulse' />
            <span>Live Preview</span>
          </div>
          <iframe
            src='/download.html'
            title='软件中心前台预览'
            className='size-full border-0'
            loading='lazy'
          />
        </div>
      </CardContent>
    </Card>
  )
}
