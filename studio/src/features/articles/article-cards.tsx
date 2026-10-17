import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Edit2,
  Trash2,
  Eye,
  Sparkles,
} from 'lucide-react'

interface ArticleCardsProps {
  articles: any[]
  onEdit: (art: any) => void
  onDelete: (art: any) => void
  onPreview: (art: any) => void
}

export function ArticleCards({
  articles,
  onEdit,
  onDelete,
  onPreview,
}: ArticleCardsProps) {
  if (articles.length === 0) {
    return (
      <div className='py-12 text-center text-xs text-muted-foreground'>
        暂无符合筛选条件的文章
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
      {articles.map((art) => (
        <Card key={art.id} className='flex flex-col justify-between overflow-hidden'>
          <div>
            {art.coverUrl && (
              <div className='aspect-video w-full overflow-hidden bg-muted'>
                <img
                  src={art.coverUrl}
                  alt={art.title}
                  className='w-full h-full object-cover transition-transform duration-300 hover:scale-105'
                  loading='lazy'
                />
              </div>
            )}
            <CardHeader className='p-4 pb-2'>
              <div className='flex items-center justify-between gap-2 mb-1.5'>
                <Badge variant='outline' className='text-[10px]'>
                  {art.category || '未分类'}
                </Badge>
                <div className='flex items-center gap-1.5'>
                  {art.featured && (
                    <span title='推荐文章'>
                      <Sparkles className='size-3 text-amber-500' />
                    </span>
                  )}
                  <Badge
                    variant={art.status === 'published' ? 'default' : 'secondary'}
                    className='text-[10px]'
                  >
                    {art.status === 'published' ? '已发布' : '草稿'}
                  </Badge>
                </div>
              </div>
              <CardTitle className='text-sm line-clamp-1 font-bold'>
                {art.title}
              </CardTitle>
              {art.summary && (
                <CardDescription className='text-xs line-clamp-2 mt-1'>
                  {art.summary}
                </CardDescription>
              )}
            </CardHeader>
          </div>

          <CardFooter className='p-4 pt-2 flex items-center justify-between border-t bg-muted/20 text-xs text-muted-foreground'>
            <span className='font-mono'>
              {art.updatedAt
                ? new Date(art.updatedAt).toLocaleDateString()
                : '-'}
            </span>
            <div className='flex items-center gap-1'>
              <Button
                size='icon'
                variant='ghost'
                className='size-7'
                onClick={() => onPreview(art)}
                title='预览文章'
              >
                <Eye className='size-3.5' />
              </Button>
              <Button
                size='icon'
                variant='ghost'
                className='size-7'
                onClick={() => onEdit(art)}
                title='编辑'
              >
                <Edit2 className='size-3.5' />
              </Button>
              <Button
                size='icon'
                variant='ghost'
                className='size-7 text-destructive'
                onClick={() => onDelete(art)}
                title='删除'
              >
                <Trash2 className='size-3.5' />
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
