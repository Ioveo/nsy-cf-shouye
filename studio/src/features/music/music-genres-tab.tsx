import { useState } from 'react'
import { toast } from 'sonner'
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Palette,
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
import { MusicGenreItem } from './types'

const PRESET_COLORS = [
  '#57e6ff',
  '#a855f7',
  '#4ade80',
  '#f0a840',
  '#bfe3ff',
  '#ff8fb3',
  '#3d7bff',
  '#ff5c38',
]

interface MusicGenresTabProps {
  genres: MusicGenreItem[]
  onChangeGenres: (next: MusicGenreItem[]) => void
}

export function MusicGenresTab({ genres, onChangeGenres }: MusicGenresTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGenre, setEditingGenre] = useState<MusicGenreItem | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [color, setColor] = useState('#57e6ff')
  const [tagsText, setTagsText] = useState('')

  function handleOpenCreate() {
    setEditingGenre(null)
    setName('')
    setNameEn('')
    setColor('#57e6ff')
    setTagsText('')
    setDialogOpen(true)
  }

  function handleOpenEdit(genre: MusicGenreItem) {
    setEditingGenre(genre)
    setName(genre.name || '')
    setNameEn(genre.nameEn || '')
    setColor(genre.color || '#57e6ff')
    setTagsText((genre.tags || []).join(', '))
    setDialogOpen(true)
  }

  function handleDelete(genre: MusicGenreItem) {
    if (!confirm(`确定要删除分类「${genre.name}」吗？`)) return
    onChangeGenres(genres.filter((g) => g.id !== genre.id))
    toast.success(`分类「${genre.name}」已移除`)
  }

  function handleMove(idx: number, direction: 'up' | 'down') {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= genres.length) return
    const next = [...genres]
    const temp = next[idx]
    next[idx] = next[targetIdx]
    next[targetIdx] = temp
    onChangeGenres(next)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('请填写分类名称')
      return
    }

    const tags = tagsText
      .split(/[,，\s]+/)
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean)

    const newItem: MusicGenreItem = {
      id: editingGenre?.id || `gen_${Date.now()}`,
      name: name.trim(),
      nameEn: nameEn.trim().toUpperCase(),
      color: color.trim() || '#57e6ff',
      tags,
    }

    if (editingGenre) {
      onChangeGenres(genres.map((g) => (g.id === editingGenre.id ? newItem : g)))
      toast.success(`分类「${newItem.name}」已更新`)
    } else {
      onChangeGenres([...genres, newItem])
      toast.success(`新分类「${newItem.name}」已添加`)
    }
    setDialogOpen(false)
  }

  return (
    <div className='space-y-5'>
      {/* 头部说明与添加 */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
        <div>
          <h3 className='text-base font-semibold flex items-center gap-2'>
            <Tag className='size-5 text-cyan-400' />
            <span>音乐流派与风格分类 (Genres & Tags)</span>
          </h3>
          <p className='text-xs text-muted-foreground mt-0.5'>
            前台第 6 模块的流派筛选网格，点击分类可即时高亮并联动筛选曲目排行。
          </p>
        </div>
        <Button onClick={handleOpenCreate} size='sm' className='gap-1.5'>
          <Plus className='size-4' />
          <span>添加新分类</span>
        </Button>
      </div>

      {/* 分类网格 */}
      {genres.length === 0 ? (
        <div className='rounded-xl border border-dashed p-10 text-center'>
          <Tag className='mx-auto size-10 text-muted-foreground/40 mb-2' />
          <p className='text-xs text-muted-foreground'>暂无流派分类，点击上方按钮新增</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {genres.map((g, idx) => (
            <div
              key={g.id}
              className='rounded-xl border bg-card p-4 space-y-3 relative overflow-hidden group hover:shadow-md transition-shadow'
              style={{ borderLeftColor: g.color || '#57e6ff', borderLeftWidth: '4px' }}
            >
              <div className='flex items-center justify-between'>
                <div>
                  <div className='font-bold text-sm flex items-center gap-2'>
                    <span>{g.name}</span>
                    <span
                      className='size-2.5 rounded-full inline-block shrink-0'
                      style={{ background: g.color || '#57e6ff' }}
                    />
                  </div>
                  <div className='text-xs text-muted-foreground font-mono mt-0.5'>
                    {g.nameEn || 'GENRE'}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className='flex items-center gap-0.5'>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='size-6'
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    title='前移'
                  >
                    <ArrowUp className='size-3' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='size-6'
                    disabled={idx === genres.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    title='后移'
                  >
                    <ArrowDown className='size-3' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='size-6'
                    onClick={() => handleOpenEdit(g)}
                    title='编辑'
                  >
                    <Edit2 className='size-3' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='size-6 text-destructive'
                    onClick={() => handleDelete(g)}
                    title='删除'
                  >
                    <Trash2 className='size-3' />
                  </Button>
                </div>
              </div>

              {/* 标签徽标列表 */}
              <div className='flex flex-wrap gap-1.5 pt-1'>
                {(g.tags || []).length > 0 ? (
                  g.tags.map((t, tIdx) => (
                    <Badge
                      key={tIdx}
                      variant='outline'
                      className='text-[10px] font-mono px-2 py-0 border-muted-foreground/20'
                    >
                      {t}
                    </Badge>
                  ))
                ) : (
                  <span className='text-[11px] text-muted-foreground'>暂无关联标签</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分类编辑弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Tag className='size-5 text-cyan-400' />
              <span>{editingGenre ? '编辑流派分类' : '添加流派分类'}</span>
            </DialogTitle>
            <DialogDescription>
              设置分类的名称、主题色彩以及包含的风格标签。
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className='space-y-4 py-2 text-xs'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label className='text-xs'>分类中文名 *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='如：合成器浪潮'
                  className='h-8 text-xs font-semibold'
                  required
                />
              </div>
              <div className='space-y-1.5'>
                <Label className='text-xs'>分类英文名</Label>
                <Input
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder='如：SYNTHWAVE'
                  className='h-8 text-xs font-mono uppercase'
                />
              </div>
            </div>

            {/* 色彩设置 */}
            <div className='space-y-2 p-3 rounded-lg border bg-muted/20'>
              <div className='flex items-center justify-between'>
                <Label className='text-xs font-semibold flex items-center gap-1.5'>
                  <Palette className='size-3.5 text-primary' />
                  <span>主题强调色 (Accent Color)</span>
                </Label>
                <span
                  className='size-4 rounded-full border shadow-xs inline-block'
                  style={{ background: color }}
                />
              </div>
              <div className='flex items-center gap-2'>
                <input
                  type='color'
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className='size-8 p-0 rounded border cursor-pointer shrink-0'
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className='h-8 text-xs font-mono'
                />
              </div>
              {/* 预设色块快捷点选 */}
              <div className='flex items-center gap-1.5 pt-1'>
                <span className='text-[10px] text-muted-foreground mr-1'>推荐色彩：</span>
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type='button'
                    onClick={() => setColor(c)}
                    className='size-5 rounded-full border border-white/20 transition-transform hover:scale-110'
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            {/* 关联标签 */}
            <div className='space-y-1.5'>
              <Label className='text-xs'>关联风格标签 (逗号隔开)</Label>
              <Input
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder='如：SYNTHWAVE, EPIC, RETRO'
                className='h-8 text-xs font-mono'
              />
              <p className='text-[10px] text-muted-foreground'>
                前台将根据曲目的 TAG 与此处标签进行精确匹配高亮
              </p>
            </div>

            <DialogFooter className='pt-2'>
              <Button type='submit' size='sm' className='gap-1.5 w-full'>
                <Save className='size-3.5' />
                <span>{editingGenre ? '保存分类修改' : '确认添加分类'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
