export const queryKeys = {
  analysis: {
    bySession: (sessionId: string) => ['analysis', sessionId] as const,
  },
  report: {
    finalBySession: (sessionId: string) => ['report', 'final', sessionId] as const,
  },
  qa: {
    nextQuestionBySession: (sessionId: string) => ['qa', 'next-question', sessionId] as const,
  },
}

