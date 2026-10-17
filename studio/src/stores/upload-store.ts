import { create } from 'zustand'

interface UploadState {
  isOpen: boolean
  title: string
  fileName: string
  percent: number
  statusText: string
  show: (title: string, fileName?: string) => void
  update: (percent: number, statusText: string) => void
  hide: () => void
}

export const useUploadStore = create<UploadState>((set) => ({
  isOpen: false,
  title: '',
  fileName: '',
  percent: 0,
  statusText: '',
  show: (title: string, fileName?: string) =>
    set({
      isOpen: true,
      title: title || '正在上传',
      fileName: fileName || '',
      percent: 0,
      statusText: '准备上传...',
    }),
  update: (percent: number, statusText: string) =>
    set({
      percent: Math.max(0, Math.min(100, percent)),
      statusText,
    }),
  hide: () =>
    set({
      isOpen: false,
      title: '',
      fileName: '',
      percent: 0,
      statusText: '',
    }),
}))
