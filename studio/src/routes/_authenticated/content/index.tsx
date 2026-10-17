import { createFileRoute } from '@tanstack/react-router'
import { ContentFeature } from '@/features/content'

export const Route = createFileRoute('/_authenticated/content/')({
  component: ContentFeature,
})
