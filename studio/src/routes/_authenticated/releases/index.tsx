import { createFileRoute } from '@tanstack/react-router'
import { ReleasesFeature } from '@/features/releases'

export const Route = createFileRoute('/_authenticated/releases/')({
  component: ReleasesFeature,
})
