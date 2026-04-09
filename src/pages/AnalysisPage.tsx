import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { useAnalysisResult } from '../hooks/useAnalysisResult'
import { useAppStore } from '../store/useAppStore'
import type { PresentationAnalyzeResponse } from '../types'

function AIThinking() {
  return (
    <div className="rounded-lg border border-brand-200 bg-brand-50 p-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-3 w-3 rounded-full bg-brand-700 animate-pulse" />
        <p className="text-sm font-semibold text-brand-900">AI 처리 중</p>
      </div>
      <p className="mt-3 text-sm text-brand-700">발표를 분석하고 있습니다...</p>
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
    <Card className="space-y-4 rounded-lg border-red-300 bg-red-50 p-4 text-red-900">
      <div>
        <h3 className="text-lg font-semibold text-red-900">문제가 발생했습니다</h3>
        <p className="mt-2 text-sm leading-6 text-red-700">{message}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {onRetry ? (
          <button type="button" onClick={() => void onRetry()} className="rounded-lg bg-red-900 px-4 py-2 text-xs font-semibold text-white">
            다시 시도
          </button>
        ) : null}
        {sessionId && onRecoverSession ? (
          <button type="button" onClick={() => void onRecoverSession()} className="rounded-lg border border-red-300 px-4 py-2 text-xs font-semibold text-red-900">
            세션 복구
          </button>
        ) : null}
      </div>
    </Card>
  )
}

type InsightCardData = {
  metricType: 'wpm' | 'filler_words' | 'gaze_score'
  value: number
}

function InsightCard({ data }: { data: InsightCardData }) {
  const insight = useMemo(() => {
    switch (data.metricType) {
      case 'wpm':
        return data.value < 80
          ? { icon: '🐢', title: '발화 속도', insight: '평균보다 느린 발화 속도입니다 (< 80 WPM).', explanation: '너무 느린 속도는 청중의 집중력을 떨어뜨릴 수 있습니다.', tip: '속도를 조금 높여 청중의 주의를 유지하되, 명확함은 잃지 않도록 하세요.', color: 'amber' as const }
          : data.value > 160
            ? { icon: '🚀', title: '발화 속도', insight: '매우 빠른 발화 속도입니다 (> 160 WPM).', explanation: '빠른 속도는 긴장이나 높은 에너지를 나타낼 수 있습니다.', tip: '핵심 포인트를 강조하고 청중이 이해할 시간을 주기 위해 전략적 멈춤을 추가하세요.', color: 'orange' as const }
            : { icon: '⏱️', title: '발화 속도', insight: `발화 속도가 ${data.value} WPM으로 발표에 이상적입니다.`, explanation: '속도가 균형잡혀 있어 명확한 의사소통이 가능합니다.', tip: '이 속도를 유지하되, 질문 세션 중 속도 가속에 주의하세요.', color: 'emerald' as const }
      case 'filler_words':
        return data.value === 0
          ? { icon: '✨', title: '음성 명료도', insight: '군더더기 표현이 완전히 없습니다 - 훌륭한 조절력입니다!', explanation: '"어", "아", "그" 같은 표현이 발견되지 않았습니다.', tip: '매우 우수합니다! 이 수준의 무음 활용을 계속 연습하세요.', color: 'emerald' as const }
          : data.value < 3
            ? { icon: '👍', title: '음성 명료도', insight: '군더더기 표현이 매우 적습니다 - 잘했어요!', explanation: '간헐적인 "어"나 "아"만 감지되어 좋은 조절력을 보여줍니다.', tip: '이 수준을 유지하세요! 남은 군더더기를 의도적 침묵으로 대체하세요.', color: 'emerald' as const }
            : data.value < 8
              ? { icon: '🎯', title: '음성 명료도', insight: '중정도의 군더더기 표현이 있습니다.', explanation: `발표 전체에서 ${data.value}개의 군더더기 표현이 감지되었습니다.`, tip: '침묵 대신 말하기 연습을 하세요. 본인의 습관 표현을 파악하려면 녹음 후 청취하세요.', color: 'cyan' as const }
              : { icon: '⚠️', title: '음성 명료도', insight: `${data.value}개 이상의 군더더기 표현을 자주 사용합니다.`, explanation: '자주 나오는 "어", "아", "그" 같은 표현은 청중을 산만하게 할 수 있습니다.', tip: '의도적인 침묵을 연습하세요. 연습 녹음을 하며 군더더기 표현을 세어보세요.', color: 'amber' as const }
      case 'gaze_score':
        return data.value >= 90
          ? { icon: '👀', title: '시선 접촉', insight: `시선 접촉 점수가 ${data.value}/100입니다 - 탁월합니다!`, explanation: '발표 내내 강하고 일관된 시선 접촉을 유지하고 있습니다.', tip: '이 수준의 관심을 유지하세요. 청중과의 연결이 매우 좋습니다.', color: 'emerald' as const }
          : data.value >= 75
            ? { icon: '👁️', title: '시선 접촉', insight: `시선 접촉 점수가 ${data.value}/100입니다 - 좋은 성과입니다.`, explanation: '전반적으로 좋은 시선 접촉이나 복잡한 부분에서 약간의 하락이 있습니다.', tip: '기술적 전환이나 어려운 슬라이드 중 시선 접촉을 유지하는 연습을 하세요.', color: 'cyan' as const }
            : data.value >= 60
              ? { icon: '🔍', title: '시선 접촉', insight: `시선 접촉 점수가 ${data.value}/100입니다 - 개선 여지가 있습니다.`, explanation: '시선이 슬라이드나 노트로 자주 흘러갑니다.', tip: '슬라이드 전환 사이 청중을 바라보는 연습을 하세요. 주요 전환점을 암기하세요.', color: 'amber' as const }
              : { icon: '⬇️', title: '시선 접촉', insight: `시선 접촉 점수가 ${data.value}/100입니다 - 주의가 필요합니다.`, explanation: '아래를 자주 봐서 청중과의 연결이 감소하고 있습니다.', tip: '청중을 60%, 슬라이드를 40% 바라보세요. 발표자 리모컨을 사용하세요.', color: 'rose' as const }
      default:
        return { icon: '❓', title: '알 수 없는 지표', insight: '알 수 없는 지표 유형입니다', explanation: '', tip: '', color: 'slate' as const }
    }
  }, [data])

  const colorClasses = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-300', icon: 'text-emerald-900', title: 'text-emerald-900', badge: 'bg-emerald-100 text-emerald-900' },
    cyan: { bg: 'bg-brand-50', border: 'border-brand-300', icon: 'text-brand-900', title: 'text-brand-900', badge: 'bg-brand-100 text-brand-900' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-300', icon: 'text-amber-900', title: 'text-amber-900', badge: 'bg-amber-100 text-amber-900' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-300', icon: 'text-orange-900', title: 'text-orange-900', badge: 'bg-orange-100 text-orange-900' },
    rose: { bg: 'bg-red-50', border: 'border-red-300', icon: 'text-red-900', title: 'text-red-900', badge: 'bg-red-100 text-red-900' },
    slate: { bg: 'bg-brand-50', border: 'border-brand-200', icon: 'text-brand-900', title: 'text-brand-900', badge: 'bg-brand-100 text-brand-900' },
  } as const

  const colors = colorClasses[insight.color]

  return (
    <div className={`rounded-lg border p-6 transition-all hover:shadow-soft ${colors.bg} ${colors.border}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div><p className={`text-xs font-semibold uppercase tracking-[0.2em] ${colors.title}`}>{insight.title}</p></div>
        <span className={`text-4xl ${colors.icon}`}>{insight.icon}</span>
      </div>
      <p className="mb-3 text-base font-semibold leading-6 text-brand-900">{insight.insight}</p>
      <p className="mb-4 text-sm leading-6 text-brand-700">{insight.explanation}</p>
      <div className="mb-4 flex items-center gap-3">
        <span className={`inline-block rounded-lg px-3 py-1 text-xs font-semibold ${colors.badge}`}>
          {data.metricType === 'gaze_score' ? `${data.value}/100` : data.value}
          {data.metricType === 'wpm' && ' WPM'}
          {data.metricType === 'filler_words' && '개'}
        </span>
      </div>
      <div className={`rounded-lg border p-3 ${colors.border} ${colors.bg}`}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">💡 코칭 팁</p>
        <p className="text-sm leading-6 text-brand-800">{insight.tip}</p>
      </div>
    </div>
  )
}

const ANALYSIS_DATA_STORAGE_KEY = 'kit_vibe_analysis_data'

interface SavedAnalysisPayload {
  sessionId: string
  analysis: PresentationAnalyzeResponse
  timestamp: string
}

function localizeLogicSummary(text: string) {
  if (!text) return '논리 구조 요약을 생성하지 못했습니다.'
  if (/[가-힣]/.test(text)) return text

  const normalized = text
    .replace(/your presentation/gi, '발표는')
    .replace(/good structure/gi, '구조가 좋습니다')
    .replace(/needs improvement/gi, '개선이 필요합니다')
    .replace(/conclusion/gi, '결론')
    .replace(/introduction/gi, '서론')
    .replace(/logic/gi, '논리')

  return `논리 구조 요약: ${normalized}`
}

export function AnalysisPage() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  const { setCurrentStep, setSessionId } = useAppStore()
  const [storedAnalysis, setStoredAnalysis] = useState<PresentationAnalyzeResponse | null>(null)

  const analysisQuery = useAnalysisResult({
    sessionId,
    enabled: Boolean(sessionId),
  })

  useEffect(() => {
    setCurrentStep('analysis')
    if (sessionId) {
      setSessionId(sessionId)
    }
  }, [sessionId, setCurrentStep, setSessionId])

  useEffect(() => {
    if (!sessionId) {
      setStoredAnalysis(null)
      return
    }

    try {
      const raw = window.localStorage.getItem(ANALYSIS_DATA_STORAGE_KEY)
      if (!raw) {
        setStoredAnalysis(null)
        return
      }

      const parsed = JSON.parse(raw) as SavedAnalysisPayload
      if (parsed.sessionId === sessionId && parsed.analysis) {
        setStoredAnalysis(parsed.analysis)
      }
    } catch {
      setStoredAnalysis(null)
    }
  }, [sessionId])

  const analysis = analysisQuery.data ?? storedAnalysis

  const insightItems = useMemo(() => {
    if (!analysis) {
      return []
    }

    return [
      { metricType: 'wpm' as const, value: analysis.analysis_result.wpm },
      { metricType: 'filler_words' as const, value: analysis.analysis_result.filler_words_count },
      { metricType: 'gaze_score' as const, value: analysis.analysis_result.gaze_score },
    ]
  }, [analysis])

  if (!sessionId) {
    return (
      <Card className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-300">분석</p>
        <h2 className="text-2xl font-black text-white">선택된 세션이 없습니다</h2>
        <p className="text-sm leading-6 text-slate-300">먼저 영상을 업로드해 주세요.</p>
      </Card>
    )
  }

  if (analysisQuery.isLoading && !analysis) {
    return <AIThinking />
  }

  if (analysisQuery.isError && !analysis) {
    return (
      <ErrorRecovery
        error={analysisQuery.error}
        sessionId={sessionId}
        onRetry={() => {
          void analysisQuery.refetch()
        }}
      />
    )
  }

  if (!analysis) {
    return (
      <Card className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-700">분석</p>
        <h2 className="text-2xl font-black text-brand-900">분석 결과가 아직 준비되지 않았습니다</h2>
        <p className="text-sm leading-6 text-brand-700">업로드 단계에서 다시 시도해 주세요.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-700">분석</p>
        <h2 className="text-3xl font-black text-brand-900">발표 코칭 인사이트</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {insightItems.map((item) => (
          <InsightCard key={item.metricType} data={item} />
        ))}
      </div>

      <Card className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-brand-600">논리 구조 요약</p>
        <p className="text-sm leading-7 text-brand-700">{localizeLogicSummary(analysis.analysis_result.logic_summary)}</p>
      </Card>

      <Card className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-brand-600">스크립트 미리보기</p>
        <p className="max-h-56 overflow-auto rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm leading-6 text-brand-700">
          {analysis.script}
        </p>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link to={`/ai-qa-session?sessionId=${encodeURIComponent(sessionId)}`}>
          <button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
            AI Q&A 세션 시작
          </button>
        </Link>
        <Link to={`/reports?sessionId=${encodeURIComponent(sessionId)}`}>
          <button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-900 ring-1 ring-inset ring-brand-200">
            최종 리포트 보기
          </button>
        </Link>
      </div>
    </div>
  )
}

