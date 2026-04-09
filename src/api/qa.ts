import { useMutation } from '@tanstack/react-query'
import { apiRequest } from './client'
import { getAnalysisResult } from './analysis'
import type {
  RoleplayStartRequest,
  RoleplayStartResponse,
  RoleplayTurnResponse,
} from '../types'

export interface NextQuestion {
  text: string
  audioBase64: string
}

export async function startQASession(sessionId: string): Promise<RoleplayStartResponse> {
  const presentationAnalysis = await getAnalysisResult(sessionId)

  const payload: RoleplayStartRequest = {
    session_id: sessionId,
    script: presentationAnalysis.script,
  }

  const response = await apiRequest<RoleplayStartResponse>({
    method: 'POST',
    // API spec: POST /api/v1/roleplay/start
    url: '/roleplay/start',
    data: payload,
  })

  return response
}

export async function sendAnswer(
  sessionId: string,
  audioBlobOrText: Blob | string,
  historyContext: string,
): Promise<RoleplayTurnResponse> {
  const userAudioBlob =
    typeof audioBlobOrText === 'string'
      ? new Blob([audioBlobOrText], { type: 'audio/webm' })
      : audioBlobOrText

  const formData = new FormData()
  formData.append('session_id', sessionId)
  formData.append('user_audio', userAudioBlob, 'user-answer.webm')
  formData.append('history_context', historyContext)

  const response = await apiRequest<RoleplayTurnResponse>({
    method: 'POST',
    // API spec: POST /api/v1/roleplay/turn
    url: '/roleplay/turn',
    data: formData,
  })

  return response
}

export interface SendAnswerVariables {
  sessionId: string
  audioBlobOrText: Blob | string
  historyContext: string
}

export function useStartQASessionMutation() {
  return useMutation({
    mutationFn: (sessionId: string) => startQASession(sessionId),
  })
}

export function useSendAnswerMutation() {
  return useMutation({
    mutationFn: ({ sessionId, audioBlobOrText, historyContext }: SendAnswerVariables) =>
      sendAnswer(sessionId, audioBlobOrText, historyContext),
  })
}

