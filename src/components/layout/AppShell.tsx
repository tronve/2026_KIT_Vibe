import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAppStore } from '../../store'
import { AIStatusIndicator } from '../common/AIStatusIndicator'
import { SessionStepper } from '../common/SessionStepper'
import { Button } from '../ui/Button'
import { SidebarNav, type SidebarNavItem } from './SidebarNav'
import { TopStatusBar } from './TopStatusBar'

const navItems: SidebarNavItem[] = [
  {
    label: '대시보드',
    to: '/dashboard',
    description: '핵심 훈련 지표와 오늘의 진행 상태를 확인합니다.',
  },
  {
    label: '훈련 업로드',
    to: '/upload-training',
    description: 'AI 코칭을 위한 발표 영상을 업로드합니다.',
  },
  {
    label: 'AI Q&A 세션',
    to: '/ai-qa-session',
    description: '실전형 질문과 피드백으로 모의 인터뷰를 진행합니다.',
  },
  {
    label: '리포트',
    to: '/reports',
    description: '점수, 개선 포인트, 세션 이력을 확인합니다.',
  },
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
        <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-cyan-400/15 via-slate-950 to-slate-900 p-5 shadow-2xl shadow-cyan-500/10">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">AI Pitch Master</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">AI 스피치 트레이닝</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            발표 연습부터 Q&A 훈련, 성과 리포트까지 한 번에 관리하는 워크스페이스입니다.
          </p>
        </div>

        <div className="mt-6 flex-1 space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">메뉴</p>
          <SidebarNav items={navItems} />
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">워크스페이스</p>
          <p className="mt-2 font-semibold text-white">Pitch Master Pro</p>
          <p className="mt-1 leading-6">빠른 반복 연습과 코칭 기반 개선을 위해 설계되었습니다.</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur lg:border-b-0">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8 lg:pt-6">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-lg font-black text-cyan-300 ring-1 ring-cyan-400/25">
                A
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">AI Pitch Master</p>
                <p className="text-sm font-semibold text-white">코칭 워크스페이스</p>
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
              workspaceName="퍼포먼스 워크스페이스"
              statusLabel="상태"
              statusValue="AI 코치 연결됨"
              secondaryLabel="오늘"
              secondaryValue="대기 중 세션 12개"
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
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">AI Pitch Master</p>
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


