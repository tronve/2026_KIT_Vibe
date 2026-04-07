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

const nextQuestionCache = new Map<string, NextQuestion>()

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

  nextQuestionCache.set(sessionId, {
    text: response.ai_question_text,
    audioBase64: response.ai_question_audio,
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

  nextQuestionCache.set(sessionId, {
    text: response.next_ai_question_text,
    audioBase64: response.next_ai_question_audio,
  })

  return response
}

export function getNextQuestion(sessionId: string): NextQuestion {
  const cachedQuestion = nextQuestionCache.get(sessionId)

  if (!cachedQuestion) {
    throw new Error('No next AI question available for this session_id.')
  }

  return cachedQuestion
}

