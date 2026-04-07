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
    label: 'Dashboard',
    to: '/dashboard',
    description: 'View key training metrics and daily product signals.',
  },
  {
    label: 'Upload Training',
    to: '/upload-training',
    description: 'Add decks, scripts, and reference material for AI coaching.',
  },
  {
    label: 'AI Q&A Session',
    to: '/ai-qa-session',
    description: 'Run a live training session with guided prompts and feedback.',
  },
  {
    label: 'Reports',
    to: '/reports',
    description: 'Review performance trends, scoring, and session history.',
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
          <h2 className="mt-3 text-2xl font-semibold text-white">SaaS Training Suite</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            A clean workspace for pitch practice, training uploads, and performance reporting.
          </p>
        </div>

        <div className="mt-6 flex-1 space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Navigation</p>
          <SidebarNav items={navItems} />
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Workspace</p>
          <p className="mt-2 font-semibold text-white">Pitch Master Pro</p>
          <p className="mt-1 leading-6">Built for rapid iteration, guided coaching, and measurable improvement.</p>
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
                <p className="text-sm font-semibold text-white">SaaS workspace</p>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <Button
                variant="ghost"
                className="lg:hidden"
                onClick={toggleMobileNav}
                aria-expanded={isMobileNavOpen}
                aria-label="Toggle navigation menu"
              >
                Menu
              </Button>
            </div>
          </div>

          <div className="px-4 pb-4 sm:px-6 lg:px-8">
            <TopStatusBar
              workspaceName="Performance workspace"
              statusLabel="Status"
              statusValue="AI assistant online"
              secondaryLabel="Today"
              secondaryValue="12 sessions queued"
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
            aria-label="Close navigation menu"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={closeMobileNav}
          />

          <div className="absolute left-0 top-0 h-full w-[88%] max-w-sm border-r border-white/10 bg-slate-950 p-5 shadow-2xl shadow-slate-950/50">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">AI Pitch Master</p>
                <p className="mt-2 text-lg font-semibold text-white">Navigation</p>
              </div>
              <Button variant="ghost" onClick={closeMobileNav} aria-label="Close menu">
                Close
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


