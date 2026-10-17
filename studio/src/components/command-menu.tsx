import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  Boxes,
  Compass,
  FilePlus2,
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

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false)
      command()
    },
    [setOpen]
  )

  return (
    <CommandDialog modal open={open} onOpenChange={setOpen}>
      <CommandInput placeholder='输入命令或搜索页面 (如: 软件, 版本, 落地页, ⌘K)...' />
      <CommandList>
        <ScrollArea type='hover' className='h-72 pe-1'>
          <CommandEmpty>未找到匹配指令。</CommandEmpty>
          
          <CommandGroup heading='快捷操作'>
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
              value='切换首页落地页 set home landing'
              onSelect={() => runCommand(() => navigate({ to: '/landing' }))}
            >
              <Compass className='size-4 text-primary' />
              <span>切换首页落地页</span>
            </CommandItem>
            <CommandItem
              value='新建软件 add software'
              onSelect={() => runCommand(() => navigate({ to: '/software', search: { action: 'new' } as any }))}
            >
              <FilePlus2 className='size-4 text-primary' />
              <span>新建软件资料</span>
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
          <CommandGroup heading='外观主题'>
            <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
              <Sun className='size-4' /> <span>浅色模式</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
              <Moon className='size-4' />
              <span>深色模式</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
              <Laptop className='size-4' />
              <span>跟随系统</span>
            </CommandItem>
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </CommandDialog>
  )
}
