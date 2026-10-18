import { createFileRoute } from '@tanstack/react-router'
import { PromotionsFeature } from '@/features/promotions'

export const Route = createFileRoute('/_authenticated/site/promotions')({
  component: PromotionsFeature,
})
