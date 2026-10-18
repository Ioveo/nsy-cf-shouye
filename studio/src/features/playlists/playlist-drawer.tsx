import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  Upload,
  Save,
  Loader2,
  Disc3,
  Sparkles,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
// @ts-ignore
import { uploadAssetFile } from '@r2'
import { SCENES, type PlaylistItem, type SceneMeta } from './types'
import { TrackPickerSection } from './track-picker-section'
import { PlaylistCoverCollage } from './playlist-cover-collage'

interface PlaylistDrawerProps {
  open: boolean
  playlist: PlaylistItem | null
  catalogTracks: any[]
  onClose: () => void
  onSave: (playlist: PlaylistItem) => Promise<void>
  isSaving: boolean
}

export function PlaylistDrawer({
  open,
  playlist,
  catalogTracks = [],
  onClose,
  onSave,
  isSaving,
}: PlaylistDrawerProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [cover, setCover] = useState('')
  const [scene, setScene] = useState<PlaylistItem['scene']>('live')
  const [trackIds, setTrackIds] = useState<string[]>([])
  const [status, setStatus] = useState<PlaylistItem['status']>('published')
  const [featured, setFeatured] = useState(false)
  const [order, setOrder] = useState(10)
  const [isUploading, setIsUploading] = useState(false)

  const coverFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    if (playlist) {
      setTitle(playlist.title || '')
      setDescription(playlist.description || '')
      setCover(playlist.cover || '')
      setScene(playlist.scene || 'live')
      setTrackIds(playlist.trackIds || [])
      setStatus(playlist.status || 'published')
      setFeatured(Boolean(playlist.featured))
      setOrder(playlist.order ?? 10)
    } else {
      setTitle('')
      setDescription('')
      setCover('')
      setScene('live')
      setTrackIds([])
      setStatus('published')
      setFeatured(false)
      setOrder(10)
    }
  }, [open, playlist])

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const res = await uploadAssetFile(file, { kind: 'image', folder: 'playlists' })
      if (res.success && res.url) {
        setCover(res.url)
        toast.success('封面图片上传成功')
      } else {
        toast.error(res.msg || '封面上传失败')
      }
    } catch (err: any) {
      toast.error(`上传异常：${err.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) {
      toast.error('请输入歌单标题')
      return
    }

    const item: PlaylistItem = {
      id: playlist?.id || `pl_${Date.now()}`,
      title: cleanTitle,
      description: description.trim(),
      cover: cover.trim(),
      scene,
      trackIds,
      status,
      order: Number(order) || 10,
      featured,
    }

    await onSave(item)
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto flex flex-col p-6"
      >
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Disc3 className="w-5 h-5 text-primary" />
            {playlist ? '编辑歌单' : '新建音乐歌单'}
          </SheetTitle>
          <SheetDescription>
            配置歌单基础信息、场景频道归属，并从曲库关联曲目
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 space-y-5 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label className="text-xs">
                歌单标题 <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：直播暖场·极度高燃"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-xs">歌单描述</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="为电商直播带货、夜间聊天设计的专属节奏..."
                className="mt-1 resize-none"
                rows={2}
              />
            </div>

            {/* Scene Selector */}
            <div>
              <Label className="text-xs">场景频道分类</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                {SCENES.map((sc) => {
                  const Icon = sc.icon
                  const isSelected = scene === sc.key
                  return (
                    <button
                      key={sc.key}
                      type="button"
                      onClick={() => setScene(sc.key)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                          : 'border-border/60 bg-muted/20 hover:bg-muted/40 text-muted-foreground'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: sc.color }}
                      />
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{sc.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Cover and Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">封面图 (留空则用前 4 首歌曲 2×2 拼贴)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  disabled={isUploading}
                  onClick={() => coverFileRef.current?.click()}
                >
                  {isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  上传封面
                </Button>
                <input
                  ref={coverFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverUpload}
                />
              </div>

              <Input
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                placeholder="https://... 或 /assets/... 或点击右侧上传"
                className="font-mono text-xs"
              />

              <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/20">
                <div className="w-24 h-24 flex-shrink-0">
                  <PlaylistCoverCollage
                    coverUrl={cover}
                    trackIds={trackIds}
                    catalogTracks={catalogTracks}
                    className="w-24 h-24"
                  />
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="font-medium text-foreground">封面实时预览</div>
                  {cover ? (
                    <p>使用自定义封面图片。</p>
                  ) : trackIds.length >= 4 ? (
                    <p className="text-emerald-500 font-medium">
                      已检测到 {trackIds.length} 首歌曲，自动生成 2×2 拼图封面。
                    </p>
                  ) : (
                    <p>尚未设置自定义封面，歌曲不足 4 首时将展示默认拼贴或单图。</p>
                  )}
                  <p className="text-[11px] text-muted-foreground/70">
                    推荐尺寸：600×600 (1:1) 正方形
                  </p>
                </div>
              </div>
            </div>

            {/* Featured & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-lg border bg-muted/10">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">主推歌单 (Featured)</Label>
                  <p className="text-[11px] text-muted-foreground">
                    在音乐频道顶部 Hero 区域优先展示
                  </p>
                </div>
                <Switch checked={featured} onCheckedChange={setFeatured} />
              </div>

              <div className="flex items-center justify-between sm:border-l sm:pl-4">
                <div>
                  <Label className="text-xs font-medium">发布状态</Label>
                  <p className="text-[11px] text-muted-foreground">
                    草稿状态不会在前台展示
                  </p>
                </div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="h-8 px-2.5 rounded-md border text-xs bg-background"
                >
                  <option value="published">已发布</option>
                  <option value="draft">草稿</option>
                </select>
              </div>
            </div>
          </div>

          {/* Track Picker & Organizer */}
          <TrackPickerSection
            catalogTracks={catalogTracks}
            selectedTrackIds={trackIds}
            onChange={setTrackIds}
          />

          <SheetFooter className="pt-4 border-t gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSaving} className="gap-2">
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              保存歌单
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
