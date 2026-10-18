import { createFileRoute } from '@tanstack/react-router'
import { PlaylistsFeature } from '@/features/playlists'

export const Route = createFileRoute('/_authenticated/content/playlists')({
  component: PlaylistsFeature,
})
