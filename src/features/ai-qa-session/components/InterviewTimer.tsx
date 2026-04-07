import { useMemo } from 'react'

interface InterviewTimerProps {
  remainingSeconds: number
  totalSeconds: number
  isActive: boolean
}

/**
 * Interview countdown timer with color-coded urgency levels
 * - Green/Blue: > 10 seconds
 * - Yellow: 10-5 seconds
 * - Red: < 5 seconds
 */
export function InterviewTimer({
  remainingSeconds,
  totalSeconds,
  isActive,
}: InterviewTimerProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const { bgColor, textColor, indicator } = useMemo(() => {
    if (!isActive) {
      return {
        bgColor: 'bg-slate-600',
        textColor: 'text-slate-200',
        indicator: 'bg-slate-500',
      }
    }

    if (remainingSeconds <= 5) {
      return {
        bgColor: 'bg-red-600/20 border-red-400/50',
        textColor: 'text-red-200',
        indicator: 'bg-red-400 animate-pulse',
      }
    }

    if (remainingSeconds <= 10) {
      return {
        bgColor: 'bg-yellow-600/20 border-yellow-400/50',
        textColor: 'text-yellow-200',
        indicator: 'bg-yellow-400',
      }
    }

    return {
      bgColor: 'bg-cyan-600/20 border-cyan-400/50',
      textColor: 'text-cyan-200',
      indicator: 'bg-cyan-400',
    }
  }, [remainingSeconds, isActive])

  const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
          ⏱️ 답변 타이머
        </p>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
            isActive ? `${bgColor} border` : 'bg-slate-600/30 text-slate-400'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${indicator}`}></span>
          {isActive ? '녹음 중' : '대기 중'}
        </span>
      </div>

      <div className={`rounded-3xl border ${bgColor} p-6 transition-colors`}>
        <div className="text-center">
          <p className="text-xs text-slate-400">남은 시간</p>
          <p className={`mt-2 text-5xl font-black ${textColor} font-mono`}>
            {formatTime(remainingSeconds)}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-700/50">
          <div
            className={`h-full transition-all ${
              remainingSeconds <= 5
                ? 'bg-red-500'
                : remainingSeconds <= 10
                  ? 'bg-yellow-500'
                  : 'bg-cyan-500'
            }`}
            style={{
              width: `${progress}%`,
              transitionDuration: '300ms',
            }}
          />
        </div>
      </div>
    </div>
  )
}

