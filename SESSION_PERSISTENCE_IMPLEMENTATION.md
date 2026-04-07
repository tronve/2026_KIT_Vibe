# Session Persistence Implementation

## Overview
세션 지속성을 구현하여 사용자가 앱을 종료했다가 나중에 다시 방문할 때 이전 세션을 자동으로 복구할 수 있습니다.

## Changes Made

### 1. **useAppStore.ts** - 핵심 세션 저장소
- `restoreSessionFromStorage()` 함수 추가: localStorage에서 `session_id`와 `currentStep` 복구
- `saveSessionToStorage()` 함수 추가: 현재 상태를 localStorage에 저장
- `setCurrentStep()`과 `setSessionId()` 메서드에 자동 저장 로직 추가
- localStorage 키: `kit_vibe_session`
- 저장되는 데이터: `{ currentStep, sessionId }`

### 2. **App.tsx** - 앱 초기화 및 자동 네비게이션
- `AppContent` 컴포넌트로 분리 (useNavigate hook 사용 가능하게)
- 앱 로드 시 `restoreSessionFromStorage()` 호출
- 복구된 세션이 있으면 자동으로 올바른 페이지로 네비게이트
  - `upload` → `/upload-training`
  - `analysis` → `/reports?sessionId={id}`
  - `interview` → `/ai-qa-session?sessionId={id}`
  - `report` → `/reports?sessionId={id}`

### 3. **useAiQaSessionStore.ts** - QA 세션 데이터 저장
- `restoreSessionFromStorage()` 함수 추가: QA 이력 복구
- `saveSessionToStorage()` 함수 추가: QA 이력 저장
- 주요 상태 변경 시 자동 저장:
  - `setPhase()`: 단계 변경 시
  - `moveToEvaluating()`: 평가 단계 진입 시
  - `moveToFeedbackReady()`: 피드백 준비 완료 시
- localStorage 키: `kit_vibe_qa_session`
- 저장되는 데이터: `{ qnaHistory }`
- **주의**: Blob 객체는 직렬화 불가능하므로 QNA 이력만 저장

### 4. **AiQaSessionPage.tsx**
- `useAiQaSessionStore`의 `restoreSessionFromStorage()` 호출 추가
- 페이지 진입 시 저장된 QA 이력 자동 복구

### 5. **ReportsPage.tsx** - 분석 데이터 저장
- 보고서 데이터가 로드될 때 자동 저장
- localStorage 키: `kit_vibe_analysis_data`
- 저장되는 데이터: `{ sessionId, report, timestamp }`
- 나중에 필요시 분석 데이터 복구 가능

### 6. **DashboardPage.tsx** - 저장된 세션 표시 및 복구
- 저장된 세션 감지 및 표시
- "Resume" 버튼으로 사용자가 저장된 세션 복구 가능
- 저장된 세션 UI: 시안색 배경의 카드로 강조

## localStorage 구조

```
Key: kit_vibe_session
Value: {
  "currentStep": "upload" | "analysis" | "interview" | "report" | null,
  "sessionId": "string | null"
}

Key: kit_vibe_qa_session
Value: {
  "qnaHistory": [
    { id, question, answer, feedback, ... }
  ]
}

Key: kit_vibe_analysis_data
Value: {
  "sessionId": "string",
  "report": { overall_score, strengths, weaknesses, action_items, ... },
  "timestamp": "ISO 8601 datetime"
}
```

## 동작 흐름

### 첫 방문 (새로운 세션)
1. 앱 로드
2. `restoreSessionFromStorage()` 실행 → 저장된 데이터 없음
3. 대시보드 페이지 표시
4. 사용자가 "Upload training" 클릭
5. 파일 업로드 시 `setSessionId()` 호출 → 자동 저장

### 재방문 (기존 세션 복구)
1. 앱 로드
2. `restoreSessionFromStorage()` 실행 → 저장된 `currentStep`과 `sessionId` 복구
3. 복구된 단계에 따라 자동 네비게이트
4. 해당 페이지에서 `restoreSessionFromStorage()` 호출 → 분석/QA 데이터 복구
5. 사용자는 중단했던 지점부터 계속 진행 가능

### 수동 복구 (대시보드)
1. 대시보드에 "Saved Session" 카드 표시
2. "Resume" 버튼 클릭
3. 저장된 세션의 `currentStep`에 맞는 페이지로 네비게이트

## API 계약 유지
- 모든 API 호출은 기존 그대로 유지
- localStorage는 클라이언트 사이드에서만 사용
- 서버와의 통신에는 영향 없음

## 에러 처리
- 모든 localStorage 작업은 try-catch로 보호
- localStorage 오류 시 콘솔에 에러 메시지 출력
- 오류 발생 시 앱은 정상 작동 계속

## 테스트 방법

### 1. 세션 생성
- 대시보드에서 "Upload training" 클릭
- 비디오 파일 업로드
- "Start analysis" 클릭
- 개발자 도구 → Storage → LocalStorage → `kit_vibe_session` 확인

### 2. 페이지 새로고침
- `Ctrl + R` 또는 `F5` 눌러 새로고침
- 자동으로 이전 페이지로 복구되는지 확인

### 3. localStorage 수동 확인
- 개발자 도구 열기 (F12)
- Application/Storage 탭
- LocalStorage 항목 확인:
  - `kit_vibe_session`
  - `kit_vibe_qa_session`
  - `kit_vibe_analysis_data`

### 4. 대시보드 복구
- 대시보드로 돌아가기
- "Saved Session" 카드 표시 확인
- "Resume" 버튼 클릭하여 복구 확인

## 성능 고려사항
- localStorage는 동기 작업이므로 대규모 데이터 저장 시 성능 영향 가능
- 현재 구현에서는 QNA 이력과 보고서 데이터만 저장하여 합리적인 크기 유지
- 필요시 IndexedDB로 마이그레이션 가능

## 브라우저 호환성
- localStorage는 모든 현대 브라우저에서 지원
- IE11도 지원하지만, 이 프로젝트는 최신 브라우저 기준

## 향후 개선 사항
1. 여러 세션 히스토리 저장 (현재는 가장 최근 1개만)
2. 세션 만료 시간 설정 (예: 7일 후 자동 삭제)
3. 동기화 기능 (다른 탭에서의 변경 감지)
4. 세션 내보내기/가져오기

