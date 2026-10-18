import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Catalog, Release } from '@/lib/queries'

export function useCatalog() {
  return useQuery<Catalog>({
    queryKey: ['catalog'],
    queryFn: async () => {
      let cat: any = null
      try {
        const res = await api.post('/api/admin/catalog')
        cat = res?.catalog
      } catch (err: any) {
        // 当后台令牌过期或接口失败时，降级读取前台公开 catalog 接口，确保绝不展示 0 软件空白态
        try {
          const pubRes = await fetch('/api/catalog')
          if (pubRes.ok) {
            cat = await pubRes.json()
          } else {
            throw err
          }
        } catch {
          throw err
        }
      }
      cat = cat || { software: [], categories: [] }
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
    staleTime: 30_000,
  })
}

/**
 * 助手函数：在保存成功后立即更新全局缓存中的 catalog，避免整页 reload
 */
export function useUpdateCatalog() {
  const queryClient = useQueryClient()
  return (updater: (prev: Catalog) => Catalog) => {
    queryClient.setQueryData<Catalog>(['catalog'], old => {
      if (!old) return old
      return updater(old)
    })
  }
}
