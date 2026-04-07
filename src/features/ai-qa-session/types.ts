export type InterviewSpeaker = 'ai' | 'user' | 'none'
export type InterviewSessionPhase =
  | 'waiting'
  | 'ai-speaking'
  | 'user-answering'
  | 'evaluating'
  | 'feedback-ready'

export interface TranscriptItem {
  id: string
  speaker: Exclude<InterviewSpeaker, 'none'>
  message: string
  createdAtIso: string
  secondMark: number
}

