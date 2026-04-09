import { create } from 'zustand'
import type { QnaHistoryItem } from '../../../types'

const QUESTION_TIME_LIMIT_SECONDS = 30
const QA_SESSION_STORAGE_KEY = 'kit_vibe_qa_session'

type InterviewSessionPhase =
  | 'waiting'
  | 'ai-speaking'
  | 'user-answering'
  | 'evaluating'
  | 'feedback-ready'

interface AiQaSessionState {
  phase: InterviewSessionPhase
  currentQuestionText: string | null
  questionRemainingSeconds: number
  answerDraft: string
  recordedAudioBlob: Blob | null
  qnaHistory: QnaHistoryItem[]
  setCurrentQuestion: (questionText: string) => void
  setAnswerDraft: (answerDraft: string) => void
  setRecordedAudioBlob: (blob: Blob | null) => void
  resetQuestionTimer: () => void
  tickQuestionTimer: () => void
  moveToEvaluating: () => void
  moveToUserAnswering: () => void
  moveToFeedbackReady: () => void
  appendHistory: (item: QnaHistoryItem) => void
  resetSession: () => void
  restoreSessionFromStorage: () => void
  saveSessionToStorage: () => void
}

export const useAiQaSessionStore = create<AiQaSessionState>((set, get) => ({
  phase: 'waiting',
  currentQuestionText: null,
  questionRemainingSeconds: QUESTION_TIME_LIMIT_SECONDS,
  answerDraft: '',
  recordedAudioBlob: null,
  qnaHistory: [],
  setCurrentQuestion: (questionText) =>
    set({
      currentQuestionText: questionText,
      phase: 'ai-speaking',
    }),
  setAnswerDraft: (answerDraft) => set({ answerDraft }),
  setRecordedAudioBlob: (blob) => set({ recordedAudioBlob: blob }),
  resetQuestionTimer: () => set({ questionRemainingSeconds: QUESTION_TIME_LIMIT_SECONDS }),
  tickQuestionTimer: () =>
    set((state) => ({
      questionRemainingSeconds:
        state.questionRemainingSeconds > 0
          ? state.questionRemainingSeconds - 1
          : state.questionRemainingSeconds,
    })),
  moveToUserAnswering: () =>
    set({
      phase: 'user-answering',
    }),
  moveToEvaluating: () => {
    set({ phase: 'evaluating' })
    get().saveSessionToStorage()
  },
  moveToFeedbackReady: () => {
    set({ phase: 'feedback-ready' })
    get().saveSessionToStorage()
  },
  appendHistory: (item) => {
    set((state) => ({ qnaHistory: [...state.qnaHistory, item] }))
    get().saveSessionToStorage()
  },
  resetSession: () =>
    set({
      phase: 'waiting',
      currentQuestionText: null,
      questionRemainingSeconds: QUESTION_TIME_LIMIT_SECONDS,
      answerDraft: '',
      recordedAudioBlob: null,
      qnaHistory: [],
    }),


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
