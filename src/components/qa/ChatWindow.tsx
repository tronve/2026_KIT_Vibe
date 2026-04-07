import { useEffect, useRef, useState } from 'react'
import { useInterviewSessionData } from '../../features/ai-qa-session/hooks'
import { ChatMessage, type ChatMessageData } from './ChatMessage'

/**
 * Chat window component for conversational interview display
 * - Auto-scrolls to newest message
 * - Maintains local conversation state
 * - Uses session_id for persistence
 * - Integrates with existing interview store
 */
export function ChatWindow() {
  const scrollEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { sessionId, currentQuestionText, qnaHistory } = useInterviewSessionData()

  const [messages, setMessages] = useState<ChatMessageData[]>([])

  // Initialize conversation from store data
  useEffect(() => {
    if (!sessionId) {
      setMessages([])
      return
    }

    // Build messages from qnaHistory
    const builtMessages: ChatMessageData[] = []
    let timestamp = new Date()

    // Add intro message
    builtMessages.push({
      id: 'intro',
      type: 'ai',
      text: 'AI 인터뷰 코치에 오신 것을 환영합니다. 발표 역량 강화를 위한 실전형 질문을 드릴게요.',
      timestamp: new Date(timestamp.getTime() - qnaHistory.length * 30000),
    })

    // Add Q&A history
    qnaHistory.forEach((item, index) => {
      const baseTime = new Date(timestamp.getTime() - (qnaHistory.length - index) * 30000)

      // Add AI question
      builtMessages.push({
        id: `q-${index}`,
        type: 'ai',
        text: item.q,
        timestamp: new Date(baseTime.getTime()),
      })

      // Add user answer
      builtMessages.push({
        id: `a-${index}`,
        type: 'user',
        text: item.a,
        timestamp: new Date(baseTime.getTime() + 5000),
      })
    })

    // Add current question only when it is different from the latest history question.
    const latestHistoryQuestion = qnaHistory.length > 0 ? qnaHistory[qnaHistory.length - 1]?.q : null
    if (currentQuestionText && qnaHistory.length > 0 && currentQuestionText !== latestHistoryQuestion) {
      const currentTimestamp = new Date()

      builtMessages.push({
        id: `q-current`,
        type: 'ai',
        text: currentQuestionText,
        timestamp: currentTimestamp,
      })
    }

    setMessages(builtMessages)
  }, [sessionId, qnaHistory, currentQuestionText])

  // Auto-scroll to newest message
  useEffect(() => {
    const scrollToEnd = () => {
      if (scrollEndRef.current && containerRef.current) {
        scrollEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }
    }

    // Use requestAnimationFrame to ensure DOM is updated
    const timeoutId = window.setTimeout(scrollToEnd, 100)
    return () => window.clearTimeout(timeoutId)
  }, [messages])

  if (!sessionId) {
    return (
      <div className="h-full rounded-3xl border border-white/10 bg-slate-950/60 p-6 flex items-center justify-center">
        <p className="text-slate-400 text-center">
          인터뷰 세션을 시작하면 대화 내용이 표시됩니다.
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-full rounded-3xl border border-white/10 bg-slate-950/60 p-6 overflow-y-auto flex flex-col"
    >
      <div className="flex-1">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-slate-400 text-center">
              첫 질문을 기다리는 중입니다...
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={scrollEndRef} />
          </>
        )}
      </div>

      {/* Message count indicator */}
      <div className="mt-4 text-center text-xs text-slate-500 border-t border-white/10 pt-4">
        메시지 {messages.filter((m) => m.type !== 'ai' || m.id === 'intro').length}개
      </div>
    </div>
  )
}


