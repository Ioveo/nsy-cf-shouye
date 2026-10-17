import { useState } from 'react'
import {
  LayoutTemplate,
  CheckCircle2,
  ExternalLink,
  Eye,
  Edit3,
  Plus,
  Trash2,
  Smartphone,
  Monitor,
  Tablet,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useLanding, LandingPageItem } from '@/lib/queries'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface ParsedField {
  key: string
  kind: 'text' | 'href' | 'src'
  label: string
  defaultValue: string
  isLongText?: boolean
}

export function LandingFeature() {
  const queryClient = useQueryClient()
  const { data: landing, isLoading } = useLanding()

  // Set home state
  const [switchingPage, setSwitchingPage] = useState<LandingPageItem | null>(null)
  const [switchConfirmOpen, setSwitchConfirmOpen] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)

  // Preview modal state
  const [previewPage, setPreviewPage] = useState<LandingPageItem | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  // Edit copy drawer state
  const [editingPage, setEditingPage] = useState<LandingPageItem | null>(null)
  const [copyDrawerOpen, setCopyDrawerOpen] = useState(false)
  const [parsedFields, setParsedFields] = useState<ParsedField[]>([])
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [isLoadingFields, setIsLoadingFields] = useState(false)
  const [isSavingContent, setIsSavingContent] = useState(false)

  // Add custom page modal state
  const [addPageOpen, setAddPageOpen] = useState(false)
  const [newId, setNewId] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newPath, setNewPath] = useState('')
  const [isAddingPage, setIsAddingPage] = useState(false)

  const homeLanding = landing?.homeLanding || 'portal'
  const pages = landing?.pages || []
  const content = landing?.content || {}

  // Builtin page IDs that cannot be deleted
  const BUILTIN_IDS = [
    'portal',
    'desktop',
    'software',
    'music',
    'gallery',
    'photo-wall',
    'articles',
    'novadisk',
  ]

  async function executeSetHome() {
    if (!switchingPage) return
    setIsSwitching(true)
    try {
      const res = await api.post('/api/admin/landing', {
        action: 'setHome',
        homeLanding: switchingPage.id,
      })
      if (res.success) {
        toast.success(`已将「${switchingPage.title}」设为网站首页 (/)`)
        setSwitchConfirmOpen(false)
        setSwitchingPage(null)
        queryClient.invalidateQueries({ queryKey: ['landing'] })
      } else {
        toast.error(res.msg || '切换首页失败')
      }
    } catch (err: any) {
      toast.error(`切换异常：${err.message}`)
    } finally {
      setIsSwitching(false)
    }
  }

  // Open copy drawer: fetch HTML, parse with DOMParser, extract all data-landing* elements
  async function openCopyDrawer(page: LandingPageItem) {
    setEditingPage(page)
    setParsedFields([])
    setFieldValues({})
    setIsLoadingFields(true)
    setCopyDrawerOpen(true)

    try {
      const response = await fetch(page.path)
      if (!response.ok) {
        throw new Error(`无法获取页面 HTML (${response.status})`)
      }
      const htmlText = await response.text()
      const doc = new DOMParser().parseFromString(htmlText, 'text/html')

      const foundFields: ParsedField[] = []
      const initialValues: Record<string, string> = {}
      const savedPageContent = content[page.id] || {}

      // 1. Text elements: [data-landing]
      const textEls = doc.querySelectorAll('[data-landing]')
      textEls.forEach((el) => {
        const key = el.getAttribute('data-landing') || ''
        if (!key || foundFields.some((f) => f.key === key)) return
        const def = el.textContent?.trim() || ''
        const isLong = def.length > 30 || el.tagName.toLowerCase() === 'p'
        foundFields.push({
          key,
          kind: 'text',
          label: key,
          defaultValue: def,
          isLongText: isLong,
        })
        initialValues[key] = savedPageContent[key] !== undefined ? savedPageContent[key] : def
      })

      // 2. Link elements: [data-landing-href]
      const hrefEls = doc.querySelectorAll('[data-landing-href]')
      hrefEls.forEach((el) => {
        const key = el.getAttribute('data-landing-href') || ''
        if (!key || foundFields.some((f) => f.key === key)) return
        const def = el.getAttribute('href') || ''
        foundFields.push({
          key,
          kind: 'href',
          label: `${key} (链接跳转)`,
          defaultValue: def,
        })
        initialValues[key] = savedPageContent[key] !== undefined ? savedPageContent[key] : def
      })

      // 3. Image elements: [data-landing-src]
      const srcEls = doc.querySelectorAll('[data-landing-src]')
      srcEls.forEach((el) => {
        const key = el.getAttribute('data-landing-src') || ''
        if (!key || foundFields.some((f) => f.key === key)) return
        const def = el.getAttribute('src') || ''
        foundFields.push({
          key,
          kind: 'src',
          label: `${key} (图片地址)`,
          defaultValue: def,
        })
        initialValues[key] = savedPageContent[key] !== undefined ? savedPageContent[key] : def
      })

      setParsedFields(foundFields)
      setFieldValues(initialValues)
    } catch (err: any) {
      toast.error(`解析页面文案结构失败：${err.message}`)
    } finally {
      setIsLoadingFields(false)
    }
  }

  async function handleSaveContent(e: React.FormEvent) {
    e.preventDefault()
    if (!editingPage) return

    setIsSavingContent(true)
    try {
      const res = await api.post('/api/admin/landing', {
        action: 'saveContent',
        pageId: editingPage.id,
        content: fieldValues,
      })
      if (res.success) {
        toast.success(`「${editingPage.title}」文案已保存并实时生效`)
        setCopyDrawerOpen(false)
        queryClient.invalidateQueries({ queryKey: ['landing'] })
      } else {
        toast.error(res.msg || '保存文案失败')
      }
    } catch (err: any) {
      toast.error(`保存异常：${err.message}`)
    } finally {
      setIsSavingContent(false)
    }
  }

  async function handleAddCustomPage(e: React.FormEvent) {
    e.preventDefault()
    if (!newId.trim() || !newTitle.trim() || !newPath.trim()) {
      toast.error('标识、标题和路径为必填')
      return
    }

    setIsAddingPage(true)
    try {
      const res = await api.post('/api/admin/landing', {
        action: 'addPage',
        page: {
          id: newId.trim().toLowerCase(),
          title: newTitle.trim(),
          path: newPath.trim(),
        },
      })
      if (res.success) {
        toast.success('自定义落地页已添加')
        setAddPageOpen(false)
        setNewId('')
        setNewTitle('')
        setNewPath('')
        queryClient.invalidateQueries({ queryKey: ['landing'] })
      } else {
        toast.error(res.msg || '添加失败')
      }
    } catch (err: any) {
      toast.error(`添加异常：${err.message}`)
    } finally {
      setIsAddingPage(false)
    }
  }

  async function handleRemoveCustomPage(pageId: string) {
    try {
      const res = await api.post('/api/admin/landing', {
        action: 'removePage',
        pageId,
      })
      if (res.success) {
        toast.success('落地页已移除')
        queryClient.invalidateQueries({ queryKey: ['landing'] })
      } else {
        toast.error(res.msg || '移除失败')
      }
    } catch (err: any) {
      toast.error(`移除异常：${err.message}`)
    }
  }

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 pt-0 md:gap-6 md:p-8'>
      {/* Header */}
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>落地页随时切换</h1>
          <p className='text-sm text-muted-foreground'>
            一键决定网站首页 (/) 呈现哪个场景落地页，并支持零代码抽取编辑各页面核心文案
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setNewId('')
              setNewTitle('')
              setNewPath('/landing/')
              setAddPageOpen(true)
            }}
          >
            <Plus className='mr-2 size-4 text-primary' />
            添加自定义落地页
          </Button>
        </div>
      </div>

      {/* Landing Pages Cards Grid */}
      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {isLoading ? (
          <div className='col-span-full py-16 text-center text-muted-foreground'>
            <Loader2 className='mx-auto size-6 animate-spin text-primary' />
            <p className='mt-2 text-sm'>加载落地页配置中...</p>
          </div>
        ) : (
          pages.map((p) => {
            const isHome = p.id === homeLanding
            const isBuiltin = BUILTIN_IDS.includes(p.id)

            return (
              <Card
                key={p.id}
                className={`flex flex-col justify-between border transition-all ${
                  isHome
                    ? 'border-primary/60 bg-primary/5 shadow-md shadow-primary/10'
                    : 'border-border/60 bg-card/60 hover:border-border'
                }`}
              >
                <CardHeader className='pb-3'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='flex items-center gap-2'>
                      <div
                        className={`flex size-8 items-center justify-center rounded-lg ${
                          isHome
                            ? 'bg-primary text-primary-foreground font-bold'
                            : 'bg-secondary text-foreground'
                        }`}
                      >
                        <LayoutTemplate className='size-4' />
                      </div>
                      <div>
                        <CardTitle className='text-base font-semibold'>
                          {p.title}
                        </CardTitle>
                        <CardDescription className='font-mono text-xs'>
                          {p.id}
                        </CardDescription>
                      </div>
                    </div>
                    {isHome ? (
                      <Badge className='bg-primary text-primary-foreground text-xs font-semibold'>
                        当前首页
                      </Badge>
                    ) : (
                      <Badge variant='outline' className='text-xs text-muted-foreground'>
                        可选
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className='pb-4 space-y-2 text-xs'>
                  <div className='flex items-center justify-between rounded-md border border-border/40 p-2 bg-secondary/10'>
                    <span className='text-muted-foreground'>文件路径</span>
                    <span className='font-mono text-foreground truncate max-w-[150px]'>
                      {p.path}
                    </span>
                  </div>
                  <div className='flex items-center justify-between text-muted-foreground pt-1'>
                    <span>页面属性</span>
                    <span>{isBuiltin ? '系统内置' : '自定义'}</span>
                  </div>
                </CardContent>

                <CardFooter className='border-t border-border/40 pt-3 flex items-center justify-between gap-1'>
                  <div className='flex items-center gap-1'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 text-xs px-2'
                      onClick={() => {
                        setPreviewPage(p)
                        setPreviewDevice('desktop')
                        setPreviewOpen(true)
                      }}
                      title='实时预览'
                    >
                      <Eye className='mr-1 size-3.5' />
                      预览
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 text-xs px-2 text-primary hover:text-primary'
                      onClick={() => openCopyDrawer(p)}
                      title='编辑文案'
                    >
                      <Edit3 className='mr-1 size-3.5' />
                      文案
                    </Button>
                  </div>

                  <div>
                    {!isHome ? (
                      <Button
                        size='sm'
                        variant='secondary'
                        className='h-8 text-xs font-semibold'
                        onClick={() => {
                          setSwitchingPage(p)
                          setSwitchConfirmOpen(true)
                        }}
                      >
                        设为首页
                      </Button>
                    ) : (
                      <span className='flex items-center text-xs text-primary font-medium pr-1'>
                        <CheckCircle2 className='mr-1 size-3.5' />
                        生效中
                      </span>
                    )}
                  </div>
                </CardFooter>
              </Card>
            )
          })
        )}
      </div>

      {/* Switch Home Landing Confirm Dialog */}
      <ConfirmDialog
        open={switchConfirmOpen}
        onOpenChange={setSwitchConfirmOpen}
        title='切换网站首页落地页'
        desc={
          <div className='space-y-2 text-sm'>
            <p>
              确定要将网站首页 (/) 切换为「<strong>{switchingPage?.title}</strong>」吗？
            </p>
            <p className='text-muted-foreground text-xs'>
              切换后，访问根域名的所有用户将默认加载「{switchingPage?.path}
              」，无需前端跳转，由 Cloudflare Functions 毫秒级重写直出。
            </p>
          </div>
        }
        confirmText='确认切换首页'
        cancelBtnText='取消'
        isLoading={isSwitching}
        handleConfirm={executeSetHome}
      />

      {/* Copy Editor Drawer (Offcanvas Sheet) */}
      <Sheet open={copyDrawerOpen} onOpenChange={setCopyDrawerOpen}>
        <SheetContent side='right' className='sm:max-w-lg overflow-y-auto w-full'>
          <SheetHeader>
            <SheetTitle>编辑页面文案：{editingPage?.title}</SheetTitle>
            <SheetDescription>
              已从页面 HTML 中自动抓取标注的 <code className='text-primary'>data-landing*</code>{' '}
              元素，修改后点击保存立即生效。
            </SheetDescription>
          </SheetHeader>

          {isLoadingFields ? (
            <div className='py-16 text-center text-muted-foreground'>
              <Loader2 className='mx-auto size-6 animate-spin text-primary' />
              <p className='mt-2 text-xs'>正在解析页面文案结构...</p>
            </div>
          ) : parsedFields.length === 0 ? (
            <div className='py-12 text-center text-sm text-muted-foreground'>
              该页面暂未标注可动态替换的 data-landing 属性
            </div>
          ) : (
            <form onSubmit={handleSaveContent} className='space-y-4 py-4 text-sm'>
              <div className='space-y-3'>
                {parsedFields.map((f) => (
                  <div key={f.key} className='grid gap-1.5 rounded-lg border border-border/40 p-3 bg-secondary/10'>
                    <div className='flex items-center justify-between'>
                      <Label htmlFor={`field-${f.key}`} className='text-xs font-semibold'>
                        {f.label}
                      </Label>
                      <Badge variant='outline' className='text-[10px] font-mono'>
                        {f.kind}
                      </Badge>
                    </div>

                    {f.isLongText ? (
                      <Textarea
                        id={`field-${f.key}`}
                        rows={3}
                        value={fieldValues[f.key] ?? ''}
                        onChange={(e) =>
                          setFieldValues({ ...fieldValues, [f.key]: e.target.value })
                        }
                        className='text-xs'
                      />
                    ) : (
                      <Input
                        id={`field-${f.key}`}
                        value={fieldValues[f.key] ?? ''}
                        onChange={(e) =>
                          setFieldValues({ ...fieldValues, [f.key]: e.target.value })
                        }
                        className='h-8 text-xs'
                      />
                    )}
                    <p className='text-[10px] text-muted-foreground truncate'>
                      默认值: {f.defaultValue || '空'}
                    </p>
                  </div>
                ))}
              </div>

              <SheetFooter className='border-t border-border/40 pt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setCopyDrawerOpen(false)}
                  disabled={isSavingContent}
                >
                  取消
                </Button>
                <Button type='submit' disabled={isSavingContent}>
                  {isSavingContent ? (
                    <>
                      <Loader2 className='mr-2 size-4 animate-spin' />
                      保存中...
                    </>
                  ) : (
                    '保存页面文案'
                  )}
                </Button>
              </SheetFooter>
            </form>
          )}
        </SheetContent>
      </Sheet>

      {/* Live Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className='max-w-6xl h-[88vh] flex flex-col p-4'>
          <DialogHeader className='flex flex-row items-center justify-between border-b border-border/40 pb-3'>
            <div>
              <DialogTitle className='text-base flex items-center gap-2'>
                <span>落地页预览：{previewPage?.title}</span>
                <Badge variant='outline' className='font-mono text-xs'>
                  /?landing={previewPage?.id}
                </Badge>
              </DialogTitle>
            </div>
            <div className='flex items-center gap-1 bg-secondary/40 rounded-lg p-1'>
              <Button
                variant={previewDevice === 'desktop' ? 'secondary' : 'ghost'}
                size='sm'
                className='h-7 text-xs'
                onClick={() => setPreviewDevice('desktop')}
              >
                <Monitor className='mr-1 size-3.5' />
                桌面端 (100%)
              </Button>
              <Button
                variant={previewDevice === 'tablet' ? 'secondary' : 'ghost'}
                size='sm'
                className='h-7 text-xs'
                onClick={() => setPreviewDevice('tablet')}
              >
                <Tablet className='mr-1 size-3.5' />
                平板 (768px)
              </Button>
              <Button
                variant={previewDevice === 'mobile' ? 'secondary' : 'ghost'}
                size='sm'
                className='h-7 text-xs'
                onClick={() => setPreviewDevice('mobile')}
              >
                <Smartphone className='mr-1 size-3.5' />
                移动端 (390px)
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 px-2'
                onClick={() => {
                  if (previewPage) window.open(`/?landing=${previewPage.id}`, '_blank')
                }}
                title='新标签页打开'
              >
                <ExternalLink className='size-3.5' />
              </Button>
            </div>
          </DialogHeader>

          <div className='flex-1 w-full flex items-center justify-center bg-black/40 rounded-lg overflow-hidden p-2'>
            {previewPage && (
              <div
                className='h-full bg-background transition-all duration-300 shadow-2xl rounded-md overflow-hidden border border-border/60'
                style={{
                  width:
                    previewDevice === 'mobile'
                      ? '390px'
                      : previewDevice === 'tablet'
                      ? '768px'
                      : '100%',
                }}
              >
                <iframe
                  src={`/?landing=${previewPage.id}&preview=1&t=${Date.now()}`}
                  className='w-full h-full border-none'
                  title={`Preview ${previewPage.title}`}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Custom Page Modal */}
      <Dialog open={addPageOpen} onOpenChange={setAddPageOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>添加自定义落地页</DialogTitle>
            <DialogDescription>
              登记新的静态落地页路径，添加后可随时设为首页或提取文案。
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddCustomPage} className='space-y-3 py-2 text-sm'>
            <div className='grid gap-1.5'>
              <Label htmlFor='new-id'>落地页标识 (ID) *</Label>
              <Input
                id='new-id'
                placeholder='例如: spring-sale, event2026'
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                className='font-mono'
              />
            </div>
            <div className='grid gap-1.5'>
              <Label htmlFor='new-title'>展示标题 *</Label>
              <Input
                id='new-title'
                placeholder='例如: 春季促销专题页'
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className='grid gap-1.5'>
              <Label htmlFor='new-path'>静态页面路径 (以 / 开头，.html 结尾) *</Label>
              <Input
                id='new-path'
                placeholder='例如: /landing/spring-sale.html'
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                className='font-mono text-xs'
              />
            </div>
            <div className='flex justify-end gap-2 pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setAddPageOpen(false)}
                disabled={isAddingPage}
              >
                取消
              </Button>
              <Button type='submit' disabled={isAddingPage}>
                {isAddingPage ? <Loader2 className='size-4 animate-spin' /> : '添加落地页'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
