import { ADMIN_TOKEN_KEY } from '@/stores/auth-store'

export class ApiError extends Error {
  status: number
  code?: string
  data?: any
  constructor(message: string, status: number, data?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export function getToken(): string {
  if (typeof window === 'undefined') return ''
  return sessionStorage.getItem(ADMIN_TOKEN_KEY) || ''
}

export async function request<T = any>(
  url: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
    params?: Record<string, string | number | boolean | undefined>
  } = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let finalUrl = url
  if (options.params) {
    const searchParams = new URLSearchParams()
    for (const [key, val] of Object.entries(options.params)) {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val))
      }
    }
    const qs = searchParams.toString()
    if (qs) {
      finalUrl += (url.includes('?') ? '&' : '?') + qs
    }
  }

  const init: RequestInit = {
    method: options.method || (options.body ? 'POST' : 'GET'),
    headers,
  }

  if (options.body !== undefined) {
    if (options.body instanceof FormData) {
      init.body = options.body
    } else {
      headers['Content-Type'] = 'application/json'
      init.body = JSON.stringify(options.body)
    }
  }

  const response = await fetch(finalUrl, init)

  if (response.status === 401 || response.status === 403) {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY)
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/sign-in')) {
      window.location.href = '/studio/sign-in'
    }
    throw new ApiError('登录已失效，请重新登录', response.status)
  }

  let data: any
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = await response.text()
  }

  if (!response.ok) {
    const errorMsg = data?.msg || data?.error || `请求失败 (${response.status})`
    throw new ApiError(errorMsg, response.status, data)
  }

  return data as T
}

export const api = {
  get: <T = any>(url: string, params?: Record<string, any>) => request<T>(url, { method: 'GET', params }),
  post: <T = any>(url: string, body?: any) => request<T>(url, { method: 'POST', body }),
  put: <T = any>(url: string, body?: any) => request<T>(url, { method: 'PUT', body }),
  delete: <T = any>(url: string, body?: any) => request<T>(url, { method: 'DELETE', body }),
}
