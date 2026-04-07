import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSendAnswerMutation, useStartQASessionMutation } from '../../../api'
import { AIThinking, Button, Card, ChatWindow, ErrorRecovery } from '../../../components'
import { useRecorder } from '../../../hooks'
import { useAppStore } from '../../../store'
import {
  useInterviewAudioRecording,
  useInterviewControls,
  useInterviewCountdown,
  useInterviewIndicators,
  useInterviewPhase,
  useInterviewSessionData,
  useInterviewTranscript,
  useAiSpeakingPhase,
} from '../hooks'
import type { InterviewSpeaker } from '../types'
import { AISpeakingIndicator, QuestionTypingText, InterviewTimer } from './index'

const indicatorStyles: Record<InterviewSpeaker, string> = {
  ai: 'bg-cyan-400 shadow-glow',
  user: 'bg-emerald-400 shadow-[0_0_24px_rgba(74,222,128,0.45)]',
  none: 'bg-slate-600',
}

export function AiInterviewInterface() {
  const [searchParams] = useSearchParams()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const phaseSwitchTimeoutRef = useRef<number | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  const { setAiStatus, clearAiStatus } = useAppStore()

  const phase = useInterviewPhase()
  const { questionRemainingSeconds, tickQuestionTimer, resetQuestionTimer } = useInterviewCountdown()
  const { activeSpeaker, microphoneEnabled } = useInterviewIndicators()
  const { appendTranscript } = useInterviewTranscript()
  const { sessionId, currentQuestionText, answerDraft, recordedAudioBlob, isRecordingAudio, qnaHistory } = useInterviewSessionData()
  const { recordedAudioBlob: _, isRecordingAudio: __, setRecordedAudioBlob, setIsRecordingAudio } = useInterviewAudioRecording()
  const { isAiAudioPlaying, isTypingAnimationComplete, setIsAiAudioPlaying, setIsTypingAnimationComplete } = useAiSpeakingPhase()

  const {
    initializeSession,
    resetSession,
    setCurrentQuestion,
    setAnswerDraft,
    moveToUserAnswering,
    moveToEvaluating,
    moveToFeedbackReady,
    appendHistory,
    toggleMicrophone,
  } = useInterviewControls()

  const {
    startRecording,
    stopRecording,
    retryRecording,
    state: recorderState,
  } = useRecorder()

  const startQASessionMutation = useStartQASessionMutation()
  const sendAnswerMutation = useSendAnswerMutation()

  const [cameraError, setCameraError] = useState<string | null>(null)
  const [flowError, setFlowError] = useState<string | null>(null)

  const routeSessionId = searchParams.get('sessionId')
  const effectiveSessionId = routeSessionId ?? sessionId

  const recordingTimeLabel = useMemo(() => {
    const minutes = Math.floor(recorderState.durationSeconds / 60)
    const seconds = recorderState.durationSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }, [recorderState.durationSeconds])

  const setNextQuestion = useCallback(
    (questionText: string, questionAudio: string) => {
      setCurrentQuestion(questionText, questionAudio)
      resetQuestionTimer()
      setIsTypingAnimationComplete(false)

      if (questionAudio) {
        // Create audio element and play it
        const audioDataUrl = `data:audio/mp3;base64,${questionAudio}`
        setIsAiAudioPlaying(true)

        if (audioElementRef.current) {
          audioElementRef.current.src = audioDataUrl
          audioElementRef.current.onended = () => {
            setIsAiAudioPlaying(false)
          }
          void audioElementRef.current.play().catch(() => {
            // Fallback if audio play fails
            setIsAiAudioPlaying(false)
          })
        }
      }

      if (phaseSwitchTimeoutRef.current !== null) {
        window.clearTimeout(phaseSwitchTimeoutRef.current)
      }
    },
    [
      moveToUserAnswering,
      resetQuestionTimer,
      setCurrentQuestion,
      setIsAiAudioPlaying,
      setIsTypingAnimationComplete,
    ]
  )

  const sessionStatusLabel = useMemo(() => {
    if (phase === 'waiting') {
      return 'Ready to start'
    }

    if (phase === 'feedback-ready') {
      return 'Feedback ready'
    }

    return 'Live interview in progress'
  }, [phase])

  useEffect(() => {
    if (routeSessionId) {
      initializeSession(routeSessionId)
    }
  }, [initializeSession, routeSessionId])

  useEffect(() => {
    let isMounted = true
    const videoElement = videoRef.current

    const setupCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Webcam preview is not supported in this browser.')
        return
      }

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        if (!isMounted) {
          mediaStream.getTracks().forEach((track) => track.stop())
          return
        }

        if (videoElement) {
          videoElement.srcObject = mediaStream
        }
      } catch {
        setCameraError('Camera access denied. Showing preview placeholder.')
      }
    }

    setupCamera()

    return () => {
      isMounted = false
      const currentStream = videoElement?.srcObject
      if (currentStream instanceof MediaStream) {
        currentStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      if (phaseSwitchTimeoutRef.current !== null) {
        window.clearTimeout(phaseSwitchTimeoutRef.current)
      }
    }
  }, [])

  const handleStartSession = useCallback(async () => {
    if (!effectiveSessionId) {
      setFlowError('sessionId is required. Start from presentation analysis first.')
      return
    }

    setFlowError(null)
    setAiStatus('generating', 'Creating your first challenge question...')

    try {
      const response = await startQASessionMutation.mutateAsync(effectiveSessionId)
      clearAiStatus()
      setNextQuestion(response.ai_question_text, response.ai_question_audio)
    } catch (error) {
      clearAiStatus()
      setFlowError(error instanceof Error ? error.message : 'Failed to start Q&A session.')
    }
  }, [effectiveSessionId, setNextQuestion, startQASessionMutation, setAiStatus, clearAiStatus])

  const handleSubmitAnswer = useCallback(async () => {
    if (!effectiveSessionId || !currentQuestionText) {
      setFlowError('No active question to submit.')
      return
    }

    setFlowError(null)
    moveToEvaluating()
    setAiStatus('thinking', 'Evaluating your response...')

    // Timer 만료/수동 제출 모두 제출 직전 녹음을 먼저 정지해 최신 오디오를 확보한다.
    let latestBlob = recordedAudioBlob
    if (recorderState.isRecording) {
      const stoppedBlob = await stopRecording()
      if (stoppedBlob) {
        latestBlob = stoppedBlob
        setRecordedAudioBlob(stoppedBlob)
      }
    }

    // Use recorded audio blob if available, otherwise fallback to draft text
    const audioBlob = latestBlob || new Blob([answerDraft.trim() || '(no spoken response)'], { type: 'audio/webm' })
    const userAnswer = answerDraft.trim() || '(no spoken response)'

    appendTranscript('user', userAnswer)
    appendHistory({ q: currentQuestionText, a: userAnswer })

    const previousTurn = qnaHistory.at(-1)
    const historyContext = JSON.stringify(previousTurn ? [previousTurn] : [])

    try {
      const response = await sendAnswerMutation.mutateAsync({
        sessionId: effectiveSessionId,
        audioBlobOrText: audioBlob,
        historyContext,
      })

      clearAiStatus()
      appendTranscript('ai', `Feedback: ${response.answer_feedback}`)
      setAnswerDraft('')
      setRecordedAudioBlob(null)
      setNextQuestion(response.next_ai_question_text, response.next_ai_question_audio)
    } catch (error) {
      clearAiStatus()
      setFlowError(error instanceof Error ? error.message : 'Failed to submit answer.')
      moveToFeedbackReady()
    }
  }, [
    answerDraft,
    appendHistory,
    appendTranscript,
    currentQuestionText,
    effectiveSessionId,
    moveToEvaluating,
    moveToFeedbackReady,
    recordedAudioBlob,
    recorderState.isRecording,
            stopRecording,
    qnaHistory,
    sendAnswerMutation,
    setAnswerDraft,
    setRecordedAudioBlob,
    setNextQuestion,
    setAiStatus,
    clearAiStatus,
  ])

  const handleRetryAnswerUpload = useCallback(async () => {
    if (!effectiveSessionId || !recordedAudioBlob || !currentQuestionText) {
      setFlowError('No recorded audio available for retry. Please record your answer again.')
      return
    }

    setFlowError(null)
    moveToEvaluating()
    setAiStatus('thinking', 'Retrying your audio upload...')

    const previousTurn = qnaHistory.at(-1)
    const historyContext = JSON.stringify(previousTurn ? [previousTurn] : [])

    try {
      const response = await sendAnswerMutation.mutateAsync({
        sessionId: effectiveSessionId,
        audioBlobOrText: recordedAudioBlob,
        historyContext,
      })

      clearAiStatus()
      appendTranscript('ai', `Feedback: ${response.answer_feedback}`)
      setAnswerDraft('')
      setRecordedAudioBlob(null)
      setNextQuestion(response.next_ai_question_text, response.next_ai_question_audio)
    } catch (error) {
      clearAiStatus()
      setFlowError(error instanceof Error ? error.message : 'Audio upload retry failed.')
      moveToFeedbackReady()
    }
  }, [
    appendTranscript,
    clearAiStatus,
    currentQuestionText,
    effectiveSessionId,
    moveToEvaluating,
    moveToFeedbackReady,
    qnaHistory,
    recordedAudioBlob,
    sendAnswerMutation,
    setAiStatus,
    setAnswerDraft,
    setRecordedAudioBlob,
    setNextQuestion,
  ])

  const handleRecoverSession = useCallback(() => {
    if (effectiveSessionId) {
      initializeSession(effectiveSessionId)
      setFlowError(null)
    }
  }, [effectiveSessionId, initializeSession])

  useEffect(() => {
    if (phase !== 'user-answering') {
      return
    }

    const timerId = window.setInterval(() => {
      if (sendAnswerMutation.isPending) {
        return
      }

      if (questionRemainingSeconds <= 1) {
        window.clearInterval(timerId)
        void handleSubmitAnswer()
        return
      }

      tickQuestionTimer()
    }, 1000)

    return () => {
      window.clearInterval(timerId)
    }
  }, [handleSubmitAnswer, phase, questionRemainingSeconds, sendAnswerMutation.isPending, tickQuestionTimer])

  // Handle typing animation completion - transition to user answering
  useEffect(() => {
    if (phase !== 'ai-speaking' || !isTypingAnimationComplete || isAiAudioPlaying) {
      return
    }

    // Audio has ended or was never played, move to user answering
    if (phaseSwitchTimeoutRef.current !== null) {
      window.clearTimeout(phaseSwitchTimeoutRef.current)
    }

    phaseSwitchTimeoutRef.current = window.setTimeout(() => {
      moveToUserAnswering()
    }, 500)

    return () => {
      if (phaseSwitchTimeoutRef.current !== null) {
        window.clearTimeout(phaseSwitchTimeoutRef.current)
      }
    }
  }, [phase, isTypingAnimationComplete, isAiAudioPlaying, moveToUserAnswering])

  // Handle auto-start recording when transitioning to user answering
  useEffect(() => {
    if (phase !== 'user-answering' || isRecordingAudio || recordedAudioBlob || recorderState.error) {
      return
    }

    void (async () => {
      setIsRecordingAudio(true)
      await startRecording()
    })()
  }, [phase, isRecordingAudio, recordedAudioBlob, recorderState.error, setIsRecordingAudio, startRecording])

  useEffect(() => {
    setIsRecordingAudio(recorderState.isRecording)
  }, [recorderState.isRecording, setIsRecordingAudio])

  const handleRecordingStart = useCallback(async () => {
    if (recorderState.isRecording) {
      return
    }
    
    setFlowError(null)
    await startRecording()
  }, [recorderState.isRecording, startRecording])

  const handleRecordingStop = useCallback(async () => {
    if (!recorderState.isRecording) {
      return
    }

    const blob = await stopRecording()
    if (blob) {
      setRecordedAudioBlob(blob)
    }
  }, [recorderState.isRecording, stopRecording, setRecordedAudioBlob])

  const handleRetryRecording = useCallback(async () => {
    setFlowError(null)
    setRecordedAudioBlob(null)
    await retryRecording()
  }, [retryRecording, setRecordedAudioBlob])

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Real-time AI Interview</p>
        <h2 className="text-3xl font-black text-white">Train under realistic interview pressure.</h2>
        <p className="max-w-3xl text-sm leading-7 text-slate-300">
          Start from a valid analysis session and continue AI question-answer turns with per-question timing.
        </p>
      </div>

      {flowError ? (
        <Card className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {flowError}
        </Card>
      ) : null}

      {(startQASessionMutation.isError || sendAnswerMutation.isError) ? (
        <ErrorRecovery
          error={sendAnswerMutation.error ?? startQASessionMutation.error}
          sessionId={effectiveSessionId}
          onRetry={() => {
            if (sendAnswerMutation.isError) {
              void handleRetryAnswerUpload()
              return
            }
            void handleStartSession()
          }}
          onRetryAudioUpload={sendAnswerMutation.isError ? () => {
            void handleRetryAnswerUpload()
          } : undefined}
          onRecoverSession={effectiveSessionId ? handleRecoverSession : undefined}
        />
      ) : null}

      {(startQASessionMutation.isPending || sendAnswerMutation.isPending) ? <AIThinking /> : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
           <Card className="space-y-4">
             <div className="flex items-center justify-between gap-4">
               <h3 className="text-lg font-semibold text-white">AI Interview Experience</h3>
               <span className="text-sm font-semibold text-cyan-300">{sessionStatusLabel}</span>
             </div>

             {/* AI Speaking Indicator */}
             <AISpeakingIndicator isPlaying={isAiAudioPlaying} />

             {/* Question Text with Typing Animation */}
             {phase === 'ai-speaking' && currentQuestionText && (
               <QuestionTypingText
                 text={currentQuestionText}
                 isActive={phase === 'ai-speaking'}
                 speed={30}
                 onComplete={() => setIsTypingAnimationComplete(true)}
               />
             )}

             {/* Show static question once typing is done or in user answering phase */}
             {(phase === 'user-answering' || (phase === 'ai-speaking' && isTypingAnimationComplete)) &&
               currentQuestionText && (
                 <div className="space-y-3">
                   <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                     💭 Question
                   </p>
                   <div className="min-h-16 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4">
                     <p className="text-base leading-7 text-slate-100">{currentQuestionText}</p>
                   </div>
                 </div>
               )}

             {/* AI Avatar Visual */}
             {phase === 'ai-speaking' && (
               <div className="relative overflow-hidden rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/15 to-slate-900 p-6">
                 <div className="mx-auto grid h-40 w-40 place-items-center rounded-full border-2 border-cyan-300/50 bg-slate-900/70">
                   <span className="animate-pulse text-5xl">🤖</span>
                 </div>
                 <p className="mt-4 text-center text-sm text-slate-300">AI is asking your question...</p>
               </div>
             )}
           </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-white">User Webcam Preview</h3>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                  microphoneEnabled ? 'bg-emerald-400/20 text-emerald-200' : 'bg-rose-500/20 text-rose-200'
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    microphoneEnabled && activeSpeaker === 'user' ? indicatorStyles.user : indicatorStyles.none
                  }`}
                />
                {microphoneEnabled ? 'Mic on' : 'Mic muted'}
              </span>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                  recorderState.isMicrophoneActive
                    ? 'bg-cyan-400/20 text-cyan-200'
                    : 'bg-slate-700/40 text-slate-300'
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    recorderState.isMicrophoneActive ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                {recorderState.isMicrophoneActive ? 'Mic active' : 'Mic idle'}
              </span>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70">
              {cameraError ? (
                <div className="grid h-56 place-items-center px-4 text-center text-sm text-slate-300">{cameraError}</div>
              ) : (
                <video ref={videoRef} autoPlay muted playsInline className="h-56 w-full object-cover" />
              )}
            </div>

             <div className="flex flex-wrap gap-3">
               <Button onClick={toggleMicrophone} variant={microphoneEnabled ? 'secondary' : 'primary'} disabled={isAiAudioPlaying}>
                 {microphoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
               </Button>
               <Button
                 onClick={handleRecordingStart}
                 variant={recorderState.isRecording ? 'primary' : 'secondary'}
                 disabled={!microphoneEnabled || phase !== 'user-answering' || recordedAudioBlob !== null || isAiAudioPlaying}
               >
                 {recorderState.isRecording ? '🔴 Recording...' : 'Start recording'}
               </Button>
               <Button
                 onClick={handleRecordingStop}
                 variant="secondary"
                 disabled={!recorderState.isRecording || recordedAudioBlob !== null}
               >
                 Stop recording
               </Button>
               {(recordedAudioBlob || recorderState.error) && (
                 <Button
                   onClick={handleRetryRecording}
                   variant="ghost"
                   disabled={isRecordingAudio}
                 >
                   Retry recording
                 </Button>
               )}
               <Button
                 onClick={handleStartSession}
                 disabled={startQASessionMutation.isPending || !effectiveSessionId || phase !== 'waiting'}
               >
                 {startQASessionMutation.isPending ? 'Starting...' : 'Start interview'}
               </Button>
               <Button
                 onClick={handleSubmitAnswer}
                 variant="secondary"
                 disabled={
                   phase !== 'user-answering' ||
                   sendAnswerMutation.isPending ||
                   !microphoneEnabled ||
                   isAiAudioPlaying ||
                   !recordedAudioBlob
                 }
               >
                 {sendAnswerMutation.isPending ? 'Sending answer...' : 'Submit answer'}
               </Button>
               <Button onClick={resetSession} variant="ghost">
                 Reset
               </Button>
             </div>

            <textarea
              value={answerDraft}
              onChange={(event) => setAnswerDraft(event.target.value)}
              placeholder="Type your answer draft (used as answer content for current flow)..."
              className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
            />

            {recorderState.error && (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                <p className="font-semibold">Recording Error</p>
                <p>{recorderState.error}</p>
              </div>
            )}

            {recordedAudioBlob && (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">✓ Audio Recorded</p>
                <p className="mt-1 text-sm text-emerald-100">
                  {(recordedAudioBlob.size / 1024).toFixed(1)} KB • Ready to submit
                </p>
              </div>
            )}

            {isRecordingAudio && !recordedAudioBlob && (
              <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">🎤 Recording in progress...</p>
                  <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-xs font-semibold text-cyan-100">
                    {recordingTimeLabel}
                  </span>
                </div>
                <div className="mt-3 flex h-12 items-end gap-1">
                  {recorderState.waveformLevels.map((level, index) => (
                    <div
                      key={`wave-${index}`}
                      className="flex-1 rounded-sm bg-cyan-300/80 transition-all duration-150"
                      style={{ height: `${Math.max(10, level)}%` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <InterviewTimer
            remainingSeconds={questionRemainingSeconds}
            totalSeconds={30}
            isActive={phase === 'user-answering'}
          />

          {/* Chat Window - Conversational Interview Display */}
          <div className="h-[500px]">
            <ChatWindow />
          </div>
        </div>
      </div>

      {/* Hidden audio element for AI question playback */}
      <audio ref={audioElementRef} />
    </div>
  )
}


