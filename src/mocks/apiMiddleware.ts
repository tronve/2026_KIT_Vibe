/**
 * API middleware for DEMO_MODE support
 * Intercepts API requests and returns mock data when DEMO_MODE is enabled
 */

import { isDemoMode } from './demoMode'
import {
  generateMockPresentationAnalyzeResponse,
  generateMockRoleplayStartResponse,
  generateMockRoleplayTurnResponse,
  generateMockReportGenerateResponse,
  generateMockSessionCleanupResponse,
  resetMockTurnResponseIndex,
} from './mockData'
import type { AxiosRequestConfig } from 'axios'

type ApiResponse<T> = { data: T }

/**
 * Mock implementation for API requests
 * Matches request URLs to mock response generators
 */
export async function mockApiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  if (!isDemoMode()) {
    throw new Error('Mock API should only be used in DEMO_MODE')
  }

  // Extract URL and method
  const url = config.url || ''
  const method = config.method?.toUpperCase() || 'GET'

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 800 + 200))

  // Route to appropriate mock based on URL pattern and method
  // Patterns: /presentation/analyze, /roleplay/start, /roleplay/turn, /report/generate, /session/cleanup

  if (method === 'POST' && url.includes('/presentation/analyze')) {
    const response: ApiResponse<ReturnType<typeof generateMockPresentationAnalyzeResponse>> = {
      data: generateMockPresentationAnalyzeResponse(),
    }
    return response.data as T
  }

  if (method === 'POST' && url.includes('/roleplay/start')) {
    resetMockTurnResponseIndex()
    const response: ApiResponse<ReturnType<typeof generateMockRoleplayStartResponse>> = {
      data: generateMockRoleplayStartResponse(),
    }
    return response.data as T
  }

  if (method === 'POST' && url.includes('/roleplay/turn')) {
    const response: ApiResponse<ReturnType<typeof generateMockRoleplayTurnResponse>> = {
      data: generateMockRoleplayTurnResponse(),
    }
    return response.data as T
  }

  if (method === 'POST' && url.includes('/report/generate')) {
    const response: ApiResponse<ReturnType<typeof generateMockReportGenerateResponse>> = {
      data: generateMockReportGenerateResponse(),
    }
    return response.data as T
  }

  if (method === 'DELETE' && url.includes('/session/cleanup')) {
    const response: ApiResponse<ReturnType<typeof generateMockSessionCleanupResponse>> = {
      data: generateMockSessionCleanupResponse(),
    }
    return response.data as T
  }

  // For unrecognized API routes, throw an error
  throw new Error(`No mock implementation for ${method} ${url}`)
}

