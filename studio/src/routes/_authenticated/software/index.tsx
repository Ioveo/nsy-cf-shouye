import { createFileRoute } from '@tanstack/react-router'
import { SoftwareFeature } from '@/features/software'

export const Route = createFileRoute('/_authenticated/software/')({
  component: SoftwareFeature,
})
