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

export function useCatalog() {
  return useQuery<Catalog>({
    queryKey: ['catalog'],
    queryFn: async () => {
      const res = await api.post('/api/admin/catalog')
      const cat = res.catalog || { software: [], categories: [] }
      const allReleases: Release[] = (cat.software || []).flatMap((s: any) =>
        (s.releases || []).map((r: any) => ({
          ...r,
          softwareId: s.slug || s.id,
        }))
      )
      return {
        ...cat,
        software: cat.software || [],
        categories: cat.categories || [],
        releases: allReleases,
      }
    },
  })
}

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
