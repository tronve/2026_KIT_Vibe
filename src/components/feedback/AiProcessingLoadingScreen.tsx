import { useEffect, useMemo, useState } from 'react'

export interface AnalysisStage {
  id: string
  label: string
}

interface AiProcessingLoadingScreenProps {
  status: 'uploading' | 'processing' | 'completed'
  progress: number
  stages: AnalysisStage[]
  friendlyMessages: string[]
}

const clampProgress = (value: number) => {
  if (value < 0) {
    return 0
  }

  if (value > 100) {
    return 100
  }

  return Math.round(value)
}

const getStageIndex = (status: AiProcessingLoadingScreenProps['status'], progress: number, stageCount: number) => {
  if (status === 'completed') {
    return stageCount - 1
  }

  if (status === 'processing') {
    return Math.max(stageCount - 2, 0)
  }

  if (progress >= 70) {
    return Math.min(1, stageCount - 1)
  }

  return 0
}

export function AiProcessingLoadingScreen({
  status,
  progress,
  stages,
  friendlyMessages,
}: AiProcessingLoadingScreenProps) {
  const [messageIndex, setMessageIndex] = useState(0)

  const normalizedProgress = clampProgress(progress)
  const displayProgress =
    status === 'processing' && normalizedProgress >= 100 ? 95 : normalizedProgress

  useEffect(() => {
    const messageTimer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % Math.max(friendlyMessages.length, 1))
    }, 2600)

    return () => {
      window.clearInterval(messageTimer)
    }
  }, [friendlyMessages.length])

  const currentStageIndex = useMemo(
    () => getStageIndex(status, displayProgress, stages.length),
    [displayProgress, stages.length, status],
  )

  const message = friendlyMessages[messageIndex] ?? 'AI is analyzing your presentation...'

  return (
    <div className="space-y-4 rounded-3xl border border-cyan-400/25 bg-gradient-to-br from-cyan-400/10 to-slate-900/70 p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">AI processing</p>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
          {displayProgress}%
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 transition-all duration-500"
          style={{ width: `${displayProgress}%` }}
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-200">
        {message}
      </div>

      <div className="space-y-2">
        {stages.map((stage, index) => {
          const isCompleted = index < currentStageIndex
          const isActive = index === currentStageIndex

          return (
            <div key={stage.id} className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isCompleted ? 'bg-emerald-400' : isActive ? 'animate-pulse bg-cyan-300' : 'bg-slate-600'
                }`}
              />
              <span className={`text-sm ${isCompleted || isActive ? 'text-slate-100' : 'text-slate-400'}`}>
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}


