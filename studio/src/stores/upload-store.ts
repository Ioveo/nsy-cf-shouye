import { create } from 'zustand'

interface UploadState {
  isOpen: boolean
  isMinimized: boolean
  title: string
  fileName: string
  percent: number
  statusText: string
  speedText?: string
  errorText?: string
  toggleMinimize: () => void
  show: (title: string, fileName?: string) => void
  update: (percent: number, statusText: string, speedText?: string) => void
  setError: (errorText: string) => void
  hide: () => void
}

export const useUploadStore = create<UploadState>((set) => ({
  isOpen: false,
  isMinimized: false,
  title: '',
  fileName: '',
  percent: 0,
  statusText: '',
  speedText: '',
  errorText: '',
  toggleMinimize: () => set((s) => ({ isMinimized: !s.isMinimized })),
  show: (title: string, fileName?: string) =>
    set({
      isOpen: true,
      isMinimized: false,
      title: title || '正在上传',
      fileName: fileName || '',
      percent: 0,
      statusText: '准备上传...',
      speedText: '',
      errorText: '',
    }),
  update: (percent: number, statusText: string, speedText?: string) =>
    set({
      percent: Math.max(0, Math.min(100, percent)),
      statusText,
      ...(speedText ? { speedText } : {}),
      errorText: '',
    }),
  setError: (errorText: string) =>
    set({
      errorText,
      statusText: '上传出错',
    }),
  hide: () =>
    set({
      isOpen: false,
      isMinimized: false,
      title: '',
      fileName: '',
      percent: 0,
      statusText: '',
      speedText: '',
      errorText: '',
    }),
}))

