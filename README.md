# AI Pitch Master / AI Pitch-Perfect

발표 영상을 분석하고, AI Q&A 실전 훈련을 거쳐, 최종 코칭 리포트까지 제공하는 통합 프로젝트입니다.

- 프론트엔드 브랜치: https://github.com/tronve/2026_KIT_Vibe/tree/frontend
- 백엔드 브랜치: https://github.com/tronve/2026_KIT_Vibe/tree/backend
- 테스트 비디오 파일: test_vid.zip
---

# 목차 (Table of Contents)

- [1. 프로젝트 개요](#1-프로젝트-개요)
- [2. 최신 구현 사항](#2-최신-구현-사항)
- [3. 아키텍처](#3-아키텍처)
- [4. 기술 스택](#4-기술-스택)
- [5. 문서 가이드](#5-문서-가이드)
- [6. 실행 방법](#6-실행-방법)
- [7. 트러블슈팅](#7-트러블슈팅)
- [8. 검증 체크리스트](#8-검증-체크리스트)

---

## 1) 프로젝트 개요

이 프로젝트는 발표 연습을 단순 녹화 확인으로 끝내지 않고, 분석과 실전 훈련, 결과 정리까지 연결하는 제품입니다.

### 핵심 가치

- **분석**: 업로드 영상에서 발표 지표(WPM, 군더더기, 시선, 논리 요약) 생성
- **훈련**: AI 질문 생성 + 사용자 음성 답변 + 다음 질문 반복
- **정리**: 분석 + Q&A 이력을 합친 최종 리포트 제공

### 문제 정의

- 발표 연습 결과가 행동 변화로 이어지기 어렵다.
- 단일 분석만으로는 실전 질의응답 대응력이 늘기 어렵다.
- 연습 데이터가 분산되면 개선 추적이 어려워진다.

### 핵심 사용자 흐름

1. 업로드 (`/upload-training`)
2. 분석 (`/analysis?sessionId=...`)
3. Q&A (`/ai-qa-session?sessionId=...`)
4. 리포트 (`/reports?sessionId=...`)

### 세션 중심 설계

모든 단계는 `sessionId`를 중심으로 연결됩니다.

- 분석/QA/리포트를 같은 세션 문맥으로 유지
- 세션 종료 시 임시 파일과 로컬 상태 정리
- 필요 시 세션 기반 복구 또는 재진입 제어

---

## 2) 최신 구현 반영

### Q&A 세션

- 최대 **3회 라운드** 제한
- 질문당 **30초 타이머**
- 타이머 bar는 `requestAnimationFrame` 기반 **연속 감소 애니메이션**
- 남은 시간 **5초 미만**이면 경고색(빨강 계열) 전환
- 시간 만료 시 답변 자동 제출 후 다음 질문으로 전환
- Q&A 종료 또는 페이지 이탈 시 카메라 스트림 강제 종료

### 리포트

- `qna_history`를 `POST /api/v1/report/generate`에 실제 포함
- 리포트 화면에서 QA 질문/답변 요약 카드 표시

### 세션 정책

- 대시보드 진입 시 세션 강제 정리
- 앱 초기 진입 시 세션 페이지가 아니면 세션 정리
- 세션 페이지 새로고침은 예외(흐름 유지)
- 세션 정리 성공 로그는 콘솔에 출력하지 않음

---

## 3) 아키텍처 요약

### Frontend 책임

- 라우팅/상태 전이/UX 흐름 제어
- 타이머/카메라/진행도 시각화
- 분석/QA/리포트 API 호출 및 결과 렌더링
- 세션 정리 정책(`App.tsx`, `useAppStore.ts`) 실행

### Backend 책임

- 멀티모달 입력 분석
- Q&A 질문 생성 및 답변 해석(STT/피드백)
- 종합 리포트 생성
- 세션 임시 파일 정리(`cleanup`)

### 경계와 계약

- 프론트는 사용자 경험과 상태 오케스트레이션 담당
- 백엔드는 AI 처리와 데이터 생성 책임
- API 계약은 `frontend/api-spec.md` 기준으로 동기화

---

## 4) 기술 스택

### Frontend

- React, Vite, TypeScript
- Zustand, React Query
- React Router, TailwindCSS, Axios

### Backend

- FastAPI, Uvicorn
- Google Gemini 2.5 Flash
- gTTS, Pydantic

---

## 5) 문서 가이드

- 프론트엔드 상세: `frontend/README.md`
- 백엔드 상세: `backend/README.md`
- API 계약: `frontend/api-spec.md`

권장 읽기 순서:

1. 이 문서(전체 흐름)
2. `frontend/README.md` (UX/상태/라우팅)
3. `backend/README.md` (API/운영/정리 정책)

---

## 6) 실행 방법

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Swagger UI:

```text
http://localhost:8000/docs
```

필수 환경 변수:

```env
GEMINI_API_KEY=본인의_구글_제미나이_API_키
```

---

## 7) 트러블슈팅

### 1. QA 타이머가 멈추거나 숫자가 안 줄어드는 경우

- 확인: `AiQaSessionPage`에서 `phase === 'user-answering'`인지
- 확인: `useAiQaSessionStore.ts`의 `tickQuestionTimer()`가 호출되는지
- 확인: 콘솔에서 `[QA][timer]` 로그가 연속 출력되는지

### 2. 카메라 UI는 꺼졌는데 기기 LED가 남는 경우

- 확인: 라우트 이탈 시 `VideoWindow` cleanup 실행 여부
- 확인: 동일 브라우저의 다른 탭/앱 카메라 사용 여부
- 확인: `streamRef.getTracks().forEach(track.stop())` 호출 시점

### 3. 리포트에 QA 내용이 반영되지 않는 경우

- 확인: `frontend/src/api/report.ts`에서 `qna_history`를 비우지 않는지
- 확인: `frontend/src/pages/ReportsPage.tsx`의 QA 요약 카드 렌더링 조건
- 확인: 백엔드 `/api/v1/report/generate` 요청 body

### 4. 세션이 예상보다 자주 초기화되는 경우

- 확인: `App.tsx` 라우팅 정책(대시보드/초기 진입 시 정리)
- 확인: 세션 페이지 새로고침 예외 경로인지
- 확인: `clearSessionFromStorage()` 호출 시점

### 5. 분석 요약이 영어로 보이는 경우

- 확인: 백엔드 분석 프롬프트의 한국어 작성 규칙
- 확인: 프론트 `AnalysisPage`의 로컬라이즈 보정 함수 적용 여부

---

## 8) 검증 체크리스트

- 업로드 → 분석 → Q&A → 리포트 흐름 정상 동작
- Q&A 타이머 숫자/바가 함께 감소
- 5초 미만 경고색 전환 확인
- Q&A 종료 또는 페이지 이탈 시 카메라 OFF
- 리포트에 QA 요약 카드 표시
- 세션 정리 정책이 의도대로 동작
- 빌드 통과 (`frontend`, `backend`)

