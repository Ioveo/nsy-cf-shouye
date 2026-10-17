import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ArticlePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  articleData: {
    title: string
    summary: string
    content: string
    category: string
    coverUrl: string
  }
}

export function ArticlePreviewDialog({
  open,
  onOpenChange,
  articleData,
}: ArticlePreviewDialogProps) {
  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-5xl h-[85vh] p-0 flex flex-col overflow-hidden'>
        <DialogHeader className='p-4 border-b bg-muted/20'>
          <div className='flex items-center justify-between'>
            <div>
              <DialogTitle className='text-sm'>文章前台实时渲染预览</DialogTitle>
              <DialogDescription className='text-xs'>
                通过 postMessage 免保存实时将草稿投射至真实文章页面渲染
              </DialogDescription>
            </div>
            <Button size='sm' variant='outline' className='h-7 text-xs' onClick={() => onOpenChange(false)}>
              关闭预览
            </Button>
          </div>
        </DialogHeader>
        <div className='flex-1 w-full h-full bg-background'>
          <iframe
            src={`/article.html?preview=1&v=${Date.now()}`}
            className='w-full h-full border-0'
            onLoad={(e) => {
              const targetIframe = e.currentTarget
              setTimeout(() => {
                targetIframe.contentWindow?.postMessage(
                  {
                    type: 'studio-preview',
                    article: {
                      title: articleData.title || '草稿文章标题',
                      summary: articleData.summary,
                      content: articleData.content,
                      category: articleData.category,
                      coverUrl: articleData.coverUrl,
                      updatedAt: Date.now(),
                      views: 1,
                    },
                  },
                  '*'
                )
              }, 400)
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
