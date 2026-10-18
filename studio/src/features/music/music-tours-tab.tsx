import { useState } from 'react'
import { toast } from 'sonner'
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { MusicTourItem } from './types'

interface MusicToursTabProps {
  tours: MusicTourItem[]
  onChangeTours: (next: MusicTourItem[]) => void
}

export function MusicToursTab({ tours, onChangeTours }: MusicToursTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTour, setEditingTour] = useState<MusicTourItem | null>(null)

  // Form states
  const [date, setDate] = useState('')
  const [city, setCity] = useState('')
  const [venue, setVenue] = useState('')
  const [status, setStatus] = useState<'hot' | 'sold' | 'soon'>('hot')
  const [statusLabel, setStatusLabel] = useState('余票')

  function handleOpenCreate() {
    setEditingTour(null)
    setDate('2026.11.08')
    setCity('')
    setVenue('')
    setStatus('hot')
    setStatusLabel('余票')
    setDialogOpen(true)
  }

  function handleOpenEdit(tour: MusicTourItem) {
    setEditingTour(tour)
    setDate(tour.date || '')
    setCity(tour.city || '')
    setVenue(tour.venue || '')
    setStatus(tour.status || 'hot')
    setStatusLabel(tour.statusLabel || '余票')
    setDialogOpen(true)
  }

  function handleDelete(tour: MusicTourItem) {
    if (!confirm(`确定要删除「${tour.city}」站巡演吗？`)) return
    onChangeTours(tours.filter((t) => t.id !== tour.id))
    toast.success(`「${tour.city}」站巡演已移除`)
  }

  function handleMove(idx: number, direction: 'up' | 'down') {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= tours.length) return
    const next = [...tours]
    const temp = next[idx]
    next[idx] = next[targetIdx]
    next[targetIdx] = temp
    onChangeTours(next)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!city.trim() || !date.trim()) {
      toast.error('请填写演出日期与城市')
      return
    }

    const newItem: MusicTourItem = {
      id: editingTour?.id || `tour_${Date.now()}`,
      date: date.trim(),
      city: city.trim(),
      venue: venue.trim() || 'LiveHouse',
      status,
      statusLabel: statusLabel.trim() || (status === 'sold' ? '售罄' : status === 'soon' ? '待售' : '余票'),
    }

    if (editingTour) {
      onChangeTours(tours.map((t) => (t.id === editingTour.id ? newItem : t)))
      toast.success(`「${newItem.city}」站演出已更新`)
    } else {
      onChangeTours([...tours, newItem])
      toast.success(`新增「${newItem.city}」站巡演已添加`)
    }
    setDialogOpen(false)
  }

  return (
    <div className='space-y-5'>
      {/* 头部说明与添加 */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <div>
          <h3 className='text-base font-semibold flex items-center gap-2'>
            <Calendar className='size-5 text-amber-400' />
            <span>全国巡演日程 (On Tour)</span>
          </h3>
          <p className='text-xs text-muted-foreground mt-0.5'>
            前台第 8 模块的演出日程路线表，展示日期、城市、场馆与票务状态。
          </p>
        </div>
        <Button onClick={handleOpenCreate} size='sm' className='gap-1.5'>
          <Plus className='size-4' />
          <span>添加巡演场次</span>
        </Button>
      </div>

      {/* 巡演日程列表 */}
      {tours.length === 0 ? (
        <div className='rounded-xl border border-dashed p-10 text-center'>
          <Calendar className='mx-auto size-10 text-muted-foreground/40 mb-2' />
          <p className='text-xs text-muted-foreground'>暂无巡演安排，点击上方按钮新增站次</p>
        </div>
      ) : (
        <div className='rounded-xl border bg-card overflow-hidden divide-y'>
          {tours.map((t, idx) => (
            <div
              key={t.id}
              className='p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors'
            >
              <div className='flex items-center gap-4'>
                <div className='font-mono text-xs font-bold text-cyan-400 w-24 shrink-0'>
                  {t.date}
                </div>
                <div className='flex items-center gap-2'>
                  <span className='font-bold text-sm text-foreground'>{t.city}</span>
                  <span className='text-xs text-muted-foreground flex items-center gap-1'>
                    <MapPin className='size-3' />
                    {t.venue}
                  </span>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                {/* 票务状态 Badge */}
                {t.status === 'hot' && (
                  <Badge variant='outline' className='text-xs border-amber-500/40 text-amber-400 bg-amber-500/10'>
                    {t.statusLabel || '余票'}
                  </Badge>
                )}
                {t.status === 'sold' && (
                  <Badge variant='outline' className='text-xs border-rose-500/40 text-rose-400 bg-rose-500/10'>
                    {t.statusLabel || '售罄'}
                  </Badge>
                )}
                {t.status === 'soon' && (
                  <Badge variant='outline' className='text-xs border-muted-foreground/40 text-muted-foreground'>
                    {t.statusLabel || '待售'}
                  </Badge>
                )}

                {/* 操作区 */}
                <div className='flex items-center gap-0.5'>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='size-7'
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    title='前移'
                  >
                    <ArrowUp className='size-3.5' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='size-7'
                    disabled={idx === tours.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    title='后移'
                  >
                    <ArrowDown className='size-3.5' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='size-7'
                    onClick={() => handleOpenEdit(t)}
                    title='编辑'
                  >
                    <Edit2 className='size-3.5' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='size-7 text-destructive'
                    onClick={() => handleDelete(t)}
                    title='删除'
                  >
                    <Trash2 className='size-3.5' />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 巡演编辑弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Calendar className='size-5 text-amber-400' />
              <span>{editingTour ? '编辑巡演站次' : '添加巡演站次'}</span>
            </DialogTitle>
            <DialogDescription>
              设置演出日期、城市、场馆及售票状态。
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className='space-y-4 py-2 text-xs'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label className='text-xs'>演出日期 (YYYY.MM.DD) *</Label>
                <Input
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder='2026.11.08'
                  className='h-8 text-xs font-mono'
                  required
                />
              </div>
              <div className='space-y-1.5'>
                <Label className='text-xs'>演出城市 *</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder='如：上海'
                  className='h-8 text-xs font-semibold'
                  required
                />
              </div>
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs'>演出场馆 / LiveHouse</Label>
              <Input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder='如：Modern Sky Lab'
                className='h-8 text-xs'
              />
            </div>

            {/* 状态设置 */}
            <div className='grid grid-cols-2 gap-3 p-3 rounded-lg border bg-muted/20'>
              <div className='space-y-1.5'>
                <Label className='text-xs'>票务状态</Label>
                <div className='flex gap-1.5 pt-0.5'>
                  <Button
                    type='button'
                    size='sm'
                    variant={status === 'hot' ? 'default' : 'outline'}
                    className='h-7 text-xs flex-1'
                    onClick={() => {
                      setStatus('hot')
                      setStatusLabel('余票')
                    }}
                  >
                    余票
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    variant={status === 'sold' ? 'destructive' : 'outline'}
                    className='h-7 text-xs flex-1'
                    onClick={() => {
                      setStatus('sold')
                      setStatusLabel('售罄')
                    }}
                  >
                    售罄
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    variant={status === 'soon' ? 'secondary' : 'outline'}
                    className='h-7 text-xs flex-1'
                    onClick={() => {
                      setStatus('soon')
                      setStatusLabel('待售')
                    }}
                  >
                    待售
                  </Button>
                </div>
              </div>

              <div className='space-y-1.5'>
                <Label className='text-xs'>徽标文字 (显示文本)</Label>
                <Input
                  value={statusLabel}
                  onChange={(e) => setStatusLabel(e.target.value)}
                  placeholder='如：余票'
                  className='h-8 text-xs'
                />
              </div>
            </div>

            <DialogFooter className='pt-2'>
              <Button type='submit' size='sm' className='gap-1.5 w-full'>
                <Save className='size-3.5' />
                <span>{editingTour ? '保存巡演修改' : '确认添加站次'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
