import { createFileRoute } from '@tanstack/react-router'
import { PhotoWallFeature } from '@/features/photo-wall'

export const Route = createFileRoute('/_authenticated/content/photo-wall')({
  component: PhotoWallFeature,
})
