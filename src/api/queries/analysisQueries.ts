import { useQuery } from '@tanstack/react-query'
import { getAnalysisResult } from '../analysis'
import { queryKeys } from '../queryKeys'

export function useAnalysisResultQuery(sessionId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.analysis.bySession(sessionId),
    queryFn: () => getAnalysisResult(sessionId),
    enabled: enabled && Boolean(sessionId),
  })
}

