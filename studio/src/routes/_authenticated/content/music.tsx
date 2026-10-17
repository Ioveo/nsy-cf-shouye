import { createFileRoute } from '@tanstack/react-router'
import { MusicFeature } from '@/features/music'

export const Route = createFileRoute('/_authenticated/content/music')({
  component: MusicFeature,
})
