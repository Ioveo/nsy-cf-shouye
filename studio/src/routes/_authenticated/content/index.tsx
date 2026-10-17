import { createFileRoute, redirect } from '@tanstack/react-router'

interface ContentSearch {
  tab?: string
}

export const Route = createFileRoute('/_authenticated/content/')({
  validateSearch: (search: Record<string, unknown>): ContentSearch => ({
    tab: typeof search.tab === 'string' ? search.tab : undefined,
  }),
  beforeLoad: ({ search }) => {
    const tab = search.tab
    if (tab === 'music') {
      throw redirect({ to: '/content/music' })
    }
    if (tab === 'gallery') {
      throw redirect({ to: '/content/gallery' })
    }
    if (tab === 'photowall' || tab === 'photo-wall') {
      throw redirect({ to: '/content/photo-wall' })
    }
    if (tab === 'carousel') {
      throw redirect({ to: '/site/carousel' })
    }
    if (tab === 'nav' || tab === 'navigation') {
      throw redirect({ to: '/site/navigation' })
    }
    throw redirect({ to: '/content/articles' })
  },
})
