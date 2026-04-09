import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useNavigate, useSearchParams} from 'react-router-dom'
import {useSendAnswerMutation, useStartQASessionMutation} from '../api/qa'
import {Button} from '../components/ui/Button'
import {Card} from '../components/ui/Card'
import {useRecorder} from '../hooks/useRecorder'
import {useAppStore} from '../store/useAppStore'
import {useAiQaSessionStore} from '../features/ai-qa-session/store/useAiQaSessionStore'

type ChatMessageData = {
    id: string
    type: 'ai' | 'user'
    text: string
    timestamp: Date
}

function ChatMessage({message}: { message: ChatMessageData }) {
    const isAi = message.type === 'ai'

    return (
        <div className={`mb-3 flex gap-2 ${isAi ? 'justify-start' : 'justify-end'}`}>
            <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${isAi ? 'border border-brand-300 bg-brand-100 text-brand-900' : 'border border-emerald-300 bg-emerald-100 text-emerald-900'}`}>
                {message.text}
            </div>
        </div>
    )
}

function VideoWindow({enabled}: { enabled: boolean }) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const streamRef = useRef<MediaStream | null>(null)

    useEffect(() => {
        let isDisposed = false

        const stopStream = () => {
            if (!streamRef.current) {
                if (videoRef.current) {
                    videoRef.current.srcObject = null
                }
                return
            }

            const tracks = streamRef.current.getTracks()
            tracks.forEach((track) => track.stop())
            streamRef.current = null
            if (videoRef.current) {
                videoRef.current.srcObject = null
            }
        }

        if (!enabled) {
            stopStream()
            return
        }

        const startVideo = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {width: {ideal: 640}, height: {ideal: 480}},
                    audio: false,
                })

                if (isDisposed) {
                    // 컴포넌트가 사라진 뒤 스트림이 도착하면 즉시 종료
                    stream.getTracks().forEach((track) => track.stop())
                    return
                }

                // 이전 스트림이 남아 있다면 먼저 정리
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((track) => track.stop())
                }
                streamRef.current = stream
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                }
            } catch (error) {
                console.error('카메라 접근 오류:', error)
            }
        }

        void startVideo()

        return () => {
            isDisposed = true
            stopStream()
        }
    }, [enabled])

    if (!enabled) {
        return (
            <div
                className="grid h-48 place-items-center overflow-hidden rounded-lg border border-brand-200 bg-brand-50 text-sm text-brand-700">
                인터뷰 종료로 카메라가 꺼졌습니다.
            </div>
        )
    }

    return (
        <div className="overflow-hidden rounded-lg border border-brand-200 bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="h-48 w-full object-cover"/>
        </div>
    )
}

function InPageChatWindow({sessionId, hasSessionStarted}: { sessionId: string | null; hasSessionStarted: boolean }) {
    const currentQuestionText = useAiQaSessionStore((state) => state.currentQuestionText)
    const qnaHistory = useAiQaSessionStore((state) => state.qnaHistory)
    const scrollEndRef = useRef<HTMLDivElement>(null)

    const messages = useMemo<ChatMessageData[]>(() => {
        if (!sessionId) return []

        const builtMessages: ChatMessageData[] = []

        if (!hasSessionStarted) {
            builtMessages.push({
                id: 'intro',
                type: 'ai',
                text: '세션 시작 버튼을 누르면 첫 질문이 표시됩니다.',
                timestamp: new Date(),
            })
            return builtMessages
        }

        if (qnaHistory.length === 0 && !currentQuestionText) {
            builtMessages.push({
                id: 'waiting',
                type: 'ai',
                text: '첫 질문을 생성 중입니다...',
                timestamp: new Date(),
            })
            return builtMessages
        }

        qnaHistory.forEach((item, index) => {
            builtMessages.push({id: `q-${index}`, type: 'ai', text: item.q, timestamp: new Date()})
            builtMessages.push({id: `a-${index}`, type: 'user', text: item.a, timestamp: new Date()})
        })

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
    }, [currentQuestionText, hasSessionStarted, qnaHistory, sessionId])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            scrollEndRef.current?.scrollIntoView({behavior: 'smooth', block: 'end'})
        }, 80)
        return () => window.clearTimeout(timer)
    }, [messages])

    if (!sessionId) {
        return <p className="text-sm text-brand-600">세션을 시작하면 대화가 표시됩니다.</p>
    }

    return (
        <div className="max-h-[320px] overflow-y-auto rounded-lg border border-brand-200 bg-brand-50 p-4">
            {messages.map((message) => (
                <ChatMessage key={message.id} message={message}/>
            ))}
            <div ref={scrollEndRef}/>
        </div>
    )
}

export function AiQaSessionPage() {
    const QUESTION_LIMIT_SECONDS = 30
    const isDev = false
    const qaLog = useCallback((...args: unknown[]) => {
        if (!isDev) return
        console.log(...args)
    }, [isDev])
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const routeSessionId = searchParams.get('sessionId')
    const sessionId = useAppStore((state) => state.sessionId)
    const setCurrentStep = useAppStore((state) => state.setCurrentStep)
    const setSessionId = useAppStore((state) => state.setSessionId)

    const phase = useAiQaSessionStore((state) => state.phase)
    const currentQuestionText = useAiQaSessionStore((state) => state.currentQuestionText)
    const recordedAudioBlob = useAiQaSessionStore((state) => state.recordedAudioBlob)
    const qnaHistory = useAiQaSessionStore((state) => state.qnaHistory)
    const currentRound = useAiQaSessionStore((state) => state.currentRound)
    const maxRounds = useAiQaSessionStore((state) => state.maxRounds)
    const questionRemainingSeconds = useAiQaSessionStore((state) => state.questionRemainingSeconds)
    const setCurrentQuestion = useAiQaSessionStore((state) => state.setCurrentQuestion)
    const setRecordedAudioBlob = useAiQaSessionStore((state) => state.setRecordedAudioBlob)
    const moveToUserAnswering = useAiQaSessionStore((state) => state.moveToUserAnswering)
    const moveToEvaluating = useAiQaSessionStore((state) => state.moveToEvaluating)
    const moveToFeedbackReady = useAiQaSessionStore((state) => state.moveToFeedbackReady)
    const appendHistory = useAiQaSessionStore((state) => state.appendHistory)
    const isQACompleted = useAiQaSessionStore((state) => state.isQACompleted)
    const resetQuestionTimer = useAiQaSessionStore((state) => state.resetQuestionTimer)
    const tickQuestionTimer = useAiQaSessionStore((state) => state.tickQuestionTimer)
    const resetSession = useAiQaSessionStore((state) => state.resetSession)

    const [localError, setLocalError] = useState<string | null>(null)
    const [hasSessionStarted, setHasSessionStarted] = useState(false)
    const [sessionCompleted, setSessionCompleted] = useState(false)
    const [smoothTimerRatio, setSmoothTimerRatio] = useState(1)
    const startQASessionMutation = useStartQASessionMutation()
    const sendAnswerMutation = useSendAnswerMutation()
    const {startRecording, stopRecording, state: recorderState} = useRecorder()
    const submitAnswerRef = useRef<() => Promise<void> | void>(() => undefined)
    const isPendingRef = useRef(false)
    const timerEndAtRef = useRef<number | null>(null)

    useEffect(() => {
        setCurrentStep('interview')
        if (routeSessionId) {
            setSessionId(routeSessionId)
        }
        // QA 페이지 진입 시 이전 임시 히스토리를 초기화한다.
        resetSession()
        setHasSessionStarted(false)
        setSessionCompleted(false)
    }, [routeSessionId, resetSession, setCurrentStep, setSessionId])

    const effectiveSessionId = routeSessionId ?? sessionId
    const isSessionDone = sessionCompleted || phase === 'completed' || isQACompleted()

    const historyContext = useMemo(() => JSON.stringify(qnaHistory), [qnaHistory])

      useEffect(() => {
        qaLog('[QA][mount] AiQaSessionPage mounted')
        return () => qaLog('[QA][unmount] AiQaSessionPage unmounted')
      }, [])

    useEffect(() => {
        qaLog('[QA][state]', {
            phase,
            storeRemainingSeconds: questionRemainingSeconds,
            isSessionDone,
            isPending: sendAnswerMutation.isPending,
            currentRound,
            maxRounds,
            hasSessionStarted,
        })
          }, [phase, questionRemainingSeconds, isSessionDone, sendAnswerMutation.isPending, currentRound, maxRounds, hasSessionStarted])

    useEffect(() => {
        isPendingRef.current = sendAnswerMutation.isPending
    }, [sendAnswerMutation.isPending])

    useEffect(() => {
        if (phase === 'user-answering' && !isSessionDone) {
            timerEndAtRef.current = Date.now() + questionRemainingSeconds * 1000
            setSmoothTimerRatio(Math.max(questionRemainingSeconds, 0) / QUESTION_LIMIT_SECONDS)
            return
        }

        if (phase !== 'user-answering') {
            setSmoothTimerRatio(Math.max(questionRemainingSeconds, 0) / QUESTION_LIMIT_SECONDS)
        }
    }, [isSessionDone, phase, questionRemainingSeconds])

    useEffect(() => {
        if (phase !== 'user-answering' || isSessionDone) {
            return
        }

        let rafId = 0
        const update = () => {
            if (!timerEndAtRef.current) {
                return
            }
            const remainMs = Math.max(0, timerEndAtRef.current - Date.now())
            setSmoothTimerRatio(remainMs / (QUESTION_LIMIT_SECONDS * 1000))
            rafId = window.requestAnimationFrame(update)
        }

        rafId = window.requestAnimationFrame(update)
        return () => window.cancelAnimationFrame(rafId)
    }, [isSessionDone, phase])

    const handleStartSession = useCallback(async () => {
        if (!effectiveSessionId) {
            setLocalError('sessionId가 필요합니다. 먼저 발표 분석 단계에서 시작해 주세요.')
            return
        }

        setLocalError(null)
        resetSession()
        setHasSessionStarted(true)
        setSessionCompleted(false)
            qaLog('[QA][start] start session requested', {effectiveSessionId})
        try {
            const response = await startQASessionMutation.mutateAsync(effectiveSessionId)
            resetQuestionTimer()
            setCurrentQuestion(response.ai_question_text)
            moveToUserAnswering()
            void startRecording().catch(() => undefined)
                  qaLog('[QA][start] first question ready', {
                    question: response.ai_question_text,
                    phaseAfterStart: useAiQaSessionStore.getState().phase,
                  })
        } catch (error) {
            setLocalError(error instanceof Error ? error.message : 'Q&A 세션 시작에 실패했습니다.')
                  qaLog('[QA][start] failed', error)
        }
              }, [effectiveSessionId, moveToUserAnswering, resetQuestionTimer, resetSession, setCurrentQuestion, startQASessionMutation, startRecording])

    const handleSubmitAnswer = useCallback(async () => {
        if (!effectiveSessionId || !currentQuestionText) {
            setLocalError('제출할 활성 질문이 없습니다.')
            return
        }

        setLocalError(null)
        moveToEvaluating()
            qaLog('[QA][submit] submit start', {
              currentQuestionText,
              round: qnaHistory.length + 1,
              hasRecordedBlob: Boolean(recordedAudioBlob),
              recorderRecording: recorderState.isRecording,
            })

        let latestBlob = recordedAudioBlob
        if (recorderState.isRecording) {
            const stoppedBlob = await stopRecording()
            if (stoppedBlob) {
                latestBlob = stoppedBlob
                setRecordedAudioBlob(stoppedBlob)
            }
        }

        const audioBlob = latestBlob || new Blob(['(음성 입력 없음)'], {type: 'audio/webm'})

        try {
            const response = await sendAnswerMutation.mutateAsync({
                sessionId: effectiveSessionId,
                audioBlobOrText: audioBlob,
                historyContext,
            })

            const sttText = response.user_answer_stt?.trim() || '(음성 입력 없음)'
            appendHistory({q: currentQuestionText, a: sttText})
                  qaLog('[QA][submit] submit success', {
                    sttText,
                    nextQuestion: response.next_ai_question_text,
                    feedback: response.answer_feedback,
                  })

            const completedNext = qnaHistory.length + 1 >= maxRounds
            if (completedNext) {
                setSessionCompleted(true)
                        qaLog('[QA][submit] session completed')
                return
            }

            resetQuestionTimer()
            setRecordedAudioBlob(null)
            setCurrentQuestion(response.next_ai_question_text)
            moveToUserAnswering()
            void startRecording().catch(() => undefined)
        } catch (error) {
            setLocalError(error instanceof Error ? error.message : '답변 제출에 실패했습니다.')
            moveToFeedbackReady()
                  qaLog('[QA][submit] failed', error)
        }
              }, [appendHistory, currentQuestionText, effectiveSessionId, historyContext, maxRounds, moveToEvaluating, moveToFeedbackReady, moveToUserAnswering, qnaHistory.length, recorderState.isRecording, recordedAudioBlob, resetQuestionTimer, sendAnswerMutation, setCurrentQuestion, setRecordedAudioBlob, startRecording, stopRecording])

                        useEffect(() => {
                            submitAnswerRef.current = handleSubmitAnswer
                        }, [handleSubmitAnswer])

    useEffect(() => {
        if (phase !== 'user-answering' || isSessionDone) {
            return
        }

        qaLog('[QA][timer] interval start', {
            storeRemainingSeconds: questionRemainingSeconds,
        })

        const timerId = window.setInterval(() => {
            const remaining = useAiQaSessionStore.getState().questionRemainingSeconds
            const isPending = isPendingRef.current
            qaLog('[QA][timer] tick', {
                remaining,
                isPending,
            })
            if (isPending) {
                return
            }
            if (remaining <= 1) {
                window.clearInterval(timerId)
                qaLog('[QA][timer] timeout -> auto submit')
                void submitAnswerRef.current()
                return
            }

            tickQuestionTimer()
        }, 1000)

        return () => {
            qaLog('[QA][timer] interval stop')
            window.clearInterval(timerId)
        }
    }, [isSessionDone, phase, qaLog, tickQuestionTimer])

    useEffect(() => {
        if (!hasSessionStarted || isSessionDone) return
        if (currentQuestionText && phase === 'ai-speaking') {
            moveToUserAnswering()
        }
    }, [currentQuestionText, hasSessionStarted, isSessionDone, moveToUserAnswering, phase])


    const canSubmitAnswer = Boolean(currentQuestionText) && !sendAnswerMutation.isPending
    const isSessionStarting = startQASessionMutation.isPending
    const primaryDisabled = currentQuestionText
        ? !canSubmitAnswer
        : isSessionStarting || sendAnswerMutation.isPending
    const actionLabel = currentQuestionText ? (sendAnswerMutation.isPending ? '제출 중...' : '답변 제출') : (startQASessionMutation.isPending ? '질문 생성 중...' : '세션 시작')
    const handlePrimaryAction = currentQuestionText ? () => void handleSubmitAnswer() : () => void handleStartSession()
    const isUrgentTimer = questionRemainingSeconds < 5
    const simplePhaseLabel =
        phase === 'user-answering'
            ? '답변 중'
            : phase === 'evaluating'
                ? '평가 중'
                : isSessionDone
                    ? '종료'
                    : '질문 준비 중'

    if (!effectiveSessionId) {
        return (
            <Card className="space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-brand-600">AI Q&A 세션</p>
                <h2 className="text-2xl font-black text-brand-900">세션 ID가 없습니다</h2>
                <p className="text-sm leading-6 text-brand-700">먼저 발표 영상을 업로드해 주세요.</p>
                <Button onClick={() => navigate('/upload-training')}>업로드로 이동</Button>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-brand-600">AI Q&A 세션</p>
                <h2 className="text-3xl font-black text-brand-900">실시간 인터뷰 훈련</h2>
                <p className="text-sm text-brand-700">진행: <span
                    className="font-semibold">{Math.min(currentRound, maxRounds)} / {maxRounds}</span> 라운드</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="space-y-4">
                    <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
                        <div
                            className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-brand-600">
                            <span>진행도</span>
                            <span>{Math.round((Math.min(currentRound, maxRounds) / maxRounds) * 100)}%</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-brand-200">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all"
                                style={{width: `${(Math.min(currentRound, maxRounds) / maxRounds) * 100}%`}}/>
                        </div>
                    </div>

                    {currentQuestionText ? (
                        <div className="rounded-lg border-2 border-brand-500 bg-brand-100 p-6">
                            <p className="text-xs uppercase tracking-[0.25em] text-brand-600">현재 질문</p>
                            <p className="mt-4 text-xl font-semibold leading-7 text-brand-900">{currentQuestionText}</p>
                        </div>
                    ) : null}

                    {phase === 'user-answering' ? (
                        <div className={`rounded-lg border p-4 ${isUrgentTimer ? 'border-rose-300 bg-rose-50' : 'border-amber-200 bg-amber-50'}`}>
                            <div className="text-center">
                                <p className={`text-xs uppercase tracking-[0.2em] ${isUrgentTimer ? 'text-rose-600' : 'text-amber-600'}`}>남은 시간</p>
                                <p className={`mt-2 text-5xl font-black ${isUrgentTimer ? 'text-rose-700' : 'text-amber-900'}`}>{questionRemainingSeconds}</p>
                                <div
                                    className={`mx-auto mt-4 h-2 w-full max-w-sm overflow-hidden rounded-full ${isUrgentTimer ? 'bg-rose-100' : 'bg-amber-100'}`}>
                                    <div
                                        className={`h-full rounded-full transition-[width] duration-75 ease-linear ${isUrgentTimer ? 'bg-rose-500' : 'bg-amber-500'}`}
                                        style={{width: `${Math.max(0, Math.min(1, smoothTimerRatio)) * 100}%`}}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <InPageChatWindow sessionId={effectiveSessionId} hasSessionStarted={hasSessionStarted}/>

                    <div className="flex flex-wrap gap-3">
                        <Button onClick={handlePrimaryAction} disabled={primaryDisabled || isSessionDone}>
                            {isSessionDone ? '세션 완료' : actionLabel}
                        </Button>
                        <Button
                            onClick={() => navigate(`/reports?sessionId=${encodeURIComponent(effectiveSessionId)}`)}
                            variant="secondary"
                        >
                            최종 리포트 보기
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                resetSession()
                                setRecordedAudioBlob(null)
                                setLocalError(null)
                                setHasSessionStarted(false)
                                setSessionCompleted(false)
                            }}
                        >
                            초기화
                        </Button>
                    </div>

                    {localError ?
                        <p className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">{localError}</p> : null}
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-brand-600">카메라</p>
                        <VideoWindow enabled={!isSessionDone}/>
                    </div>

                    <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-brand-600">상태</p>
                        <div className="mt-3 space-y-2 text-sm text-brand-700">
                            <p>인터뷰: <span className="font-semibold text-brand-900">{simplePhaseLabel}</span></p>
                            <p>마이크: <span
                                className="font-semibold text-brand-900">{recorderState.isMicrophoneActive ? '활성' : '비활성'}</span>
                            </p>
                            <p>진행: <span
                                className="font-semibold text-brand-900">{qnaHistory.length} / {maxRounds}</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
