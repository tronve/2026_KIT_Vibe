### 1. 발표 영상 업로드 및 단방향 분석

사용자의 발표 영상을 백엔드로 전송하여 STT(음성 텍스트 변환) 및 Vision 분석 결과를 받아오는 API입니다.

- **URL:** `/api/v1/presentation/analyze`
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Request (React → FastAPI):**
    - `video_file`: 업로드된 발표 영상 파일 (mp4, webm 등)
- **Response (FastAPI → React):** 성공 (200 OK)

```cpp
{
  "session_id": "session_12345", // 이후 Q&A 식별용
  "script": "안녕하세요. 오늘 제가 발표할 주제는 차세대 AI 솔루션입니다...",
  "analysis_result": {
    "wpm": 125, // 분당 단어 수 (말하기 속도)
    "filler_words_count": 4, // '어', '음' 등 추임새 횟수
    "gaze_score": 85, // 시선 처리 점수 (100점 만점)
    "logic_summary": "서론과 본론의 전개는 좋으나 결론이 다소 약함"
  }
}
```

### 2. 실시간 AI 롤플레잉 시작 (첫 압박 질문 생성)

분석된 발표 스크립트를 바탕으로 AI가 첫 번째 날카로운 꼬리 질문을 던집니다.

- **URL:** `/api/v1/roleplay/start`
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Request (React → FastAPI):**

```cpp
{
  "session_id": "session_12345",
  "script": "안녕하세요. 오늘 제가 발표할 주제는..."
}
```

**Response (FastAPI → React):** 성공 (200 OK)

- *Tip:* 오디오 파일은 다루기 쉽게 Base64 문자열로 반환하여 프론트에서 바로 재생(`new Audio("data:audio/mp3;base64,...")`)하도록 합니다.

```cpp
{
  "ai_question_text": "발표 잘 들었습니다. 그런데 경쟁사 대비 기술적 진입 장벽이 너무 낮아 보이는데 어떻게 방어하실 계획인가요?",
  "ai_question_audio": "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA..." // TTS 오디오 Base64
}
```

### 3. 실시간 질의응답 (Q&A Ping-Pong)

사용자의 답변(음성)을 받아 분석하고, 다음 AI의 꼬리 질문을 생성하는 핵심 반복 루프입니다.

- **URL:** `/api/v1/roleplay/turn`
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Request (React → FastAPI):**
    - `session_id`: "session_12345"
    - `user_audio`: 브라우저에서 녹음된 사용자의 답변 오디오 파일 (webm, wav 등)
    - `history_context`: 이전 대화 내역 (JSON String) *※ 토큰 낭비를 막기 위해 직전 질문/답변만 전송*
- **Response (FastAPI → React):** 성공 (200 OK)

```cpp
{
  "user_answer_stt": "그 부분은 저희만의 독자적인 데이터 파이프라인으로 해결...",
  "answer_feedback": "당황하여 이전보다 말이 1.5배 빨라졌습니다. 호흡을 가다듬으세요.",
  "next_ai_question_text": "데이터 파이프라인이라고 하셨는데, 개인정보 보호 문제는 어떻게 해결하나요?",
  "next_ai_question_audio": "UklGRjIAAABXQVZFZm10IBAAAAABAAEA..." // 다음 질문 TTS
}
```

### 4. 종합 입체 피드백 리포트 생성

모든 Q&A 세션이 끝난 후, 전체 데이터를 종합하여 최종 평가 리포트를 생성합니다.

- **URL:** `/api/v1/report/generate`
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Request (React → FastAPI):**

```cpp
{
  "session_id": "session_12345",
  "presentation_analysis": { ... }, // 1번 API의 결과
  "qna_history": [                  // 3번 API에서 누적된 질의응답 내역
    { "q": "진입 장벽 방어는?", "a": "데이터 파이프라인으로 해결..." },
    { "q": "개인정보 보호는?", "a": "비식별화 처리..." }
  ]
}
```

- **Response (FastAPI → React):** 성공 (200 OK)

```cpp
{
  "overall_score": 88,
  "strengths": ["질문 의도를 정확히 파악함", "비식별화라는 구체적인 해결책 제시"],
  "weaknesses": ["압박 질문 시 추임새(어, 음)가 3배 이상 증가함", "시선이 자주 아래로 향함"],
  "action_items": ["답변 전 1초간 심호흡하기", "카메라 렌즈를 보고 말하는 연습하기"]
}
```

### 5. 임시 데이터 정리 (Cleanup API)

사용자가 올린 무거운 영상이나 음성 파일이 서버(Render, Vercel 등)에 계속 쌓이면 용량 초과로 서버가 뻗어버릴 수 있습니다. 세션이 끝날 때 쓰레기통을 비워주는 API입니다.

- **URL:** `/api/v1/session/cleanup`
- **Method:** `DELETE`
- **Request:** `{"session_id": "session_12345"}`
- **Response:** `{"status": "success", "message": "Files deleted"}`
- **용도:** 프론트에서 4번 리포트 생성을 완료하고 화면을 나갈 때, 뒤끝 없이 서버의 임시 파일(mp4, wav 등)을 지워줍니다.