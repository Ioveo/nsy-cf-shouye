import { Info, Sparkles, Globe, Link2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MusicAboutConfig, MusicFooterConfig } from './types'

interface MusicAboutTabProps {
  about: MusicAboutConfig
  footer: MusicFooterConfig
  onChangeAbout: (next: MusicAboutConfig) => void
  onChangeFooter: (next: MusicFooterConfig) => void
}

export function MusicAboutTab({
  about,
  footer,
  onChangeAbout,
  onChangeFooter,
}: MusicAboutTabProps) {
  function updateAboutStat(index: number, field: 'label' | 'value', val: string) {
    const nextStats = [...(about.stats || [])]
    if (!nextStats[index]) nextStats[index] = { label: '', value: '' }
    nextStats[index] = { ...nextStats[index], [field]: val }
    onChangeAbout({ ...about, stats: nextStats })
  }

  function updateSocialLink(index: number, field: 'label' | 'href', val: string) {
    const nextLinks = [...(footer.socialLinks || [])]
    if (!nextLinks[index]) nextLinks[index] = { label: '', href: '' }
    nextLinks[index] = { ...nextLinks[index], [field]: val }
    onChangeFooter({ ...footer, socialLinks: nextLinks })
  }

  return (
    <div className='space-y-6'>
      {/* 1. 关于白夜 (About Section) */}
      <div className='rounded-xl border bg-card p-5 space-y-4 shadow-xs'>
        <div className='border-b pb-3 space-y-0.5'>
          <h3 className='font-semibold text-sm flex items-center gap-2'>
            <Info className='size-4 text-cyan-400' />
            <span>音乐人介绍与艺术生平 (About White Night)</span>
          </h3>
          <p className='text-xs text-muted-foreground'>
            前台第 9 模块的艺术家专栏，展示音乐人简介、创作理念与生涯数据。
          </p>
        </div>

        <div className='space-y-1.5'>
          <Label className='text-xs'>模块大标题</Label>
          <Input
            value={about.title}
            onChange={(e) => onChangeAbout({ ...about, title: e.target.value })}
            placeholder='如：关于白夜'
            className='h-8 text-xs font-semibold'
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <Label className='text-xs'>简介正文第 1 段</Label>
            <Textarea
              value={about.text1}
              onChange={(e) => onChangeAbout({ ...about, text1: e.target.value })}
              rows={3}
              placeholder='如：白夜，电子音乐制作人。以电影感的氛围电子见长...'
              className='text-xs'
            />
          </div>
          <div className='space-y-1.5'>
            <Label className='text-xs'>简介正文第 2 段 (专辑概念)</Label>
            <Textarea
              value={about.text2}
              onChange={(e) => onChangeAbout({ ...about, text2: e.target.value })}
              rows={3}
              placeholder='如：《十五境》是她的第三张录音室专辑...'
              className='text-xs'
            />
          </div>
        </div>

        {/* 生涯指标 */}
        <div className='space-y-2 pt-2 border-t'>
          <Label className='text-xs font-semibold flex items-center gap-1.5'>
            <Sparkles className='size-3.5 text-primary' />
            <span>生涯指标卡 (3 组数据)</span>
          </Label>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
            {(about.stats || []).map((s, idx) => (
              <div key={idx} className='p-2.5 rounded-lg border bg-muted/20 flex gap-2 items-center'>
                <div className='w-16 space-y-0.5'>
                  <span className='text-[10px] text-muted-foreground'>数值</span>
                  <Input
                    value={s.value}
                    onChange={(e) => updateAboutStat(idx, 'value', e.target.value)}
                    className='h-7 text-xs font-bold text-center'
                  />
                </div>
                <div className='flex-1 space-y-0.5'>
                  <span className='text-[10px] text-muted-foreground'>标签名称</span>
                  <Input
                    value={s.label}
                    onChange={(e) => updateAboutStat(idx, 'label', e.target.value)}
                    className='h-7 text-xs'
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. 底部巨幕与页脚 (Footer Section) */}
      <div className='rounded-xl border bg-card p-5 space-y-4 shadow-xs'>
        <div className='border-b pb-3 space-y-0.5'>
          <h3 className='font-semibold text-sm flex items-center gap-2'>
            <Globe className='size-4 text-purple-400' />
            <span>底部沉浸式巨幕与社交媒体 (Footer & CTA)</span>
          </h3>
          <p className='text-xs text-muted-foreground'>
            前台第 10 模块的闭幕视觉，包含重听专辑、邮件订阅与各大音乐流媒体平台外链。
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <Label className='text-xs'>页脚大标题 (支持换行)</Label>
            <Textarea
              value={footer.title}
              onChange={(e) => onChangeFooter({ ...footer, title: e.target.value })}
              rows={2}
              placeholder='在云海之上\n听见日出。'
              className='text-xs font-semibold'
            />
          </div>
          <div className='space-y-1.5'>
            <Label className='text-xs'>页脚副标题 / 导语</Label>
            <Textarea
              value={footer.subtitle}
              onChange={(e) => onChangeFooter({ ...footer, subtitle: e.target.value })}
              rows={2}
              placeholder='订阅获取新专辑、巡演预售与未公开曲目'
              className='text-xs'
            />
          </div>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t'>
          <div className='space-y-1'>
            <Label className='text-xs'>订阅按钮文字</Label>
            <Input
              value={footer.subscribeText}
              onChange={(e) => onChangeFooter({ ...footer, subscribeText: e.target.value })}
              placeholder='订阅邮件'
              className='h-8 text-xs'
            />
          </div>
          <div className='space-y-1'>
            <Label className='text-xs'>订阅跳转链接</Label>
            <Input
              value={footer.subscribeHref}
              onChange={(e) => onChangeFooter({ ...footer, subscribeHref: e.target.value })}
              placeholder='#'
              className='h-8 text-xs font-mono'
            />
          </div>
          <div className='space-y-1'>
            <Label className='text-xs'>重听按钮文字</Label>
            <Input
              value={footer.replayText}
              onChange={(e) => onChangeFooter({ ...footer, replayText: e.target.value })}
              placeholder='重听专辑'
              className='h-8 text-xs'
            />
          </div>
        </div>

        <div className='space-y-1.5 pt-1'>
          <Label className='text-xs'>底部版权所有文本</Label>
          <Input
            value={footer.copyright}
            onChange={(e) => onChangeFooter({ ...footer, copyright: e.target.value })}
            placeholder='© 2026 白夜 WHITE NIGHT · 天才猫音乐频道'
            className='h-8 text-xs font-mono'
          />
        </div>

        {/* 社交平台外链列表 */}
        <div className='space-y-2 pt-2 border-t'>
          <Label className='text-xs font-semibold flex items-center gap-1.5'>
            <Link2 className='size-3.5 text-primary' />
            <span>流媒体音乐平台链接 (Social Links)</span>
          </Label>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'>
            {(footer.socialLinks || []).map((link, idx) => (
              <div key={idx} className='p-2 rounded-lg border bg-muted/20 space-y-1'>
                <Input
                  value={link.label}
                  onChange={(e) => updateSocialLink(idx, 'label', e.target.value)}
                  placeholder='平台名称'
                  className='h-7 text-xs font-medium'
                />
                <Input
                  value={link.href}
                  onChange={(e) => updateSocialLink(idx, 'href', e.target.value)}
                  placeholder='https://...'
                  className='h-7 text-xs font-mono'
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
