import { Outlet } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SkipToMain } from '@/components/skip-to-main'
import { UploadProgressDialog } from '@/components/upload-progress-dialog'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  return (
    <SearchProvider>
      <LayoutProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <SkipToMain />
          <AppSidebar />
          <UploadProgressDialog />
          <SidebarInset
            className={cn(
              // Set content container, so we can use container queries
              '@container/content',

              // If layout is fixed, set the height
              // to 100svh to prevent overflow
              'has-data-[layout=fixed]:h-svh',

              // If layout is fixed and sidebar is inset,
              // set the height to 100svh - spacing (total margins) to prevent overflow
              'peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]'
            )}
          >
            {/* Top Global Header with ⌘K Search, Theme, Profile */}
            <header className='flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/50 px-4 md:px-6 bg-background/50 backdrop-blur-md sticky top-0 z-30'>
              <div className='flex items-center gap-3'>
                <SidebarTrigger className='-ml-1 size-8' />
                <Separator orientation='vertical' className='mr-1 h-4' />
                <Search className='w-44 sm:w-64' placeholder='搜索或按 ⌘K...' />
              </div>
              <div className='flex items-center gap-2'>
                <ThemeSwitch />
                <ProfileDropdown />
              </div>
            </header>

            <div className='flex-1 overflow-auto'>
              {children ?? <Outlet />}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}
