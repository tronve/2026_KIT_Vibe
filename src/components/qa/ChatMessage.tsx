import { useMemo } from 'react'

export interface ChatMessageData {
  id: string
  type: 'ai' | 'user'
  text: string
  audioUrl?: string
  timestamp: Date
  feedback?: string
}

interface ChatMessageProps {
  message: ChatMessageData
}

/**
 * Individual chat message component
 * - AI messages: left-aligned, cyan background
 * - User messages: right-aligned, emerald background
 * - Shows timestamp and optional audio indicator
 */
export function ChatMessage({ message }: ChatMessageProps) {
  const isAi = message.type === 'ai'

  const formattedTime = useMemo(() => {
    const now = new Date()
    const msgTime = new Date(message.timestamp)
    const diffMs = now.getTime() - msgTime.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffSeconds = Math.floor(diffMs / 1000)

    if (diffSeconds < 60) {
      return `${diffSeconds}초 전`
    }
    if (diffMinutes < 60) {
      return `${diffMinutes}분 전`
    }

    const hours = Math.floor(diffMinutes / 60)
    return `${hours}시간 전`
  }, [message.timestamp])

  return (
    <div
      className={`flex gap-3 mb-4 ${isAi ? 'justify-start' : 'justify-end'}`}
    >
      {/* AI Avatar */}
      {isAi && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/30 grid place-items-center">
          <span className="text-sm">🤖</span>
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`max-w-[65%] rounded-3xl px-4 py-3 ${
          isAi
            ? 'bg-cyan-500/10 border border-cyan-400/30 text-slate-100'
            : 'bg-emerald-500/10 border border-emerald-400/30 text-slate-100'
        }`}
      >
        {/* Main Message Text */}
        <p className="text-sm leading-6 whitespace-pre-wrap break-words">
          {message.text}
        </p>

        {/* Audio Indicator (User Messages) */}
        {!isAi && message.audioUrl && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-emerald-300">🎤 오디오 메시지</span>
          </div>
        )}

        {/* AI Feedback (shown below user message in AI response) */}
        {isAi && message.feedback && (
          <div className="mt-3 pt-3 border-t border-cyan-400/20">
            <p className="text-xs text-cyan-200 font-semibold">📊 피드백:</p>
            <p className="text-xs text-slate-300 mt-1">{message.feedback}</p>
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-xs mt-2 ${isAi ? 'text-cyan-300/50' : 'text-emerald-300/50'}`}>
          {formattedTime}
        </p>
      </div>

      {/* User Avatar */}
      {!isAi && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/30 grid place-items-center">
          <span className="text-sm">👤</span>
        </div>
      )}
    </div>
  )
}

