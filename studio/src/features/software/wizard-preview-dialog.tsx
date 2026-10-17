import { useState, useRef } from 'react'
import { Laptop, Smartphone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface WizardPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  softwarePayload: any
}

export function WizardPreviewDialog({
  open,
  onOpenChange,
  softwarePayload,
}: WizardPreviewDialogProps) {
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  function handleIframeLoad() {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage(
          {
            type: 'preview-update',
            software: softwarePayload,
          },
          '*'
        )
      }, 500)
    }
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden bg-background'>
        <DialogHeader className='px-4 py-3 border-b border-border/60 flex flex-row items-center justify-between'>
          <div className='flex items-center gap-3'>
            <DialogTitle className='text-sm font-semibold'>详情页草稿实时预览</DialogTitle>
            <Badge variant='outline' className='text-xs text-primary border-primary/40'>
              {softwarePayload.name || '软件详情'}
            </Badge>
          </div>
          <div className='flex items-center gap-2'>
            <div className='flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5 text-xs'>
              <button
                type='button'
                onClick={() => setPreviewDevice('desktop')}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded transition-colors',
                  previewDevice === 'desktop' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
                )}
              >
                <Laptop className='size-3.5' /> 桌面端
              </button>
              <button
                type='button'
                onClick={() => setPreviewDevice('mobile')}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded transition-colors',
                  previewDevice === 'mobile' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
                )}
              >
                <Smartphone className='size-3.5' /> 移动端 (390px)
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className='flex-1 bg-muted/20 flex items-center justify-center p-2 overflow-hidden'>
          <iframe
            ref={iframeRef}
            src='/software.html?preview=1'
            onLoad={handleIframeLoad}
            title='Software Preview'
            className={cn(
              'h-full border border-border/60 rounded-lg shadow-xl transition-all duration-300 bg-[#07090e]',
              previewDevice === 'desktop' ? 'w-full' : 'w-[390px]'
            )}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
