# AI Pitch-Perfect Backend

발표 영상을 분석하고, AI가 꼬리 질문을 던지며, 최종 리포트까지 생성하는 FastAPI 기반 백엔드입니다. 프론트엔드의 업로드 → 분석 → Q&A → 리포트 흐름을 안정적으로 지원하도록 설계되었습니다.

---

## 1. 프로젝트 전반 설명

### 목적
- 단순한 발표 녹화 저장이 아니라, **분석과 실전 Q&A 훈련**까지 이어지는 백엔드를 제공한다.
- 사용자가 업로드한 영상/오디오를 바탕으로 AI가 발표 품질을 해석하고, 이어서 질문-답변 훈련을 생성한다.
- 훈련 종료 후에는 전체 흐름을 요약한 리포트를 반환한다.

### 기술 스택
- **Framework:** FastAPI, Uvicorn
- **AI Model:** Google Gemini 2.5 Flash
- **Data Validation:** Pydantic
- **TTS:** gTTS
- **Language:** Python 3.12

### 핵심 역할
- 발표 영상 업로드 및 분석
- AI 롤플레이 세션 시작 및 턴 처리
- 종합 리포트 생성
- 세션 임시 파일 정리

### 주요 디렉터리
- `main.py`: FastAPI 애플리케이션 및 API 엔드포인트
- `requirements.txt`: Python 의존성
- `temp_sessions/`: 세션별 임시 파일 저장소

---

## 2. AI와 함께 정리한 기획문서

이 섹션은 실제 구현 방향을 정리한 내부 기획 문서입니다.

### 2.1 제품 정의
이 백엔드는 발표 훈련을 “분석”에만 머무르게 하지 않고, AI가 질문을 이어가는 **양방향 압박 면접형 스피치 트레이너**를 제공하는 것을 목표로 합니다.

### 2.2 핵심 목표
- 영상/오디오 기반 발표 분석 자동화
- 분석 결과를 Q&A 훈련으로 자연스럽게 연결
- 답변 피드백과 꼬리 질문 생성을 하나의 턴으로 처리
- 세션 종료 후 서버에 데이터가 남지 않도록 정리

### 2.3 사용자 흐름
1. 프론트엔드가 발표 영상을 업로드한다.
2. 백엔드가 발표 내용을 분석하고 스크립트/지표를 반환한다.
3. 프론트엔드가 분석 결과를 바탕으로 Q&A 세션을 시작한다.
4. 사용자가 음성 답변을 보내면 백엔드가 답변을 해석하고 피드백 및 다음 질문을 생성한다.
5. 훈련이 끝나면 종합 리포트를 생성하고 세션 파일을 정리한다.

### 2.4 API 역할 분담
#### `POST /api/v1/presentation/analyze`
- 발표 영상 또는 PPT 녹화 영상을 분석한다.
- 스크립트, WPM, 군더더기 표현 수, 시선 점수, 논리 요약을 반환한다.

#### `POST /api/v1/roleplay/start`
- 분석된 스크립트를 바탕으로 첫 압박 질문을 생성한다.
- 질문 텍스트와 TTS 오디오(Base64)를 반환한다.

#### `POST /api/v1/roleplay/turn`
- 사용자 답변 음성을 분석해 STT, 피드백, 다음 꼬리 질문을 생성한다.
- 다음 질문 TTS 오디오(Base64)도 함께 반환한다.

#### `POST /api/v1/report/generate`
- 발표 분석 데이터와 Q&A 히스토리를 합쳐 최종 리포트를 생성한다.

#### `DELETE /api/v1/session/cleanup`
- 세션 임시 폴더를 제거한다.
- 훈련 종료 후 파일 누적을 방지한다.

### 2.5 아키텍처 전략
1. **멀티모달 AI 사용**
   - 영상과 음성을 직접 다루는 방향으로 설계해 텍스트 전용 한계를 줄입니다.
2. **응답 안정성 확보**
   - Gemini 응답이 JSON 형식을 깨더라도 `_safe_parse_json`으로 최대한 복구합니다.
   - 누락 필드는 `or` 기본값으로 보정합니다.
3. **세션 단위 파일 관리**
   - 업로드 파일은 `temp_sessions/<session_id>`에 저장합니다.
   - 분석/턴 처리 후에는 Gemini 업로드 파일과 로컬 파일을 정리합니다.
4. **프론트 연동 단순화**
   - 질문 오디오는 Base64 문자열로 내려서 프론트가 바로 재생할 수 있게 합니다.

### 2.6 완료 기준
- 발표 업로드 → 분석 → Q&A → 리포트 → 정리 흐름이 끊기지 않는다.
- AI 응답이 불완전해도 서버가 쉽게 무너지지 않는다.
- 세션 종료 시 임시 파일이 남지 않는다.
- 프론트엔드에서 필요한 필드명이 명확하고 일관된다.

---

## 3. API 명세 요약

### 3.1 `POST /api/v1/presentation/analyze`
**기능**: 발표 영상 또는 PPT 녹화 영상을 업로드받아 분석 결과를 생성합니다.

**입력**
- `video_file` (선택)
- `ppt_recording_video_file` (선택)

**출력 예시**
- `session_id`
- `script`
- `analysis_result`
  - `wpm`
  - `filler_words_count`
  - `gaze_score`
  - `logic_summary`

### 3.2 `POST /api/v1/roleplay/start`
**기능**: 발표 스크립트를 바탕으로 첫 질문을 생성합니다.

**입력**
- `session_id`
- `script`

**출력 예시**
- `ai_question_text`
- `ai_question_audio`

### 3.3 `POST /api/v1/roleplay/turn`
**기능**: 사용자의 음성 답변을 분석하고 다음 질문을 생성합니다.

**입력**
- `session_id`
- `user_audio`
- `history_context` (`"[]"` 기본값)

**출력 예시**
- `user_answer_stt`
- `answer_feedback`
- `next_ai_question_text`
- `next_ai_question_audio`

### 3.4 `POST /api/v1/report/generate`
**기능**: 발표 분석과 Q&A 히스토리를 합쳐 종합 리포트를 생성합니다.

**입력**
- `session_id`
- `presentation_analysis`
- `qna_history`

**출력 예시**
- `overall_score`
- `strengths`
- `weaknesses`
- `action_items`

### 3.5 `DELETE /api/v1/session/cleanup`
**기능**: 세션 임시 디렉터리와 파일을 삭제합니다.

**입력**
- `session_id`

**출력**
- 정리 성공 메시지

---

## 4. 개발/운영 지침서

### 4.1 환경 변수
필수 환경 변수:

```env
GEMINI_API_KEY=본인의_구글_제미나이_API_키
```

### 4.2 로컬 실행 방법

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

실행 후 Swagger UI:

```text
http://localhost:8000/docs
```

### 4.3 세션 및 파일 정리 규칙
- 업로드 파일은 세션별 임시 디렉터리에 저장한다.
- 분석/턴 처리 후 Gemini 업로드 파일은 삭제한다.
- 훈련 종료 시 `DELETE /api/v1/session/cleanup`으로 세션 폴더를 정리한다.
- 동일 세션에 대한 정리는 여러 번 호출되어도 안전해야 한다.

### 4.4 에러 처리 원칙
- Gemini 응답은 JSON 파싱 실패 가능성을 항상 고려한다.
- `_safe_parse_json()`으로 응답 복구를 시도한다.
- 필드 누락 시 기본값으로 응답을 완성한다.
- 업로드 파일 형식, 필수 입력 누락, 세션 식별자 누락은 `HTTPException`으로 명확히 처리한다.

### 4.5 유지보수 지침
- 새 API를 추가할 때는 README의 API 요약을 함께 갱신한다.
- 프론트엔드와 요청/응답 필드명을 맞춘다.
- 모델 또는 프롬프트를 바꿀 때는 JSON 응답 스키마 호환성을 다시 확인한다.
- `temp_sessions/`에 파일이 쌓이지 않는지 수시로 점검한다.

### 4.6 테스트/검증 체크리스트
- 서버 기동 확인
- `/docs`에서 엔드포인트 노출 확인
- 발표 업로드 요청 정상 응답 확인
- Q&A start/turn 응답 정상 확인
- cleanup API가 세션 폴더를 실제로 삭제하는지 확인

---

## 5. 트러블슈팅 참고

- **Gemini 파일 처리 지연**: 업로드 후 ACTIVE 상태가 될 때까지 폴링한다.
- **JSON 파싱 실패**: 마크다운 코드펜스가 섞인 응답을 정리한 뒤 다시 파싱한다.
- **422 에러 방지**: `history_context`는 기본값 `"[]"`를 사용한다.
- **세션 파일 누수 방지**: 분석/턴 종료 시 로컬 파일과 Gemini 파일을 모두 정리한다.

