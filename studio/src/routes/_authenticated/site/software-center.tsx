import { createFileRoute } from '@tanstack/react-router'
import { SiteSoftwareCenterFeature } from '@/features/site-software-center'

export const Route = createFileRoute('/_authenticated/site/software-center')({
  component: SiteSoftwareCenterFeature,
})
