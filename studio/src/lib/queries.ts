import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './api'

export interface Software {
  id?: string
  slug: string
  name: string
  categoryId: string
  tagline?: string
  description?: string
  requirements?: string
  landingUrl?: string
  highlights?: { title: string; text: string }[]
  icon?: string
  iconUrl?: string
  coverUrl?: string
  screenshots?: string[]
  featured?: boolean
  featuredOrder?: number
  firstReleasedAt?: number | string
  priceLabel?: string
  developer?: string
  website?: string
  sortOrder?: number
  status?: 'active' | 'draft' | 'disabled' | string
  createdAt?: number
  updatedAt?: number
  releases?: Release[]
}

export interface Release {
  id: string
  softwareId: string
  version: string
  title?: string
  description?: string
  changelog?: string
  fileName?: string
  fileSize?: number
  size?: string
  fileKey?: string
  sha256?: string
  downloadCount?: number
  status?: string
  isLatest?: boolean
  platform?: string
  label?: string
  arch?: string
  createdAt?: string | number
  updatedAt?: string | number
}

export interface Category {
  id: string
  name: string
  slug?: string
  sortOrder?: number
  status?: string
}

export interface Catalog {
  product?: string
  software: Software[]
  categories: Category[]
  releases: Release[]
  articles?: any[]
  music?: any[]
  gallery?: any[]
  photoWall?: any[]
  siteCarousel?: any[]
  navigation?: any[]
  site?: any
}

export interface LandingPageItem {
  id: string
  title: string
  path: string
}

export interface LandingData {
  homeLanding: string
  pages: LandingPageItem[]
  content: Record<string, Record<string, string>>
  updatedAt?: number
}

export { useCatalog } from '@/hooks/use-catalog'

export function useLanding() {
  return useQuery<LandingData>({
    queryKey: ['landing'],
    queryFn: async () => {
      const res = await api.post('/api/admin/landing', { action: 'get' })
      return {
        homeLanding: res.homeLanding || res.data?.homeLanding || 'portal',
        pages: res.pages || res.data?.pages || [],
        content: res.content || res.data?.content || {},
        updatedAt: res.updatedAt || res.data?.updatedAt || 0,
      }
    },
  })
}

export interface SoftwareCenterConfig {
  accent: 'cyan' | 'gold' | 'violet'
  hero: {
    mode: 'featured' | 'promotions'
    showSearch: boolean
    autoplaySeconds: number
  }
  stats: {
    show: boolean
    items: string[]
    hideBelow: number
  }
  newArrivals: {
    show: boolean
    days: number
    max: number
  }
  ranking: {
    show: boolean
    tabs: string[]
    size: number
  }
  density: 'comfortable' | 'compact' | 'list'
  pageSize: number
  announcement: {
    show: boolean
    text: string
    href: string
    tone: 'info' | 'warning' | 'success'
  }
}

export interface PromotionItem {
  id: string
  placements: string[]
  entity: {
    type: 'software' | 'article' | 'playlist' | 'custom'
    id: string
  }
  override: {
    title: string
    subtitle: string
    image: string
    ctaText: string
    ctaHref: string
  }
  badge: string
  startAt: number
  endAt: number
  status: 'active' | 'paused'
  order: number
}

export interface PromotionsConfig {
  items: PromotionItem[]
}

export function useConfig<T>(name: string) {
  return useQuery<T>({
    queryKey: ['config', name],
    queryFn: async () => {
      const res = await api.post('/api/admin/config', { action: 'get', name })
      return res.config as T
    },
  })
}

