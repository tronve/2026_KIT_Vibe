import { useEffect, useRef } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { queryClient } from './lib/queryClient'
import { useAppStore } from './store/useAppStore'
import { AiQaSessionPage } from './pages/AiQaSessionPage'
import { AnalysisPage } from './pages/AnalysisPage'
import { DashboardPage } from './pages/DashboardPage'
import { ReportsPage } from './pages/ReportsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { UploadTrainingPage } from './pages/UploadTrainingPage'

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const { restoreSessionFromStorage, clearSessionFromStorage, currentStep, sessionId } = useAppStore()
  const hasHandledInitialRouteRef = useRef(false)

  // Restore session on app load and navigate to correct page
  useEffect(() => {
    restoreSessionFromStorage()
  }, [restoreSessionFromStorage])

  // Navigate to correct page based on restored session step
  useEffect(() => {
    if (!currentStep || !sessionId) {
      return
    }

    const stepToPath: Record<string, string> = {
      upload: '/upload-training',
      analysis: `/analysis?sessionId=${encodeURIComponent(sessionId)}`,
      interview: `/ai-qa-session?sessionId=${encodeURIComponent(sessionId)}`,
      report: `/reports?sessionId=${encodeURIComponent(sessionId)}`,
    }

    const path = stepToPath[currentStep]
    if (path && window.location.pathname === '/') {
      navigate(path, { replace: true })
    }
  }, [currentStep, sessionId, navigate])

  // 첫 진입(세션 페이지 새로고침 제외) 및 대시보드 재진입 시 세션 강제 정리
  useEffect(() => {
    const path = location.pathname
    const isSessionPage = path === '/analysis' || path === '/ai-qa-session' || path === '/reports'

    if (!hasHandledInitialRouteRef.current) {
      hasHandledInitialRouteRef.current = true
      if (!isSessionPage) {
        void clearSessionFromStorage()
      }
      return
    }

    if (path === '/dashboard') {
      void clearSessionFromStorage()
    }
  }, [clearSessionFromStorage, location.pathname])

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/upload-training" element={<UploadTrainingPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/ai-qa-session" element={<AiQaSessionPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/home" element={<Navigate to="/dashboard" replace />} />
        <Route path="/practice" element={<Navigate to="/ai-qa-session" replace />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
      {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  )
}

export default App
