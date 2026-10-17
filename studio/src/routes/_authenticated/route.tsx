import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { ADMIN_TOKEN_KEY } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem(ADMIN_TOKEN_KEY)
      if (!token) {
        throw redirect({
          to: '/sign-in',
          search: { redirect: location.href } as any,
        })
      }
    }
  },
  component: AuthenticatedLayout,
})
