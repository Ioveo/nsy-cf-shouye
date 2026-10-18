import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore, ADMIN_TOKEN_KEY } from '@/stores/auth-store'
import { useUploadStore } from '@/stores/upload-store'
// @ts-ignore
import { configureUpload } from '@r2'
import { DirectionProvider } from './context/direction-provider'
import { FontProvider } from './context/font-provider'
import { ThemeProvider } from './context/theme-provider'
// Generated Routes
import { routeTree } from './routeTree.gen'
// Styles
import './styles/index.css'

// Connect R2 upload module to our upload progress store
configureUpload({
  getToken: () => (typeof window !== 'undefined' ? sessionStorage.getItem(ADMIN_TOKEN_KEY) || '' : ''),
  setToken: (t: string) => {
    if (typeof window !== 'undefined') sessionStorage.setItem(ADMIN_TOKEN_KEY, t)
  },
  ui: {
    show: (title: string, fileName?: string) => useUploadStore.getState().show(title, fileName),
    update: (percent: number, statusText: string) => useUploadStore.getState().update(percent, statusText),
    hide: () => useUploadStore.getState().hide(),
  },
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (failureCount >= 0 && import.meta.env.DEV) return false
        if (failureCount > 2 && import.meta.env.PROD) return false
        if (
          error?.status === 401 ||
          error?.status === 403 ||
          error?.response?.status === 401 ||
          error?.response?.status === 403
        ) return false
        return true
      },
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
    },
  },
  queryCache: new QueryCache({
    onError: (error: any) => {
      if (
        error?.status === 401 ||
        error?.status === 403 ||
        error?.response?.status === 401 ||
        error?.response?.status === 403
      ) {
        toast.error('登录会话已过期，请重新登录')
        useAuthStore.getState().clearToken()
        router.navigate({ to: '/sign-in' })
      }
    },
  }),
})

// Create router with basepath /studio
const router = createRouter({
  routeTree,
  basepath: '/studio',
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme='dark'>
          <FontProvider>
            <DirectionProvider>
              <RouterProvider router={router} />
            </DirectionProvider>
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}
