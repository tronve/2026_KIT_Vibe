/**
 * DEMO_MODE utility
 * Detects whether the app should run in demo mode (using mock data instead of real API calls)
 */

export function isDemoMode(): boolean {
  // Check environment variable: VITE_DEMO_MODE=true
  const demoModeEnv = import.meta.env.VITE_DEMO_MODE
  if (demoModeEnv !== undefined && demoModeEnv !== '') {
    return demoModeEnv === 'true' || demoModeEnv === '1'
  }

  // Check URL query parameter: ?demo=true
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const demoParam = params.get('demo')
    if (demoParam !== null) {
      return demoParam === 'true' || demoParam === '1' || demoParam === ''
    }
  }

  return false
}

/**
 * Log DEMO_MODE status
 */
export function logDemoModeStatus() {
  if (isDemoMode()) {
    console.warn(
      '[DEMO_MODE] App is running in demo mode with mock data. Set VITE_DEMO_MODE=false or remove ?demo query parameter to use real APIs.',
    )
  }
}

