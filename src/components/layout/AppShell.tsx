import { useEffect, useMemo } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { Button } from '../ui/Button'

const navItems = [
  { label: '대시보드', to: '/dashboard' },
  { label: '훈련 업로드', to: '/upload-training' },
  { label: 'AI Q&A 세션', to: '/ai-qa-session' },
  { label: '리포트', to: '/reports' },
]

const sessionSteps = [
  { id: 'upload', label: '업로드', icon: '📹' },
  { id: 'analysis', label: '분석', icon: '🔍' },
  { id: 'interview', label: '인터뷰', icon: '🎤' },
  { id: 'report', label: '리포트', icon: '📊' },
] as const

type AIStatus = 'analyzing' | 'generating' | 'thinking' | 'preparing' | null

function SidebarNavList() {
  return (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `rounded-2xl border px-4 py-3 transition ${
              isActive
                ? 'border-brand-500/30 bg-brand-500/10 text-white shadow-glow'
                : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <span className="block text-sm font-semibold">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

function TopStatusBar({ sessionId }: { sessionId: string | null }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-950/70 px-5 py-4 backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">AI Pitch Master</p>
        <h1 className="mt-2 text-xl font-semibold text-white">워크스페이스</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">상태</p>
          <p className="mt-1 text-sm font-semibold text-white">AI 코치 연결됨</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">세션</p>
          <p className="mt-1 text-sm font-semibold text-brand-300">{sessionId ? '진행 중' : '대기'}</p>
        </div>
      </div>
    </div>
  )
}

function SessionStepper({ currentStep, sessionId }: { currentStep: typeof sessionSteps[number]['id'] | null; sessionId: string | null }) {
  const currentStepIndex = useMemo(() => sessionSteps.findIndex((step) => step.id === currentStep), [currentStep])
  const progressPercentage = currentStepIndex >= 0 ? ((currentStepIndex + 1) / sessionSteps.length) * 100 : 0

  if (!sessionId && !currentStep) {
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/30 px-6 py-4">
        <p className="text-center text-sm text-slate-500">발표 자료를 업로드하면 인터뷰 워크플로가 시작됩니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <div className="relative flex justify-between gap-2 md:gap-4">
          <div className="absolute top-8 left-0 right-0 -z-10 h-1 rounded-full bg-slate-700/30">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
          </div>

          {sessionSteps.map((step, index) => {
            const isActive = step.id === currentStep
            const isPassed = currentStepIndex >= index

            return (
              <div key={step.id} className="flex flex-1 flex-col items-center gap-3">
                <div className="relative z-10">
                  <button
                    type="button"
                    disabled
                    className={`relative flex h-16 w-16 items-center justify-center rounded-full border-2 text-xl font-semibold transition-all duration-300 md:h-20 md:w-20 ${
                      isActive
                        ? 'scale-110 border-brand-400 bg-gradient-to-r from-brand-500/20 to-brand-400/20 shadow-lg shadow-brand-600/20'
                        : isPassed
                          ? 'border-emerald-400 bg-emerald-500/20'
                          : 'border-slate-600 bg-slate-700/20'
                    }`}
                  >
                    <span className="text-2xl">{step.icon}</span>
                    {isActive ? (
                      <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-400 text-xs font-bold text-slate-950">
                        {index + 1}
                      </span>
                    ) : null}
                    {isPassed && !isActive ? (
                      <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-xs font-bold text-slate-950">
                        ✓
                      </span>
                    ) : null}
                  </button>
                  {isActive ? <div className="absolute inset-0 animate-pulse rounded-full border-2 border-brand-400" /> : null}
                </div>

                <div className="text-center">
                  <p
                    className={`text-sm font-semibold transition-colors md:text-base ${
                      isActive ? 'text-brand-200' : isPassed ? 'text-emerald-200' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {sessionId ? <div className="text-center text-xs text-slate-500">세션 ID: <span className="font-mono text-slate-400">{sessionId.slice(0, 16)}...</span></div> : null}
    </div>
  )
}

function AIStatusIndicator({ status, message }: { status: AIStatus; message?: string }) {
  if (!status) return null

  const config = {
    analyzing: { icon: '📹', label: '발표 분석 중' },
    generating: { icon: '✨', label: 'AI 질문 생성 중' },
    thinking: { icon: '🧠', label: 'AI 사고 중' },
    preparing: { icon: '📊', label: '리포트 준비 중' },
  }[status]

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-400 opacity-30 blur-xl" />
      <div className="relative rounded-2xl border border-brand-400/30 bg-brand-500/10 px-4 py-3 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="animate-bounce text-2xl">{config.icon}</span>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-brand-200">{config.label}</p>
            {message ? <p className="text-xs text-slate-300">{message}</p> : null}
          </div>
          <div className="ml-2 flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-2 w-2 animate-pulse rounded-full bg-brand-400" style={{ animationDelay: `${i * 0.2}s`, animationDuration: '1.4s' }} />
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes fade-in { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} } .animate-fade-in { animation: fade-in 0.3s ease-out; }`}</style>
    </div>
  )
}

export function AppShell() {
  const location = useLocation()
  const isMobileNavOpen = useAppStore((state) => state.isMobileNavOpen)
  const toggleMobileNav = useAppStore((state) => state.toggleMobileNav)
  const closeMobileNav = useAppStore((state) => state.closeMobileNav)
  const aiStatus = useAppStore((state) => state.aiStatus)
  const aiStatusMessage = useAppStore((state) => state.aiStatusMessage)
  const currentStep = useAppStore((state) => state.currentStep)
  const sessionId = useAppStore((state) => state.sessionId)

  useEffect(() => {
    closeMobileNav()
  }, [closeMobileNav, location.pathname])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="hidden border-r border-white/10 bg-slate-950/95 px-5 py-6 lg:flex lg:flex-col">
        <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-brand-500/20 via-slate-950 to-slate-900 p-5 shadow-2xl shadow-brand-700/10">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-300">AI Pitch Master</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">코칭 워크스페이스</h2>
        </div>

        <div className="mt-6 flex-1 space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">메뉴</p>
          <SidebarNavList />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur lg:border-b-0">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8 lg:pt-6">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/15 text-lg font-black text-brand-300 ring-1 ring-brand-500/25">A</div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">AI Pitch Master</p>
                <p className="text-sm font-semibold text-white">워크스페이스</p>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <Button variant="ghost" className="lg:hidden" onClick={toggleMobileNav} aria-expanded={isMobileNavOpen} aria-label="메뉴 열기/닫기">
                메뉴
              </Button>
            </div>
          </div>

          <div className="px-4 pb-4 sm:px-6 lg:px-8">
            <TopStatusBar sessionId={sessionId} />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            <SessionStepper currentStep={currentStep} sessionId={sessionId} />
            <Outlet />
          </div>
        </main>
      </div>

      {isMobileNavOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden">
          <button type="button" aria-label="메뉴 닫기" className="absolute inset-0 h-full w-full cursor-default" onClick={closeMobileNav} />

          <div className="absolute left-0 top-0 h-full w-[88%] max-w-sm border-r border-white/10 bg-slate-950 p-5 shadow-2xl shadow-slate-950/50">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand-300">AI Pitch Master</p>
                <p className="mt-2 text-lg font-semibold text-white">메뉴</p>
              </div>
              <Button variant="ghost" onClick={closeMobileNav} aria-label="메뉴 닫기">닫기</Button>
            </div>

            <div className="mt-6">
              <SidebarNavList />
            </div>
          </div>
        </div>
      ) : null}

      <AIStatusIndicator status={aiStatus} message={aiStatusMessage} />
    </div>
  )
}


