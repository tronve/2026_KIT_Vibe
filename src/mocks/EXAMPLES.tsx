import { useEffect } from 'react'
/**
 * Example: How to verify DEMO_MODE is working in your React components
 *
 * This file shows how to detect and optionally display DEMO_MODE status in your app
 */

// In any React component:
import { isDemoMode } from './index'

export function ExampleComponent() {
  // Check if running in DEMO_MODE
  if (isDemoMode()) {
    return (
      <div className="rounded-lg border-2 border-yellow-400 bg-yellow-50 p-4">
        <h3 className="font-semibold text-yellow-800">
          ⚠️ Running in DEMO_MODE
        </h3>
        <p className="text-sm text-yellow-700">
          This app is using mock data. No real APIs are being called.
        </p>
      </div>
    )
  }

  // Normal rendering when DEMO_MODE is disabled
  return <div>Normal content</div>
}

// Example: Add a demo banner to the app header
export function AppHeader() {
  return (
    <header className="border-b bg-white">
      {isDemoMode() && (
        <div className="border-b border-yellow-300 bg-yellow-100 px-4 py-2 text-sm text-yellow-800">
          🧪 Demo Mode Active - Using Mock Data
        </div>
      )}
      {/* Rest of header */}
    </header>
  )
}

// Example: Test API calls are working with mocks
export function VerifyMockSetup() {
  useEffect(() => {
    if (isDemoMode()) {
      console.log('✅ DEMO_MODE is enabled')
      console.log('Mock data will be used instead of real APIs')
      console.log('Check api-spec.md for expected mock responses')
    } else {
      console.log('❌ DEMO_MODE is disabled - using real APIs')
    }
  }, [])

  return null
}

// Example: Environment-specific configuration
export function getApiConfig() {
  return {
    useDemo: isDemoMode(),
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
    demoModeEnabled: isDemoMode(),
  }
}

