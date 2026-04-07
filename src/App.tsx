import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { queryClient } from './lib/queryClient'
import { useAppStore } from './store'
import { AiQaSessionPage } from './pages/AiQaSessionPage'
import { DashboardPage } from './pages/DashboardPage'
import { ReportsPage } from './pages/ReportsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { UploadTrainingPage } from './pages/UploadTrainingPage'

function AppContent() {
  const navigate = useNavigate()
  const { restoreSessionFromStorage, currentStep, sessionId } = useAppStore()

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
      analysis: `/reports?sessionId=${encodeURIComponent(sessionId)}`,
      interview: `/ai-qa-session?sessionId=${encodeURIComponent(sessionId)}`,
      report: `/reports?sessionId=${encodeURIComponent(sessionId)}`,
    }

    const path = stepToPath[currentStep]
    if (path && window.location.pathname === '/') {
      navigate(path, { replace: true })
    }
  }, [currentStep, sessionId, navigate])

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/upload-training" element={<UploadTrainingPage />} />
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
