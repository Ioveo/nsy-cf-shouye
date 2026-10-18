import { Music, Disc3 } from 'lucide-react'

interface PlaylistCoverCollageProps {
  coverUrl?: string
  trackIds?: string[]
  catalogTracks?: any[]
  className?: string
}

export function PlaylistCoverCollage({
  coverUrl,
  trackIds = [],
  catalogTracks = [],
  className = 'w-full h-40',
}: PlaylistCoverCollageProps) {
  if (coverUrl && coverUrl.trim()) {
    return (
      <div className={`relative overflow-hidden rounded-lg bg-muted/40 ${className}`}>
        <img
          src={coverUrl}
          alt="Playlist cover"
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
    )
  }

  // Find covers of first 4 tracks that have a coverUrl
  const trackMap = new Map((catalogTracks || []).map((t) => [String(t.id), t]))
  const covers: string[] = []
  for (const tid of trackIds) {
    const t = trackMap.get(String(tid))
    if (t?.coverUrl) {
      covers.push(t.coverUrl)
      if (covers.length >= 4) break
    }
  }

  if (covers.length >= 4) {
    return (
      <div className={`grid grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-lg bg-zinc-900 ${className}`}>
        {covers.slice(0, 4).map((c, i) => (
          <img key={i} src={c} alt="" className="w-full h-full object-cover" />
        ))}
      </div>
    )
  }

  if (covers.length > 0) {
    return (
      <div className={`relative overflow-hidden rounded-lg bg-muted/40 ${className}`}>
        <img src={covers[0]} alt="" className="w-full h-full object-cover" />
        {covers.length > 1 && (
          <div className="absolute bottom-1 right-1 bg-black/75 px-1.5 py-0.5 rounded text-[10px] text-white">
            +{trackIds.length}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg bg-gradient-to-br from-purple-950/40 via-zinc-900 to-cyan-950/30 border border-border/40 ${className}`}
    >
      <Disc3 className="w-10 h-10 text-muted-foreground/60 animate-pulse" />
      <span className="text-xs text-muted-foreground/50 mt-1 font-mono">2×2 自动拼贴</span>
    </div>
  )
}
