import { useEffect, useState } from 'react'

interface QuestionTypingTextProps {
  text: string
  isActive: boolean
  speed?: number // milliseconds between characters
  onComplete?: () => void
}

/**
 * Displays question text with typing animation effect
 */
export function QuestionTypingText({
  text,
  isActive,
  speed = 30,
  onComplete,
}: QuestionTypingTextProps) {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    if (!isActive) {
      setDisplayedText('')
      return
    }

    setDisplayedText('')
    let charIndex = 0

    const interval = window.setInterval(() => {
      charIndex += 1

      if (charIndex > text.length) {
        window.clearInterval(interval)
        onComplete?.()
        return
      }

      setDisplayedText(text.substring(0, charIndex))
    }, speed)

    return () => window.clearInterval(interval)
  }, [text, isActive, speed, onComplete])

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
        💭 AI 질문
      </p>
      <div className="min-h-16 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4">
        <p className="text-base leading-7 text-slate-100">
          {displayedText}
          {isActive && displayedText !== text && (
            <span className="ml-1 inline-block h-5 w-1 animate-pulse bg-cyan-400"></span>
          )}
        </p>
      </div>
    </div>
  )
}

