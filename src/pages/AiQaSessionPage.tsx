import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSendAnswerMutation, useStartQASessionMutation } from '../api/qa'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useRecorder } from '../hooks/useRecorder'
import { useAppStore } from '../store/useAppStore'
import { useAiQaSessionStore } from '../features/ai-qa-session/store/useAiQaSessionStore'

type ChatMessageData = {
  id: string
  type: 'ai' | 'user'
  text: string
  timestamp: Date
}

function ChatMessage({ message }: { message: ChatMessageData }) {
  const isAi = message.type === 'ai'

  return (
    <div className={`mb-3 flex gap-2 ${isAi ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${isAi ? 'border border-brand-400/30 bg-brand-500/10 text-slate-100' : 'border border-emerald-400/30 bg-emerald-500/10 text-slate-100'}`}>
        {message.text}
      </div>
    </div>
  )
}

function InPageChatWindow({ sessionId }: { sessionId: string | null }) {
  const currentQuestionText = useAiQaSessionStore((state) => state.currentQuestionText)
  const qnaHistory = useAiQaSessionStore((state) => state.qnaHistory)
  const scrollEndRef = useRef<HTMLDivElement>(null)

  const messages = useMemo<ChatMessageData[]>(() => {
    if (!sessionId) return []

    const builtMessages: ChatMessageData[] = [
      {
        id: 'intro',
        type: 'ai',
        text: '인터뷰를 시작하면 질문이 표시됩니다.',
        timestamp: new Date(Date.now() - qnaHistory.length * 30000),
      },
      ...qnaHistory.flatMap((item, index) => {
        const baseTime = new Date(Date.now() - (qnaHistory.length - index) * 30000)
        const pair: ChatMessageData[] = [
          { id: `q-${index}`, type: 'ai', text: item.q, timestamp: new Date(baseTime.getTime()) },
          { id: `a-${index}`, type: 'user', text: item.a, timestamp: new Date(baseTime.getTime() + 5000) },
        ]
        return pair
      }),
    ]

    const latestHistoryQuestion = qnaHistory.at(-1)?.q
    if (currentQuestionText && currentQuestionText !== latestHistoryQuestion) {
      builtMessages.push({
        id: 'q-current',
        type: 'ai',
        text: currentQuestionText,
        timestamp: new Date(),
      })
    }

    return builtMessages
  }, [currentQuestionText, qnaHistory, sessionId])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 80)
    return () => window.clearTimeout(timer)
  }, [messages])

  if (!sessionId) {
    return <p className="text-sm text-slate-400">세션을 시작하면 대화가 표시됩니다.</p>
  }

  return (
    <div className="max-h-[320px] overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      <div ref={scrollEndRef} />
    </div>
  )
}

export function AiQaSessionPage() {
  const [searchParams] = useSearchParams()
  const routeSessionId = searchParams.get('sessionId')
  const sessionId = useAppStore((state) => state.sessionId)
  const setCurrentStep = useAppStore((state) => state.setCurrentStep)
  const setSessionId = useAppStore((state) => state.setSessionId)
  const restoreSessionFromStorage = useAiQaSessionStore((state) => state.restoreSessionFromStorage)
  const phase = useAiQaSessionStore((state) => state.phase)
  const currentQuestionText = useAiQaSessionStore((state) => state.currentQuestionText)
  const answerDraft = useAiQaSessionStore((state) => state.answerDraft)
  const recordedAudioBlob = useAiQaSessionStore((state) => state.recordedAudioBlob)
  const qnaHistory = useAiQaSessionStore((state) => state.qnaHistory)
  const questionRemainingSeconds = useAiQaSessionStore((state) => state.questionRemainingSeconds)
  const setCurrentQuestion = useAiQaSessionStore((state) => state.setCurrentQuestion)
  const setAnswerDraft = useAiQaSessionStore((state) => state.setAnswerDraft)
  const setRecordedAudioBlob = useAiQaSessionStore((state) => state.setRecordedAudioBlob)
  const moveToUserAnswering = useAiQaSessionStore((state) => state.moveToUserAnswering)
  const moveToEvaluating = useAiQaSessionStore((state) => state.moveToEvaluating)
  const moveToFeedbackReady = useAiQaSessionStore((state) => state.moveToFeedbackReady)
  const appendHistory = useAiQaSessionStore((state) => state.appendHistory)
  const resetQuestionTimer = useAiQaSessionStore((state) => state.resetQuestionTimer)
  const tickQuestionTimer = useAiQaSessionStore((state) => state.tickQuestionTimer)
  const resetSession = useAiQaSessionStore((state) => state.resetSession)
  const [localError, setLocalError] = useState<string | null>(null)
  const startQASessionMutation = useStartQASessionMutation()
  const sendAnswerMutation = useSendAnswerMutation()
  const { startRecording, stopRecording, state: recorderState } = useRecorder()
  const aiPhaseTimerRef = useRef<number | null>(null)

  useEffect(() => {
    setCurrentStep('interview')
    if (routeSessionId) {
      setSessionId(routeSessionId)
    }
    restoreSessionFromStorage()
  }, [routeSessionId, restoreSessionFromStorage, setCurrentStep, setSessionId])

  const effectiveSessionId = routeSessionId ?? sessionId

  const historyContext = useMemo(() => {
    const previousTurn = qnaHistory.at(-1)
    return JSON.stringify(previousTurn ? [previousTurn] : [])
  }, [qnaHistory])

  const handleStartSession = useCallback(async () => {
    if (!effectiveSessionId) {
      setLocalError('sessionId가 필요합니다. 먼저 발표 분석 단계에서 시작해 주세요.')
      return
    }

    setLocalError(null)
    try {
      const response = await startQASessionMutation.mutateAsync(effectiveSessionId)
      resetQuestionTimer()
      setCurrentQuestion(response.ai_question_text)
      if (aiPhaseTimerRef.current !== null) {
        window.clearTimeout(aiPhaseTimerRef.current)
      }
      aiPhaseTimerRef.current = window.setTimeout(() => {
        moveToUserAnswering()
        void startRecording().catch(() => undefined)
      }, 700)
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Q&A 세션 시작에 실패했습니다.')
    }
  }, [effectiveSessionId, moveToUserAnswering, setCurrentQuestion, startQASessionMutation, startRecording])

  const handleSubmitAnswer = useCallback(async () => {
    if (!effectiveSessionId || !currentQuestionText) {
      setLocalError('제출할 활성 질문이 없습니다.')
      return
    }

    setLocalError(null)
    moveToEvaluating()

    let latestBlob = recordedAudioBlob
    if (recorderState.isRecording) {
      const stoppedBlob = await stopRecording()
      if (stoppedBlob) {
        latestBlob = stoppedBlob
        setRecordedAudioBlob(stoppedBlob)
      }
    }

    const audioBlob = latestBlob || new Blob([answerDraft.trim() || '(음성 답변 없음)'], { type: 'audio/webm' })
    const userAnswer = answerDraft.trim() || '(음성 답변 없음)'
    appendHistory({ q: currentQuestionText, a: userAnswer })

    try {
      const response = await sendAnswerMutation.mutateAsync({
        sessionId: effectiveSessionId,
        audioBlobOrText: audioBlob,
        historyContext,
      })
      resetQuestionTimer()
      setAnswerDraft('')
      setRecordedAudioBlob(null)
      setCurrentQuestion(response.next_ai_question_text)
      if (aiPhaseTimerRef.current !== null) {
        window.clearTimeout(aiPhaseTimerRef.current)
      }
      aiPhaseTimerRef.current = window.setTimeout(() => {
        moveToUserAnswering()
        void startRecording().catch(() => undefined)
      }, 700)
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : '답변 제출에 실패했습니다.')
      moveToFeedbackReady()
    }
  }, [answerDraft, appendHistory, currentQuestionText, effectiveSessionId, historyContext, moveToEvaluating, moveToFeedbackReady, recorderState.isRecording, recordedAudioBlob, resetQuestionTimer, sendAnswerMutation, setAnswerDraft, setCurrentQuestion, setRecordedAudioBlob, startRecording, stopRecording])

  useEffect(() => {
    if (phase !== 'user-answering' || !recorderState.isRecording) {
      return
    }

    const timerId = window.setInterval(() => {
      if (sendAnswerMutation.isPending) return
      if (questionRemainingSeconds <= 1) {
        window.clearInterval(timerId)
        void handleSubmitAnswer()
        return
      }
      tickQuestionTimer()
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [handleSubmitAnswer, phase, questionRemainingSeconds, recorderState.isRecording, sendAnswerMutation.isPending, tickQuestionTimer])

  useEffect(() => {
    return () => {
      if (aiPhaseTimerRef.current !== null) {
        window.clearTimeout(aiPhaseTimerRef.current)
      }
    }
  }, [])

  const canSubmitAnswer = Boolean(currentQuestionText) && !sendAnswerMutation.isPending
  const isSessionStarting = startQASessionMutation.isPending
  const primaryDisabled = currentQuestionText
    ? !canSubmitAnswer
    : isSessionStarting || sendAnswerMutation.isPending
  const actionLabel = currentQuestionText ? (sendAnswerMutation.isPending ? '제출 중...' : '답변 제출') : (startQASessionMutation.isPending ? '질문 생성 중...' : '세션 시작')
  const handlePrimaryAction = currentQuestionText ? () => void handleSubmitAnswer() : () => void handleStartSession()
  const simplePhaseLabel = phase === 'user-answering' ? '답변 중' : phase === 'evaluating' ? '평가 중' : '질문 준비 중'

  if (!effectiveSessionId) {
    return (
      <Card className="space-y-4">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-300">AI Q&A 세션</p>
        <h2 className="text-2xl font-black text-white">세션 ID가 없습니다</h2>
        <p className="text-sm leading-6 text-slate-300">먼저 발표 영상을 업로드해 주세요.</p>
        <Link to="/upload-training" className="inline-flex rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-slate-950">업로드로 이동</Link>
      </Card>
    )
  }

  return (
    <Card className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-300">AI Q&A 세션</p>
        <h2 className="text-3xl font-black text-white">실시간 인터뷰</h2>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
        <p>상태: <span className="font-semibold text-white">{simplePhaseLabel}</span></p>
        <p className="mt-1">남은 시간: <span className="font-semibold text-white">{questionRemainingSeconds}s</span></p>
        <p className="mt-1">마이크: <span className="font-semibold text-white">{recorderState.isMicrophoneActive ? '활성' : '비활성'}</span></p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handlePrimaryAction} disabled={primaryDisabled}>
          {actionLabel}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            resetSession()
            setAnswerDraft('')
            setRecordedAudioBlob(null)
            setLocalError(null)
          }}
        >
          초기화
        </Button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">답변 메모</p>
        <textarea
          value={answerDraft}
          onChange={(event) => setAnswerDraft(event.target.value)}
          rows={4}
          className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-100 outline-none"
          placeholder="음성 답변이 어려우면 메모를 입력하세요."
        />
      </div>

      {localError ? <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{localError}</p> : null}

      <InPageChatWindow sessionId={effectiveSessionId} />

      <p className="text-xs text-slate-500">세션 ID: {sessionId ?? '없음'}</p>
    </Card>
  )
}
