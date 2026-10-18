import { useState, useEffect, useRef } from 'react'
import {
  Sliders,
  Save,
  RotateCcw,
  Smartphone,
  Tablet,
  Monitor,
  RefreshCw,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useConfig, type SoftwareCenterConfig } from '@/lib/queries'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ConfigForm } from './config-form'

const DEFAULT_CONFIG: SoftwareCenterConfig = {
  accent: 'cyan',
  hero: { mode: 'featured', showSearch: true, autoplaySeconds: 6 },
  stats: { show: true, items: ['software', 'downloads', 'monthlyUpdates', 'platforms'], hideBelow: 0 },
  newArrivals: { show: true, days: 30, max: 8 },
  ranking: { show: true, tabs: ['downloads', 'updated'], size: 10 },
  density: 'comfortable',
  pageSize: 12,
  announcement: { show: false, text: '', href: '', tone: 'info' },
}

export function SiteSoftwareCenterFeature() {
  const queryClient = useQueryClient()
  const { data: serverConfig, isLoading } = useConfig<SoftwareCenterConfig>('software-center')

  const [form, setForm] = useState<SoftwareCenterConfig>(DEFAULT_CONFIG)
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isSaving, setIsSaving] = useState(false)
  const [isRollingBack, setIsRollingBack] = useState(false)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const debounceTimerRef = useRef<any>(null)

  // 同步服务端初始配置
  useEffect(() => {
    if (serverConfig) {
      setForm({ ...DEFAULT_CONFIG, ...serverConfig })
    }
  }, [serverConfig])

  // 300ms 防抖同步实时预览消息至 iframe
  function handleFormChange(next: SoftwareCenterConfig) {
    setForm(next)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { type: 'studio-preview-config', config: next },
          window.location.origin
        )
      }
    }, 300)
  }

  // 保存配置
  async function handleSave() {
    setIsSaving(true)
    try {
      const res = await api.post('/api/admin/config', {
        action: 'save',
        name: 'software-center',
        data: form,
      })
      if (res.success) {
        toast.success('软件中心前台配置已保存生效')
        queryClient.setQueryData(['config', 'software-center'], res.config)
      } else {
        toast.error(res.msg || '保存失败')
      }
    } catch (e: any) {
      toast.error(`保存异常：${e.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  // 回滚上一版
  async function handleRollback() {
    if (!confirm('确定要恢复到上一版本的配置吗？当前未保存的修改将被覆盖。')) return
    setIsRollingBack(true)
    try {
      const res = await api.post('/api/admin/config', {
        action: 'rollback',
        name: 'software-center',
      })
      if (res.success) {
        toast.success('已成功恢复至上一版配置')
        queryClient.setQueryData(['config', 'software-center'], res.config)
        setForm(res.config)
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            { type: 'studio-preview-config', config: res.config },
            window.location.origin
          )
        }
      } else {
        toast.error(res.msg || '回滚失败')
      }
    } catch (e: any) {
      toast.error(`回滚异常：${e.message}`)
    } finally {
      setIsRollingBack(false)
    }
  }

  function handleReloadPreview() {
    if (iframeRef.current) {
      iframeRef.current.src = `/download.html?preview=1&_t=${Date.now()}`
    }
  }

  return (
    <div className='space-y-6'>
      {/* 头部标题与快捷操作 */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
            <Sliders className='size-6 text-primary' />
            <span>软件中心展示配置</span>
          </h1>
          <p className='text-xs text-muted-foreground mt-1'>
            编排前台呈现风格、主推/推广位轮播、核心数据条与卡片排版密度。
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleRollback}
            disabled={isRollingBack || isSaving}
            className='gap-1.5'
          >
            {isRollingBack ? <Loader2 className='size-3.5 animate-spin' /> : <RotateCcw className='size-3.5' />}
            <span>恢复上一版</span>
          </Button>

          <Button
            size='sm'
            onClick={handleSave}
            disabled={isSaving || isRollingBack}
            className='gap-1.5'
          >
            {isSaving ? <Loader2 className='size-3.5 animate-spin' /> : <Save className='size-3.5' />}
            <span>保存前台配置</span>
          </Button>
        </div>
      </div>

      {/* 左右分栏：左侧配置表单，右侧实时 iframe 预览 */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
        {/* 左侧表单 */}
        <div className='lg:col-span-5 space-y-4'>
          {isLoading ? (
            <div className='flex items-center justify-center p-12 text-muted-foreground'>
              <Loader2 className='size-5 animate-spin mr-2' />
              <span className='text-xs'>正在载入配置...</span>
            </div>
          ) : (
            <ConfigForm config={form} onChange={handleFormChange} />
          )}
        </div>

        {/* 右侧 iframe 预览 */}
        <div className='lg:col-span-7 flex flex-col items-center rounded-xl border bg-card/30 p-4 backdrop-blur-sm'>
          <div className='w-full flex items-center justify-between pb-3 border-b mb-3'>
            <div className='flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg'>
              <Button
                variant={device === 'desktop' ? 'default' : 'ghost'}
                size='icon'
                className='size-7'
                onClick={() => setDevice('desktop')}
                title='桌面端视图 (100%)'
              >
                <Monitor className='size-3.5' />
              </Button>
              <Button
                variant={device === 'tablet' ? 'default' : 'ghost'}
                size='icon'
                className='size-7'
                onClick={() => setDevice('tablet')}
                title='平板端视图 (768px)'
              >
                <Tablet className='size-3.5' />
              </Button>
              <Button
                variant={device === 'mobile' ? 'default' : 'ghost'}
                size='icon'
                className='size-7'
                onClick={() => setDevice('mobile')}
                title='手机端视图 (390px)'
              >
                <Smartphone className='size-3.5' />
              </Button>
            </div>

            <div className='flex items-center gap-2'>
              <Button
                variant='ghost'
                size='icon'
                className='size-7'
                onClick={handleReloadPreview}
                title='重新加载预览'
              >
                <RefreshCw className='size-3.5' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='size-7'
                onClick={() => window.open('/download.html', '_blank')}
                title='在新标签页打开'
              >
                <ExternalLink className='size-3.5' />
              </Button>
            </div>
          </div>

          <div
            className='w-full flex justify-center overflow-hidden transition-all duration-300'
            style={{
              maxWidth: device === 'mobile' ? '390px' : device === 'tablet' ? '768px' : '100%',
            }}
          >
            <div className='w-full h-[680px] rounded-lg border shadow-xl bg-black overflow-hidden relative'>
              <iframe
                ref={iframeRef}
                src='/download.html?preview=1'
                title='软件中心实时预览'
                className='w-full h-full border-0'
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
