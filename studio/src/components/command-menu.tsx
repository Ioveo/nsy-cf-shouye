import React, { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  Boxes,
  Compass,
  FilePlus2,
  FileText,
  Music,
  Image,
  Sparkles,
  ExternalLink,
  Laptop,
  Moon,
  Sun,
  Zap,
} from 'lucide-react'
import { useSearch } from '@/context/search-provider'
import { useTheme } from '@/context/theme-provider'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { sidebarData } from './layout/data/sidebar-data'
import { ScrollArea } from './ui/scroll-area'

export function CommandMenu() {
  const navigate = useNavigate()
  const { setTheme } = useTheme()
  const { open, setOpen } = useSearch()

  // 监听全局 Ctrl+S / ⌘S 广播事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('studio:save'))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false)
      command()
    },
    [setOpen]
  )

  return (
    <CommandDialog modal open={open} onOpenChange={setOpen}>
      <CommandInput placeholder='输入命令或搜索页面 (如: 软件, 版本, 落地页, 文章, ⌘K)...' />
      <CommandList>
        <ScrollArea type='hover' className='h-80 pe-1'>
          <CommandEmpty>未找到匹配指令。</CommandEmpty>

          <CommandGroup heading='核心快捷操作'>
            <CommandItem
              value='发布新软件 向导 new software wizard'
              onSelect={() => runCommand(() => navigate({ to: '/software/new' as any }))}
            >
              <FilePlus2 className='size-4 text-primary' />
              <span>发布新软件 (一页式向导)</span>
            </CommandItem>
            <CommandItem
              value='上传新版本 upload release'
              onSelect={() => runCommand(() => navigate({ to: '/releases', search: { action: 'upload' } as any }))}
            >
              <Boxes className='size-4 text-primary' />
              <span>上传新版本安装包</span>
            </CommandItem>
            <CommandItem
              value='发布热更新 publish hotupdate'
              onSelect={() => runCommand(() => navigate({ to: '/hotupdate', search: { action: 'publish' } as any }))}
            >
              <Zap className='size-4 text-primary' />
              <span>发布在线热更新</span>
            </CommandItem>
            <CommandItem
              value='撰写新文章 write new article'
              onSelect={() => runCommand(() => navigate({ to: '/content', search: { tab: 'articles' } as any }))}
            >
              <FileText className='size-4 text-primary' />
              <span>撰写新文章 (Markdown 编辑器)</span>
            </CommandItem>
            <CommandItem
              value='切换首页落地页 set home landing'
              onSelect={() => runCommand(() => navigate({ to: '/landing' }))}
            >
              <Compass className='size-4 text-primary' />
              <span>切换首页落地页模式</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading='内容与多媒体管理'>
            <CommandItem
              value='音乐频道试听与发布 music audio'
              onSelect={() => runCommand(() => navigate({ to: '/content', search: { tab: 'music' } as any }))}
            >
              <Music className='size-4 text-primary' />
              <span>音乐频道 (试听播放与音频上传)</span>
            </CommandItem>
            <CommandItem
              value='图片画廊瀑布流 gallery'
              onSelect={() => runCommand(() => navigate({ to: '/content', search: { tab: 'gallery' } as any }))}
            >
              <Image className='size-4 text-primary' />
              <span>图片画廊 (批量拖拽上传与排序)</span>
            </CommandItem>
            <CommandItem
              value='照片墙与轮播图 photo wall carousel'
              onSelect={() => runCommand(() => navigate({ to: '/content', search: { tab: 'photo-wall' } as any }))}
            >
              <Sparkles className='size-4 text-primary' />
              <span>照片墙与首页轮播</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {sidebarData.navGroups.map((group) => (
            <CommandGroup key={group.title} heading={group.title}>
              {group.items.map((navItem, i) => {
                if (navItem.url)
                  return (
                    <CommandItem
                      key={`${navItem.url}-${i}`}
                      value={`${navItem.title} ${navItem.url}`}
                      onSelect={() => {
                        runCommand(() => navigate({ to: navItem.url }))
                      }}
                    >
                      <div className='flex size-4 items-center justify-center'>
                        <ArrowRight className='size-3 text-muted-foreground/80' />
                      </div>
                      {navItem.title}
                    </CommandItem>
                  )

                return navItem.items?.map((subItem, i) => (
                  <CommandItem
                    key={`${navItem.title}-${subItem.url}-${i}`}
                    value={`${navItem.title} ${subItem.title} ${subItem.url}`}
                    onSelect={() => {
                      runCommand(() => navigate({ to: subItem.url }))
                    }}
                  >
                    <div className='flex size-4 items-center justify-center'>
                      <ArrowRight className='size-3 text-muted-foreground/80' />
                    </div>
                    {navItem.title} / {subItem.title}
                  </CommandItem>
                ))
              })}
            </CommandGroup>
          ))}

          <CommandSeparator />

          <CommandGroup heading='前台快速直达'>
            <CommandItem
              value='前台软件中心 download'
              onSelect={() => runCommand(() => window.open('/download.html', '_blank'))}
            >
              <ExternalLink className='size-4 text-muted-foreground' />
              <span>前台软件下载中心 (/download.html)</span>
            </CommandItem>
            <CommandItem
              value='前台首页 portal'
              onSelect={() => runCommand(() => window.open('/', '_blank'))}
            >
              <ExternalLink className='size-4 text-muted-foreground' />
              <span>前台综合门户 (/)</span>
            </CommandItem>
            <CommandItem
              value='前台文章教程 articles'
              onSelect={() => runCommand(() => window.open('/articles.html', '_blank'))}
            >
              <ExternalLink className='size-4 text-muted-foreground' />
              <span>前台文章教程 (/articles.html)</span>
            </CommandItem>
            <CommandItem
              value='前台音乐频道 music'
              onSelect={() => runCommand(() => window.open('/music.html', '_blank'))}
            >
              <ExternalLink className='size-4 text-muted-foreground' />
              <span>前台音乐频道 (/music.html)</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading='外观主题'>
            <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
              <Sun className='size-4' /> <span>浅色模式</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
              <Moon className='size-4' /> <span>深色模式</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
              <Laptop className='size-4' /> <span>跟随系统</span>
            </CommandItem>
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </CommandDialog>
  )
}
