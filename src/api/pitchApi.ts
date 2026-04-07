import { apiRequest } from './client'
import type { PracticePrompt } from '../features/pitch-session/types'

export const pitchApi = {
  getPracticePrompts: () =>
    apiRequest<PracticePrompt[]>({
      method: 'GET',
      url: '/practice-prompts',
    }),
}

