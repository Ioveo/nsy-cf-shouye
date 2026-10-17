import { createFileRoute } from '@tanstack/react-router'
import { SoftwareWizard } from '@/features/software/wizard'

export const Route = createFileRoute('/_authenticated/software/new')({
  component: SoftwareWizard,
})
