import { useEffect, useMemo, useState, type RefObject } from 'react'

export type FeedbackSeverity = 'low' | 'medium' | 'high'

export interface VideoFeedbackItem {
  id: string
  timestamp: number
  message: string
  severity: FeedbackSeverity
}

interface VideoFeedbackTimelineProps {
  videoRef: RefObject<HTMLVideoElement | null>
  items: VideoFeedbackItem[]
  title?: string
}

const severityStyles: Record<FeedbackSeverity, string> = {
  low: 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30',
  medium: 'bg-amber-400/15 text-amber-300 ring-amber-400/30',
  high: 'bg-rose-400/15 text-rose-300 ring-rose-400/30',
}

const formatTimestamp = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const findActiveItemId = (items: VideoFeedbackItem[], currentTime: number) => {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (currentTime >= items[index].timestamp) {
      return items[index].id
    }
  }

  return items[0]?.id ?? null
}

export function VideoFeedbackTimeline({
  videoRef,
  items,
  title = 'Feedback Timeline',
}: VideoFeedbackTimelineProps) {
  const [currentTime, setCurrentTime] = useState(0)

  const sortedItems = useMemo(
    () => [...items].sort((first, second) => first.timestamp - second.timestamp),
    [items],
  )

  const activeItemId = useMemo(
    () => findActiveItemId(sortedItems, currentTime),
    [currentTime, sortedItems],
  )

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) {
      return
    }

    const syncTime = () => {
      setCurrentTime(videoElement.currentTime)
    }

    syncTime()
    videoElement.addEventListener('timeupdate', syncTime)
    videoElement.addEventListener('seeked', syncTime)
    videoElement.addEventListener('loadedmetadata', syncTime)

    return () => {
      videoElement.removeEventListener('timeupdate', syncTime)
      videoElement.removeEventListener('seeked', syncTime)
      videoElement.removeEventListener('loadedmetadata', syncTime)
    }
  }, [videoRef])

  const handleSeek = (timestamp: number) => {
    const videoElement = videoRef.current
    if (!videoElement) {
      return
    }

    videoElement.currentTime = timestamp
    videoElement.focus()
  }

  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Current {formatTimestamp(currentTime)}
        </span>
      </div>

      <div className="space-y-2">
        {sortedItems.map((item) => {
          const isActive = item.id === activeItemId

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSeek(item.timestamp)}
              className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                isActive
                  ? 'border-cyan-400/30 bg-cyan-400/10'
                  : 'border-white/10 bg-slate-900/40 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-sm font-semibold text-cyan-300">
                  {formatTimestamp(item.timestamp)}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${severityStyles[item.severity]}`}
                >
                  {item.severity}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{item.message}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

