# AI Pitch Master Frontend

발표 업로드부터 분석, AI Q&A, 최종 리포트까지 사용자 경험을 담당하는 프론트엔드입니다.

---

## 프로젝트 목적

- 업로드 → 분석 → Q&A → 리포트 흐름을 한 번에 제공해 발표 훈련의 단절을 줄입니다.
- 사용자가 현재 단계와 다음 행동을 즉시 이해할 수 있도록 단순한 상태 기반 UI를 유지합니다.
- 백엔드 API 계약(`api-spec.md`)과 프론트 상태 모델(`Zustand`)을 일치시켜 운영 안정성을 확보합니다.

---

## 핵심 사용자 흐름

1. `UploadTrainingPage`에서 영상 업로드
2. `AnalysisPage`에서 분석 결과 확인
3. `AiQaSessionPage`에서 Q&A 실전 훈련
4. `ReportsPage`에서 최종 리포트 + QA 요약 확인

---

## 최신 구현 반영

### Q&A 세션 (`src/pages/AiQaSessionPage.tsx`)

- 최대 라운드: **3회**
- 질문당 타이머: **30초**
- 타이머 bar: `requestAnimationFrame` 기반 **연속 감소 애니메이션**
- 남은 시간 5초 미만: **강조색(빨강 계열)** 자동 전환
- 시간 만료 시: 자동 제출 후 다음 질문으로 전환
- 카메라: 세션 종료 또는 페이지 이탈 시 스트림 강제 `stop()`

#### 구현 메모

- 타이머 숫자/바는 동일한 잔여 시간 소스를 사용해 표시 불일치를 줄입니다.
- 타이머 만료 시 수동 클릭 없이 자동 제출 경로로 진입합니다.
- 페이지 이동, 세션 종료, 비활성화 전환 시 카메라 트랙을 명시적으로 종료합니다.

### 세션 정리 정책 (`src/App.tsx`, `src/store/useAppStore.ts`)

- 대시보드 진입 시 세션 강제 정리
- 앱 첫 진입 시 세션 페이지가 아니면 세션 정리
- 세션 페이지 새로고침은 예외 처리
- 세션 정리 성공 로그는 콘솔에 출력하지 않음

#### 운영 의도

- 중간 상태가 누적되어 다음 사용자 흐름에 영향을 주지 않도록 기본 진입점을 클린 상태로 유지합니다.
- 분석/QA/리포트 페이지 새로고침은 사용자의 진행 흐름 보호를 위해 예외로 둡니다.

### 리포트 연동 (`src/api/report.ts`, `src/pages/ReportsPage.tsx`)

- `qna_history`를 실제 리포트 요청 payload에 포함
- 리포트 화면에 QA 질문/답변 요약 카드 표시

#### 데이터 경계

- 프론트는 세션 기반 Q&A 히스토리를 직렬화해 백엔드 리포트 생성 요청에 포함합니다.
- 백엔드는 전달된 히스토리를 점수/강점/약점/액션 항목 산출에 반영합니다.

---

## 기술 스택

- React, Vite, TypeScript
- Zustand, React Query
- React Router, TailwindCSS
- Axios

---

## 디렉터리 가이드

- `src/pages`: 라우트 화면
- `src/components`: 재사용 UI/레이아웃
- `src/api`: API 클라이언트/도메인 요청
- `src/features`: 도메인 상태/로직
- `src/store`: 전역 상태
- `src/hooks`: 공통 훅
- `src/types`: 타입 정의

### 주요 파일 맵

- `src/App.tsx`: 라우팅 진입점 + 세션 정리 정책
- `src/pages/UploadTrainingPage.tsx`: 업로드/분석 시작
- `src/pages/AnalysisPage.tsx`: 분석 결과/요약 노출
- `src/pages/AiQaSessionPage.tsx`: Q&A 흐름/타이머/카메라
- `src/pages/ReportsPage.tsx`: 최종 리포트 + QA 요약 카드
- `src/store/useAppStore.ts`: 전역 세션 상태 + 정리 API 트리거
- `src/features/ai-qa-session/store/useAiQaSessionStore.ts`: Q&A 단계/라운드/타이머 상태

---

## 실행 방법

```bash
npm install
npm run dev
```

### 빌드

```bash
npm run build
```

---

## 개발 체크리스트

- Q&A 타이머 숫자와 bar가 함께 감소하는지
- 5초 미만 강조색 전환이 동작하는지
- Q&A 종료/라우트 이탈 시 카메라 LED가 꺼지는지
- 리포트에 QA 요약 카드가 표시되는지
- 빌드 오류 없이 통과하는지

---

## 트러블슈팅

### 1. QA 타이머가 줄지 않음

- `AiQaSessionPage`에서 현재 `phase`가 `user-answering`인지 확인
- 콘솔에서 `[QA][timer] interval start/tick` 로그 확인
- `useAiQaSessionStore.ts`의 `tickQuestionTimer()` 호출 여부 확인
- 타이머 숫자와 progress bar가 같은 상태값을 읽는지 확인

### 2. 카메라 영역은 꺼졌는데 기기 카메라 LED가 켜져 있음

- `VideoWindow` cleanup에서 `track.stop()` 호출 여부 확인
- 브라우저 다른 탭/앱에서 카메라 점유 중인지 확인
- 페이지 이탈(라우트 변경) 시점 로그 확인
- `getUserMedia` 응답이 늦게 도착하는 race 조건에서 즉시 stop 처리되는지 확인

### 3. 리포트에서 QA 요약이 비어 있음

- `src/api/report.ts`에서 `qna_history`를 로컬 스토리지에서 읽어오는지 확인
- `ReportsPage`의 QA 요약 카드 렌더링 조건 확인
- Q&A를 1회 이상 진행했는지 확인
- `session_id`가 업로드/분석/QA/리포트에서 동일하게 이어지는지 확인

### 4. 세션이 예상보다 자주 초기화됨

- `App.tsx`의 라우팅 기반 세션 정리 정책 확인
- 대시보드 진입 시 세션 정리 동작이 의도인지 확인
- 세션 페이지 새로고침 예외 경로인지 확인
- 수동으로 `초기화` 버튼을 눌렀는지 확인

### 5. 분석 요약이 영어로 보임

- `AnalysisPage`의 로컬라이즈 보정 함수 적용 여부 확인
- 백엔드 분석 프롬프트의 한국어 작성 규칙 반영 여부 확인
- 저장된 과거 분석 캐시(localStorage)가 오래된 응답인지 확인

---

## 빠른 참조

- 라우터 진입점: `src/App.tsx`
- 전역 세션 스토어: `src/store/useAppStore.ts`
- QA 스토어: `src/features/ai-qa-session/store/useAiQaSessionStore.ts`
- QA API: `src/api/qa.ts`
- 리포트 API: `src/api/report.ts`

