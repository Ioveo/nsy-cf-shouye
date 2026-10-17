import { useSearch } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'
import { ShieldCheck } from 'lucide-react'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <AuthLayout>
      <Card className='w-full max-w-sm border-border/80 bg-card/60 backdrop-blur-xl'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary'>
            <ShieldCheck className='size-6' />
          </div>
          <CardTitle className='text-xl font-bold tracking-tight'>天才猫 Studio</CardTitle>
          <CardDescription>
            请输入后台管理密码进行安全验证
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm redirectTo={redirect} />
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
