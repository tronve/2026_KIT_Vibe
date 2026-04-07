import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AiInterviewInterface } from '../features/ai-qa-session'
import { useAiQaSessionStore } from '../features/ai-qa-session'
import { useAppStore } from '../store'

export function AiQaSessionPage() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  const { setCurrentStep, setSessionId } = useAppStore()
  const { restoreSessionFromStorage } = useAiQaSessionStore()

  // Update session step and restore QA history
  useEffect(() => {
    setCurrentStep('interview')
    if (sessionId) {
      setSessionId(sessionId)
    }

    // Restore QA history from storage
    restoreSessionFromStorage()
  }, [sessionId, setCurrentStep, setSessionId, restoreSessionFromStorage])

  return <AiInterviewInterface />
}
