import { create } from 'zustand'
import type { QnaHistoryItem } from '../../../types'
import type { InterviewSessionPhase, InterviewSpeaker, TranscriptItem } from '../types'

const QUESTION_TIME_LIMIT_SECONDS = 30
const QA_SESSION_STORAGE_KEY = 'kit_vibe_qa_session'

interface AiQaSessionState {
  phase: InterviewSessionPhase
  sessionId: string | null
  currentQuestionText: string | null
  currentQuestionAudio: string | null
  questionRemainingSeconds: number
  activeSpeaker: InterviewSpeaker
  microphoneEnabled: boolean
  answerDraft: string
  recordedAudioBlob: Blob | null
  isRecordingAudio: boolean
  isAiAudioPlaying: boolean
  isTypingAnimationComplete: boolean
  transcriptItems: TranscriptItem[]
  qnaHistory: QnaHistoryItem[]
  initializeSession: (sessionId: string) => void
  setPhase: (phase: InterviewSessionPhase) => void
  setCurrentQuestion: (questionText: string, questionAudio: string) => void
  setAnswerDraft: (answerDraft: string) => void
  setRecordedAudioBlob: (blob: Blob | null) => void
  setIsRecordingAudio: (isRecording: boolean) => void
  setIsAiAudioPlaying: (isPlaying: boolean) => void
  setIsTypingAnimationComplete: (isComplete: boolean) => void
  resetQuestionTimer: () => void
  tickQuestionTimer: () => void
  moveToEvaluating: () => void
  moveToUserAnswering: () => void
  moveToFeedbackReady: () => void
  appendTranscript: (speaker: 'ai' | 'user', message: string) => void
  appendHistory: (item: QnaHistoryItem) => void
  resetSession: () => void
  toggleMicrophone: () => void
  // Session persistence
  restoreSessionFromStorage: () => void
  saveSessionToStorage: () => void
}

const initialTranscriptItems: TranscriptItem[] = [
  {
    id: 'intro-1',
    speaker: 'ai',
    message: '환영합니다. 2분 집중 모의 인터뷰를 시작하겠습니다.',
    createdAtIso: new Date().toISOString(),
    secondMark: 0,
  },
]

const toSecondMark = (transcriptItems: TranscriptItem[]) => transcriptItems.length * 5

export const useAiQaSessionStore = create<AiQaSessionState>((set, get) => ({
  phase: 'waiting',
  sessionId: null,
  currentQuestionText: null,
  currentQuestionAudio: null,
  questionRemainingSeconds: QUESTION_TIME_LIMIT_SECONDS,
  activeSpeaker: 'none',
  microphoneEnabled: true,
  answerDraft: '',
  recordedAudioBlob: null,
  isRecordingAudio: false,
  isAiAudioPlaying: false,
  isTypingAnimationComplete: false,
  transcriptItems: initialTranscriptItems,
  qnaHistory: [],
  initializeSession: (sessionId) =>
    set({
      sessionId,
      phase: 'waiting',
      currentQuestionText: null,
      currentQuestionAudio: null,
      questionRemainingSeconds: QUESTION_TIME_LIMIT_SECONDS,
      activeSpeaker: 'none',
      answerDraft: '',
      recordedAudioBlob: null,
      isRecordingAudio: false,
      isAiAudioPlaying: false,
      isTypingAnimationComplete: false,
      transcriptItems: initialTranscriptItems,
      qnaHistory: [],
    }),
  setPhase: (phase) => {
    set({ phase })
    get().saveSessionToStorage()
  },
  setCurrentQuestion: (questionText, questionAudio) =>
    set((state) => ({
      currentQuestionText: questionText,
      currentQuestionAudio: questionAudio,
      phase: 'ai-speaking',
      activeSpeaker: 'ai',
      transcriptItems: [
        ...state.transcriptItems,
        {
          id: `ai-${Date.now()}`,
          speaker: 'ai',
          message: questionText,
          createdAtIso: new Date().toISOString(),
          secondMark: toSecondMark(state.transcriptItems),
        },
      ],
    })),
  setAnswerDraft: (answerDraft) => set({ answerDraft }),
  setRecordedAudioBlob: (blob) => set({ recordedAudioBlob: blob }),
  setIsRecordingAudio: (isRecording) => set({ isRecordingAudio: isRecording }),
  setIsAiAudioPlaying: (isPlaying) => set({ isAiAudioPlaying: isPlaying }),
  setIsTypingAnimationComplete: (isComplete) => set({ isTypingAnimationComplete: isComplete }),
  resetQuestionTimer: () => set({ questionRemainingSeconds: QUESTION_TIME_LIMIT_SECONDS }),
  tickQuestionTimer: () =>
    set((state) => ({
      questionRemainingSeconds:
        state.questionRemainingSeconds > 0
          ? state.questionRemainingSeconds - 1
          : state.questionRemainingSeconds,
    })),
  moveToUserAnswering: () =>
    set((state) => ({
      phase: 'user-answering',
      activeSpeaker: state.microphoneEnabled ? 'user' : 'none',
    })),
  moveToEvaluating: () => {
    set({ phase: 'evaluating', activeSpeaker: 'none' })
    get().saveSessionToStorage()
  },
  moveToFeedbackReady: () => {
    set({ phase: 'feedback-ready', activeSpeaker: 'none' })
    get().saveSessionToStorage()
  },
  appendTranscript: (speaker, message) =>
    set((state) => ({
      transcriptItems: [
        ...state.transcriptItems,
        {
          id: `${speaker}-${Date.now()}`,
          speaker,
          message,
          createdAtIso: new Date().toISOString(),
          secondMark: toSecondMark(state.transcriptItems),
        },
      ],
    })),
  appendHistory: (item) =>
    set((state) => ({
      qnaHistory: [...state.qnaHistory, item],
    })),
  resetSession: () =>
    set({
      phase: 'waiting',
      sessionId: null,
      currentQuestionText: null,
      currentQuestionAudio: null,
      questionRemainingSeconds: QUESTION_TIME_LIMIT_SECONDS,
      activeSpeaker: 'none',
      microphoneEnabled: true,
      answerDraft: '',
      recordedAudioBlob: null,
      isRecordingAudio: false,
      isAiAudioPlaying: false,
      isTypingAnimationComplete: false,
      transcriptItems: initialTranscriptItems,
      qnaHistory: [],
    }),
  toggleMicrophone: () =>
    set((state) => ({
      microphoneEnabled: !state.microphoneEnabled,
      activeSpeaker:
        state.microphoneEnabled && state.phase === 'user-answering' ? 'none' : state.activeSpeaker,
    })),

  // Session persistence
  restoreSessionFromStorage: () => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const savedSession = window.localStorage.getItem(QA_SESSION_STORAGE_KEY)
      if (savedSession) {
        const { qnaHistory } = JSON.parse(savedSession) as {
          qnaHistory: QnaHistoryItem[]
        }
        set({ qnaHistory })
      }
    } catch (error) {
      console.error('Failed to restore QA session from storage:', error)
    }
  },

  saveSessionToStorage: () => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const { qnaHistory } = get()
      window.localStorage.setItem(QA_SESSION_STORAGE_KEY, JSON.stringify({ qnaHistory }))
    } catch (error) {
      console.error('Failed to save QA session to storage:', error)
    }
  },
}))
