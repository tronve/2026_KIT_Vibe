import { create } from 'zustand'
import type { PracticePrompt } from '../types'

const createInitialPrompts = (): PracticePrompt[] => [
  {
    id: 'hook',
    title: '도입',
    description: '청중의 문제를 즉시 환기할 수 있는 강한 오프닝으로 시작하세요.',
    focusArea: '오프닝 한 문장',
    estimatedMinutes: 2,
    completed: false,
  },
  {
    id: 'story',
    title: '스토리',
    description: '짧은 서사를 활용해 발표를 기억하기 쉽고 전달하기 쉽게 만드세요.',
    focusArea: '서사 흐름',
    estimatedMinutes: 3,
    completed: false,
  },
  {
    id: 'close',
    title: '마무리',
    description: '명확한 요청으로 끝맺어 청중이 다음 행동을 이해하도록 하세요.',
    focusArea: '행동 유도 문구',
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



