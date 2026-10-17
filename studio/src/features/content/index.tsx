import { useState } from 'react'
import {
  FileText,
  Compass,
  Music,
  Image,
  Sliders,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCatalog } from '@/lib/queries'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { ConfirmDialog } from '@/components/confirm-dialog'

export function ContentFeature() {
  const queryClient = useQueryClient()
  const { data: catalog, isLoading } = useCatalog()

  const [activeTab, setActiveTab] = useState('nav')

  // Site mode
  const currentSiteMode = (catalog as any)?.site?.siteMode || 'portal'
  const [isUpdatingMode, setIsUpdatingMode] = useState(false)

  // Navigation drawer
  const [navDrawerOpen, setNavDrawerOpen] = useState(false)
  const [navEditingItem, setNavEditingItem] = useState<any>(null)
  const [navLabel, setNavLabel] = useState('')
  const [navHref, setNavHref] = useState('')
  const [navTarget, setNavTarget] = useState('_self')
  const [navSortOrder, setNavSortOrder] = useState<number>(0)
  const [isSavingNav, setIsSavingNav] = useState(false)

  // Article drawer
  const [articleDrawerOpen, setArticleDrawerOpen] = useState(false)
  const [articleEditing, setArticleEditing] = useState<any>(null)
  const [artTitle, setArtTitle] = useState('')
  const [artSlug, setArtSlug] = useState('')
  const [artSummary, setArtSummary] = useState('')
  const [artContent, setArtContent] = useState('')
  const [artCover, setArtCover] = useState('')
  const [isSavingArticle, setIsSavingArticle] = useState(false)

  // Music drawer
  const [musicDrawerOpen, setMusicDrawerOpen] = useState(false)
  const [musicEditing, setMusicEditing] = useState<any>(null)
  const [musicTitle, setMusicTitle] = useState('')
  const [musicArtist, setMusicArtist] = useState('')
  const [musicUrl, setMusicUrl] = useState('')
  const [musicCover, setMusicCover] = useState('')
  const [isSavingMusic, setIsSavingMusic] = useState(false)

  // Carousel drawer
  const [carouselDrawerOpen, setCarouselDrawerOpen] = useState(false)
  const [carouselEditing, setCarouselEditing] = useState<any>(null)
  const [carouselTitle, setCarouselTitle] = useState('')
  const [carouselImage, setCarouselImage] = useState('')
  const [carouselLink, setCarouselLink] = useState('')
  const [carouselSortOrder, setCarouselSortOrder] = useState(0)
  const [isSavingCarousel, setIsSavingCarousel] = useState(false)

  // Generic delete confirm
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    title: string
    desc: string
    action: () => Promise<void>
  }>({
    open: false,
    title: '',
    desc: '',
    action: async () => {},
  })
  const [isDeleting, setIsDeleting] = useState(false)

  const navList = (catalog as any)?.navigation || []
  const articlesList = (catalog as any)?.articles || []
  const musicList = (catalog as any)?.music || []
  const galleryList = (catalog as any)?.gallery || []
  const photoWallList = (catalog as any)?.photoWall || []
  const carouselList = (catalog as any)?.siteCarousel || []

  async function handleSwitchSiteMode(mode: string) {
    setIsUpdatingMode(true)
    try {
      const res = await api.post('/api/admin/site-mode', { mode })
      if (res.success) {
        toast.success(`网站模式已切换为「${mode}」`)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '切换模式失败')
      }
    } catch (err: any) {
      toast.error(`切换异常：${err.message}`)
    } finally {
      setIsUpdatingMode(false)
    }
  }

  // Navigation handlers
  function openNavDrawer(item?: any) {
    if (item) {
      setNavEditingItem(item)
      setNavLabel(item.label || item.title || '')
      setNavHref(item.href || item.url || '')
      setNavTarget(item.target || '_self')
      setNavSortOrder(item.sortOrder ?? 0)
    } else {
      setNavEditingItem(null)
      setNavLabel('')
      setNavHref('')
      setNavTarget('_self')
      setNavSortOrder(navList.length)
    }
    setNavDrawerOpen(true)
  }

  async function handleSaveNav(e: React.FormEvent) {
    e.preventDefault()
    if (!navLabel.trim() || !navHref.trim()) {
      toast.error('导航标题和链接为必填')
      return
    }

    setIsSavingNav(true)
    try {
      const payload = {
        id: navEditingItem?.id || '',
        label: navLabel.trim(),
        href: navHref.trim(),
        target: navTarget,
        sortOrder: Number(navSortOrder) || 0,
      }
      const res = await api.post('/api/admin/navigation', payload)
      if (res.success) {
        toast.success('导航项已保存')
        setNavDrawerOpen(false)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '保存导航项失败')
      }
    } catch (err: any) {
      toast.error(`保存异常：${err.message}`)
    } finally {
      setIsSavingNav(false)
    }
  }

  function confirmDeleteNav(item: any) {
    setDeleteDialog({
      open: true,
      title: '删除导航项',
      desc: `确定要删除导航「${item.label || item.title}」吗？`,
      action: async () => {
        setIsDeleting(true)
        try {
          const res = await api.post('/api/admin/navigation/delete', { id: item.id })
          if (res.success) {
            toast.success('导航项已删除')
            setDeleteDialog((d) => ({ ...d, open: false }))
            queryClient.invalidateQueries({ queryKey: ['catalog'] })
          } else {
            toast.error(res.msg || '删除失败')
          }
        } finally {
          setIsDeleting(false)
        }
      },
    })
  }

  // Article handlers
  function openArticleDrawer(item?: any) {
    if (item) {
      setArticleEditing(item)
      setArtTitle(item.title || '')
      setArtSlug(item.slug || '')
      setArtSummary(item.summary || '')
      setArtContent(item.content || '')
      setArtCover(item.coverUrl || '')
    } else {
      setArticleEditing(null)
      setArtTitle('')
      setArtSlug('')
      setArtSummary('')
      setArtContent('')
      setArtCover('')
    }
    setArticleDrawerOpen(true)
  }

  async function handleSaveArticle(e: React.FormEvent) {
    e.preventDefault()
    if (!artTitle.trim()) {
      toast.error('文章标题不能为空')
      return
    }

    setIsSavingArticle(true)
    try {
      const payload = {
        id: articleEditing?.id || '',
        title: artTitle.trim(),
        slug: artSlug.trim() || `post-${Date.now()}`,
        summary: artSummary.trim(),
        content: artContent.trim(),
        coverUrl: artCover.trim(),
        status: 'published',
      }
      const res = await api.post('/api/admin/articles', payload)
      if (res.success) {
        toast.success('文章已保存')
        setArticleDrawerOpen(false)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '保存文章失败')
      }
    } catch (err: any) {
      toast.error(`保存异常：${err.message}`)
    } finally {
      setIsSavingArticle(false)
    }
  }

  function confirmDeleteArticle(item: any) {
    setDeleteDialog({
      open: true,
      title: '删除文章',
      desc: `确定要删除文章「${item.title}」吗？`,
      action: async () => {
        setIsDeleting(true)
        try {
          const res = await api.post('/api/admin/articles/delete', { id: item.id })
          if (res.success) {
            toast.success('文章已删除')
            setDeleteDialog((d) => ({ ...d, open: false }))
            queryClient.invalidateQueries({ queryKey: ['catalog'] })
          } else {
            toast.error(res.msg || '删除失败')
          }
        } finally {
          setIsDeleting(false)
        }
      },
    })
  }

  // Carousel handlers
  function openCarouselDrawer(item?: any) {
    if (item) {
      setCarouselEditing(item)
      setCarouselTitle(item.title || '')
      setCarouselImage(item.image || item.imageUrl || '')
      setCarouselLink(item.link || item.url || '')
      setCarouselSortOrder(item.sortOrder ?? 0)
    } else {
      setCarouselEditing(null)
      setCarouselTitle('')
      setCarouselImage('')
      setCarouselLink('')
      setCarouselSortOrder(carouselList.length)
    }
    setCarouselDrawerOpen(true)
  }

  async function handleSaveCarousel(e: React.FormEvent) {
    e.preventDefault()
    if (!carouselTitle.trim() || !carouselImage.trim()) {
      toast.error('标题和图片地址为必填')
      return
    }

    setIsSavingCarousel(true)
    try {
      const payload = {
        id: carouselEditing?.id || '',
        title: carouselTitle.trim(),
        image: carouselImage.trim(),
        link: carouselLink.trim(),
        sortOrder: Number(carouselSortOrder) || 0,
        status: 'published',
      }
      const res = await api.post('/api/admin/site-carousel', payload)
      if (res.success) {
        toast.success('轮播图已保存')
        setCarouselDrawerOpen(false)
        queryClient.invalidateQueries({ queryKey: ['catalog'] })
      } else {
        toast.error(res.msg || '保存失败')
      }
    } catch (err: any) {
      toast.error(`保存异常：${err.message}`)
    } finally {
      setIsSavingCarousel(false)
    }
  }

  function confirmDeleteCarousel(item: any) {
    setDeleteDialog({
      open: true,
      title: '删除轮播图',
      desc: `确定要删除轮播项「${item.title}」吗？`,
      action: async () => {
        setIsDeleting(true)
        try {
          const res = await api.post('/api/admin/site-carousel', {
            action: 'delete',
            id: item.id,
          })
          if (res.success) {
            toast.success('轮播项已删除')
            setDeleteDialog((d) => ({ ...d, open: false }))
            queryClient.invalidateQueries({ queryKey: ['catalog'] })
          } else {
            toast.error(res.msg || '删除失败')
          }
        } finally {
          setIsDeleting(false)
        }
      },
    })
  }

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 pt-0 md:gap-6 md:p-8'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>内容与导航</h1>
        <p className='text-sm text-muted-foreground'>
          管理网站整体模式、顶部导航条、首页轮播、文章资讯与生态内容
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-4'>
        <TabsList className='bg-card/60 border border-border/40 p-1 flex-wrap h-auto'>
          <TabsTrigger value='nav' className='text-xs'>
            <Compass className='mr-1.5 size-3.5' />
            网站模式与导航
          </TabsTrigger>
          <TabsTrigger value='articles' className='text-xs'>
            <FileText className='mr-1.5 size-3.5' />
            文章资讯 ({articlesList.length})
          </TabsTrigger>
          <TabsTrigger value='carousel' className='text-xs'>
            <Sliders className='mr-1.5 size-3.5' />
            首页轮播 ({carouselList.length})
          </TabsTrigger>
          <TabsTrigger value='media' className='text-xs'>
            <Music className='mr-1.5 size-3.5' />
            生态媒体 (音乐/画廊)
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Site Mode & Navigation */}
        <TabsContent value='nav' className='space-y-6'>
          {/* Site Mode Card */}
          <Card className='border-border/60 bg-card/60 backdrop-blur-sm'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base'>网站全局模式 (Site Mode)</CardTitle>
              <CardDescription className='text-xs'>
                控制网站前台默认路由与导航结构偏好。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-3 sm:grid-cols-3'>
                {[
                  {
                    id: 'portal',
                    title: '综合门户模式',
                    desc: '展示旗舰产品、生态入口与最新文章',
                  },
                  {
                    id: 'software',
                    title: '纯软件中心模式',
                    desc: '直接展现全量软件目录与下载矩阵',
                  },
                  {
                    id: 'blog',
                    title: '文章资讯博客模式',
                    desc: '以文章内容与更新日志为核心',
                  },
                ].map((m) => (
                  <div
                    key={m.id}
                    className={`cursor-pointer rounded-lg border p-3.5 transition-all ${
                      currentSiteMode === m.id
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border/60 bg-secondary/10 hover:border-border'
                    }`}
                    onClick={() => handleSwitchSiteMode(m.id)}
                  >
                    <div className='flex items-center justify-between'>
                      <span className='font-semibold text-sm'>{m.title}</span>
                      {currentSiteMode === m.id && (
                        <CheckCircle2 className='size-4 text-primary' />
                      )}
                    </div>
                    <p className='mt-1 text-xs text-muted-foreground'>{m.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Navigation Items Card */}
          <Card className='border-border/60 bg-card/60 backdrop-blur-sm'>
            <CardHeader className='flex flex-row items-center justify-between pb-3'>
              <div>
                <CardTitle className='text-base'>前台顶部导航菜单</CardTitle>
                <CardDescription className='text-xs'>
                  前台各页面中带 <code className='text-primary'>data-nav</code> 属性的菜单项
                </CardDescription>
              </div>
              <Button size='sm' onClick={() => openNavDrawer()}>
                <Plus className='mr-1.5 size-4' />
                添加导航项
              </Button>
            </CardHeader>
            <CardContent>
              <div className='rounded-lg border border-border/40 overflow-hidden'>
                <table className='w-full text-left text-sm'>
                  <thead className='border-b border-border/40 bg-muted/30 text-xs text-muted-foreground'>
                    <tr>
                      <th className='px-4 py-2.5'>标题</th>
                      <th className='px-4 py-2.5'>跳转链接</th>
                      <th className='px-4 py-2.5 text-center'>打开方式</th>
                      <th className='px-4 py-2.5 text-center'>排序</th>
                      <th className='px-4 py-2.5 text-right'>操作</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-border/40'>
                    {navList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className='px-4 py-6 text-center text-xs text-muted-foreground'>
                          暂无导航项配置
                        </td>
                      </tr>
                    ) : (
                      navList.map((item: any, idx: number) => (
                        <tr key={item.id || idx} className='hover:bg-muted/20'>
                          <td className='px-4 py-2.5 font-semibold text-xs'>
                            {item.label || item.title}
                          </td>
                          <td className='px-4 py-2.5 font-mono text-xs text-muted-foreground'>
                            {item.href || item.url}
                          </td>
                          <td className='px-4 py-2.5 text-center text-xs'>
                            {item.target === '_blank' ? '新窗口' : '当前页'}
                          </td>
                          <td className='px-4 py-2.5 text-center font-mono text-xs text-muted-foreground'>
                            {item.sortOrder ?? idx}
                          </td>
                          <td className='px-4 py-2.5 text-right'>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='size-7 p-0'
                              onClick={() => openNavDrawer(item)}
                            >
                              <Edit2 className='size-3.5' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='size-7 p-0 text-destructive'
                              onClick={() => confirmDeleteNav(item)}
                            >
                              <Trash2 className='size-3.5' />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Articles */}
        <TabsContent value='articles' className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='text-sm text-muted-foreground'>
              发布软件使用教程、更新说明与技术博客
            </div>
            <Button size='sm' onClick={() => openArticleDrawer()}>
              <Plus className='mr-1.5 size-4' />
              发表新文章
            </Button>
          </div>

          <div className='rounded-xl border border-border/60 bg-card/60 overflow-hidden'>
            <table className='w-full text-left text-sm'>
              <thead className='border-b border-border/40 bg-muted/30 text-xs text-muted-foreground'>
                <tr>
                  <th className='px-4 py-3'>标题</th>
                  <th className='px-4 py-3'>Slug</th>
                  <th className='px-4 py-3'>摘要</th>
                  <th className='px-4 py-3 text-right'>操作</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/40'>
                {articlesList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className='px-4 py-8 text-center text-xs text-muted-foreground'>
                      暂无已发布的文章
                    </td>
                  </tr>
                ) : (
                  articlesList.map((art: any) => (
                    <tr key={art.id} className='hover:bg-muted/20'>
                      <td className='px-4 py-3 font-semibold text-xs'>{art.title}</td>
                      <td className='px-4 py-3 font-mono text-xs text-muted-foreground'>
                        {art.slug}
                      </td>
                      <td className='px-4 py-3 text-xs text-muted-foreground max-w-sm truncate'>
                        {art.summary || '无摘要'}
                      </td>
                      <td className='px-4 py-3 text-right'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='size-8 p-0'
                          onClick={() => openArticleDrawer(art)}
                        >
                          <Edit2 className='size-3.5' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='size-8 p-0 text-destructive'
                          onClick={() => confirmDeleteArticle(art)}
                        >
                          <Trash2 className='size-3.5' />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Tab 3: Carousel */}
        <TabsContent value='carousel' className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='text-sm text-muted-foreground'>
              综合门户首屏大图轮播条目
            </div>
            <Button size='sm' onClick={() => openCarouselDrawer()}>
              <Plus className='mr-1.5 size-4' />
              添加轮播项
            </Button>
          </div>

          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {carouselList.length === 0 ? (
              <div className='col-span-full py-12 text-center text-xs text-muted-foreground'>
                暂无轮播图条目
              </div>
            ) : (
              carouselList.map((item: any) => (
                <Card key={item.id} className='border-border/60 bg-card/60 overflow-hidden'>
                  <div className='h-32 w-full bg-secondary/30 relative overflow-hidden'>
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title}
                        className='w-full h-full object-cover'
                      />
                    )}
                  </div>
                  <CardHeader className='p-3 pb-2'>
                    <CardTitle className='text-sm'>{item.title}</CardTitle>
                    <CardDescription className='font-mono text-xs truncate'>
                      {item.link || '无跳转'}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className='p-3 pt-0 flex justify-end gap-1'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='size-7 p-0'
                      onClick={() => openCarouselDrawer(item)}
                    >
                      <Edit2 className='size-3.5' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='size-7 p-0 text-destructive'
                      onClick={() => confirmDeleteCarousel(item)}
                    >
                      <Trash2 className='size-3.5' />
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Tab 4: Ecological Media (Music & Gallery) */}
        <TabsContent value='media' className='space-y-4'>
          <div className='grid gap-6 md:grid-cols-2'>
            <Card className='border-border/60 bg-card/60'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base flex items-center justify-between'>
                  <span>音乐曲库 ({musicList.length})</span>
                </CardTitle>
                <CardDescription className='text-xs'>/music.html 播放曲目</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='divide-y divide-border/40 max-h-64 overflow-y-auto'>
                  {musicList.length === 0 ? (
                    <p className='py-6 text-center text-xs text-muted-foreground'>暂无曲目</p>
                  ) : (
                    musicList.map((m: any) => (
                      <div key={m.id} className='py-2 flex items-center justify-between text-xs'>
                        <div>
                          <div className='font-semibold'>{m.title}</div>
                          <div className='text-muted-foreground'>{m.artist}</div>
                        </div>
                        <Badge variant='outline'>{m.channel || '默认'}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className='border-border/60 bg-card/60'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base flex items-center justify-between'>
                  <span>画廊与照片墙 ({galleryList.length + photoWallList.length})</span>
                </CardTitle>
                <CardDescription className='text-xs'>/gallery.html 及首页照片墙素材</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-4 gap-2 max-h-64 overflow-y-auto'>
                  {[...galleryList, ...photoWallList].map((img: any, i) => (
                    <div key={i} className='aspect-square rounded border border-border/40 overflow-hidden bg-secondary/20'>
                      <img
                        src={img.url || img.image}
                        alt={img.title || ''}
                        className='w-full h-full object-cover'
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Nav Edit Drawer */}
      <Sheet open={navDrawerOpen} onOpenChange={setNavDrawerOpen}>
        <SheetContent side='right' className='sm:max-w-md'>
          <SheetHeader>
            <SheetTitle>{navEditingItem ? '编辑导航菜单' : '添加导航菜单'}</SheetTitle>
            <SheetDescription>配置前台顶部导航项显示文本与目标链接。</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSaveNav} className='space-y-4 py-4 text-sm'>
            <div className='grid gap-1.5'>
              <Label htmlFor='nav-label'>菜单显示名称 *</Label>
              <Input
                id='nav-label'
                placeholder='例如: 软件中心, 桌面 2.0, 博客'
                value={navLabel}
                onChange={(e) => setNavLabel(e.target.value)}
              />
            </div>
            <div className='grid gap-1.5'>
              <Label htmlFor='nav-href'>跳转链接 (URL) *</Label>
              <Input
                id='nav-href'
                placeholder='例如: /download.html, /desktop.html, https://...'
                value={navHref}
                onChange={(e) => setNavHref(e.target.value)}
                className='font-mono text-xs'
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='grid gap-1.5'>
                <Label htmlFor='nav-target'>打开方式</Label>
                <select
                  id='nav-target'
                  value={navTarget}
                  onChange={(e) => setNavTarget(e.target.value)}
                  className='h-9 rounded-md border border-input bg-background px-3 py-1 text-xs'
                >
                  <option value='_self'>当前窗口 (_self)</option>
                  <option value='_blank'>新标签页 (_blank)</option>
                </select>
              </div>
              <div className='grid gap-1.5'>
                <Label htmlFor='nav-sort'>排序权重</Label>
                <Input
                  id='nav-sort'
                  type='number'
                  value={navSortOrder}
                  onChange={(e) => setNavSortOrder(Number(e.target.value))}
                />
              </div>
            </div>
            <SheetFooter className='pt-4'>
              <Button type='submit' disabled={isSavingNav}>
                {isSavingNav ? '保存中...' : '保存导航项'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Article Edit Drawer */}
      <Sheet open={articleDrawerOpen} onOpenChange={setArticleDrawerOpen}>
        <SheetContent side='right' className='sm:max-w-lg overflow-y-auto w-full'>
          <SheetHeader>
            <SheetTitle>{articleEditing ? '编辑文章' : '发表新文章'}</SheetTitle>
            <SheetDescription>录入文章标题、路径 Slug、封面与 Markdown 正文。</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSaveArticle} className='space-y-4 py-4 text-sm'>
            <div className='grid gap-1.5'>
              <Label htmlFor='art-title'>文章标题 *</Label>
              <Input
                id='art-title'
                placeholder='输入文章主标题...'
                value={artTitle}
                onChange={(e) => setArtTitle(e.target.value)}
              />
            </div>
            <div className='grid gap-1.5'>
              <Label htmlFor='art-slug'>访问 Slug</Label>
              <Input
                id='art-slug'
                placeholder='如: v2-release-notes'
                value={artSlug}
                onChange={(e) => setArtSlug(e.target.value)}
                className='font-mono text-xs'
              />
            </div>
            <div className='grid gap-1.5'>
              <Label htmlFor='art-cover'>封面图片 URL</Label>
              <Input
                id='art-cover'
                placeholder='https://... 或 /assets/...'
                value={artCover}
                onChange={(e) => setArtCover(e.target.value)}
                className='font-mono text-xs'
              />
            </div>
            <div className='grid gap-1.5'>
              <Label htmlFor='art-summary'>文章摘要</Label>
              <Textarea
                id='art-summary'
                rows={2}
                placeholder='一到两句话简介...'
                value={artSummary}
                onChange={(e) => setArtSummary(e.target.value)}
              />
            </div>
            <div className='grid gap-1.5'>
              <Label htmlFor='art-content'>文章正文 (Markdown)</Label>
              <Textarea
                id='art-content'
                rows={8}
                placeholder='正文内容...'
                value={artContent}
                onChange={(e) => setArtContent(e.target.value)}
                className='font-mono text-xs'
              />
            </div>
            <SheetFooter className='pt-4'>
              <Button type='submit' disabled={isSavingArticle}>
                {isSavingArticle ? '保存中...' : '保存文章'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Carousel Edit Drawer */}
      <Sheet open={carouselDrawerOpen} onOpenChange={setCarouselDrawerOpen}>
        <SheetContent side='right' className='sm:max-w-md'>
          <SheetHeader>
            <SheetTitle>{carouselEditing ? '编辑轮播图' : '添加轮播图'}</SheetTitle>
            <SheetDescription>设置首页横幅图片与点击跳转链接。</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSaveCarousel} className='space-y-4 py-4 text-sm'>
            <div className='grid gap-1.5'>
              <Label htmlFor='car-title'>标题 *</Label>
              <Input
                id='car-title'
                placeholder='例如: 天才猫桌面 2.0 正式上线'
                value={carouselTitle}
                onChange={(e) => setCarouselTitle(e.target.value)}
              />
            </div>
            <div className='grid gap-1.5'>
              <Label htmlFor='car-img'>图片 URL *</Label>
              <Input
                id='car-img'
                placeholder='/assets/... 或 https://...'
                value={carouselImage}
                onChange={(e) => setCarouselImage(e.target.value)}
                className='font-mono text-xs'
              />
            </div>
            <div className='grid gap-1.5'>
              <Label htmlFor='car-link'>点击跳转链接</Label>
              <Input
                id='car-link'
                placeholder='/desktop.html'
                value={carouselLink}
                onChange={(e) => setCarouselLink(e.target.value)}
                className='font-mono text-xs'
              />
            </div>
            <div className='grid gap-1.5'>
              <Label htmlFor='car-sort'>排序</Label>
              <Input
                id='car-sort'
                type='number'
                value={carouselSortOrder}
                onChange={(e) => setCarouselSortOrder(Number(e.target.value))}
              />
            </div>
            <SheetFooter className='pt-4'>
              <Button type='submit' disabled={isSavingCarousel}>
                {isSavingCarousel ? '保存中...' : '保存轮播图'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((d) => ({ ...d, open }))}
        title={deleteDialog.title}
        desc={deleteDialog.desc}
        confirmText='确认删除'
        cancelBtnText='取消'
        destructive
        isLoading={isDeleting}
        handleConfirm={deleteDialog.action}
      />
    </div>
  )
}
