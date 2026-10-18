import React from 'react'
import {
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Clock,
  ExternalLink,
  Layers,
  FileText,
  Music,
  Globe,
} from 'lucide-react'
import type { PromotionItem } from '@/lib/queries'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

interface PromoTableProps {
  items: PromotionItem[]
  onEdit: (item: PromotionItem) => void
  onDelete: (id: string) => void
  onToggleStatus: (item: PromotionItem) => void
  onMove: (index: number, direction: 'up' | 'down') => void
  isMoving: boolean
}

const PLACEMENT_LABELS: Record<string, { label: string; color: string }> = {
  portal: { label: '官网首页', color: 'border-blue-500/40 text-blue-400 bg-blue-500/10' },
  software: { label: '软件中心', color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10' },
  music: { label: '音乐频道', color: 'border-purple-500/40 text-purple-400 bg-purple-500/10' },
  articles: { label: '文章教程', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  software: <Layers className='size-3 text-cyan-400' />,
  article: <FileText className='size-3 text-amber-400' />,
  playlist: <Music className='size-3 text-purple-400' />,
  custom: <Globe className='size-3 text-emerald-400' />,
}

export function PromoTable({
  items,
  onEdit,
  onDelete,
  onToggleStatus,
  onMove,
  isMoving,
}: PromoTableProps) {
  function formatTimeWindow(startAt: number, endAt: number) {
    if (!startAt && !endAt) return '永久有效'
    const start = startAt ? new Date(startAt).toLocaleDateString() : '开始'
    const end = endAt ? new Date(endAt).toLocaleDateString() : '长期'
    return `${start} ~ ${end}`
  }

  if (!items.length) {
    return (
      <div className='flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed'>
        <p className='text-sm text-muted-foreground'>暂无推广位投放项</p>
        <p className='text-xs text-muted-foreground/80 mt-1'>
          点击右上角「新建推广位」按钮，将重点软件、专栏教程或营销活动投放至各大前台首屏。
        </p>
      </div>
    )
  }

  return (
    <div className='rounded-xl border overflow-hidden bg-card/40'>
      <div className='overflow-x-auto'>
        <table className='w-full text-xs text-left'>
          <thead className='bg-muted/50 border-b text-muted-foreground uppercase text-[11px] font-semibold'>
            <tr>
              <th className='px-4 py-3 w-16 text-center'>排序</th>
              <th className='px-4 py-3 min-w-[200px]'>推广内容</th>
              <th className='px-4 py-3 w-28'>类型 / 实体</th>
              <th className='px-4 py-3 min-w-[160px]'>投放页面</th>
              <th className='px-4 py-3 min-w-[150px]'>时间窗口</th>
              <th className='px-4 py-3 w-24 text-center'>状态</th>
              <th className='px-4 py-3 w-28 text-right'>操作</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-border/60'>
            {items.map((item, idx) => {
              const entityType = item.entity?.type || 'custom'
              const title = item.override?.title || `推广 #${item.id}`
              const imgUrl = item.override?.image || ''

              return (
                <tr key={item.id} className='hover:bg-muted/30 transition-colors'>
                  {/* 排序操作 */}
                  <td className='px-4 py-3 text-center'>
                    <div className='flex items-center justify-center gap-1'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-6'
                        disabled={idx === 0 || isMoving}
                        onClick={() => onMove(idx, 'up')}
                        title='上移'
                      >
                        <ArrowUp className='size-3' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-6'
                        disabled={idx === items.length - 1 || isMoving}
                        onClick={() => onMove(idx, 'down')}
                        title='下移'
                      >
                        <ArrowDown className='size-3' />
                      </Button>
                    </div>
                  </td>

                  {/* 缩略图与标题 */}
                  <td className='px-4 py-3'>
                    <div className='flex items-center gap-3'>
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={title}
                          className='size-12 rounded-lg object-cover border bg-muted flex-shrink-0'
                        />
                      ) : (
                        <div className='size-12 rounded-lg bg-muted flex items-center justify-center border flex-shrink-0 text-muted-foreground'>
                          {TYPE_ICONS[entityType]}
                        </div>
                      )}
                      <div className='min-w-0'>
                        <div className='flex items-center gap-1.5'>
                          <span className='font-semibold text-sm truncate text-foreground'>
                            {title}
                          </span>
                          {item.badge && (
                            <Badge variant='outline' className='text-[10px] py-0 px-1.5 h-4'>
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className='text-muted-foreground text-xs truncate mt-0.5 max-w-[240px]'>
                          {item.override?.subtitle || item.override?.ctaHref || '—'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* 类型与实体 */}
                  <td className='px-4 py-3'>
                    <div className='flex items-center gap-1.5'>
                      {TYPE_ICONS[entityType]}
                      <span className='font-medium'>
                        {entityType === 'software'
                          ? '软件'
                          : entityType === 'article'
                          ? '文章'
                          : entityType === 'playlist'
                          ? '歌单'
                          : '自定义外链'}
                      </span>
                    </div>
                    {item.entity?.id && (
                      <p className='text-[10px] text-muted-foreground truncate font-mono mt-0.5'>
                        {item.entity.id}
                      </p>
                    )}
                  </td>

                  {/* 投放位置 */}
                  <td className='px-4 py-3'>
                    <div className='flex flex-wrap gap-1'>
                      {(item.placements || []).map((p) => {
                        const info = PLACEMENT_LABELS[p] || { label: p, color: '' }
                        return (
                          <span
                            key={p}
                            className={`text-[10px] px-2 py-0.5 rounded-full border ${info.color}`}
                          >
                            {info.label}
                          </span>
                        )
                      })}
                    </div>
                  </td>

                  {/* 时间窗口 */}
                  <td className='px-4 py-3 text-muted-foreground'>
                    <div className='flex items-center gap-1.5'>
                      <Clock className='size-3 text-muted-foreground' />
                      <span>{formatTimeWindow(item.startAt, item.endAt)}</span>
                    </div>
                  </td>

                  {/* 状态开关 */}
                  <td className='px-4 py-3 text-center'>
                    <Switch
                      checked={item.status === 'active'}
                      onCheckedChange={() => onToggleStatus(item)}
                    />
                  </td>

                  {/* 操作按钮 */}
                  <td className='px-4 py-3 text-right'>
                    <div className='flex items-center justify-end gap-1'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-7'
                        onClick={() => onEdit(item)}
                        title='编辑'
                      >
                        <Edit2 className='size-3.5' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-7 text-red-400 hover:text-red-300'
                        onClick={() => onDelete(item.id)}
                        title='删除'
                      >
                        <Trash2 className='size-3.5' />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
