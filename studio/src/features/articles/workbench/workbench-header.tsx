import {
  ArrowLeft,
  Smartphone,
  Monitor,
  PenTool,
  SlidersHorizontal,
  Save,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { WorkbenchViewMode } from './types'

interface WorkbenchHeaderProps {
  isEditing: boolean
  title: string
  isSaving: boolean
  lastSavedAt: number | null
  viewMode: WorkbenchViewMode
  propertiesOpen: boolean
  onBack: () => void
  onSave: () => void
  onViewModeChange: (mode: WorkbenchViewMode) => void
  onToggleProperties: () => void
  onOpenExternalPreview?: () => void
}

export function WorkbenchHeader({
  isEditing,
  title,
  isSaving,
  lastSavedAt,
  viewMode,
  propertiesOpen,
  onBack,
  onSave,
  onViewModeChange,
  onToggleProperties,
  onOpenExternalPreview,
}: WorkbenchHeaderProps) {
  return (
    <header className='h-14 border-b border-border bg-background/95 backdrop-blur-md px-4 flex items-center justify-between shrink-0 select-none'>
      {/* 左侧：返回按钮与文章简标 */}
      <div className='flex items-center gap-3 min-w-0 max-w-[40%]'>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={onBack}
          className='gap-1.5 text-muted-foreground hover:text-foreground h-8 px-2'
          title='返回文章专栏管理'
        >
          <ArrowLeft className='size-4' />
          <span className='hidden sm:inline text-xs'>专栏列表</span>
        </Button>

        <div className='h-4 w-px bg-border hidden sm:block' />

        <div className='flex items-center gap-2 truncate'>
          <span className='text-xs font-semibold text-foreground/90 truncate max-w-[200px] md:max-w-[320px]'>
            {title.trim() ? title : '新文章草稿'}
          </span>
          <span className='text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono shrink-0'>
            {isEditing ? 'EDIT' : 'NEW'}
          </span>
        </div>
      </div>

      {/* 中间：视图模式切换（专注 / 微信手机 / 桌面端） */}
      <div className='hidden md:flex items-center p-1 bg-muted/50 rounded-lg border border-border/60 gap-1'>
        <button
          type='button'
          onClick={() => onViewModeChange('focus')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            viewMode === 'focus'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <PenTool className='size-3.5' />
          <span>沉浸写作</span>
        </button>

        <button
          type='button'
          onClick={() => onViewModeChange('split-phone')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            viewMode === 'split-phone'
              ? 'bg-background text-foreground shadow-sm text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Smartphone className='size-3.5' />
          <span>微信手机仿真</span>
        </button>

        <button
          type='button'
          onClick={() => onViewModeChange('split-desktop')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            viewMode === 'split-desktop'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Monitor className='size-3.5' />
          <span>桌面宽屏预览</span>
        </button>
      </div>

      {/* 右侧：自动保存状态、属性抽屉开关、发布主按钮 */}
      <div className='flex items-center gap-2 sm:gap-3'>
        {lastSavedAt && (
          <div className='hidden lg:flex items-center gap-1.5 text-[11px] text-muted-foreground'>
            <CheckCircle2 className='size-3 text-emerald-500' />
            <span>自动暂存 {new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}

        <Button
          type='button'
          variant={propertiesOpen ? 'secondary' : 'outline'}
          size='sm'
          onClick={onToggleProperties}
          className={`h-8 px-2.5 text-xs gap-1.5 ${propertiesOpen ? 'border-primary/50 text-primary' : ''}`}
          title='文章分类、封面、标签与SEO设置'
        >
          <SlidersHorizontal className='size-3.5' />
          <span className='hidden sm:inline'>文章属性</span>
        </Button>

        {onOpenExternalPreview && (
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={onOpenExternalPreview}
            className='h-8 px-2.5 text-xs gap-1.5'
            title='在浏览器新标签页中打开前台真实网页预览'
          >
            <ExternalLink className='size-3.5 text-primary' />
            <span className='hidden sm:inline'>前台预览</span>
          </Button>
        )}

        <Button
          type='button'
          size='sm'
          disabled={isSaving}
          onClick={onSave}
          className='h-8 px-4 text-xs gap-1.5 shadow-sm font-semibold'
        >
          {isSaving ? (
            <>
              <Loader2 className='size-3.5 animate-spin' />
              <span>同步 D1...</span>
            </>
          ) : (
            <>
              <Save className='size-3.5' />
              <span>{isEditing ? '保存修改' : '立即发布'}</span>
            </>
          )}
        </Button>
      </div>
    </header>
  )
}
