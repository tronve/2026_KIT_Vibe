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
            `rounded-lg border px-4 py-3 transition ${
              isActive
                ? 'border-brand-300 bg-brand-100 text-brand-900 shadow-soft'
                : 'border-transparent text-brand-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-900'
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
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-brand-200 bg-white px-5 py-4 shadow-soft">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-brand-500">AI Pitch Master</p>
        <h1 className="mt-2 text-xl font-semibold text-brand-900">워크스페이스</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
        <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-brand-600">상태</p>
          <p className="mt-1 text-sm font-semibold text-brand-900">AI 코치 연결됨</p>
        </div>
        <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-brand-600">세션</p>
          <p className="mt-1 text-sm font-semibold text-brand-700">{sessionId ? '진행 중' : '대기'}</p>
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
      <div className="rounded-lg border border-brand-200 bg-brand-50 px-6 py-4">
        <p className="text-center text-sm text-brand-600">발표 자료를 업로드하면 인터뷰 워크플로가 시작됩니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-brand-200 bg-white p-6 shadow-soft">
        <div className="relative flex justify-between gap-2 md:gap-4">
          <div className="absolute top-8 left-0 right-0 -z-10 h-1 rounded-full bg-brand-200">
            <div className="h-full rounded-full bg-brand-700 transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
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
                        ? 'scale-110 border-brand-700 bg-brand-100 shadow-soft'
                        : isPassed
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-brand-300 bg-brand-50'
                    }`}
                  >
                    <span className="text-2xl">{step.icon}</span>
                    {isActive ? (
                      <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                    ) : null}
                    {isPassed && !isActive ? (
                      <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                        ✓
                      </span>
                    ) : null}
                  </button>
                  {isActive ? <div className="absolute inset-0 animate-pulse rounded-full border-2 border-brand-700" /> : null}
                </div>

                <div className="text-center">
                  <p
                    className={`text-sm font-semibold transition-colors md:text-base ${
                      isActive ? 'text-brand-900' : isPassed ? 'text-emerald-900' : 'text-brand-600'
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

      {sessionId ? <div className="text-center text-xs text-brand-600">세션 ID: <span className="font-mono text-brand-700">{sessionId.slice(0, 16)}...</span></div> : null}
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
      <div className="absolute inset-0 rounded-lg bg-brand-200 opacity-20 blur-lg" />
      <div className="relative rounded-lg border border-brand-300 bg-white px-4 py-3 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="animate-bounce text-2xl">{config.icon}</span>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-brand-900">{config.label}</p>
            {message ? <p className="text-xs text-brand-600">{message}</p> : null}
          </div>
          <div className="ml-2 flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-2 w-2 animate-pulse rounded-full bg-brand-600" style={{ animationDelay: `${i * 0.2}s`, animationDuration: '1.4s' }} />
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
    <div className="min-h-screen bg-white text-brand-900 lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="hidden border-r border-brand-200 bg-brand-50 px-5 py-6 lg:flex lg:flex-col">
        <div className="rounded-lg border border-brand-200 bg-white p-5 shadow-soft">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-700">AI Pitch Master</p>
          <h2 className="mt-3 text-2xl font-semibold text-brand-900">코칭 워크스페이스</h2>
        </div>

        <div className="mt-6 flex-1 space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-600">메뉴</p>
          <SidebarNavList />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-brand-200 bg-white/80 backdrop-blur lg:border-b-0">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8 lg:pt-6">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-100 text-lg font-black text-brand-900 ring-1 ring-brand-200">A</div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand-600">AI Pitch Master</p>
                <p className="text-sm font-semibold text-brand-900">워크스페이스</p>
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
        <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm lg:hidden">
          <button type="button" aria-label="메뉴 닫기" className="absolute inset-0 h-full w-full cursor-default" onClick={closeMobileNav} />

          <div className="absolute left-0 top-0 h-full w-[88%] max-w-sm border-r border-brand-200 bg-brand-50 p-5 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand-700">AI Pitch Master</p>
                <p className="mt-2 text-lg font-semibold text-brand-900">메뉴</p>
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


