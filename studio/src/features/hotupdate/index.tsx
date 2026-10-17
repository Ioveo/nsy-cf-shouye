import { useState, useRef } from 'react'
import {
  Zap,
  Upload,
  RefreshCw,
  History,
  CheckCircle2,
  FileArchive,
  Loader2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCatalog } from '@/lib/queries'
import { api } from '@/lib/api'
// @ts-ignore
import { uploadHotUpdateFile, computeFileHash, formatBytes } from '@r2'
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
} from '@/components/ui/card'

interface UpdateInfo {
  app: string; version: string; appName?: string; minSupportedVersion?: string
  patchUrl?: string; patchMd5?: string; patchSize?: number; fullSetupUrl?: string
  forceUpdate?: boolean; changelog?: string; updatedAt?: string
}

export function HotUpdateFeature() {
  const queryClient = useQueryClient()
  const { data: catalog } = useCatalog()
  const softwareList = catalog?.software || []

  const [selectedApp, setSelectedApp] = useState<string>('desktop')

  // Form state
  const [formVersion, setFormVersion] = useState('')
  const [formAppName, setFormAppName] = useState('天才猫桌面 2.0')
  const [formMinVersion, setFormMinVersion] = useState('')
  const [formPatchUrl, setFormPatchUrl] = useState('')
  const [formPatchMd5, setFormPatchMd5] = useState('')
  const [formPatchSize, setFormPatchSize] = useState<number>(0)
  const [formSetupUrl, setFormSetupUrl] = useState('')
  const [formForceUpdate, setFormForceUpdate] = useState(false)
  const [formChangelog, setFormChangelog] = useState('优化系统稳定性，提升运行流畅度。')

  const [uploadingFile, setUploadingFile] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Query current version.json
  const { data: currentVersion, isLoading: isLoadingCurrent, refetch: refetchCurrent } = useQuery<UpdateInfo>({
    queryKey: ['update-current', selectedApp],
    queryFn: async () => {
      const res = await fetch(`/api/update?app=${selectedApp}&t=${Date.now()}`)
      if (!res.ok) return null
      return res.json()
    },
  })

  // Query history
  const { data: historyList, isLoading: isLoadingHistory, refetch: refetchHistory } = useQuery<UpdateInfo[]>({
    queryKey: ['update-history', selectedApp],
    queryFn: async () => {
      const res = await fetch(`/api/update?app=${selectedApp}&action=history&t=${Date.now()}`)
      if (!res.ok) return []
      return res.json()
    },
  })

  // File upload handler
  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFile(true)
    try {
      toast.info('正在计算文件哈希...')
      const hash = await computeFileHash(file)
      setFormPatchMd5(hash)
      setFormPatchSize(file.size)

      toast.info('正在上传增量热更包到 R2...')
      const res = await uploadHotUpdateFile(file, selectedApp)

      if (res.success) {
        toast.success('热更新文件上传完成')
        const targetUrl = res.url || `/apps/${selectedApp}/${file.name}`
        setFormPatchUrl(targetUrl)
        if (!formSetupUrl) {
          setFormSetupUrl(targetUrl)
        }
      } else {
        toast.error(res.msg || '上传失败')
      }
    } catch (err: any) {
      toast.error(`上传异常：${err.message}`)
    } finally {
      setUploadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Publish handler
  async function handlePublish(e: React.FormEvent) {
    e.preventDefault()
    if (!formVersion.trim()) {
      toast.error('版本号不能为空')
      return
    }

    setIsPublishing(true)
    try {
      const payload = {
        app: selectedApp,
        version: formVersion.trim().replace(/^v/i, ''),
        appName: formAppName.trim(),
        minSupportedVersion: formMinVersion.trim() || formVersion.trim(),
        patchUrl: formPatchUrl.trim(),
        patchMd5: formPatchMd5.trim(),
        patchSize: Number(formPatchSize) || 0,
        fullSetupUrl: formSetupUrl.trim(),
        forceUpdate: formForceUpdate,
        changelog: formChangelog.trim(),
      }

      const res = await api.post('/api/update', payload)
      if (res.success || res.version) {
        toast.success(`热更新版本 v${payload.version} 发布成功！已写入 version.json`)
        refetchCurrent()
        refetchHistory()
      } else {
        toast.error(res.error || res.msg || '发布失败')
      }
    } catch (err: any) {
      toast.error(`发布异常：${err.message}`)
    } finally {
      setIsPublishing(false)
    }
  }

  function handleRollback(item: UpdateInfo) {
    setFormVersion(item.version)
    if (item.appName) setFormAppName(item.appName)
    if (item.minSupportedVersion) setFormMinVersion(item.minSupportedVersion)
    if (item.patchUrl) setFormPatchUrl(item.patchUrl)
    if (item.patchMd5) setFormPatchMd5(item.patchMd5)
    if (item.patchSize) setFormPatchSize(item.patchSize)
    if (item.fullSetupUrl) setFormSetupUrl(item.fullSetupUrl)
    setFormForceUpdate(Boolean(item.forceUpdate))
    if (item.changelog) setFormChangelog(item.changelog)
    toast.info(`已将历史版本 v${item.version} 信息填入上方发布表单，确认后点击「发布」生效`)
  }

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 pt-0 md:gap-6 md:p-8'>
      {/* Header */}
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>在线热更控制台</h1>
          <p className='text-sm text-muted-foreground'>
            管理客户端增量热更新包发布、静默更新推送与发版版本回滚
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Label className='text-xs text-muted-foreground'>选择应用：</Label>
          <select
            value={selectedApp}
            onChange={(e) => {
              const val = e.target.value
              setSelectedApp(val)
              const sw = softwareList.find((s) => s.slug === val)
              if (sw) setFormAppName(sw.name)
            }}
            className='h-9 rounded-md border border-input bg-card/60 px-3 py-1 text-sm font-medium shadow-sm'
          >
            {softwareList.map((sw) => (
              <option key={sw.slug} value={sw.slug}>
                {sw.name} ({sw.slug})
              </option>
            ))}
            <option value='desktop'>天才猫桌面 (desktop)</option>
            <option value='datacenter'>天才猫数据中心 (datacenter)</option>
            <option value='live'>直播助手 (live)</option>
          </select>
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-12'>
        {/* Left Column: Publish Form & Current Info */}
        <div className='space-y-6 md:col-span-7'>
          {/* Current Status Card */}
          <Card className='border-border/60 bg-card/60 backdrop-blur-sm'>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <div className='flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                    <Zap className='size-4' />
                  </div>
                  <div>
                    <CardTitle className='text-base'>当前线上热更状态</CardTitle>
                    <CardDescription className='text-xs'>
                      接口端点：/api/update?app={selectedApp}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => refetchCurrent()}
                  className='size-8 p-0'
                >
                  <RefreshCw className='size-4' />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingCurrent ? (
                <div className='py-4 text-center text-xs text-muted-foreground'>
                  <Loader2 className='mx-auto size-4 animate-spin text-primary' />
                </div>
              ) : !currentVersion || !currentVersion.version ? (
                <div className='py-4 text-center text-sm text-muted-foreground'>
                  该应用暂未发布热更新版本配置 (version.json 不存在)
                </div>
              ) : (
                <div className='grid grid-cols-2 gap-3 text-xs'>
                  <div className='space-y-1 rounded-md border border-border/40 p-2.5 bg-secondary/10'>
                    <span className='text-muted-foreground'>当前线上版本</span>
                    <div className='font-mono text-base font-bold text-foreground'>
                      v{currentVersion.version}
                    </div>
                  </div>
                  <div className='space-y-1 rounded-md border border-border/40 p-2.5 bg-secondary/10'>
                    <span className='text-muted-foreground'>应用显示名称</span>
                    <div className='font-medium text-foreground truncate'>
                      {currentVersion.appName || selectedApp}
                    </div>
                  </div>
                  <div className='space-y-1 rounded-md border border-border/40 p-2.5 bg-secondary/10 col-span-2'>
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground'>热更包下载地址</span>
                      {currentVersion.forceUpdate && (
                        <Badge variant='destructive' className='text-[10px]'>
                          强制更新
                        </Badge>
                      )}
                    </div>
                    <div className='font-mono truncate text-primary'>
                      {currentVersion.patchUrl || '未配置'}
                    </div>
                  </div>
                  <div className='space-y-1 rounded-md border border-border/40 p-2.5 bg-secondary/10 col-span-2'>
                    <span className='text-muted-foreground'>更新日志</span>
                    <p className='text-foreground'>{currentVersion.changelog}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Publish Form Card */}
          <Card className='border-border/60 bg-card/60 backdrop-blur-sm'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base'>发布新热更版本</CardTitle>
              <CardDescription className='text-xs'>
                上传增量更新包（.zip / .exe），配置版本号并推送上线。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePublish} className='space-y-4 text-sm'>
                {/* Upload Section */}
                <div className='grid gap-2'>
                  <Label>上传热更文件至 R2 (apps/{selectedApp}/)</Label>
                  <div
                    className='rounded-lg border-2 border-dashed border-border/80 p-4 text-center cursor-pointer hover:border-primary/50 transition-colors bg-secondary/10'
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type='file'
                      ref={fileInputRef}
                      onChange={handleFileSelected}
                      className='hidden'
                    />
                    <div className='space-y-1'>
                      <FileArchive className='mx-auto size-6 text-primary' />
                      <p className='text-xs font-medium'>
                        {uploadingFile ? '正在上传中...' : '点击选择增量补丁文件 (如 patch.zip)'}
                      </p>
                      <p className='text-[10px] text-muted-foreground'>
                        上传后将自动计算 SHA256 哈希并填入 Patch URL
                      </p>
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <div className='grid gap-1.5'>
                    <Label htmlFor='hu-ver'>新版本号 *</Label>
                    <Input
                      id='hu-ver'
                      placeholder='例如: 2.0.2'
                      value={formVersion}
                      onChange={(e) => setFormVersion(e.target.value)}
                    />
                  </div>

                  <div className='grid gap-1.5'>
                    <Label htmlFor='hu-appname'>应用中文名</Label>
                    <Input
                      id='hu-appname'
                      value={formAppName}
                      onChange={(e) => setFormAppName(e.target.value)}
                    />
                  </div>
                </div>

                <div className='grid gap-1.5'>
                  <Label htmlFor='hu-patchurl'>热更增量包下载地址 (Patch URL) *</Label>
                  <Input
                    id='hu-patchurl'
                    placeholder='例如: /apps/desktop/TianCaiMao.Desktop.exe'
                    value={formPatchUrl}
                    onChange={(e) => setFormPatchUrl(e.target.value)}
                    className='font-mono text-xs'
                  />
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <div className='grid gap-1.5'>
                    <Label htmlFor='hu-md5'>文件 SHA256 / MD5 哈希</Label>
                    <Input
                      id='hu-md5'
                      placeholder='上传后自动填入'
                      value={formPatchMd5}
                      onChange={(e) => setFormPatchMd5(e.target.value)}
                      className='font-mono text-xs'
                    />
                  </div>

                  <div className='grid gap-1.5'>
                    <Label htmlFor='hu-minver'>最低支持版本</Label>
                    <Input
                      id='hu-minver'
                      placeholder='低于此版本强制全量安装'
                      value={formMinVersion}
                      onChange={(e) => setFormMinVersion(e.target.value)}
                    />
                  </div>
                </div>

                <div className='grid gap-1.5'>
                  <Label htmlFor='hu-setupurl'>全量安装包地址 (Full Setup URL)</Label>
                  <Input
                    id='hu-setupurl'
                    placeholder='例如: /apps/desktop/TianCaiMao-Setup-v2.0.2.exe'
                    value={formSetupUrl}
                    onChange={(e) => setFormSetupUrl(e.target.value)}
                    className='font-mono text-xs'
                  />
                </div>

                <div className='flex items-center gap-2 pt-1'>
                  <input
                    type='checkbox'
                    id='hu-force'
                    checked={formForceUpdate}
                    onChange={(e) => setFormForceUpdate(e.target.checked)}
                    className='size-4 rounded border-input text-primary focus:ring-primary'
                  />
                  <Label htmlFor='hu-force' className='cursor-pointer text-xs'>
                    强制全量更新 (客户端检测到更新后不可跳过)
                  </Label>
                </div>

                <div className='grid gap-1.5'>
                  <Label htmlFor='hu-cl'>本次更新日志</Label>
                  <Textarea
                    id='hu-cl'
                    rows={3}
                    value={formChangelog}
                    onChange={(e) => setFormChangelog(e.target.value)}
                  />
                </div>

                <Button type='submit' className='w-full' disabled={isPublishing}>
                  {isPublishing ? (
                    <>
                      <Loader2 className='mr-2 size-4 animate-spin' />
                      正在发布热更...
                    </>
                  ) : (
                    <>
                      <Zap className='mr-2 size-4' />
                      立即发布热更新 (覆盖 version.json)
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: History Audit */}
        <div className='space-y-6 md:col-span-5'>
          <Card className='border-border/60 bg-card/60 backdrop-blur-sm'>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <History className='size-4 text-primary' />
                  <div>
                    <CardTitle className='text-base'>发版审计与历史回退</CardTitle>
                    <CardDescription className='text-xs'>
                      最近 50 次热更发版记录 (history.json)
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => refetchHistory()}
                  className='size-8 p-0'
                >
                  <RefreshCw className='size-4' />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className='py-8 text-center text-xs text-muted-foreground'>
                  <Loader2 className='mx-auto size-4 animate-spin text-primary' />
                </div>
              ) : !historyList || historyList.length === 0 ? (
                <div className='py-8 text-center text-sm text-muted-foreground'>
                  暂无历史发版记录
                </div>
              ) : (
                <div className='space-y-3 max-h-[600px] overflow-y-auto pr-1'>
                  {historyList.map((item, idx) => (
                    <div
                      key={idx}
                      className='rounded-lg border border-border/40 p-3 space-y-2 text-xs bg-secondary/10'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-1.5'>
                          <span className='font-mono font-bold text-sm text-foreground'>
                            v{item.version}
                          </span>
                          {idx === 0 && (
                            <Badge className='bg-primary/20 text-primary border-primary/30 text-[10px]'>
                              当前生效
                            </Badge>
                          )}
                          {item.forceUpdate && (
                            <Badge variant='destructive' className='text-[10px]'>
                              强更
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          className='h-6 text-[11px]'
                          onClick={() => handleRollback(item)}
                        >
                          填入回退
                        </Button>
                      </div>
                      <div className='font-mono truncate text-muted-foreground text-[11px]'>
                        {item.patchUrl || item.fullSetupUrl}
                      </div>
                      <p className='text-foreground/80 line-clamp-2'>{item.changelog}</p>
                      <div className='text-[10px] text-muted-foreground'>
                        发布时间: {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '未知'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
