import { createFileRoute } from '@tanstack/react-router'
import { ArticleCategoriesFeature } from '@/features/article-categories'

export const Route = createFileRoute('/_authenticated/content/article-categories')({
  component: ArticleCategoriesFeature,
})
