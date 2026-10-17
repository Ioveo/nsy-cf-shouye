import { useNavigate, useRouter } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type GeneralErrorProps = React.HTMLAttributes<HTMLDivElement> & {
  minimal?: boolean
  error?: any
  reset?: () => void
}

export function GeneralError({
  className,
  minimal = false,
  error,
  reset,
}: GeneralErrorProps) {
  const navigate = useNavigate()
  const { history } = useRouter()

  if (error) {
    console.error('[Studio GeneralError caught]:', error)
  }

  function handleReLogin() {
    sessionStorage.removeItem('downloadAdminToken')
    window.location.href = '/studio/sign-in'
  }

  return (
    <div className={cn('h-svh w-full', className)}>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2 p-4'>
        {!minimal && (
          <h1 className='text-[5rem] sm:text-[7rem] leading-tight font-bold text-primary'>500</h1>
        )}
        <span className='text-lg font-medium'>出错了 / Something went wrong</span>
        <p className='text-center text-sm text-muted-foreground max-w-md'>
          页面渲染或数据加载时遇到异常。如因会话过期或缓存引起，建议点击下方「重新登录」或「刷新重试」。
        </p>
        {error?.message && (
          <pre className='mt-2 max-w-lg overflow-auto rounded bg-secondary/50 p-2 text-xs text-muted-foreground'>
            {String(error.message)}
          </pre>
        )}
        {!minimal && (
          <div className='mt-6 flex flex-wrap gap-3 justify-center'>
            <Button variant='outline' onClick={() => (reset ? reset() : window.location.reload())}>
              刷新重试
            </Button>
            <Button variant='outline' onClick={handleReLogin}>
              重新登录
            </Button>
            <Button onClick={() => (window.location.href = '/studio/')}>返回工作台</Button>
          </div>
        )}
      </div>
    </div>
  )
}
