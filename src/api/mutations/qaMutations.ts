import { useMutation } from '@tanstack/react-query'
import { sendAnswer, startQASession } from '../qa'

export function useStartQASessionMutation() {
  return useMutation({
    mutationFn: (sessionId: string) => startQASession(sessionId),
  })
}

export interface SendAnswerVariables {
  sessionId: string
  audioBlobOrText: Blob | string
  historyContext: string
}

export function useSendAnswerMutation() {
  return useMutation({
    mutationFn: ({ sessionId, audioBlobOrText, historyContext }: SendAnswerVariables) =>
      sendAnswer(sessionId, audioBlobOrText, historyContext),
  })
}

