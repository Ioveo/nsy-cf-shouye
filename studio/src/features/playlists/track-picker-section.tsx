import { useState, useMemo } from 'react'
import {
  Search,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Music,
  Check,
  Disc3,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface TrackPickerSectionProps {
  catalogTracks: any[]
  selectedTrackIds: string[]
  onChange: (trackIds: string[]) => void
}

export function TrackPickerSection({
  catalogTracks = [],
  selectedTrackIds = [],
  onChange,
}: TrackPickerSectionProps) {
  const [keyword, setKeyword] = useState('')

  const trackMap = useMemo(() => {
    return new Map(catalogTracks.map((t) => [String(t.id), t]))
  }, [catalogTracks])

  const filteredCatalog = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return catalogTracks
    return catalogTracks.filter((t) => {
      const matchText = [t.title, t.artist, t.album, t.neteaseId].join(' ').toLowerCase()
      return matchText.includes(q)
    })
  }, [catalogTracks, keyword])

  const selectedSet = useMemo(() => {
    return new Set(selectedTrackIds.map(String))
  }, [selectedTrackIds])

  function handleAddTrack(trackId: string) {
    if (selectedSet.has(trackId)) return
    if (selectedTrackIds.length >= 200) return
    onChange([...selectedTrackIds, trackId])
  }

  function handleRemoveTrack(idx: number) {
    const next = [...selectedTrackIds]
    next.splice(idx, 1)
    onChange(next)
  }

  function handleMoveTrack(idx: number, dir: 'up' | 'down') {
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= selectedTrackIds.length) return
    const next = [...selectedTrackIds]
    const temp = next[idx]
    next[idx] = next[targetIdx]
    next[targetIdx] = temp
    onChange(next)
  }

  function handleClearAll() {
    if (confirm('确定要清空当前歌单的全部歌曲吗？')) {
      onChange([])
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">歌单曲目编排</label>
        <div className="text-xs text-muted-foreground">
          已选 <span className="font-semibold text-primary">{selectedTrackIds.length}</span> / 200 首
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-xl p-3 bg-muted/10">
        {/* Left Column: Catalog */}
        <div className="flex flex-col h-[380px] border rounded-lg bg-background p-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-primary" />
              曲库选择 ({filteredCatalog.length})
            </span>
          </div>

          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索曲目名、歌手..."
              className="h-8 pl-8 text-xs"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredCatalog.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-muted-foreground">
                未找到匹配曲目
              </div>
            ) : (
              filteredCatalog.map((t) => {
                const isAdded = selectedSet.has(String(t.id))
                return (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between p-1.5 rounded-md border text-xs transition-colors ${
                      isAdded
                        ? 'bg-muted/40 border-border/40 opacity-75'
                        : 'bg-card border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={t.coverUrl || '/logo.png'}
                        alt=""
                        className="w-7 h-7 rounded object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-medium truncate max-w-[130px]">{t.title}</div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[130px]">
                          {t.artist || '未知歌手'}
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant={isAdded ? 'ghost' : 'outline'}
                      className="h-6 px-2 text-[10px] gap-1"
                      disabled={isAdded}
                      onClick={() => handleAddTrack(String(t.id))}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          已加
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          添加
                        </>
                      )}
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Playlist Tracks */}
        <div className="flex flex-col h-[380px] border rounded-lg bg-background p-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <Disc3 className="w-3.5 h-3.5 text-primary" />
              歌单曲目序列 ({selectedTrackIds.length})
            </span>
            {selectedTrackIds.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[10px] text-rose-500 hover:text-rose-600"
                onClick={handleClearAll}
              >
                清空
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {selectedTrackIds.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-muted-foreground text-center px-4">
                <Disc3 className="w-8 h-8 text-muted-foreground/40 mb-1" />
                从左侧曲库点击「添加」加入曲目
              </div>
            ) : (
              selectedTrackIds.map((tid, idx) => {
                const track = trackMap.get(String(tid))
                return (
                  <div
                    key={`${tid}-${idx}`}
                    className="flex items-center justify-between p-1.5 rounded-md border bg-card border-border text-xs gap-1.5"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-4 text-center font-mono text-[10px] text-muted-foreground flex-shrink-0">
                        {idx + 1}
                      </span>
                      <img
                        src={track?.coverUrl || '/logo.png'}
                        alt=""
                        className="w-7 h-7 rounded object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-medium truncate max-w-[100px]">
                          {track ? track.title : `未知歌曲 (${tid})`}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                          {track?.artist || '未知歌手'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        disabled={idx === 0}
                        onClick={() => handleMoveTrack(idx, 'up')}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        disabled={idx === selectedTrackIds.length - 1}
                        onClick={() => handleMoveTrack(idx, 'down')}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-rose-500 hover:text-rose-600"
                        onClick={() => handleRemoveTrack(idx)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
