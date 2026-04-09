# AI Pitch Master Frontend

AI Pitch Master는 발표 연습을 돕는 프론트엔드 애플리케이션입니다. 사용자는 발표 영상을 업로드하고, AI 분석 결과를 확인한 뒤, AI Q&A 세션에서 실제 질문에 답하는 흐름으로 훈련할 수 있습니다.

---

## 1. 프로젝트 전반 설명

### 목표
- 발표 훈련을 단순 시청이 아니라 **피드백 + 반복 연습**으로 연결한다.
- 사용자가 짧은 시간 안에 업로드 → 분석 → Q&A → 리포트 흐름을 끝까지 경험하도록 만든다.
- 기능을 늘리기보다, 핵심 행동을 명확하게 보여주는 간결한 UX를 유지한다.

### 기술 스택
- React
- Vite
- TypeScript
- TailwindCSS
- Zustand
- React Query
- React Router
- Axios

### 핵심 사용자 흐름
1. `UploadTrainingPage`에서 발표 영상을 선택한다.
2. 서버 분석 결과를 받아 `AnalysisPage` 또는 `AiQaSessionPage`로 이동한다.
3. `AiQaSessionPage`에서 AI 질문을 확인하고 답변을 제출한다.
4. `ReportsPage`에서 분석 리포트를 확인한다.

### 주요 화면
- `src/pages/DashboardPage.tsx`
- `src/pages/UploadTrainingPage.tsx`
- `src/pages/AnalysisPage.tsx`
- `src/pages/AiQaSessionPage.tsx`
- `src/pages/ReportsPage.tsx`

---

## 2. AI와 함께 정리한 기획문서

이 섹션은 실제 개발 방향을 정리한 내부 기획 초안입니다.

### 2.1 제품 정의
이 제품은 발표 영상을 업로드하면 AI가 발표 품질을 분석하고, 이후 Q&A 세션을 통해 사용자가 실전 질문에 답하도록 돕는 발표 코칭 도구입니다.

### 2.2 핵심 문제
- 발표 연습 결과가 즉시 행동으로 이어지지 않는다.
- 사용자가 어떤 부분을 개선해야 하는지 한눈에 파악하기 어렵다.
- 단순 분석만으로는 실전 대응 훈련이 부족하다.

### 2.3 해결 전략
- 업로드 직후 분석 결과를 보여준다.
- 분석 결과를 Q&A 훈련으로 자연스럽게 연결한다.
- Q&A 세션은 복잡한 UI보다 “질문 확인 → 답변 제출”에 집중한다.

### 2.4 사용자 플로우
| 단계 | 화면 | 사용자가 하는 일 | 시스템 역할 |
|---|---|---|---|
| 1 | `UploadTrainingPage` | 발표 영상 업로드 | 파일 검증, 세션 생성, 분석 요청 |
| 2 | `AnalysisPage` | 분석 결과 확인 | 분석 지표/요약 제공 |
| 3 | `AiQaSessionPage` | AI 질문에 답변 | 질문 생성, 타이머, 답변 제출 |
| 4 | `ReportsPage` | 결과 확인 | 리포트 조회 및 요약 |

### 2.5 기능 범위
#### 포함
- 영상 업로드
- 분석 진행 상태 표시
- 분석 결과 요약
- AI Q&A 세션
- 세션 복원
- 리포트 확인

#### 제외 또는 후순위
- 데모 모드/mock 분기
- 과도한 다중 패널 UI
- 복잡한 협업/공유 기능

### 2.6 화면/라우트 설계
- `/dashboard` → 시작 화면
- `/upload-training` → 업로드 화면
- `/analysis?sessionId=...` → 분석 화면
- `/ai-qa-session?sessionId=...` → Q&A 세션
- `/reports?sessionId=...` → 리포트 화면

### 2.7 완료 기준
- 업로드 후 분석 흐름이 정상 동작한다.
- 세션 ID 기반으로 분석/QA/리포트 화면이 이어진다.
- QA 화면에서 질문/답변 흐름이 끊기지 않는다.
- 빌드가 성공하고 삭제된 파일 참조가 남지 않는다.

---

## 3. 개발 지침서

### 3.1 폴더 구조 원칙
- `src/pages`: 라우트 단위 화면만 둔다.
- `src/components`: 재사용 UI와 레이아웃만 둔다.
- `src/api`: HTTP 클라이언트와 도메인 API를 둔다.
- `src/features`: 도메인 상태/로직을 둔다.
- `src/store`: 앱 전역 상태를 둔다.
- `src/hooks`: 여러 화면에서 공유하는 공통 훅만 둔다.
- `src/types`: 공통 타입만 둔다.

### 3.2 상태 관리 원칙
- 서버 상태는 React Query를 사용한다.
- 화면/세션 상태는 Zustand로 관리한다.
- 페이지에서는 selector 기반 구독을 우선 사용한다.
- 불필요한 전역 상태는 만들지 않는다.

### 3.3 API 연동 원칙
- 공통 요청 처리는 `src/api/client.ts`에서 담당한다.
- 기능별 API는 `src/api/*.ts`에 둔다.
- QA 관련 mutation도 API 파일 기준으로 함께 관리한다.
- API 응답 실패 시 사용자에게 바로 이해되는 메시지를 보여준다.

### 3.4 에러 처리 원칙
- 에러 메시지는 기술 정보보다 사용자 행동 중심으로 작성한다.
- 최소한 다음 행동을 제공한다.
  - 다시 시도
  - 세션 복구
  - 이전 화면으로 이동
- 네트워크 오류와 입력 오류는 구분해서 다룬다.

### 3.5 UI/UX 원칙
- 한 화면에 핵심 행동은 1~2개로 제한한다.
- 버튼 문구는 짧고 명확하게 유지한다.
- 상태 라벨은 내부 상태명보다 사용자 관점 표현을 우선한다.
- 중복 패널보다 단일 흐름 중심의 레이아웃을 사용한다.

### 3.6 코드 작성 규칙
- 새 기능은 페이지에만 몰아넣지 말고 적절한 계층으로 분리한다.
- 사용하지 않는 파일/타입/import는 즉시 제거한다.
- 이름은 화면명/도메인명과 맞춘다.
- 공통 로직이 늘어나면 `index.ts` 또는 feature 단위 모듈로 묶는다.

### 3.7 QA 세션 개발 기준
- `AiQaSessionPage`는 “질문 생성 → 답변 제출 → 다음 질문”의 흐름만 유지한다.
- 상태 정보는 과도하게 노출하지 않는다.
- 복잡한 보조 UI보다 진행에 필요한 정보만 보여준다.

---

## 4. 실행 방법

```bash
npm install
npm run dev
```

### 빌드

```bash
npm run build
```

---

## 5. 작업 전/후 체크리스트

### 작업 전
- 수정 대상 파일의 참조 관계를 먼저 확인한다.
- 페이지/스토어/API 경계를 넘는 변경인지 판단한다.

### 작업 후
- 빌드가 통과하는지 확인한다.
- 삭제한 파일의 import가 남아 있지 않은지 확인한다.
- 라우트 이동과 세션 복원이 깨지지 않았는지 확인한다.

---

## 6. 빠른 참조

- 라우터 진입점: `src/App.tsx`
- 전역 상태: `src/store/useAppStore.ts`
- QA 세션 상태: `src/features/ai-qa-session/store/useAiQaSessionStore.ts`
- API 클라이언트: `src/api/client.ts`
- QA API: `src/api/qa.ts`
- 업로드 화면: `src/pages/UploadTrainingPage.tsx`
- QA 화면: `src/pages/AiQaSessionPage.tsx`
- 리포트 화면: `src/pages/ReportsPage.tsx`

