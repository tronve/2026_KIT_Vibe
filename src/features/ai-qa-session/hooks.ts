import { useAiQaSessionStore } from './store/useAiQaSessionStore'

export const useInterviewPhase = () => useAiQaSessionStore((state) => state.phase)

export const useInterviewCountdown = () =>
  useAiQaSessionStore((state) => ({
    questionRemainingSeconds: state.questionRemainingSeconds,
    tickQuestionTimer: state.tickQuestionTimer,
    resetQuestionTimer: state.resetQuestionTimer,
  }))

export const useInterviewTranscript = () =>
  useAiQaSessionStore((state) => ({
    transcriptItems: state.transcriptItems,
    appendTranscript: state.appendTranscript,
  }))

export const useInterviewIndicators = () =>
  useAiQaSessionStore((state) => ({
    activeSpeaker: state.activeSpeaker,
    microphoneEnabled: state.microphoneEnabled,
  }))

export const useInterviewControls = () =>
  useAiQaSessionStore((state) => ({
    initializeSession: state.initializeSession,
    resetSession: state.resetSession,
    setPhase: state.setPhase,
    setCurrentQuestion: state.setCurrentQuestion,
    setAnswerDraft: state.setAnswerDraft,
    moveToUserAnswering: state.moveToUserAnswering,
    moveToEvaluating: state.moveToEvaluating,
    moveToFeedbackReady: state.moveToFeedbackReady,
    appendHistory: state.appendHistory,
    toggleMicrophone: state.toggleMicrophone,
  }))

export const useInterviewSessionData = () =>
  useAiQaSessionStore((state) => ({
    sessionId: state.sessionId,
    currentQuestionText: state.currentQuestionText,
    currentQuestionAudio: state.currentQuestionAudio,
    answerDraft: state.answerDraft,
    recordedAudioBlob: state.recordedAudioBlob,
    isRecordingAudio: state.isRecordingAudio,
    qnaHistory: state.qnaHistory,
  }))

export const useInterviewAudioRecording = () =>
  useAiQaSessionStore((state) => ({
    recordedAudioBlob: state.recordedAudioBlob,
    isRecordingAudio: state.isRecordingAudio,
    setRecordedAudioBlob: state.setRecordedAudioBlob,
    setIsRecordingAudio: state.setIsRecordingAudio,
  }))

export const useAiSpeakingPhase = () =>
  useAiQaSessionStore((state) => ({
    isAiAudioPlaying: state.isAiAudioPlaying,
    isTypingAnimationComplete: state.isTypingAnimationComplete,
    setIsAiAudioPlaying: state.setIsAiAudioPlaying,
    setIsTypingAnimationComplete: state.setIsTypingAnimationComplete,
  }))

