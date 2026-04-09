import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAppStore } from '../../store'
import { AIStatusIndicator } from '../common/AIStatusIndicator'
import { SessionStepper } from '../common/SessionStepper'
import { Button } from '../ui/Button'
import { SidebarNav, type SidebarNavItem } from './SidebarNav'
import { TopStatusBar } from './TopStatusBar'

const navItems: SidebarNavItem[] = [
  { label: '대시보드', to: '/dashboard' },
  { label: '훈련 업로드', to: '/upload-training' },
  { label: 'AI Q&A 세션', to: '/ai-qa-session' },
  { label: '리포트', to: '/reports' },
]

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
          <SidebarNav items={navItems} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur lg:border-b-0">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8 lg:pt-6">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/15 text-lg font-black text-brand-300 ring-1 ring-brand-500/25">
                A
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">AI Pitch Master</p>
                <p className="text-sm font-semibold text-white">워크스페이스</p>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <Button
                variant="ghost"
                className="lg:hidden"
                onClick={toggleMobileNav}
                aria-expanded={isMobileNavOpen}
                aria-label="메뉴 열기/닫기"
              >
                메뉴
              </Button>
            </div>
          </div>

          <div className="px-4 pb-4 sm:px-6 lg:px-8">
            <TopStatusBar
              workspaceName="AI Pitch Master"
              statusLabel="상태"
              statusValue="AI 코치 연결됨"
              secondaryLabel="세션"
              secondaryValue={sessionId ? '진행 중' : '대기'}
            />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            {/* Session Progress Stepper */}
            <SessionStepper currentStep={currentStep} sessionId={sessionId} />

            {/* Page Content */}
            <Outlet />
          </div>
        </main>
      </div>

      {isMobileNavOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden">
          <button
            type="button"
            aria-label="메뉴 닫기"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={closeMobileNav}
          />

          <div className="absolute left-0 top-0 h-full w-[88%] max-w-sm border-r border-white/10 bg-slate-950 p-5 shadow-2xl shadow-slate-950/50">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand-300">AI Pitch Master</p>
                <p className="mt-2 text-lg font-semibold text-white">메뉴</p>
              </div>
              <Button variant="ghost" onClick={closeMobileNav} aria-label="메뉴 닫기">
                닫기
              </Button>
            </div>

            <div className="mt-6">
              <SidebarNav items={navItems} />
            </div>
          </div>
        </div>
      ) : null}

      {/* Global AI Status Indicator */}
      <AIStatusIndicator status={aiStatus} message={aiStatusMessage} />
    </div>
  )
}


