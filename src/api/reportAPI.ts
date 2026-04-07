import { apiRequest } from './client'

export interface ReportMetric {
  label: string
  score: number
  trend: number
}

export interface CoachingInsight {
  id: string
  message: string
  priority: 'high' | 'medium' | 'low'
}

export interface PerformanceReportResponse {
  reportId: string
  generatedAtIso: string
  metrics: ReportMetric[]
  insights: CoachingInsight[]
}

export const reportAPI = {
  getPerformanceReport: (sessionId: string) =>
    apiRequest<PerformanceReportResponse>({
      method: 'GET',
      url: `/reports/performance/${sessionId}`,
    }),

  getLatestReport: () =>
    apiRequest<PerformanceReportResponse>({
      method: 'GET',
      url: '/reports/performance/latest',
    }),
}

