import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useFinalReportQuery } from '../api'
import { ActionPlan, AIThinking, Button, Card, ErrorRecovery, FeedbackSection, ScoreHero } from '../components'
import { useAppStore } from '../store'

// Storage key for analysis data
const ANALYSIS_DATA_STORAGE_KEY = 'kit_vibe_analysis_data'

export function ReportsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('sessionId')

  const { setAiStatus, clearAiStatus, setCurrentStep, setSessionId, clearSessionFromStorage } = useAppStore()

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
      setAiStatus('preparing', '최종 코칭 리포트를 준비하고 있습니다...')
      return
    }

    clearAiStatus()
  }, [reportQuery.isFetching, reportQuery.data, setAiStatus, clearAiStatus])

  const handleNewSession = async () => {
    await clearSessionFromStorage()
    navigate('/dashboard')
  }

  if (!sessionId) {
    return (
      <Card className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-300">AI 코칭 리포트</p>
        <h2 className="text-2xl font-black text-white">선택된 세션이 없습니다</h2>
        <p className="text-sm leading-6 text-slate-300">업로드부터 시작해 주세요.</p>
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
        <p className="text-xs uppercase tracking-[0.3em] text-brand-300">AI 코칭 리포트</p>
        <h2 className="text-2xl font-black text-white">리포트 데이터가 비어 있습니다</h2>
        <p className="text-sm leading-6 text-slate-300">리포트 API에서 코칭 데이터가 반환되지 않았습니다.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-300">AI 코칭 리포트</p>
        <h2 className="text-3xl font-black text-white">최종 코칭 요약</h2>
      </div>

      <ScoreHero score={report.overall_score} />

      <FeedbackSection
        title="강점"
        variant="strength"
        items={report.strengths}
        animationDelayMs={120}
      />

      <FeedbackSection
        title="개선 필요 영역"
        variant="weakness"
        items={report.weaknesses}
        animationDelayMs={220}
      />

      <ActionPlan items={report.action_items} animationDelayMs={320} />

      <div className="flex gap-2">
        <Button onClick={handleNewSession}>새 연습 시작</Button>
      </div>
    </div>
  )
}

