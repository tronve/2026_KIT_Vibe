import { useQuery } from '@tanstack/react-query'
import { getFinalReport } from '../report'
import { queryKeys } from '../queryKeys'

export function useFinalReportQuery(sessionId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.report.finalBySession(sessionId),
    queryFn: () => getFinalReport(sessionId),
    enabled: enabled && Boolean(sessionId),
  })
}

