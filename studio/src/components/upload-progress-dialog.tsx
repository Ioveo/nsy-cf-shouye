import { useEffect } from 'react'
import { useUploadStore } from '@/stores/upload-store'
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  FileUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function UploadProgressDialog() {
  const {
    isOpen,
    isMinimized,
    title,
    fileName,
    percent,
    statusText,
    speedText,
    errorText,
    toggleMinimize,
    hide,
  } = useUploadStore()

  // 上传中离开页面防丢失提示
  useEffect(() => {
    if (!isOpen || percent >= 100) return
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = '文件正在上传中，离开页面将导致上传中断，确定要离开吗？'
      return e.returnValue
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isOpen, percent])

  if (!isOpen) return null

  const isComplete = percent >= 100 && !errorText

  return (
    <aside
      aria-label='全局上传进度'
      className='fixed bottom-5 right-5 z-50 w-84 md:w-96 rounded-2xl border border-border/80 bg-background/95 p-4 shadow-2xl backdrop-blur-xl transition-all duration-300'
    >
      {/* Header */}
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-2.5 min-w-0'>
          {errorText ? (
            <AlertCircle className='size-4 text-destructive shrink-0' />
          ) : isComplete ? (
            <CheckCircle2 className='size-4 text-emerald-500 shrink-0' />
          ) : (
            <Loader2 className='size-4 animate-spin text-primary shrink-0' />
          )}
          <span className='truncate text-sm font-semibold tracking-tight'>
            {title || '正在上传'}
          </span>
          <Badge
            variant={errorText ? 'destructive' : isComplete ? 'outline' : 'secondary'}
            className='shrink-0 text-[11px] font-mono'
          >
            {errorText ? '失败' : `${percent}%`}
          </Badge>
        </div>

        <div className='flex items-center gap-1 shrink-0'>
          <Button
            variant='ghost'
            size='icon'
            className='size-7 rounded-lg text-muted-foreground hover:text-foreground'
            onClick={toggleMinimize}
            title={isMinimized ? '展开面板' : '最小化'}
          >
            {isMinimized ? <ChevronUp className='size-4' /> : <ChevronDown className='size-4' />}
          </Button>
          {(isComplete || errorText) && (
            <Button
              variant='ghost'
              size='icon'
              className='size-7 rounded-lg text-muted-foreground hover:text-foreground'
              onClick={hide}
              title='关闭'
            >
              <X className='size-4' />
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {!isMinimized && (
        <div className='mt-3 space-y-3 pt-1'>
          {fileName && (
            <div className='flex items-center gap-2 rounded-lg bg-secondary/50 px-2.5 py-1.5 text-xs text-muted-foreground'>
              <FileUp className='size-3.5 shrink-0 text-primary' />
              <span className='truncate font-medium text-foreground' title={fileName}>
                {fileName}
              </span>
            </div>
          )}

          {/* Progress Bar */}
          <div className='space-y-1.5'>
            <div className='h-2 w-full overflow-hidden rounded-full bg-secondary'>
              <div
                className={`h-full transition-all duration-300 ease-out ${
                  errorText
                    ? 'bg-destructive'
                    : isComplete
                    ? 'bg-emerald-500'
                    : 'bg-primary'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className='flex items-center justify-between text-[11px] text-muted-foreground'>
              <span className='truncate'>{errorText || statusText || '上传中...'}</span>
              {speedText && (
                <span className='shrink-0 font-mono text-muted-foreground'>{speedText}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
