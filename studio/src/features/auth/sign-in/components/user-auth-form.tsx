import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/password-input'
import { Label } from '@/components/ui/label'

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  redirectTo?: string
}

export function UserAuthForm({ className, redirectTo, ...props }: UserAuthFormProps) {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { setToken } = useAuthStore()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) {
      toast.error('请输入管理密码')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()

      if (data.success && data.token) {
        setToken(data.token)
        toast.success('登录成功')
        const target = redirectTo && !redirectTo.includes('sign-in') ? redirectTo : '/'
        navigate({ to: target as any, replace: true })
      } else {
        toast.error(data.msg || '密码错误，请重试')
      }
    } catch (err: any) {
      toast.error(`登录异常：${err.message || '网络连接失败'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={className} {...props}>
      <form onSubmit={handleSubmit} className='grid gap-4'>
        <div className='grid gap-2'>
          <Label htmlFor='admin-password'>管理员访问密钥</Label>
          <PasswordInput
            id='admin-password'
            placeholder='输入 ADMIN_PASSWORD...'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            autoFocus
          />
        </div>
        <Button type='submit' className='w-full' disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className='mr-2 size-4 animate-spin' />
              验证中...
            </>
          ) : (
            <>
              <KeyRound className='mr-2 size-4' />
              进入 Studio 控制台
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
