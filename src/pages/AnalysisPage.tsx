import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { useAnalysisResult } from '../hooks/useAnalysisResult'
import { useAppStore } from '../store/useAppStore'
import type { PresentationAnalyzeResponse } from '../types'

function AIThinking() {
  return (
    <div className="rounded-3xl border border-brand-500/20 bg-brand-500/10 p-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-3 w-3 rounded-full bg-brand-300 animate-pulse" />
        <p className="text-sm font-semibold text-brand-100">AI 처리 중</p>
      </div>
      <p className="mt-3 text-sm text-slate-200">발표를 분석하고 있습니다...</p>
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
    <Card className="space-y-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">
      <div>
        <h3 className="text-lg font-semibold text-white">문제가 발생했습니다</h3>
        <p className="mt-2 text-sm leading-6 text-rose-100">{message}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {onRetry ? (
          <button type="button" onClick={() => void onRetry()} className="rounded-full bg-brand-500 px-4 py-2 text-xs font-semibold text-slate-950">
            다시 시도
          </button>
        ) : null}
        {sessionId && onRecoverSession ? (
          <button type="button" onClick={() => void onRecoverSession()} className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white">
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
          ? { icon: '🐢', title: 'Speaking Pace', insight: 'Your speaking speed is below average (< 80 WPM).', explanation: 'You may be speaking too slowly, which can reduce engagement.', tip: 'Try increasing your pace slightly to maintain audience attention while ensuring clarity.', color: 'amber' as const }
          : data.value > 160
            ? { icon: '🚀', title: 'Speaking Pace', insight: 'Your speaking speed is very fast (> 160 WPM).', explanation: 'You speak rapidly, which can indicate nervousness or high energy.', tip: 'Add strategic pauses to emphasize key points and give your audience time to process.', color: 'orange' as const }
            : { icon: '⏱️', title: 'Speaking Pace', insight: `Your speaking speed is ${data.value} WPM - ideal for presentations.`, explanation: 'Your pace is well-balanced, allowing clear communication without rushing.', tip: 'Maintain this pace but watch for acceleration during stressful Q&A moments.', color: 'emerald' as const }
      case 'filler_words':
        return data.value === 0
          ? { icon: '✨', title: 'Verbal Fluency', insight: 'You used zero filler words - excellent control!', explanation: 'No "ums," "ahs," or "likes" detected in your presentation.', tip: 'This is excellent! Continue practicing silence over filler words.', color: 'emerald' as const }
          : data.value < 3
            ? { icon: '👍', title: 'Verbal Fluency', insight: 'You use very few filler words - great job!', explanation: 'Only occasional "ums" or "ahs" detected, showing good control.', tip: 'Keep this up! Replace any remaining filler words with intentional pauses.', color: 'emerald' as const }
            : data.value < 8
              ? { icon: '🎯', title: 'Verbal Fluency', insight: 'You use a moderate amount of filler words.', explanation: `${data.value} filler words detected throughout your presentation.`, tip: 'Practice pausing instead of filling silence. Record yourself to identify your habit words.', color: 'cyan' as const }
              : { icon: '⚠️', title: 'Verbal Fluency', insight: `You used ${data.value}+ filler words frequently.`, explanation: 'Frequent "ums," "ahs," and "likes" can distract your audience.', tip: 'Practice deliberate pauses. Record practice sessions and count your filler words.', color: 'amber' as const }
      case 'gaze_score':
        return data.value >= 90
          ? { icon: '👀', title: 'Eye Contact', insight: `Your eye contact score is ${data.value}/100 - exceptional!`, explanation: 'You maintain strong, consistent eye contact throughout your presentation.', tip: 'Maintain this level of engagement. You\'re connecting well with your audience.', color: 'emerald' as const }
          : data.value >= 75
            ? { icon: '👁️', title: 'Eye Contact', insight: `Your eye contact score is ${data.value}/100 - strong performance.`, explanation: 'Generally good eye contact with minor drops during complex sections.', tip: 'Practice maintaining eye contact during technical transitions or difficult slides.', color: 'cyan' as const }
            : data.value >= 60
              ? { icon: '🔍', title: 'Eye Contact', insight: `Your eye contact score is ${data.value}/100 - room for improvement.`, explanation: 'Your gaze frequently drifts to slides or notes.', tip: 'Practice looking at your audience between slides. Memorize key transition points.', color: 'amber' as const }
              : { icon: '⬇️', title: 'Eye Contact', insight: `Your eye contact score is ${data.value}/100 - needs attention.`, explanation: 'You\'re looking down significantly, reducing audience connection.', tip: 'Spend 60% of your time looking at the audience, 40% at slides. Use a speaker remote.', color: 'rose' as const }
      default:
        return { icon: '❓', title: 'Unknown Metric', insight: 'Unknown metric type', explanation: '', tip: '', color: 'slate' as const }
    }
  }, [data])

  const colorClasses = {
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-400/30', icon: 'text-emerald-300', title: 'text-emerald-200', badge: 'bg-emerald-400/20 text-emerald-300' },
    cyan: { bg: 'bg-brand-500/10', border: 'border-brand-400/30', icon: 'text-brand-300', title: 'text-brand-200', badge: 'bg-brand-400/20 text-brand-300' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-400/30', icon: 'text-amber-300', title: 'text-amber-200', badge: 'bg-amber-400/20 text-amber-300' },
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-400/30', icon: 'text-orange-300', title: 'text-orange-200', badge: 'bg-orange-400/20 text-orange-300' },
    rose: { bg: 'bg-rose-500/10', border: 'border-rose-400/30', icon: 'text-rose-300', title: 'text-rose-200', badge: 'bg-rose-400/20 text-rose-300' },
    slate: { bg: 'bg-slate-500/10', border: 'border-slate-400/30', icon: 'text-slate-300', title: 'text-slate-200', badge: 'bg-slate-400/20 text-slate-300' },
  } as const

  const colors = colorClasses[insight.color]

  return (
    <div className={`rounded-3xl border p-6 transition-all hover:shadow-lg ${colors.bg} ${colors.border}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div><p className={`text-xs font-semibold uppercase tracking-[0.2em] ${colors.title}`}>{insight.title}</p></div>
        <span className={`text-4xl ${colors.icon}`}>{insight.icon}</span>
      </div>
      <p className="mb-3 text-base font-semibold leading-6 text-white">{insight.insight}</p>
      <p className="mb-4 text-sm leading-6 text-slate-300">{insight.explanation}</p>
      <div className="mb-4 flex items-center gap-3">
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${colors.badge}`}>
          {data.metricType === 'gaze_score' ? `${data.value}/100` : data.value}
          {data.metricType === 'wpm' && ' WPM'}
          {data.metricType === 'filler_words' && ' instances'}
        </span>
      </div>
      <div className={`rounded-2xl border p-3 ${colors.border} ${colors.bg}`}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">💡 Coaching Tip</p>
        <p className="text-sm leading-6 text-slate-200">{insight.tip}</p>
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
        <p className="text-xs uppercase tracking-[0.3em] text-brand-300">분석</p>
        <h2 className="text-2xl font-black text-white">분석 결과가 아직 준비되지 않았습니다</h2>
        <p className="text-sm leading-6 text-slate-300">업로드 단계에서 다시 시도해 주세요.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-300">분석</p>
        <h2 className="text-3xl font-black text-white">발표 코칭 인사이트</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {insightItems.map((item) => (
          <InsightCard key={item.metricType} data={item} />
        ))}
      </div>

      <Card className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">논리 구조 요약</p>
        <p className="text-sm leading-7 text-slate-200">{analysis.analysis_result.logic_summary}</p>
      </Card>

      <Card className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">스크립트 미리보기</p>
        <p className="max-h-56 overflow-auto rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-sm leading-6 text-slate-300">
          {analysis.script}
        </p>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link to={`/ai-qa-session?sessionId=${encodeURIComponent(sessionId)}`}>
          <button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-slate-950">
            AI Q&A 세션 시작
          </button>
        </Link>
        <Link to={`/reports?sessionId=${encodeURIComponent(sessionId)}`}>
          <button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 ring-1 ring-inset ring-slate-700">
            최종 리포트 보기
          </button>
        </Link>
      </div>
    </div>
  )
}

