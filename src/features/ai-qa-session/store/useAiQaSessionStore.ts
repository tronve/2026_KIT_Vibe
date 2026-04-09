import { create } from 'zustand'
import type { QnaHistoryItem } from '../../../types'

const QUESTION_TIME_LIMIT_SECONDS = 30
const MAX_QA_ROUNDS = 3
const QA_SESSION_STORAGE_KEY = 'kit_vibe_qa_session'

type InterviewSessionPhase =
  | 'waiting'
  | 'ai-speaking'
  | 'user-answering'
  | 'evaluating'
  | 'feedback-ready'
  | 'completed'

interface AiQaSessionState {
  phase: InterviewSessionPhase
  currentQuestionText: string | null
  questionRemainingSeconds: number
  answerDraft: string
  recordedAudioBlob: Blob | null
  qnaHistory: QnaHistoryItem[]
  currentRound: number
  maxRounds: number
  setCurrentQuestion: (questionText: string) => void
  setAnswerDraft: (answerDraft: string) => void
  setRecordedAudioBlob: (blob: Blob | null) => void
  resetQuestionTimer: () => void
  tickQuestionTimer: () => void
  moveToEvaluating: () => void
  moveToUserAnswering: () => void
  moveToFeedbackReady: () => void
  appendHistory: (item: QnaHistoryItem) => void
  isQACompleted: () => boolean
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
  currentRound: 0,
  maxRounds: MAX_QA_ROUNDS,
  setCurrentQuestion: (questionText) =>
    set((state) => ({
      currentQuestionText: questionText,
      phase: 'ai-speaking',
      currentRound: state.currentRound + 1,
    })),
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
    set((state) => {
      const newHistory = [...state.qnaHistory, item]
      const isCompleted = newHistory.length >= state.maxRounds
      return {
        qnaHistory: newHistory,
        phase: isCompleted ? 'completed' : state.phase,
      }
    })
    get().saveSessionToStorage()
  },
  isQACompleted: () => {
    const state = get()
    return state.qnaHistory.length >= state.maxRounds
  },
  resetSession: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(QA_SESSION_STORAGE_KEY)
    }

    set({
      phase: 'waiting',
      currentQuestionText: null,
      questionRemainingSeconds: QUESTION_TIME_LIMIT_SECONDS,
      answerDraft: '',
      recordedAudioBlob: null,
      qnaHistory: [],
      currentRound: 0,
    })
  },


  // Session persistence
  restoreSessionFromStorage: () => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const savedSession = window.localStorage.getItem(QA_SESSION_STORAGE_KEY)
      if (savedSession) {
        const { qnaHistory, currentRound, phase } = JSON.parse(savedSession) as {
          qnaHistory: QnaHistoryItem[]
          currentRound?: number
          phase?: InterviewSessionPhase
        }
        set({
          qnaHistory: qnaHistory ?? [],
          currentRound: currentRound ?? (qnaHistory?.length ?? 0),
          phase: phase ?? 'waiting',
        })
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
      const { qnaHistory, currentRound, phase } = get()
      window.localStorage.setItem(QA_SESSION_STORAGE_KEY, JSON.stringify({ qnaHistory, currentRound, phase }))
    } catch (error) {
      console.error('Failed to save QA session to storage:', error)
    }
  },
}))
