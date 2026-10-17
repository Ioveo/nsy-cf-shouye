import { createFileRoute } from '@tanstack/react-router'
import { GalleryFeature } from '@/features/gallery'

export const Route = createFileRoute('/_authenticated/content/gallery')({
  component: GalleryFeature,
})
