import { createFileRoute } from '@tanstack/react-router'
import { NavigationFeature } from '@/features/navigation'

export const Route = createFileRoute('/_authenticated/site/navigation')({
  component: NavigationFeature,
})
