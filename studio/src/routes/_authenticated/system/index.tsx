import { createFileRoute } from '@tanstack/react-router'
import { SystemFeature } from '@/features/system'

export const Route = createFileRoute('/_authenticated/system/')({
  component: SystemFeature,
})
