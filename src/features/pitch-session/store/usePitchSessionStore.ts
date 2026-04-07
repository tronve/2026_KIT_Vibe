import { create } from 'zustand'
import type { PracticePrompt } from '../types'

const createInitialPrompts = (): PracticePrompt[] => [
  {
    id: 'hook',
    title: 'Hook',
    description: 'Start with a compelling opening that immediately frames the audience problem.',
    focusArea: 'Opening line',
    estimatedMinutes: 2,
    completed: false,
  },
  {
    id: 'story',
    title: 'Story',
    description: 'Use a short narrative to make the pitch memorable and easy to repeat.',
    focusArea: 'Narrative flow',
    estimatedMinutes: 3,
    completed: false,
  },
  {
    id: 'close',
    title: 'Close',
    description: 'End with a clear ask so listeners know the next step.',
    focusArea: 'Call to action',
    estimatedMinutes: 2,
    completed: false,
  },
]

interface PitchSessionState {
  prompts: PracticePrompt[]
  activePromptId: string
  moveToNextPrompt: () => void
  markActivePromptComplete: () => void
  resetSession: () => void
}

const getNextPromptId = (prompts: PracticePrompt[], activePromptId: string) => {
  const currentIndex = prompts.findIndex((prompt) => prompt.id === activePromptId)

  if (currentIndex === -1) {
    return prompts[0]?.id ?? ''
  }

  return prompts[(currentIndex + 1) % prompts.length]?.id ?? activePromptId
}

export const usePitchSessionStore = create<PitchSessionState>((set) => ({
  prompts: createInitialPrompts(),
  activePromptId: createInitialPrompts()[0]?.id ?? '',
  moveToNextPrompt: () =>
    set((state) => ({
      activePromptId: getNextPromptId(state.prompts, state.activePromptId),
    })),
  markActivePromptComplete: () =>
    set((state) => ({
      prompts: state.prompts.map((prompt) =>
        prompt.id === state.activePromptId
          ? {
              ...prompt,
              completed: true,
            }
          : prompt,
      ),
    })),
  resetSession: () => {
    const initialPrompts = createInitialPrompts()

    set({
      prompts: initialPrompts,
      activePromptId: initialPrompts[0]?.id ?? '',
    })
  },
}))



