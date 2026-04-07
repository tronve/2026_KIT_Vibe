import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

const messagesByPath: Record<string, string> = {
  '/upload-training': 'Analyzing your presentation...',
  '/ai-qa-session': 'Preparing next question...',
  '/reports': 'Evaluating response...',
}

interface AIThinkingProps {
  message?: string
}

export function AIThinking({ message }: AIThinkingProps) {
  const { pathname } = useLocation()

  const resolvedMessage = useMemo(() => {
    if (message) {
      return message
    }

    for (const [path, pathMessage] of Object.entries(messagesByPath)) {
      if (pathname.startsWith(path)) {
        return pathMessage
      }
    }

    return 'Analyzing your presentation...'
  }, [message, pathname])

  return (
    <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-3 w-3 rounded-full bg-cyan-300 animate-pulse" />
        <p className="text-sm font-semibold text-cyan-100">AI is thinking</p>
      </div>

      <p className="mt-3 text-sm text-slate-200">{resolvedMessage}</p>

      <div className="mt-5 flex items-end gap-1">
        <span className="h-2 w-2 rounded-full bg-cyan-300/90 animate-[thinkingDot_1s_ease-in-out_infinite]" />
        <span className="h-2 w-2 rounded-full bg-cyan-300/90 animate-[thinkingDot_1s_ease-in-out_150ms_infinite]" />
        <span className="h-2 w-2 rounded-full bg-cyan-300/90 animate-[thinkingDot_1s_ease-in-out_300ms_infinite]" />
      </div>

      <style>{`@keyframes thinkingDot { 0%, 100% { transform: translateY(0); opacity: 0.45; } 50% { transform: translateY(-4px); opacity: 1; } }`}</style>
    </div>
  )
}

