import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card } from '../components'

const metrics = [
  { label: 'Weekly practice score', value: '87%', detail: '+6% from last week' },
  { label: 'Sessions completed', value: '24', detail: '4 queued for review' },
  { label: 'Speech confidence', value: 'High', detail: 'Ready for live rehearsal' },
]

const quickLinks = [
  { label: 'Upload training', to: '/upload-training' },
  { label: 'Start AI Q&A', to: '/ai-qa-session' },
  { label: 'Open reports', to: '/reports' },
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
      analysis: `/reports?sessionId=${encodeURIComponent(savedSession.sessionId)}`,
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
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Dashboard</p>
              <h2 className="mt-2 text-3xl font-black text-white">Your AI pitch workspace is ready.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Monitor practice health, move into training uploads, and launch guided AI Q&A sessions from a
                single SaaS-style command center.
              </p>
            </div>
            <Link to="/upload-training">
              <Button>New session</Button>
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
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Today</p>
          <h3 className="text-2xl font-semibold text-white">Focus path</h3>
          <ul className="space-y-3 text-sm leading-6 text-slate-300">
            <li className="rounded-2xl bg-white/5 p-4">1. Upload your latest pitch deck or script.</li>
            <li className="rounded-2xl bg-white/5 p-4">2. Run the AI Q&A session and capture weak spots.</li>
            <li className="rounded-2xl bg-white/5 p-4">3. Review performance trends in reports.</li>
          </ul>
        </Card>
      </section>

      {savedSession && (
        <Card className="space-y-4 border-cyan-400/30 bg-cyan-400/5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Saved Session</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Resume your last session</h3>
              <p className="mt-1 text-sm text-slate-300">
                You have an in-progress session. Continue from where you left off.
              </p>
            </div>
            <Button onClick={handleResumeSavedSession}>Resume</Button>
          </div>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {quickLinks.map((item) => (
          <Link key={item.label} to={item.to}>
            <Card className="h-full space-y-2 transition hover:border-cyan-400/25 hover:bg-white/7">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Quick action</p>
              <h3 className="text-lg font-semibold text-white">{item.label}</h3>
              <p className="text-sm text-slate-400">Open this workflow in one click.</p>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  )
}

