import { create } from 'zustand'

export const ADMIN_TOKEN_KEY = 'downloadAdminToken'

interface AuthState {
  token: string
  setToken: (token: string) => void
  clearToken: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: typeof window !== 'undefined' ? sessionStorage.getItem(ADMIN_TOKEN_KEY) || '' : '',
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(ADMIN_TOKEN_KEY, token)
    }
    set({ token })
  },
  clearToken: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY)
    }
    set({ token: '' })
  },
  isAuthenticated: () => {
    const t = get().token || (typeof window !== 'undefined' ? sessionStorage.getItem(ADMIN_TOKEN_KEY) || '' : '')
    return Boolean(t)
  },
}))
