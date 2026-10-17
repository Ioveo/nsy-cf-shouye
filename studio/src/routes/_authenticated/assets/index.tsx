import { createFileRoute } from '@tanstack/react-router'
import { AssetsFeature } from '@/features/assets'

export const Route = createFileRoute('/_authenticated/assets/')({
  component: AssetsFeature,
})
