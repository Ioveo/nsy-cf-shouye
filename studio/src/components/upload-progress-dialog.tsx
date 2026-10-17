import { useUploadStore } from '@/stores/upload-store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

export function UploadProgressDialog() {
  const { isOpen, title, fileName, percent, statusText } = useUploadStore()

  return (
    <Dialog open={isOpen}>
      <DialogContent showCloseButton={false} className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-base font-semibold'>
            <Loader2 className='size-4 animate-spin text-primary' />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          {fileName && (
            <p className='truncate text-sm font-medium text-muted-foreground' title={fileName}>
              {fileName}
            </p>
          )}
          <div className='space-y-2'>
            <div className='h-2 w-full overflow-hidden rounded-full bg-secondary'>
              <div
                className='h-full bg-primary transition-all duration-300 ease-out'
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className='flex items-center justify-between text-xs text-muted-foreground'>
              <span>{statusText || '上传中...'}</span>
              <span className='font-mono font-medium text-foreground'>{percent}%</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
