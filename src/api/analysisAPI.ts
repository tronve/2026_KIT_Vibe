import { apiRequest } from './client'

export interface AnalysisSummary {
  presentationScore: number
  qaStressResponse: number
  speakingSpeedWpm: number
  keyInsight: string
}

export interface StartAnalysisPayload {
  uploadId: string
  sessionId: string
}

export interface StartAnalysisResponse {
  analysisId: string
  status: 'queued' | 'processing' | 'completed'
}

export interface AnalysisDetailResponse {
  analysisId: string
  status: 'processing' | 'completed'
  summary: AnalysisSummary
}

export const analysisAPI = {
  start: (payload: StartAnalysisPayload) =>
    apiRequest<StartAnalysisResponse>({
      method: 'POST',
      url: '/analysis/start',
      data: payload,
    }),

  getById: (analysisId: string) =>
    apiRequest<AnalysisDetailResponse>({
      method: 'GET',
      url: `/analysis/${analysisId}`,
    }),
}

