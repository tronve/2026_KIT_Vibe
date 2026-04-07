import os
import uuid
import shutil
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

# 환경 변수 로드
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="Pitch-Perfect AI Backend")

# CORS 설정 (프론트엔드와의 통신 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 "http://localhost:5173" 등으로 제한 필요
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 임시 파일 저장소 (세션별 영상/음성 저장용)
TEMP_DIR = "./temp_sessions"
os.makedirs(TEMP_DIR, exist_ok=True)


# ==========================================
# 📌 Pydantic Models (API 명세서 기반)
# ==========================================

class AnalysisResult(BaseModel):
    wpm: int
    filler_words_count: int
    gaze_score: int
    logic_summary: str

class AnalyzeResponse(BaseModel):
    session_id: str
    script: str
    analysis_result: AnalysisResult

class RoleplayStartRequest(BaseModel):
    session_id: str
    script: str

class RoleplayStartResponse(BaseModel):
    ai_question_text: str
    ai_question_audio: str  # Base64

class RoleplayTurnResponse(BaseModel):
    user_answer_stt: str
    answer_feedback: str
    next_ai_question_text: str
    next_ai_question_audio: str  # Base64

class QnAItem(BaseModel):
    q: str
    a: str

class ReportGenerateRequest(BaseModel):
    session_id: str
    presentation_analysis: Dict[str, Any]
    qna_history: List[QnAItem]

class ReportGenerateResponse(BaseModel):
    overall_score: int
    strengths: List[str]
    weaknesses: List[str]
    action_items: List[str]

class CleanupRequest(BaseModel):
    session_id: str


# ==========================================
# 📌 API Endpoints
# ==========================================

# API 1: 발표 영상 업로드 및 단방향 분석
@app.post("/api/v1/presentation/analyze", response_model=AnalyzeResponse)
async def analyze_presentation(video_file: UploadFile = File(...)):
    # 1. 파일 확장자 검증
    if not video_file.filename.endswith(('.mp4', '.webm', '.mov', '.avi')):
        raise HTTPException(status_code=400, detail="지원하지 않는 영상 파일 형식입니다.")
        
    # 2. 세션 ID 및 독립된 디렉토리 생성
    session_id = f"session_{uuid.uuid4().hex[:8]}"
    session_path = os.path.join(TEMP_DIR, session_id)
    os.makedirs(session_path, exist_ok=True)
    
    file_path = os.path.join(session_path, video_file.filename)
    
    try:
        # 3. 비디오 파일 서버 로컬에 안전하게 저장 (청크 단위 쓰기)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(video_file.file, buffer)
            
        # TODO: 실제 OpenAI Whisper (STT) 및 GPT-4o (Vision/Logic) 연동 로직 위치
        # 현재는 프론트엔드 연동 테스트를 위한 Mock 데이터 반환
        
        return AnalyzeResponse(
            session_id=session_id,
            script="안녕하세요. 오늘 제가 발표할 주제는 차세대 AI 솔루션입니다. 이 솔루션은 기존 교육 현장의 문제를...",
            analysis_result=AnalysisResult(
                wpm=125,
                filler_words_count=4,
                gaze_score=85,
                logic_summary="서론과 본론의 전개는 좋으나 결론이 다소 약함"
            )
        )
    except Exception as e:
        # 에러 발생 시 쓰레기 파일 방지를 위한 즉각 롤백(삭제) 처리
        if os.path.exists(session_path):
            shutil.rmtree(session_path)
        raise HTTPException(status_code=500, detail=f"영상 처리 중 서버 오류 발생: {str(e)}")


# API 2: 실시간 AI 롤플레잉 시작 (Mock)
@app.post("/api/v1/roleplay/start", response_model=RoleplayStartResponse)
async def start_roleplay(req: RoleplayStartRequest):
    # TODO: OpenAI GPT-4o 텍스트 생성 & TTS Base64 인코딩 로직 위치
    return RoleplayStartResponse(
        ai_question_text="발표 잘 들었습니다. 그런데 경쟁사 대비 기술적 진입 장벽이 너무 낮아 보이는데 어떻게 방어하실 계획인가요?",
        ai_question_audio="UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA..." # Mock Base64
    )


# API 3: 실시간 질의응답 (Mock)
@app.post("/api/v1/roleplay/turn", response_model=RoleplayTurnResponse)
async def roleplay_turn(
    session_id: str = Form(...),
    user_audio: UploadFile = File(...),
    history_context: str = Form(...) # JSON String 형태로 받음
):
    # TODO: 오디오 저장 -> STT -> GPT 꼬리질문 생성 -> TTS 변환 로직 위치
    return RoleplayTurnResponse(
        user_answer_stt="그 부분은 저희만의 독자적인 데이터 파이프라인으로 해결...",
        answer_feedback="당황하여 이전보다 말이 1.5배 빨라졌습니다. 호흡을 가다듬으세요.",
        next_ai_question_text="데이터 파이프라인이라고 하셨는데, 개인정보 보호 문제는 어떻게 해결하나요?",
        next_ai_question_audio="UklGRjIAAABXQVZFZm10IBAAAAABAAEA..." # Mock Base64
    )


# API 4: 종합 리포트 생성 (Mock)
@app.post("/api/v1/report/generate", response_model=ReportGenerateResponse)
async def generate_report(req: ReportGenerateRequest):
    # TODO: 종합 데이터 기반 GPT-4o 리포트 생성 로직 위치
    return ReportGenerateResponse(
        overall_score=88,
        strengths=["질문 의도를 정확히 파악함", "비식별화라는 구체적인 해결책 제시"],
        weaknesses=["압박 질문 시 추임새(어, 음)가 3배 이상 증가함", "시선이 자주 아래로 향함"],
        action_items=["답변 전 1초간 심호흡하기", "카메라 렌즈를 보고 말하는 연습하기"]
    )


# API 5: 임시 데이터 정리
@app.delete("/api/v1/session/cleanup")
async def cleanup_session(req: CleanupRequest):
    session_path = os.path.join(TEMP_DIR, req.session_id)
    if os.path.exists(session_path):
        try:
            shutil.rmtree(session_path)
            return {"status": "success", "message": f"{req.session_id} files deleted"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"파일 삭제 실패: {str(e)}")
    return {"status": "success", "message": "Session directory not found (already clean)"}