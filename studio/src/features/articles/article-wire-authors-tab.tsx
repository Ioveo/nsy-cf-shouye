import { useState } from 'react'
import { toast } from 'sonner'
import {
  Flame,
  Radio,
  Users,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ArticlesWireConfig,
  ArticlesWireItem,
  ArticlesTrendingConfig,
  ArticlesTrendingItem,
  ArticlesAuthorsConfig,
  ArticlesAuthorItem,
} from './types'

interface ArticleWireAuthorsTabProps {
  theWire: ArticlesWireConfig
  trending: ArticlesTrendingConfig
  authors: ArticlesAuthorsConfig
  onChangeWire: (next: ArticlesWireConfig) => void
  onChangeTrending: (next: ArticlesTrendingConfig) => void
  onChangeAuthors: (next: ArticlesAuthorsConfig) => void
}

export function ArticleWireAuthorsTab({
  theWire,
  trending,
  authors,
  onChangeWire,
  onChangeTrending,
  onChangeAuthors,
}: ArticleWireAuthorsTabProps) {
  // 1. 快讯操作
  function updateWireItem(index: number, patch: Partial<ArticlesWireItem>) {
    const nextItems = [...(theWire.items || [])]
    nextItems[index] = { ...nextItems[index], ...patch }
    onChangeWire({ ...theWire, items: nextItems })
  }

  function handleAddWireItem() {
    const newItem: ArticlesWireItem = {
      title: '最新特稿动态发布',
      tag: '快讯',
      time: '刚刚',
      articleIndex: 0,
    }
    onChangeWire({ ...theWire, items: [newItem, ...(theWire.items || [])] })
    toast.success('已新增快讯条目')
  }

  function handleDeleteWireItem(index: number) {
    const nextItems = (theWire.items || []).filter((_, i) => i !== index)
    onChangeWire({ ...theWire, items: nextItems })
  }

  // 2. 热榜操作
  function updateTrendingItem(index: number, patch: Partial<ArticlesTrendingItem>) {
    const nextItems = [...(trending.items || [])]
    nextItems[index] = { ...nextItems[index], ...patch }
    onChangeTrending({ ...trending, items: nextItems })
  }

  // 3. 作者操作
  function updateAuthor(index: number, patch: Partial<ArticlesAuthorItem>) {
    const nextItems = [...(authors.items || [])]
    nextItems[index] = { ...nextItems[index], ...patch }
    onChangeAuthors({ ...authors, items: nextItems })
  }

  return (
    <div className='space-y-6'>
      {/* 1. 24 小时快讯 (THE WIRE) */}
      <div className='rounded-xl border bg-card p-5 space-y-4 shadow-xs'>
        <div className='flex items-center justify-between border-b pb-3 flex-wrap gap-2'>
          <div>
            <h3 className='font-semibold text-sm flex items-center gap-2'>
              <Radio className='size-4 text-emerald-500' />
              <span>24 小时动态快讯 (The Wire)</span>
            </h3>
            <p className='text-xs text-muted-foreground mt-0.5'>
              展示于全网文章下方的滚动特稿速递与即时资讯。
            </p>
          </div>
          <Button onClick={handleAddWireItem} size='sm' variant='outline' className='gap-1.5 text-xs'>
            <Plus className='size-3.5' />
            <span>添加快讯</span>
          </Button>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>主标题</Label>
            <Input
              value={theWire.title}
              onChange={(e) => onChangeWire({ ...theWire, title: e.target.value })}
              placeholder='24 小时'
              className='h-9 text-xs'
            />
          </div>
          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>副标题 (Subtitle)</Label>
            <Input
              value={theWire.subtitle}
              onChange={(e) => onChangeWire({ ...theWire, subtitle: e.target.value })}
              placeholder='THE WIRE'
              className='h-9 text-xs'
            />
          </div>
        </div>

        <div className='space-y-2 pt-2'>
          {(theWire.items || []).map((it, idx) => (
            <div key={idx} className='flex items-center gap-2 p-2 rounded-lg border bg-muted/20'>
              <Input
                value={it.time}
                onChange={(e) => updateWireItem(idx, { time: e.target.value })}
                placeholder='2 小时前'
                className='h-8 w-24 text-xs font-mono shrink-0'
              />
              <Input
                value={it.title}
                onChange={(e) => updateWireItem(idx, { title: e.target.value })}
                placeholder='输入快讯内容...'
                className='h-8 text-xs flex-1'
              />
              <Input
                value={it.tag}
                onChange={(e) => updateWireItem(idx, { tag: e.target.value })}
                placeholder='分类'
                className='h-8 w-20 text-xs shrink-0'
              />
              <Button
                size='icon'
                variant='ghost'
                className='size-8 text-destructive shrink-0'
                onClick={() => handleDeleteWireItem(idx)}
              >
                <Trash2 className='size-3.5' />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. 热榜 (TRENDING 5) */}
      <div className='rounded-xl border bg-card p-5 space-y-4 shadow-xs'>
        <div className='border-b pb-3'>
          <h3 className='font-semibold text-sm flex items-center gap-2'>
            <Flame className='size-4 text-amber-500' />
            <span>热读榜 (Trending 5 · 01-05 排名卡片)</span>
          </h3>
          <p className='text-xs text-muted-foreground mt-0.5'>
            配置 5 个重点推荐位序号卡片，带有艺术斜体字排版。
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>主标题</Label>
            <Input
              value={trending.title}
              onChange={(e) => onChangeTrending({ ...trending, title: e.target.value })}
              placeholder='热榜'
              className='h-9 text-xs'
            />
          </div>
          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>副标题 (Subtitle)</Label>
            <Input
              value={trending.subtitle}
              onChange={(e) => onChangeTrending({ ...trending, subtitle: e.target.value })}
              placeholder='TRENDING'
              className='h-9 text-xs'
            />
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-5 gap-3 pt-2'>
          {(trending.items || []).slice(0, 5).map((it, idx) => (
            <div key={idx} className='p-3 rounded-lg border bg-muted/20 space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='font-serif italic font-bold text-lg text-primary'>{it.rank || `0${idx + 1}`}</span>
                <input
                  type='color'
                  value={it.color1 || '#3b5bff'}
                  onChange={(e) => updateTrendingItem(idx, { color1: e.target.value })}
                  className='size-5 rounded border cursor-pointer'
                  title='序号主强调色'
                />
              </div>
              <div>
                <Label className='text-[10px] text-muted-foreground'>标题</Label>
                <Input
                  value={it.title}
                  onChange={(e) => updateTrendingItem(idx, { title: e.target.value })}
                  className='h-7 text-xs mt-0.5'
                />
              </div>
              <div className='grid grid-cols-2 gap-1.5'>
                <div>
                  <Label className='text-[10px] text-muted-foreground'>分类</Label>
                  <Input
                    value={it.tag}
                    onChange={(e) => updateTrendingItem(idx, { tag: e.target.value })}
                    className='h-7 text-[11px] mt-0.5'
                  />
                </div>
                <div>
                  <Label className='text-[10px] text-muted-foreground'>阅读</Label>
                  <Input
                    value={it.reads}
                    onChange={(e) => updateTrendingItem(idx, { reads: e.target.value })}
                    className='h-7 text-[11px] mt-0.5'
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 驻站作者 (AUTHORS) */}
      <div className='rounded-xl border bg-card p-5 space-y-4 shadow-xs'>
        <div className='border-b pb-3'>
          <h3 className='font-semibold text-sm flex items-center gap-2'>
            <Users className='size-4 text-purple-500' />
            <span>驻站作者团队卡片 (Resident Authors)</span>
          </h3>
          <p className='text-xs text-muted-foreground mt-0.5'>
            前台包含动态巨幅单字肖像渐变卡、身份徽章、作者简介与圆环头像平滑切换联动。
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>主标题</Label>
            <Input
              value={authors.title}
              onChange={(e) => onChangeAuthors({ ...authors, title: e.target.value })}
              placeholder='驻站作者'
              className='h-9 text-xs'
            />
          </div>
          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>副标题 (Subtitle)</Label>
            <Input
              value={authors.subtitle}
              onChange={(e) => onChangeAuthors({ ...authors, subtitle: e.target.value })}
              placeholder='AUTHORS'
              className='h-9 text-xs'
            />
          </div>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2'>
          {(authors.items || []).map((author, idx) => (
            <div key={idx} className='p-3 rounded-lg border bg-muted/20 space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <div
                    className='size-7 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0'
                    style={{ background: author.color }}
                  >
                    {(author.name || '白')[0]}
                  </div>
                  <span className='font-semibold text-xs'>{author.name}</span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <input
                    type='color'
                    value={author.color}
                    onChange={(e) => updateAuthor(idx, { color: e.target.value })}
                    className='size-6 rounded border cursor-pointer'
                    title='作者代表色'
                  />
                  <Input
                    value={author.role}
                    onChange={(e) => updateAuthor(idx, { role: e.target.value })}
                    placeholder='职务'
                    className='h-6 text-[11px] w-20'
                  />
                </div>
              </div>

              <div>
                <Label className='text-[10px] text-muted-foreground'>姓名</Label>
                <Input
                  value={author.name}
                  onChange={(e) => updateAuthor(idx, { name: e.target.value })}
                  className='h-7 text-xs mt-0.5'
                />
              </div>

              <div>
                <Label className='text-[10px] text-muted-foreground'>作者简述</Label>
                <Textarea
                  rows={2}
                  value={author.bio}
                  onChange={(e) => updateAuthor(idx, { bio: e.target.value })}
                  placeholder='作者个人介绍...'
                  className='text-xs mt-0.5'
                />
              </div>

              <div>
                <Label className='text-[10px] text-muted-foreground'>文章数量标牌</Label>
                <Input
                  value={author.count}
                  onChange={(e) => updateAuthor(idx, { count: e.target.value })}
                  placeholder='3 篇特稿'
                  className='h-7 text-xs mt-0.5'
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
