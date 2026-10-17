import { createFileRoute } from '@tanstack/react-router'
import { CarouselFeature } from '@/features/carousel'

export const Route = createFileRoute('/_authenticated/site/carousel')({
  component: CarouselFeature,
})
