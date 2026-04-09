# AI Pitch-Perfect Backend

발표 분석, Q&A 질문 생성/턴 처리, 최종 리포트 생성, 세션 정리를 담당하는 FastAPI 서버입니다.

---

## 프로젝트 목적

- 프론트의 업로드 → 분석 → Q&A → 리포트 흐름을 API 단에서 안정적으로 완성합니다.
- 멀티모달 입력(영상/음성)을 처리해 발표 분석과 실전형 질문 생성을 연결합니다.
- 세션 기반 임시 파일 관리로 서버 리소스 누수를 방지합니다.

---

## 역할 요약

- 발표 영상/PPT 녹화 영상 분석
- 첫 질문 생성 + 질문 음성(Base64) 제공
- 사용자 음성 답변 분석(STT) + 피드백 + 다음 질문 생성
- 분석 + Q&A 히스토리(`qna_history`) 기반 최종 리포트 생성
- 세션 임시 파일 정리(`cleanup`)

### 운영 관점 핵심

- API 계약 필드명 일관성 유지 (`session_id`, `qna_history`, `history_context`)
- 예외 상황에서도 JSON 응답 스키마를 최대한 유지
- 세션 정리 API를 통한 파일 누적 방지

---

## API 요약

### `POST /api/v1/presentation/analyze`

- 입력: `video_file?`, `ppt_recording_video_file?`
- 출력: `session_id`, `script`, `analysis_result`
- 규칙: `script`, `logic_summary`는 한국어 작성 유도

운영 메모:

- 분석 입력이 없는 경우 명확한 4xx 응답으로 처리
- 분석 단계에서 생성된 세션 ID를 이후 API 전 구간에서 재사용

### `POST /api/v1/roleplay/start`

- 입력: `session_id`, `script`
- 출력: `ai_question_text`, `ai_question_audio`

운영 메모:

- 첫 질문 생성 실패 시 세션은 유지하되 재시도 가능 상태 보장

### `POST /api/v1/roleplay/turn`

- 입력: `session_id`, `user_audio`, `history_context`(기본값 `[]`)
- 출력: `user_answer_stt`, `answer_feedback`, `next_ai_question_text`, `next_ai_question_audio`

운영 메모:

- `history_context` 누락에 대비한 기본값 처리로 422 방지
- STT/피드백/다음 질문을 한 턴에서 일관되게 생성

### `POST /api/v1/report/generate`

- 입력: `session_id`, `presentation_analysis`, `qna_history`
- 출력: `overall_score`, `strengths`, `weaknesses`, `action_items`
- 주의: 프론트에서 전달한 `qna_history`가 리포트 품질에 직접 영향

운영 메모:

- `qna_history`가 비어 있으면 리포트 품질 저하 가능
- 프론트와 함께 라운드 데이터 전달 여부를 반드시 점검

### `DELETE /api/v1/session/cleanup`

- 입력: `session_id`
- 출력: 정리 결과 메시지
- 목적: `temp_sessions/<session_id>` 삭제

운영 메모:

- 동일 세션 정리 요청이 반복돼도 안전하게 동작하도록 멱등성 유지

---

## 기술 스택

- FastAPI, Uvicorn
- Google Gemini 2.5 Flash
- gTTS
- Pydantic
- Python 3.12

---

## 실행 방법

### 환경 변수

```env
GEMINI_API_KEY=본인의_구글_제미나이_API_키
```

### 로컬 실행

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

Swagger UI:

```text
http://localhost:8000/docs
```

---

## 운영 규칙

- 업로드 파일은 세션 폴더에 저장 후 처리 완료 시 즉시 정리
- Gemini 임시 업로드 파일도 처리 후 삭제
- 세션 종료/이탈 시 프론트에서 `cleanup` 호출
- 정리 API는 여러 번 호출되어도 안전(멱등성)

### 권장 점검 루틴

- `temp_sessions/` 하위 폴더 주기 점검
- 비정상 종료 세션 누적 여부 점검
- 리포트 품질 이슈 발생 시 `qna_history` payload 점검

---

## 트러블슈팅 포인트

- Gemini 응답 JSON 파싱 실패 대비 `_safe_parse_json` 사용
- `history_context` 기본값으로 422 방지
- 파일 처리 지연 시 ACTIVE 상태 폴링
- `temp_sessions/` 누적 여부 주기 점검
- 프론트 리포트 품질 저하 시 `qna_history` 전달 여부 우선 확인
- `logic_summary` 언어 이슈가 있으면 분석 프롬프트의 한국어 강제 규칙 확인
- 세션 정리 누락 시 `/api/v1/session/cleanup` 호출 성공 여부와 세션 ID 일치 여부 확인

### 증상별 빠른 점검

1. 리포트가 빈약하게 생성됨
   - `qna_history` 전달 여부 확인
   - 프론트 세션 ID와 리포트 요청 세션 ID 일치 여부 확인

2. 세션 폴더가 계속 남음
   - `cleanup` 호출 유무 확인
   - 권한 문제로 파일 삭제 실패 로그가 있는지 확인

3. 분석 요약이 영어로 내려옴
   - 프롬프트에 한국어 작성 규칙이 반영되어 있는지 확인
   - 모델 응답 원문과 파싱 결과를 함께 확인

