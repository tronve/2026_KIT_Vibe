import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card } from '../components'
import { useAppStore } from '../store'

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
  const { clearSessionFromStorage } = useAppStore()

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

  const handleClearSession = async () => {
    await clearSessionFromStorage()
    setSavedSession(null)
  }

  const handleStartNewSession = async () => {
    await clearSessionFromStorage()
    navigate('/upload-training')
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-300">대시보드</p>
              <h2 className="mt-2 text-3xl font-black text-white">시작하기</h2>
            </div>
            <Button onClick={handleStartNewSession}>새 세션 시작</Button>
          </div>

          <div className="space-y-3 text-sm leading-6 text-slate-300">
            <p className="rounded-2xl bg-white/5 p-4">1. 발표 영상 업로드</p>
            <p className="rounded-2xl bg-white/5 p-4">2. AI Q&A 연습</p>
            <p className="rounded-2xl bg-white/5 p-4">3. 코칭 리포트 확인</p>
          </div>
        </Card>

        {savedSession && (
          <Card className="space-y-4 border-brand-500/30 bg-brand-500/5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-brand-300">저장된 세션</p>
                <h3 className="mt-2 text-xl font-semibold text-white">진행 중</h3>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleResumeSavedSession}>이어하기</Button>
              <Button variant="ghost" onClick={handleClearSession}>세션 삭제</Button>
            </div>
          </Card>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {quickLinks.map((item) => (
          <Link key={item.label} to={item.to}>
            <Card className="h-full space-y-2 transition hover:border-brand-500/25 hover:bg-white/7">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">바로가기</p>
              <h3 className="text-lg font-semibold text-white">{item.label}</h3>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  )
}

