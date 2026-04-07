import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AIThinking, Card, ErrorRecovery, InsightCard } from '../components'
import { useAnalysisResult } from '../hooks'
import { useAppStore } from '../store'
import type { PresentationAnalyzeResponse } from '../types'

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
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">분석</p>
        <h2 className="text-2xl font-black text-white">선택된 세션이 없습니다</h2>
        <p className="text-sm leading-6 text-slate-300">먼저 발표 영상 또는 PPT 녹화 영상을 업로드해 주세요.</p>
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
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">분석</p>
        <h2 className="text-2xl font-black text-white">분석 결과가 아직 준비되지 않았습니다</h2>
        <p className="text-sm leading-6 text-slate-300">업로드 단계에서 다시 분석을 실행해 주세요.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">분석</p>
        <h2 className="text-3xl font-black text-white">발표 코칭 인사이트</h2>
        <p className="max-w-3xl text-sm leading-7 text-slate-300">
          분석이 완료되었습니다. 핵심 코칭 신호를 확인한 뒤 AI Q&A 또는 최종 리포트로 이동하세요.
        </p>
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
          <button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">
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

