# 🎙️ AI Pitch-Perfect Backend (KIT 바이브 코딩 공모전 출품작)

## 📖 프로젝트 개요
**'AI Pitch-Perfect'**는 단순한 단방향 발표 연습을 넘어, 사용자의 발표를 분석하고 실시간으로 날카로운 꼬리 질문을 던지는 **양방향 압박 면접 및 스피치 트레이닝 솔루션**입니다. 
본 백엔드 서버는 Google의 최신 멀티모달 AI(Gemini 2.5 Flash)와 FastAPI를 기반으로 구축되었으며, 실시간 오디오/비디오 처리와 무지연 핑퐁(Ping-Pong) 질의응답을 완벽하게 지원합니다.

---

## 🎯 핵심 기획 의도 및 아키텍처 전략

1. **최신 멀티모달 AI 적극 활용 (Gemini 2.5 Flash)**
   - 기존 텍스트 위주의 LLM 한계를 극복하기 위해 영상/오디오 파일을 직접 해석하는 네이티브 멀티모달 모델을 도입했습니다.
   - 이를 통해 STT(Speech-to-Text) API 비용을 절감하고, 음성의 뉘앙스와 발표 내용의 논리를 동시에 평가합니다.
2. **비용 효율성 극대화 (Zero-Cost Architecture)**
   - 고비용의 유료 STT/TTS API 대신, 파이썬 오픈소스 라이브러리인 `gTTS`를 자체 서버에서 Base64로 인코딩하여 프론트엔드에 전달하는 방식으로 운영 유지비를 0원으로 설계했습니다.
3. **강력한 Fault-Tolerance (결함 허용 시스템)**
   - AI 모델이 예측 불가능한 응답(Null 값 반환, JSON 형식 파괴 등)을 하더라도 서버가 다운되지 않도록, `_safe_parse_json` 헬퍼 함수와 `or` 연산자를 활용한 2중 방어 가드레일을 구축했습니다.
4. **효율적인 상태 및 용량 관리 (Garbage Collection)**
   - 무거운 영상/오디오 파일이 서버 용량을 낭비하지 않도록 세션(Session) 단위의 임시 디렉토리 구조를 설계했으며, `Cleanup API`를 통해 멱등성(Idempotency)이 보장된 파일 정리 로직을 구현했습니다.

---

## 🛠️ 기술 스택 (Tech Stack)
- **Framework:** FastAPI, Uvicorn
- **AI Model:** Google Gemini 2.5 Flash
- **Data Validation:** Pydantic
- **Audio Processing:** gTTS (Text-to-Speech)
- **Language:** Python 3.12

---

## 📡 API 명세서 (Core Endpoints)

### 1. `POST /api/v1/presentation/analyze` (발표 체공 분석)
- **기능:** 사용자의 1분 엘리베이터 피치 영상을 업로드받아 스크립트 추출 및 논리, 추임새, 시선 처리 등을 종합 분석합니다.
- **특징:** 파일 확장자 및 코덱 문제 방지를 위한 MIME Type 명시적 처리 및 비동기 폴링(Polling) 대기 로직 적용.

### 2. `POST /api/v1/roleplay/start` (롤플레잉 세션 시작)
- **기능:** 분석된 발표 스크립트를 기반으로 비즈니스 모델이나 논리적 허점을 찌르는 첫 번째 압박 질문(Audio/Text)을 생성합니다.

### 3. `POST /api/v1/roleplay/turn` (실시간 Q&A 핑퐁)
- **기능:** 사용자의 답변 음성을 받아 **[1. STT 변환] ➡️ [2. 답변 피드백] ➡️ [3. 다음 꼬리 질문 생성] ➡️ [4. 다음 질문 TTS 변환]**을 단 1회의 Gemini 호출로 처리하는 1타 4피 최적화 엔드포인트.
- **특징:** 프론트엔드의 `history_context` 전송 누락에 대비한 Default Form 처리로 422 에러 원천 차단.

### 4. `POST /api/v1/report/generate` (종합 입체 리포트)
- **기능:** 발표 분석 데이터와 Q&A 세션 전체 내역을 영끌하여 상위 1% 컨설턴트급 최종 피드백 리포트를 JSON으로 반환합니다.

### 5. `DELETE /api/v1/session/cleanup` (가비지 컬렉션)
- **기능:** 훈련이 종료되거나 유저 이탈 시 서버에 남은 세션 임시 파일(.mp4, .wav 등)을 완전히 삭제하여 서버 스토리지 오버플로우를 방지합니다.

---

## 🚀 로컬 실행 방법 (Quick Start)

### 1. 환경 변수 설정
프로젝트 최상단 경로에 `.env` 파일을 생성하고 아래 내용을 입력합니다.
```env
GEMINI_API_KEY="본인의_구글_제미나이_API_키"

2. 패키지 설치

가상환경 활성화 후 필수 라이브러리를 설치합니다.
pip install -r requirements.txt

3. 서버 실행

Bash
uvicorn main:app --reload

서버가 실행되면 http://localhost:8000/docs 에 접속하여 Swagger UI를 통해 모든 API를 즉시 테스트할 수 있습니다.

🛡️ 트러블슈팅 및 극복 사례 (Troubleshooting)
Gemini Transcoding 500 에러 극복: 프론트엔드에서 전송되는 다양한 형태의 영상/오디오 파일 처리를 위해 명시적 mime_type 주입 및 호환성 확보 완료.

Pydantic 422 에러(Missing Field) 극복: AI가 명시적으로 null을 반환하거나, 프론트엔드에서 폼 데이터를 누락할 경우를 대비해 or 연산자와 FastAPI Form("[]") 기본값 처리를 통해 런타임 에러 100% 방지.

404 Model Not Found 문제: 최신 계정 권한에 맞춰 구형 1.5 모델 대신 가장 빠르고 가벼운 models/gemini-2.5-flash 모델로 하드코딩하여 인식률과 속도 동시 향상.