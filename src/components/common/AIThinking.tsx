import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

const messagesByPath: Record<string, string> = {
  '/upload-training': '발표를 분석하고 있습니다...',
  '/ai-qa-session': '다음 질문을 준비하고 있습니다...',
  '/reports': '응답을 평가하고 있습니다...',
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

    return '발표를 분석하고 있습니다...'
  }, [message, pathname])

  return (
    <div className="rounded-3xl border border-brand-500/20 bg-brand-500/10 p-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-3 w-3 rounded-full bg-brand-300 animate-pulse" />
        <p className="text-sm font-semibold text-brand-100">AI 처리 중</p>
      </div>

      <p className="mt-3 text-sm text-slate-200">{resolvedMessage}</p>

      <div className="mt-5 flex items-end gap-1">
        <span className="h-2 w-2 rounded-full bg-brand-300/90 animate-[thinkingDot_1s_ease-in-out_infinite]" />
        <span className="h-2 w-2 rounded-full bg-brand-300/90 animate-[thinkingDot_1s_ease-in-out_150ms_infinite]" />
        <span className="h-2 w-2 rounded-full bg-brand-300/90 animate-[thinkingDot_1s_ease-in-out_300ms_infinite]" />
      </div>

      <style>{`@keyframes thinkingDot { 0%, 100% { transform: translateY(0); opacity: 0.45; } 50% { transform: translateY(-4px); opacity: 1; } }`}</style>
    </div>
  )
}

