import { apiRequest } from './client'
import { getAnalysisResult } from './analysis'
import type { QnaHistoryItem, ReportGenerateRequest, ReportGenerateResponse } from '../types'

export async function getFinalReport(sessionId: string): Promise<ReportGenerateResponse> {
  const presentationAnalysisResponse = await getAnalysisResult(sessionId)

  // api-spec.md requires qna_history in request body.
  // This module keeps an empty history until conversation history integration is wired.
  const qnaHistory: QnaHistoryItem[] = []

  const payload: ReportGenerateRequest = {
    session_id: sessionId,
    presentation_analysis: presentationAnalysisResponse.analysis_result,
    qna_history: qnaHistory,
  }

  return apiRequest<ReportGenerateResponse>({
    method: 'POST',
    // API spec: POST /api/v1/report/generate
    url: '/report/generate',
    data: payload,
  })
}

