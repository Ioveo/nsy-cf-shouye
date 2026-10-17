import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Edit2,
  Trash2,
  Eye,
  Sparkles,
} from 'lucide-react'

interface ArticleTableProps {
  articles: any[]
  onEdit: (art: any) => void
  onDelete: (art: any) => void
  onPreview: (art: any) => void
}

export function ArticleTable({
  articles,
  onEdit,
  onDelete,
  onPreview,
}: ArticleTableProps) {
  if (articles.length === 0) {
    return (
      <div className='py-12 text-center text-xs text-muted-foreground'>
        暂无符合筛选条件的文章
      </div>
    )
  }

  return (
    <div className='rounded-lg border bg-card overflow-hidden'>
      <table className='w-full text-left text-xs'>
        <thead className='border-b bg-muted/40 font-medium text-muted-foreground'>
          <tr>
            <th className='p-3 pl-4'>标题与摘要</th>
            <th className='p-3'>分类</th>
            <th className='p-3'>状态</th>
            <th className='p-3'>更新时间</th>
            <th className='p-3 text-right pr-4'>操作</th>
          </tr>
        </thead>
        <tbody className='divide-y'>
          {articles.map((art) => (
            <tr key={art.id} className='hover:bg-muted/30 transition-colors'>
              <td className='p-3 pl-4 max-w-[320px]'>
                <div className='flex items-center gap-2'>
                  {art.featured && (
                    <Sparkles className='size-3 text-amber-500 shrink-0' />
                  )}
                  <span className='font-medium text-foreground truncate'>
                    {art.title}
                  </span>
                </div>
                {art.summary && (
                  <p className='text-muted-foreground line-clamp-1 mt-0.5'>
                    {art.summary}
                  </p>
                )}
              </td>
              <td className='p-3 whitespace-nowrap text-muted-foreground'>
                {art.category || '未分类'}
              </td>
              <td className='p-3 whitespace-nowrap'>
                <Badge
                  variant={art.status === 'published' ? 'default' : 'secondary'}
                  className='text-[10px]'
                >
                  {art.status === 'published' ? '已发布' : '草稿'}
                </Badge>
              </td>
              <td className='p-3 whitespace-nowrap text-muted-foreground font-mono'>
                {art.updatedAt
                  ? new Date(art.updatedAt).toLocaleDateString()
                  : '-'}
              </td>
              <td className='p-3 text-right pr-4 whitespace-nowrap space-x-1'>
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
