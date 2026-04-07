// API schema source: api-spec.md

// 1) POST /api/v1/presentation/analyze
export interface PresentationAnalyzeRequest {
  video_file: File
}

export interface PresentationAnalysisResult {
  wpm: number
  filler_words_count: number
  gaze_score: number
  logic_summary: string
}

export interface PresentationAnalyzeResponse {
  session_id: string
  script: string
  analysis_result: PresentationAnalysisResult
}

// 2) POST /api/v1/roleplay/start
export interface RoleplayStartRequest {
  session_id: string
  script: string
}

export interface RoleplayStartResponse {
  ai_question_text: string
  ai_question_audio: string
}

// 3) POST /api/v1/roleplay/turn
export interface RoleplayTurnRequest {
  session_id: string
  user_audio: File
  history_context: string
}

export interface RoleplayTurnResponse {
  user_answer_stt: string
  answer_feedback: string
  next_ai_question_text: string
  next_ai_question_audio: string
}

// 4) POST /api/v1/report/generate
export interface QnaHistoryItem {
  q: string
  a: string
}

export interface ReportGenerateRequest {
  session_id: string
  presentation_analysis: PresentationAnalysisResult
  qna_history: QnaHistoryItem[]
}

export interface ReportGenerateResponse {
  overall_score: number
  strengths: string[]
  weaknesses: string[]
  action_items: string[]
}

// 5) DELETE /api/v1/session/cleanup
export interface SessionCleanupRequest {
  session_id: string
}

export interface SessionCleanupResponse {
  status: string
  message: string
}

