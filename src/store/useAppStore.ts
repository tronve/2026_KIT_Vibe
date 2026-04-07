import { create } from 'zustand'

export type AIStatus = 'analyzing' | 'generating' | 'thinking' | 'preparing' | null
export type SessionStep = 'upload' | 'analysis' | 'interview' | 'report' | null

interface AppStore {
  // Mobile navigation
  isMobileNavOpen: boolean
  toggleMobileNav: () => void
  closeMobileNav: () => void
  
  // AI status indicator
  aiStatus: AIStatus
  aiStatusMessage: string
  setAiStatus: (status: AIStatus, message?: string) => void
  clearAiStatus: () => void
  
  // Session progress
  currentStep: SessionStep
  sessionId: string | null
  setCurrentStep: (step: SessionStep) => void
  setSessionId: (sessionId: string | null) => void
  resetSession: () => void

  // Session persistence
  restoreSessionFromStorage: () => void
  saveSessionToStorage: () => void
}

const SESSION_STORAGE_KEY = 'kit_vibe_session'

export const useAppStore = create<AppStore>((set, get) => ({
  // Mobile navigation
  isMobileNavOpen: false,
  toggleMobileNav: () => set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),
  closeMobileNav: () => set({ isMobileNavOpen: false }),
  
  // AI status indicator
  aiStatus: null,
  aiStatusMessage: '',
  setAiStatus: (status, message = '') =>
    set({
      aiStatus: status,
      aiStatusMessage: message,
    }),
  clearAiStatus: () =>
    set({
      aiStatus: null,
      aiStatusMessage: '',
    }),
  
  // Session progress
  currentStep: null,
  sessionId: null,
  setCurrentStep: (step) => {
    set({ currentStep: step })
    get().saveSessionToStorage()
  },
  setSessionId: (sessionId) => {
    set({ sessionId })
    get().saveSessionToStorage()
  },
  resetSession: () =>
    set({
      currentStep: null,
      sessionId: null,
      aiStatus: null,
      aiStatusMessage: '',
    }),

  // Session persistence
  restoreSessionFromStorage: () => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const savedSession = window.localStorage.getItem(SESSION_STORAGE_KEY)
      if (savedSession) {
        const { currentStep, sessionId } = JSON.parse(savedSession) as {
          currentStep: SessionStep
          sessionId: string | null
        }
        set({ currentStep, sessionId })
      }
    } catch (error) {
      console.error('Failed to restore session from storage:', error)
    }
  },

  saveSessionToStorage: () => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const { currentStep, sessionId } = get()
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ currentStep, sessionId }))
    } catch (error) {
      console.error('Failed to save session to storage:', error)
    }
  },
}))
