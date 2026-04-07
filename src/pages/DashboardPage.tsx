import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card } from '../components'

const metrics = [
  { label: '주간 연습 점수', value: '87%', detail: '지난주 대비 +6%' },
  { label: '완료한 세션', value: '24', detail: '리뷰 대기 4개' },
  { label: '발표 자신감', value: '높음', detail: '실전 리허설 준비 완료' },
]

const quickLinks = [
  { label: '훈련 업로드', to: '/upload-training' },
  { label: 'AI Q&A 시작', to: '/ai-qa-session' },
  { label: '리포트 열기', to: '/reports' },
]

const SESSION_STORAGE_KEY = 'kit_vibe_session'

interface SavedSession {
  currentStep: string
  sessionId: string | null
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null)

  // Load saved session from storage
  useEffect(() => {
    try {
      const savedSessionData = window.localStorage.getItem(SESSION_STORAGE_KEY)
      if (savedSessionData) {
        const session = JSON.parse(savedSessionData) as SavedSession
        if (session.sessionId && session.currentStep) {
          setSavedSession(session)
        }
      }
    } catch (error) {
      console.error('Failed to load saved session:', error)
    }
  }, [])

  const handleResumeSavedSession = () => {
    if (!savedSession?.sessionId) {
      return
    }

    const stepToPath: Record<string, string> = {
      upload: '/upload-training',
      analysis: `/analysis?sessionId=${encodeURIComponent(savedSession.sessionId)}`,
      interview: `/ai-qa-session?sessionId=${encodeURIComponent(savedSession.sessionId)}`,
      report: `/reports?sessionId=${encodeURIComponent(savedSession.sessionId)}`,
    }

    const path = stepToPath[savedSession.currentStep]
    if (path) {
      navigate(path)
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">대시보드</p>
              <h2 className="mt-2 text-3xl font-black text-white">AI 피치 워크스페이스가 준비되었습니다.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                연습 진행 상황을 확인하고, 발표 업로드부터 AI Q&A 세션까지 한 화면에서 빠르게 이어가세요.
              </p>
            </div>
            <Link to="/upload-training">
              <Button>새 세션 시작</Button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{metric.label}</p>
                <p className="mt-3 text-3xl font-black text-white">{metric.value}</p>
                <p className="mt-2 text-sm text-slate-400">{metric.detail}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">오늘의 루트</p>
          <h3 className="text-2xl font-semibold text-white">추천 진행 순서</h3>
          <ul className="space-y-3 text-sm leading-6 text-slate-300">
            <li className="rounded-2xl bg-white/5 p-4">1. 발표 영상(또는 PPT 화면 녹화 영상)을 업로드합니다.</li>
            <li className="rounded-2xl bg-white/5 p-4">2. AI Q&A 세션으로 약점을 점검합니다.</li>
            <li className="rounded-2xl bg-white/5 p-4">3. 리포트에서 개선 포인트를 확인합니다.</li>
          </ul>
        </Card>
      </section>

      {savedSession && (
        <Card className="space-y-4 border-cyan-400/30 bg-cyan-400/5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">저장된 세션</p>
              <h3 className="mt-2 text-xl font-semibold text-white">마지막 세션 이어서 진행</h3>
              <p className="mt-1 text-sm text-slate-300">
                진행 중이던 세션이 있습니다. 마지막 지점부터 이어서 진행하세요.
              </p>
            </div>
            <Button onClick={handleResumeSavedSession}>이어하기</Button>
          </div>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {quickLinks.map((item) => (
          <Link key={item.label} to={item.to}>
            <Card className="h-full space-y-2 transition hover:border-cyan-400/25 hover:bg-white/7">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">빠른 실행</p>
              <h3 className="text-lg font-semibold text-white">{item.label}</h3>
              <p className="text-sm text-slate-400">한 번의 클릭으로 바로 이동합니다.</p>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  )
}

