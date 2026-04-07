import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useFinalReportQuery } from '../api'
import { ActionPlan, AIThinking, Card, ErrorRecovery, FeedbackSection, ScoreHero } from '../components'
import { useAppStore } from '../store'

// Storage key for analysis data
const ANALYSIS_DATA_STORAGE_KEY = 'kit_vibe_analysis_data'

export function ReportsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('sessionId')

  const { setAiStatus, clearAiStatus, setCurrentStep, setSessionId } = useAppStore()

  const reportQuery = useFinalReportQuery(sessionId ?? '', Boolean(sessionId))

  useEffect(() => {
    setCurrentStep('report')
    if (sessionId) {
      setSessionId(sessionId)
    }
  }, [sessionId, setCurrentStep, setSessionId])

  // Save analysis data to localStorage when report is loaded
  useEffect(() => {
    if (reportQuery.data && sessionId) {
      try {
        const analysisData = {
          sessionId,
          report: reportQuery.data,
          timestamp: new Date().toISOString(),
        }
        window.localStorage.setItem(ANALYSIS_DATA_STORAGE_KEY, JSON.stringify(analysisData))
      } catch (error) {
        console.error('Failed to save analysis data to storage:', error)
      }
    }
  }, [reportQuery.data, sessionId])

  useEffect(() => {
    if (reportQuery.isFetching && !reportQuery.data) {
      setAiStatus('preparing', 'Preparing your final coaching report...')
      return
    }

    clearAiStatus()
  }, [reportQuery.isFetching, reportQuery.data, setAiStatus, clearAiStatus])

  if (!sessionId) {
    return (
      <Card className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">AI Coaching Report</p>
        <h2 className="text-2xl font-black text-white">No session selected</h2>
        <p className="text-sm leading-6 text-slate-300">
          Start from presentation upload to generate a report with coaching feedback.
        </p>
      </Card>
    )
  }

  if (reportQuery.isPending || (reportQuery.isFetching && !reportQuery.data)) {
    return <AIThinking />
  }

  if (reportQuery.isError) {
    return (
      <ErrorRecovery
        error={reportQuery.error}
        sessionId={sessionId}
        onRetry={() => {
          void reportQuery.refetch()
        }}
        onRecoverSession={() => {
          if (!sessionId) {
            return
          }

          navigate(`/reports?sessionId=${encodeURIComponent(sessionId)}`, { replace: true })
          void reportQuery.refetch()
        }}
      />
    )
  }

  const report = reportQuery.data

  if (!report) {
    return (
      <Card className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">AI Coaching Report</p>
        <h2 className="text-2xl font-black text-white">Report is empty</h2>
        <p className="text-sm leading-6 text-slate-300">No coaching payload returned from report API.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">AI Coaching Report</p>
        <h2 className="text-3xl font-black text-white">Your Final Coaching Summary</h2>
        <p className="max-w-3xl text-sm leading-7 text-slate-300">
          This report highlights what you did well, where pressure affected your delivery, and what to practice next.
        </p>
      </div>

      <ScoreHero score={report.overall_score} />

      <FeedbackSection
        title="Strengths"
        variant="strength"
        items={report.strengths}
        animationDelayMs={120}
      />

      <FeedbackSection
        title="Weaknesses"
        variant="weakness"
        items={report.weaknesses}
        animationDelayMs={220}
      />

      <ActionPlan items={report.action_items} animationDelayMs={320} />

      <p className="text-xs text-slate-500">
        Source: `/api/v1/report/generate` response ({sessionId})
      </p>
    </div>
  )
}

