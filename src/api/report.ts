import { apiRequest } from './client'
import { getAnalysisResult } from './analysis'
import type { QnaHistoryItem, ReportGenerateRequest, ReportGenerateResponse } from '../types'

const QA_SESSION_STORAGE_KEY = 'kit_vibe_qa_session'

function getStoredQnaHistory(): QnaHistoryItem[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(QA_SESSION_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as { qnaHistory?: QnaHistoryItem[] }
    return parsed.qnaHistory ?? []
  } catch {
    return []
  }
}

export async function getFinalReport(sessionId: string): Promise<ReportGenerateResponse> {
  const presentationAnalysisResponse = await getAnalysisResult(sessionId)

  const qnaHistory = getStoredQnaHistory()

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

