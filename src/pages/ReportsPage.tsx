import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useFinalReportQuery } from '../api/queries/reportQueries'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAppStore } from '../store/useAppStore'

// Storage key for analysis data
const ANALYSIS_DATA_STORAGE_KEY = 'kit_vibe_analysis_data'

function AIThinking() {
  return (
    <div className="rounded-lg border border-brand-300 bg-brand-50 p-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-3 w-3 rounded-full bg-brand-600 animate-pulse" />
        <p className="text-sm font-semibold text-brand-900">AI 처리 중</p>
      </div>
      <p className="mt-3 text-sm text-brand-700">최종 코칭 리포트를 준비하고 있습니다...</p>
    </div>
  )
}

function ErrorRecovery({
  error,
  onRetry,
  sessionId,
  onRecoverSession,
}: {
  error?: unknown
  onRetry?: () => void | Promise<void>
  sessionId?: string | null
  onRecoverSession?: () => void | Promise<void>
}) {
  const message = error instanceof Error ? error.message : '다시 시도해 주세요.'
  return (
    <Card className="space-y-4 rounded-lg border border-rose-300 bg-rose-50 p-4 text-rose-900">
      <div>
        <h3 className="text-lg font-semibold text-brand-900">문제가 발생했습니다</h3>
        <p className="mt-2 text-sm leading-6 text-rose-700">{message}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {onRetry ? (
          <button type="button" onClick={() => void onRetry()} className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white">
            다시 시도
          </button>
        ) : null}
        {sessionId && onRecoverSession ? (
          <button type="button" onClick={() => void onRecoverSession()} className="rounded-lg border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-900">
            세션 복구
          </button>
        ) : null}
      </div>
    </Card>
  )
}

function ScoreHero({ score }: { score: number }) {
  const boundedScore = Math.max(0, Math.min(100, score))
  const tone = boundedScore >= 85 ? '압박 상황에서도 안정적인 전달력을 보여줬습니다. 실전 인터뷰 준비가 잘 되어 있습니다.' : boundedScore >= 70 ? '기본기가 탄탄합니다. 핵심 포인트 몇 가지만 보완하면 전달력이 크게 향상됩니다.' : '좋은 출발입니다. 집중 연습을 통해 자신감과 명료도를 빠르게 높일 수 있습니다.'
  const levelLabel = boundedScore >= 85 ? '상위 퍼포먼스' : boundedScore >= 70 ? '안정적 성장' : '집중 개선 구간'

  return (
    <section className="rounded-lg border border-brand-300 bg-gradient-to-br from-brand-50 to-white p-6" style={{ animation: 'reportReveal 500ms ease-out both' }}>
      <p className="text-xs uppercase tracking-[0.25em] text-brand-600">종합 점수</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-5xl font-black text-brand-900">{score}</p>
          <p className="mt-1 text-sm text-brand-600">{levelLabel}</p>
        </div>
        <p className="max-w-xl text-sm leading-6 text-brand-700">{tone}</p>
      </div>
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-brand-600">
          <span>코칭 진행도</span>
          <span>{boundedScore}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-brand-200">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-700" style={{ width: `${boundedScore}%` }} />
        </div>
      </div>
      <style>{`@keyframes reportReveal { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} }`}</style>
    </section>
  )
}

function FeedbackSection({ title, items, variant, animationDelayMs = 0 }: { title: string; items: string[]; variant: 'strength' | 'weakness'; animationDelayMs?: number }) {
  const isStrength = variant === 'strength'
  return (
    <section className="space-y-4" style={{ animation: `reportReveal 500ms ease-out ${animationDelayMs}ms both` }}>
      <p className={`text-xs uppercase tracking-[0.25em] ${isStrength ? 'text-emerald-600' : 'text-amber-600'}`}>{title}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {(items.length > 0 ? items : ['아직 피드백 데이터가 없습니다.']).map((item, index) => (
          <article key={`${variant}-${index}`} className={`rounded-lg border p-4 ${isStrength ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'}`}>
            <div className="mb-2 flex items-center gap-2">
              <span>{isStrength ? '✅' : '⚠️'}</span>
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${isStrength ? 'text-emerald-700' : 'text-amber-700'}`}>{isStrength ? '강점' : '주의'} {index + 1}</p>
            </div>
            <p className="text-sm leading-6 text-brand-800">{item}</p>
          </article>
        ))}
      </div>
      <style>{`@keyframes reportReveal { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} }`}</style>
    </section>
  )
}

function ActionPlan({ items, animationDelayMs = 0 }: { items: string[]; animationDelayMs?: number }) {
  const actionItems = items.length > 0 ? items : ['모의 인터뷰를 한 번 더 진행하고, 한 가지 개선 포인트에 집중해 보세요.']
  return (
    <section className="rounded-lg border border-brand-200 bg-brand-50 p-6" style={{ animation: `reportReveal 500ms ease-out ${animationDelayMs}ms both` }}>
      <p className="text-xs uppercase tracking-[0.25em] text-brand-600">실행 계획</p>
      <ol className="mt-5 space-y-3">
        {actionItems.map((item, index) => (
          <li key={`action-${index}`} className="flex gap-3 rounded-lg border border-brand-200 bg-white p-4">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-xs font-semibold text-brand-700">{index + 1}</span>
            <p className="text-sm leading-6 text-brand-800">{item}</p>
          </li>
        ))}
      </ol>
      <style>{`@keyframes reportReveal { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} }`}</style>
    </section>
  )
}

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
        <p className="text-xs uppercase tracking-[0.3em] text-brand-600">AI 코칭 리포트</p>
        <h2 className="text-2xl font-black text-brand-900">선택된 세션이 없습니다</h2>
        <p className="text-sm leading-6 text-brand-700">업로드부터 시작해 주세요.</p>
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
        <p className="text-xs uppercase tracking-[0.3em] text-brand-600">AI 코칭 리포트</p>
        <h2 className="text-2xl font-black text-brand-900">리포트 데이터가 비어 있습니다</h2>
        <p className="text-sm leading-6 text-brand-700">리포트 API에서 코칭 데이터가 반환되지 않았습니다.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-600">AI 코칭 리포트</p>
        <h2 className="text-3xl font-black text-brand-900">최종 코칭 요약</h2>
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

