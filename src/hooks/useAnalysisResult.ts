import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAnalysisResult } from '../api/analysis'
import { isApiError, type ApiError } from '../api/client'
import { queryKeys } from '../api/queryKeys'
import type { PresentationAnalyzeResponse } from '../types'

export interface UseAnalysisResultOptions {
  sessionId: string | null
  pollingIntervalMs?: number
  enabled?: boolean
}

export interface UseAnalysisResultResult {
  data: PresentationAnalyzeResponse | undefined
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  isCompleted: boolean
  error: ApiError | Error | null
  errorMessage: string | null
  refetch: () => Promise<PresentationAnalyzeResponse | undefined>
}

export function useAnalysisResult({
  sessionId,
  pollingIntervalMs = 2000,
  enabled = true,
}: UseAnalysisResultOptions): UseAnalysisResultResult {
  const query = useQuery<PresentationAnalyzeResponse, ApiError | Error>({
    queryKey: queryKeys.analysis.bySession(sessionId ?? 'pending-session'),
    queryFn: async () => {
      if (!sessionId) {
        throw new Error('sessionId is required to fetch analysis result.')
      }

      return getAnalysisResult(sessionId)
    },
    enabled: enabled && Boolean(sessionId),
    retry: false,
    refetchInterval: (queryContext) => {
      const result = queryContext.state.data

      if (
        result &&
        result.session_id === sessionId &&
        result.analysis_result
      ) {
        return false
      }

      return pollingIntervalMs
    },
    refetchIntervalInBackground: true,
  })

  const isCompleted = Boolean(
    query.data && query.data.session_id === sessionId && query.data.analysis_result,
  )

  const errorMessage = useMemo(() => {
    if (!query.error) {
      return null
    }

    if (isApiError(query.error)) {
      return query.error.message
    }

    return query.error.message || 'Failed to fetch analysis result.'
  }, [query.error])

  return {
    data: query.data,
    isLoading: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    isCompleted,
    error: query.error ?? null,
    errorMessage,
    refetch: async () => {
      const response = await query.refetch()
      return response.data
    },
  }
}

