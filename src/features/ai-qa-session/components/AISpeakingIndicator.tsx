import { useEffect, useState } from 'react'

interface AISpeakingIndicatorProps {
  isPlaying: boolean
  audioUrl?: string
}

/**
 * Visual indicator showing AI is speaking with animated dots
 */
export function AISpeakingIndicator({ isPlaying, audioUrl }: AISpeakingIndicatorProps) {
  const [dotIndex, setDotIndex] = useState(0)

  useEffect(() => {
    if (!isPlaying) {
      setDotIndex(0)
      return
    }

    const interval = window.setInterval(() => {
      setDotIndex((prev) => (prev + 1) % 3)
    }, 500)

    return () => window.clearInterval(interval)
  }, [isPlaying])

  if (!isPlaying) {
    return null
  }

  const dots = Array(3)
    .fill(null)
    .map((_, i) => i === dotIndex)

  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3">
      <span className="inline-flex h-3 w-3 animate-pulse rounded-full bg-cyan-400"></span>
      <p className="text-sm font-semibold text-cyan-200">
        🎤 AI가 말하고 있어요
        {dots.map((isActive, i) => (
          <span
            key={i}
            className={`ml-0.5 transition-opacity ${isActive ? 'opacity-100' : 'opacity-30'}`}
          >
            .
          </span>
        ))}
      </p>
      {audioUrl && (
        <audio
          src={audioUrl}
          autoPlay
          onEnded={() => {
            // onEnded will be handled by parent component
          }}
        />
      )}
    </div>
  )
}

