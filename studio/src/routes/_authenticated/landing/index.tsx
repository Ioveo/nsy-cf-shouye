import { createFileRoute } from '@tanstack/react-router'
import { LandingFeature } from '@/features/landing'

export const Route = createFileRoute('/_authenticated/landing/')({
  component: LandingFeature,
})
