import os
import uuid
import shutil
import base64
import json
import asyncio
import logging
from io import BytesIO
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Gemini 및 TTS
import google.generativeai as genai
from gtts import gTTS

# ==========================================
# 📌 1. 환경 설정 및 초기화
# ==========================================
load_dotenv()

# 로깅 설정 (print 대신 실무형 logger 사용)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Pitch-Perfect Backend",
    description="KIT 바이브 코딩 공모전 출품작: 실시간 AI 압박 Q&A 스피치 트레이너",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "./temp_sessions"
os.makedirs(TEMP_DIR, exist_ok=True)

# Gemini API 초기화 (최신 2.5 Flash 모델 적용)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.warning("⚠️ GEMINI_API_KEY가 환경변수에 설정되지 않았습니다.")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('models/gemini-2.5-flash')


# ==========================================
# 📌 2. Pydantic 스키마 (데이터 검증)
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
    ai_question_audio: str


class RoleplayTurnResponse(BaseModel):
    user_answer_stt: str
    answer_feedback: str
    next_ai_question_text: str
    next_ai_question_audio: str


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
# 📌 3. 공통 헬퍼 함수 (최적화 포인트)
# ==========================================
def _safe_parse_json(response_text: str) -> dict:
    """Gemini가 반환한 텍스트에서 안전하게 JSON을 파싱합니다."""
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        # 마크다운 태그(```json)가 섞여 있을 경우를 대비한 클리닝
        cleaned_text = response_text.replace("```json", "").replace("```", "").strip()
        try:
            return json.loads(cleaned_text)
        except json.JSONDecodeError:
            logger.error("JSON 파싱 완전 실패. 원본 텍스트: %s", response_text)
            return {}


# ==========================================
# 📌 4. API Endpoints
# ==========================================

# [API 1] 발표 영상 업로드 및 체공 분석 (단방향 훈련)
@app.post("/api/v1/presentation/analyze", response_model=AnalyzeResponse)
async def analyze_presentation(
        video_file: Optional[UploadFile] = File(default=None),
        ppt_recording_video_file: Optional[UploadFile] = File(default=None),
):
    if not any([video_file, ppt_recording_video_file]):
        raise HTTPException(
            status_code=400,
            detail="At least one source is required: video_file or ppt_recording_video_file.",
        )

    session_id = f"session_{uuid.uuid4().hex[:8]}"
    session_path = os.path.join(TEMP_DIR, session_id)
    os.makedirs(session_path, exist_ok=True)

    saved_paths: List[str] = []
    gemini_files = []

    def _save_upload(upload: UploadFile) -> str:
        filename = upload.filename or f"upload_{uuid.uuid4().hex[:6]}"
        path = os.path.join(session_path, filename)
        with open(path, "wb") as buffer:
            shutil.copyfileobj(upload.file, buffer)
        saved_paths.append(path)
        return path

    async def _wait_until_active(uploaded_file):
        attempts = 0
        while True:
            latest = genai.get_file(uploaded_file.name)
            if latest.state.name == "ACTIVE":
                return latest
            if latest.state.name == "FAILED":
                raise Exception("Gemini 서버 파일 처리 실패 (State: FAILED)")
            if attempts > 20:
                raise Exception("파일 처리 시간 초과")
            await asyncio.sleep(5)
            attempts += 1

    try:
        prompt_parts = []

        if video_file:
            video_path = _save_upload(video_file)
            video_mime = video_file.content_type or "video/mp4"
            logger.info(f"[{session_id}] 영상 입력 분석 시작 (MIME: {video_mime})")
            uploaded_video = genai.upload_file(path=video_path, mime_type=video_mime)
            active_video = await _wait_until_active(uploaded_video)
            gemini_files.append(active_video)
            prompt_parts.append("- 발표 영상")

        if ppt_recording_video_file:
            ppt_video_path = _save_upload(ppt_recording_video_file)
            ppt_video_mime = ppt_recording_video_file.content_type or "video/mp4"
            logger.info(f"[{session_id}] PPT 화면 녹화 영상 분석 시작 (MIME: {ppt_video_mime})")
            uploaded_ppt = genai.upload_file(path=ppt_video_path, mime_type=ppt_video_mime)
            active_ppt = await _wait_until_active(uploaded_ppt)
            gemini_files.append(active_ppt)
            prompt_parts.append("- PPT 화면 녹화 영상")

        input_summary = "\n".join(prompt_parts) if prompt_parts else "- 입력 정보 없음"

        prompt = f"""
        아래 입력 자료를 종합 분석하고 반드시 JSON으로만 응답하세요.

        [입력 자료]
        {input_summary}

        분석 규칙:
        - 영상에 포함된 실제 발화를 기준으로 스크립트, 말하기 속도(WPM), 군더더기 표현 빈도를 산출하세요.
        - 영상이 없으면 gaze_score는 추정이 어려우므로 0으로 반환할 수 있습니다.
        - PPT 화면 녹화 영상이 있으면 슬라이드 흐름과 발표 전달 일치도를 logic_summary 평가에 반영하세요.
        - script와 logic_summary는 반드시 한국어로 작성하세요.

        응답 스키마:
        {{
          "script": "발표자가 말한 전체 내용",
          "wpm": 130,
          "filler_words_count": 3,
          "gaze_score": 90,
          "logic_summary": "논리 구조에 대한 1문장 피드백"
        }}
        """

        response = model.generate_content(
            [*gemini_files, prompt],
            generation_config={"response_mime_type": "application/json"}
        )

        result_data = _safe_parse_json(response.text)

        return AnalyzeResponse(
            session_id=session_id,
            script=result_data.get("script") or "스크립트 추출 실패",
            analysis_result=AnalysisResult(
                wpm=int(result_data.get("wpm") or 0),
                filler_words_count=int(result_data.get("filler_words_count") or 0),
                gaze_score=int(result_data.get("gaze_score") or 0),
                logic_summary=result_data.get("logic_summary") or "분석 내용을 생성할 수 없습니다."
            )
        )

    except Exception as e:
        logger.error(f"[{session_id}] API 1 에러: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        for uploaded in gemini_files:
            try:
                genai.delete_file(uploaded.name)
            except:
                pass
        for path in saved_paths:
            if os.path.exists(path):
                os.remove(path)


# [API 2] 실시간 AI 롤플레잉 시작 (첫 압박 질문)
@app.post("/api/v1/roleplay/start", response_model=RoleplayStartResponse)
async def start_roleplay(req: RoleplayStartRequest):
    try:
        logger.info(f"[{req.session_id}] 실시간 AI 롤플레잉 시작")
        prompt = f"""
        당신은 깐깐한 면접관입니다. 다음 발표 스크립트를 읽고,
        비즈니스 모델이나 기술적 허점을 찌르는 날카로운 압박 질문 딱 1개를 한국어로 생성하세요.
        길이는 2~3문장 이내로 짧고 구어체로 작성하세요.
        
        발표 스크립트: {req.script}
        """

        response = model.generate_content(prompt)
        ai_question = response.text.strip()

        # 텍스트 -> 음성(TTS) 변환 및 Base64 인코딩
        tts = gTTS(text=ai_question, lang='ko', slow=False)
        fp = BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        base64_audio = base64.b64encode(fp.read()).decode('utf-8')

        return RoleplayStartResponse(
            ai_question_text=ai_question,
            ai_question_audio=base64_audio
        )
    except Exception as e:
        logger.error(f"[{req.session_id}] API 2 에러: {str(e)}")
        raise HTTPException(status_code=500, detail=f"질문 생성 중 오류 발생: {str(e)}")


# [API 3] 실시간 질의응답 (Q&A Ping-Pong)
@app.post("/api/v1/roleplay/turn", response_model=RoleplayTurnResponse)
async def roleplay_turn(
        session_id: str = Form(...),
        user_audio: UploadFile = File(...),
        history_context: str = Form("[]")
):
    session_path = os.path.join(TEMP_DIR, session_id)
    os.makedirs(session_path, exist_ok=True)

    audio_path = os.path.join(session_path, user_audio.filename)
    gemini_file = None

    try:
        with open(audio_path, "wb") as buffer:
            shutil.copyfileobj(user_audio.file, buffer)

        mime_type = user_audio.content_type or "audio/webm"
        logger.info(f"[{session_id}] Q&A 턴 분석 시작 (MIME: {mime_type})")

        gemini_file = genai.upload_file(path=audio_path, mime_type=mime_type)

        attempts = 0
        while True:
            gemini_file = genai.get_file(gemini_file.name)
            if gemini_file.state.name == "ACTIVE": break
            if gemini_file.state.name == "FAILED": raise Exception("음성 처리 실패")
            if attempts > 15: raise Exception("음성 처리 시간 초과")
            await asyncio.sleep(2)
            attempts += 1

        history = _safe_parse_json(history_context) if history_context != "[]" else []
        history_str = json.dumps(history, ensure_ascii=False, indent=2)

        prompt = f"""
        당신은 깐깐한 면접관입니다. 첨부된 오디오는 당신의 질문에 대한 사용자의 답변입니다.
        [이전 대화 내역]
        {history_str}
        
        오디오를 듣고 다음 3가지를 분석하여 반드시 JSON으로 응답하세요.
        1. "user_answer_stt": 사용자가 말한 답변 내용 (텍스트 변환)
        2. "answer_feedback": 답변의 논리/설득력에 대한 짧은 피드백 (1문장)
        3. "next_ai_question_text": 이전 내용을 바탕으로 파고드는 다음 꼬리 질문 (1~2문장 구어체)
        """

        response = model.generate_content(
            [gemini_file, prompt],
            generation_config={"response_mime_type": "application/json"}
        )

        result_data = _safe_parse_json(response.text)

        stt = result_data.get("user_answer_stt") or "답변을 인식하지 못했습니다."
        feedback = result_data.get("answer_feedback") or "피드백을 생성하지 못했습니다."
        next_question = result_data.get("next_ai_question_text") or "더 이상 질문할 내용이 없습니다."

        # 다음 질문 TTS 생성
        tts = gTTS(text=next_question, lang='ko', slow=False)
        fp = BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        base64_audio = base64.b64encode(fp.read()).decode('utf-8')

        return RoleplayTurnResponse(
            user_answer_stt=stt,
            answer_feedback=feedback,
            next_ai_question_text=next_question,
            next_ai_question_audio=base64_audio
        )

    except Exception as e:
        logger.error(f"[{session_id}] API 3 에러: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if gemini_file:
            try:
                genai.delete_file(gemini_file.name)
            except:
                pass
        if os.path.exists(audio_path):
            os.remove(audio_path)


# [API 4] 종합 입체 피드백 리포트 생성
@app.post("/api/v1/report/generate", response_model=ReportGenerateResponse)
async def generate_report(req: ReportGenerateRequest):
    try:
        logger.info(f"[{req.session_id}] 종합 리포트 생성 시작")
        presentation_data = json.dumps(req.presentation_analysis, ensure_ascii=False)

        qna_history_str = ""
        for idx, item in enumerate(req.qna_history):
            qna_history_str += f"\n[턴 {idx + 1}] Q: {item.q}\nA: {item.a}\n"

        prompt = f"""
        당신은 상위 1% 스피치 코치입니다. 사용자의 '발표 분석'과 '실시간 Q&A 내역'을 바탕으로 최종 리포트를 JSON으로 작성하세요.

        [발표 분석 결과]
        {presentation_data}

        [실시간 Q&A 내역]
        {qna_history_str if qna_history_str else "내역 없음"}

        형식:
        - overall_score: 0~100 종합 점수 (정수)
        - strengths: 강점 2~3개 (문자열 배열)
        - weaknesses: 약점 또는 개선점 2~3개 (문자열 배열)
        - action_items: 실전 행동 지침 2~3개 (문자열 배열)
        """

        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )

        result_data = _safe_parse_json(response.text)

        return ReportGenerateResponse(
            overall_score=int(result_data.get("overall_score") or 70),
            strengths=result_data.get("strengths") or ["강점 분석 데이터 부족"],
            weaknesses=result_data.get("weaknesses") or ["약점 분석 데이터 부족"],
            action_items=result_data.get("action_items") or ["지속적인 훈련 권장"]
        )

    except Exception as e:
        logger.error(f"[{req.session_id}] API 4 에러: {str(e)}")
        raise HTTPException(status_code=500, detail=f"리포트 생성 오류: {str(e)}")


# [API 5] 임시 데이터 정리 (Cleanup API)
@app.delete("/api/v1/session/cleanup")
async def cleanup_session(req: CleanupRequest):
    session_path = os.path.join(TEMP_DIR, req.session_id)

    if os.path.exists(session_path):
        try:
            shutil.rmtree(session_path)
            logger.info(f"🧹 [{req.session_id}] 임시 파일 정리 완료")
            return {"status": "success", "message": "임시 파일이 삭제되었습니다."}
        except Exception as e:
            logger.error(f"[{req.session_id}] 파일 삭제 실패: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    return {"status": "success", "message": "폴더가 이미 비워져 있습니다."}
