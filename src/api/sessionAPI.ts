import { apiRequest } from './client'

export interface InterviewSession {
  id: string
  title: string
  status: 'waiting' | 'ai-speaking' | 'user-answering' | 'evaluating' | 'feedback-ready'
  startedAtIso: string
}

export interface CreateSessionPayload {
  title: string
}

export interface CreateSessionResponse {
  session: InterviewSession
}

export interface SessionEventPayload {
  type: 'session:start' | 'session:end' | 'session:evaluating' | 'session:feedback-ready'
  payload?: Record<string, unknown>
}

export const sessionAPI = {
  create: (payload: CreateSessionPayload) =>
    apiRequest<CreateSessionResponse>({
      method: 'POST',
      url: '/sessions',
      data: payload,
    }),

  getById: (sessionId: string) =>
    apiRequest<InterviewSession>({
      method: 'GET',
      url: `/sessions/${sessionId}`,
    }),

  publishEvent: (sessionId: string, payload: SessionEventPayload) =>
    apiRequest<{ ok: boolean }>({
      method: 'POST',
      url: `/sessions/${sessionId}/events`,
      data: payload,
    }),
}

