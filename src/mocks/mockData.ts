/**
 * Mock data for DEMO_MODE
 * Matches the API specifications in api-spec.md
 */

import type {
  PresentationAnalyzeResponse,
  RoleplayStartResponse,
  RoleplayTurnResponse,
  ReportGenerateResponse,
  SessionCleanupResponse,
} from '../types'

// Simple base64 encoded silent audio (WAV format, ~1 second of silence)
// This is a minimal WAV file header + silence data
const MOCK_AUDIO_BASE64 =
  'UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=='

/**
 * Mock response for POST /api/v1/presentation/analyze
 * Simulates successful presentation video upload and analysis
 */
export function generateMockPresentationAnalyzeResponse(
  sessionId: string = 'session_demo_' + Date.now(),
): PresentationAnalyzeResponse {
  return {
    session_id: sessionId,
    script:
      '안녕하세요. 오늘 제가 발표할 주제는 차세대 AI 솔루션입니다. ' +
      '우리의 기술은 기존 시장의 한계를 극복하고, 새로운 가치를 제시합니다. ' +
      '이를 통해 글로벌 시장에서 경쟁력을 확보할 수 있습니다.',
    analysis_result: {
      wpm: 125,
      filler_words_count: 4,
      gaze_score: 85,
      logic_summary: '서론과 본론의 전개는 좋으나 결론이 다소 약함',
    },
  }
}

/**
 * Mock response for POST /api/v1/roleplay/start
 * Simulates starting an interactive Q&A session with AI
 */
export function generateMockRoleplayStartResponse(): RoleplayStartResponse {
  return {
    ai_question_text:
      '발표 잘 들었습니다. 그런데 경쟁사 대비 기술적 진입 장벽이 너무 낮아 보이는데 어떻게 방어하실 계획인가요?',
    ai_question_audio: MOCK_AUDIO_BASE64,
  }
}

/**
 * Mock responses for POST /api/v1/roleplay/turn
 * Cycles through different follow-up questions to simulate conversation
 */
const MOCK_TURN_RESPONSES: RoleplayTurnResponse[] = [
  {
    user_answer_stt:
      '그 부분은 저희만의 독자적인 데이터 파이프라인으로 해결합니다.',
    answer_feedback:
      '당황하여 이전보다 말이 1.5배 빨라졌습니다. 호흡을 가다듬으세요.',
    next_ai_question_text:
      '데이터 파이프라인이라고 하셨는데, 개인정보 보호 문제는 어떻게 해결하나요?',
    next_ai_question_audio: MOCK_AUDIO_BASE64,
  },
  {
    user_answer_stt: '고객 데이터는 모두 비식별화 처리하여 관리합니다.',
    answer_feedback: '명확한 답변입니다. 다만 기술적 세부사항도 언급하면 좋겠습니다.',
    next_ai_question_text:
      '비식별화 처리 이후의 데이터 저장소는 어디에 있으며, 재해 복구 계획은 있나요?',
    next_ai_question_audio: MOCK_AUDIO_BASE64,
  },
  {
    user_answer_stt:
      '멀티 리전 클라우드 아키텍처를 사용하여 고가용성을 보장합니다.',
    answer_feedback:
      '좋은 답변입니다. 더 자신감 있게 답하셨고, 말의 속도도 적절합니다.',
    next_ai_question_text: '그럼 초기 시장 진출 계획은 어떻게 되나요?',
    next_ai_question_audio: MOCK_AUDIO_BASE64,
  },
]

let turnResponseIndex = 0

export function generateMockRoleplayTurnResponse(): RoleplayTurnResponse {
  const response = MOCK_TURN_RESPONSES[turnResponseIndex % MOCK_TURN_RESPONSES.length]
  turnResponseIndex++
  return response
}

export function resetMockTurnResponseIndex() {
  turnResponseIndex = 0
}

/**
 * Mock response for POST /api/v1/report/generate
 * Simulates comprehensive feedback report after all Q&A rounds
 */
export function generateMockReportGenerateResponse(): ReportGenerateResponse {
  return {
    overall_score: 88,
    strengths: [
      '질문 의도를 정확히 파악함',
      '비식별화라는 구체적인 해결책 제시',
      '기술 스택에 대한 깊이 있는 이해',
    ],
    weaknesses: [
      '압박 질문 시 추임새(어, 음)가 3배 이상 증가함',
      '시선이 자주 아래로 향함',
      '개인정보 보호 관련 규정을 더 구체적으로 언급하지 않음',
    ],
    action_items: [
      '답변 전 1초간 심호흡하기',
      '카메라 렌즈를 보고 말하는 연습하기',
      'GDPR, CCPA 등 국제 개인정보 보호 규정 숙지하기',
      '기술용어 설명 시 비기술자도 이해할 수 있도록 단순화하기',
    ],
  }
}

/**
 * Mock response for DELETE /api/v1/session/cleanup
 * Simulates cleanup of temporary session data
 */
export function generateMockSessionCleanupResponse(): SessionCleanupResponse {
  return {
    status: 'success',
    message: 'Files deleted',
  }
}

