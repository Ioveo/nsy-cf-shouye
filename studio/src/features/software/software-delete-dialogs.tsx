import { AlertTriangle, Trash2, Loader2 } from 'lucide-react'
import type { Software } from '@/lib/queries'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface SoftwareDeleteDialogsProps {
  software: Software | null
  deleteConfirmOpen: boolean
  forceDeleteConfirmOpen: boolean
  isDeleting: boolean
  onDeleteConfirmChange: (open: boolean) => void
  onForceDeleteConfirmChange: (open: boolean) => void
  onExecuteDelete: (force?: boolean) => void
}

export function SoftwareDeleteDialogs({
  software,
  deleteConfirmOpen,
  forceDeleteConfirmOpen,
  isDeleting,
  onDeleteConfirmChange,
  onForceDeleteConfirmChange,
  onExecuteDelete,
}: SoftwareDeleteDialogsProps) {
  if (!software) return null

  return (
    <>
      {/* 普通删除确认 */}
      <Dialog open={deleteConfirmOpen} onOpenChange={onDeleteConfirmChange}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-destructive'>
              <Trash2 className='size-5' />
              <span>删除软件确认</span>
            </DialogTitle>
            <DialogDescription>
              确定要删除软件「{software.name}」吗？
            </DialogDescription>
          </DialogHeader>
          <p className='text-xs text-muted-foreground'>
            如果该软件下仍有发布的安装包，系统将拦截普通删除以保护分发数据。
          </p>
          <DialogFooter className='gap-2 sm:gap-0'>
            <Button variant='outline' size='sm' onClick={() => onDeleteConfirmChange(false)}>
              取消
            </Button>
            <Button
              variant='destructive'
              size='sm'
              disabled={isDeleting}
              onClick={() => onExecuteDelete(false)}
              className='gap-1.5'
            >
              {isDeleting ? <Loader2 className='size-3.5 animate-spin' /> : <Trash2 className='size-3.5' />}
              <span>确认删除</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 级联强制删除确认 */}
      <Dialog open={forceDeleteConfirmOpen} onOpenChange={onForceDeleteConfirmChange}>
        <DialogContent className='sm:max-w-md border-destructive/60'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-destructive'>
              <AlertTriangle className='size-5' />
              <span>级联强制删除警告</span>
            </DialogTitle>
            <DialogDescription>
              检测到「{software.name}」名下存在安装包记录。
            </DialogDescription>
          </DialogHeader>
          <div className='rounded-lg bg-destructive/10 p-3 text-xs text-destructive space-y-1'>
            <p className='font-semibold'>⚠️ 此操作不可撤销：</p>
            <p>将同时清理其所有关联版本记录及 R2 存储文件。</p>
          </div>
          <DialogFooter className='gap-2 sm:gap-0'>
            <Button variant='outline' size='sm' onClick={() => onForceDeleteConfirmChange(false)}>
              取消
            </Button>
            <Button
              variant='destructive'
              size='sm'
              disabled={isDeleting}
              onClick={() => onExecuteDelete(true)}
              className='gap-1.5 bg-red-600 hover:bg-red-700'
            >
              {isDeleting ? <Loader2 className='size-3.5 animate-spin' /> : <Trash2 className='size-3.5' />}
              <span>强制清理并删除</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
