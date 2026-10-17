import { createFileRoute } from '@tanstack/react-router'
import { HotUpdateFeature } from '@/features/hotupdate'

export const Route = createFileRoute('/_authenticated/hotupdate/')({
  component: HotUpdateFeature,
})
