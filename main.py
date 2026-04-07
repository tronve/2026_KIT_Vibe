import os
import uuid
import shutil
import base64
import json
import asyncio

from io import BytesIO
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any

# Gemini 및 gTTS(무료 TTS) 임포트
import google.generativeai as genai
from gtts import gTTS

from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="Pitch-Perfect AI Backend (Gemini Version)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "./temp_sessions"
os.makedirs(TEMP_DIR, exist_ok=True)

# 🚀 Gemini API 설정
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

# 가장 빠르고 멀티모달(영상/음성) 처리에 강력한 2.5 Flash 모델로 지정합니다.
model = genai.GenerativeModel('models/gemini-2.5-flash')

# ==========================================
# 📌 Pydantic Models
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
# 📌 API Endpoints
# ==========================================

# API 1: 발표 영상 업로드 및 멀티모달 분석 (Gemini 적용)
@app.post("/api/v1/presentation/analyze", response_model=AnalyzeResponse)
async def analyze_presentation(video_file: UploadFile = File(...)):
    session_id = f"session_{uuid.uuid4().hex[:8]}"
    session_path = os.path.join(TEMP_DIR, session_id)
    os.makedirs(session_path, exist_ok=True)
    
    file_path = os.path.join(session_path, video_file.filename)
    gemini_file = None
    
    try:
        # 파일 저장
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(video_file.file, buffer)
            
        # 🌟 magic 없이 video_file.content_type을 바로 사용합니다.
        mime_type = video_file.content_type or "video/mp4" 
        print(f"[{session_id}] Gemini 업로드 시작 (MIME: {mime_type})")

        gemini_file = genai.upload_file(
            path=file_path,
            mime_type=mime_type
        )
        
        # ACTIVE 상태 대기 (기존 로직 동일)
        attempts = 0
        while True:
            gemini_file = genai.get_file(gemini_file.name)
            state = gemini_file.state.name
            
            if state == "ACTIVE":
                break
            elif state == "FAILED":
                raise Exception(f"Gemini 서버 파일 처리 실패 (State: {state})")
            
            if attempts > 20:
                raise Exception("처리 시간 초과")
            
            await asyncio.sleep(5)
            attempts += 1

        # 분석 요청
        prompt = """
        영상을 보고 다음 정보를 추출하여 JSON으로만 응답하세요.
        {
          "script": "발표자가 말한 전체 내용",
          "wpm": 130,
          "filler_words_count": 3,
          "gaze_score": 90,
          "logic_summary": "논리 구조 피드백"
        }
        """
        
        response = model.generate_content(
            [gemini_file, prompt],
            generation_config={"response_mime_type": "application/json"}
        )
        
        result_data = json.loads(response.text)
        # 3. 명시적 null(None)까지 완벽하게 차단하는 방어 로직
        return AnalyzeResponse(
            session_id=session_id,
            script=result_data.get("script") or "스크립트 추출 실패",
            analysis_result=AnalysisResult(
                wpm=int(result_data.get("wpm") or 0),
                filler_words_count=int(result_data.get("filler_words_count") or 0),
                gaze_score=int(result_data.get("gaze_score") or 0), # null이 오면 0으로 강제 변환
                logic_summary=result_data.get("logic_summary") or "분석 내용을 생성할 수 없습니다."
            )
        )

    except Exception as e:
        print(f"❌ 에러 발생: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if gemini_file:
            try: genai.delete_file(gemini_file.name)
            except: pass
        if os.path.exists(file_path):
            os.remove(file_path)

# API 2: 실시간 AI 롤플레잉 시작 (Gemini + gTTS 적용)
@app.post("/api/v1/roleplay/start", response_model=RoleplayStartResponse)
async def start_roleplay(req: RoleplayStartRequest):
    try:
        # 1. Gemini로 날카로운 꼬리 질문 생성
        prompt = f"""
        당신은 깐깐한 면접관입니다. 다음 발표 스크립트를 읽고,
        비즈니스 모델이나 기술적 허점을 찌르는 날카로운 압박 질문 딱 1개를 한국어로 생성하세요.
        길이는 2~3문장 이내로 짧고 구어체로 작성하세요.
        
        발표 스크립트: {req.script}
        """
        
        response = model.generate_content(prompt)
        ai_question = response.text.strip()
        
        # 2. gTTS를 사용한 무료 텍스트-음성 변환 (TTS)
        tts = gTTS(text=ai_question, lang='ko', slow=False)
        fp = BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        
        # 3. Base64 인코딩
        base64_audio = base64.b64encode(fp.read()).decode('utf-8')
        
        return RoleplayStartResponse(
            ai_question_text=ai_question,
            ai_question_audio=base64_audio
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"질문 생성 중 오류 발생: {str(e)}")

# API 3: 실시간 질의응답 (Gemini 멀티모달 + 무료 TTS 연동 완료)
@app.post("/api/v1/roleplay/turn", response_model=RoleplayTurnResponse)
async def roleplay_turn(
    session_id: str = Form(...),
    user_audio: UploadFile = File(...),
    history_context: str = Form("[]") # 기본값으로 빈 배열 형태의 문자열("[]")
):
    session_path = os.path.join(TEMP_DIR, session_id)
    os.makedirs(session_path, exist_ok=True)
    
    audio_path = os.path.join(session_path, user_audio.filename)
    gemini_file = None
    
    try:
        # 1. 사용자 음성 파일 로컬 임시 저장
        with open(audio_path, "wb") as buffer:
            shutil.copyfileobj(user_audio.file, buffer)
            
        print(f"[{session_id}] 사용자 답변 음성 Gemini 업로드 중...")
        
        # 2. Gemini에 사용자 음성 업로드
        # 프론트엔드(Web)에서 녹음된 webm 또는 wav 파일 전송
        mime_type = user_audio.content_type or "audio/webm"
        gemini_file = genai.upload_file(path=audio_path, mime_type=mime_type)
        
        # ACTIVE 상태 대기 로직
        attempts = 0
        while True:
            gemini_file = genai.get_file(gemini_file.name)
            if gemini_file.state.name == "ACTIVE":
                break
            elif gemini_file.state.name == "FAILED":
                raise Exception(f"음성 처리 실패: {getattr(gemini_file, 'error', 'Unknown')}")
            if attempts > 15:
                raise Exception("음성 처리 시간 초과 (30초 경과)")
            await asyncio.sleep(2)
            attempts += 1

        # 3. 이전 대화 내역(Context) 안전하게 파싱
        try:
            history = json.loads(history_context)
        except json.JSONDecodeError:
            history = []
        
        # 프롬프트에 넣기 위해 문자열로 변환
        history_str = json.dumps(history, ensure_ascii=False, indent=2)

        # 4. 1타 3피 프롬프트 (STT + 피드백 + 꼬리질문 생성)
        prompt = f"""
        당신은 깐깐한 면접관이자 압박 질문의 달인입니다.
        첨부된 오디오는 방금 전 당신의 질문에 대한 사용자의 답변 음성입니다.
        
        [이전 대화 내역]
        {history_str}
        
        오디오를 듣고 다음 3가지를 분석하여 반드시 JSON 형식으로만 응답하세요.
        1. "user_answer_stt": 사용자가 말한 답변 내용 전체 (텍스트 변환)
        2. "answer_feedback": 답변 내용의 논리나 설득력에 대한 날카롭고 짧은 피드백 (1문장)
        3. "next_ai_question_text": 사용자의 답변을 반박하거나 허점을 파고드는 다음 꼬리 질문 (1~2문장 구어체)

        응답 예시:
        {{
            "user_answer_stt": "저희 수익 모델은 구독형 서비스입니다...",
            "answer_feedback": "구독형 모델을 제시했으나, 초기 고객 유치 비용에 대한 설명이 부족합니다.",
            "next_ai_question_text": "구독형 좋죠. 근데 요즘 구독 피로도가 높은데 초기 고객은 대체 무슨 돈으로 마케팅해서 데려오실 건가요?"
        }}
        """
        
        # 5. Gemini 분석 요청
        response = model.generate_content(
            [gemini_file, prompt],
            generation_config={"response_mime_type": "application/json"}
        )
        
        # JSON 안전 파싱
        try:
            result_data = json.loads(response.text)
        except json.JSONDecodeError:
            text = response.text.replace("```json", "").replace("```", "").strip()
            result_data = json.loads(text)
            
        # 1번 API에서 썼던 완벽한 방어 로직(or 연산자) 재사용!
        stt = result_data.get("user_answer_stt") or "답변을 정확히 인식하지 못했습니다."
        feedback = result_data.get("answer_feedback") or "답변에 대한 피드백을 생성하지 못했습니다."
        next_question = result_data.get("next_ai_question_text") or "더 이상 질문할 내용이 없습니다."
        
        # 6. gTTS를 이용해 다음 꼬리 질문을 오디오(Base64)로 변환
        print(f"[{session_id}] 다음 질문 TTS 생성 중...")
        tts = gTTS(text=next_question, lang='ko', slow=False)
        fp = BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        base64_audio = base64.b64encode(fp.read()).decode('utf-8')
        
        # 7. 프론트엔드로 최종 리턴!
        return RoleplayTurnResponse(
            user_answer_stt=stt,
            answer_feedback=feedback,
            next_ai_question_text=next_question,
            next_ai_question_audio=base64_audio
        )
        
    except Exception as e:
        print(f"❌ API 3 에러 발생: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # 단일 파일 깔끔하게 정리 (서버 용량 방어)
        if gemini_file:
            try: genai.delete_file(gemini_file.name)
            except: pass
        if os.path.exists(audio_path):
            os.remove(audio_path)

# API 4: 종합 입체 피드백 리포트 생성 (Gemini 2.5 Flash 연동 완료)
@app.post("/api/v1/report/generate", response_model=ReportGenerateResponse)
async def generate_report(req: ReportGenerateRequest):
    try:
        # 1. 프론트에서 넘겨준 딕셔너리/리스트 데이터를 프롬프트에 넣기 좋게 문자열(JSON)로 변환
        presentation_data = json.dumps(req.presentation_analysis, ensure_ascii=False)
        
        qna_history_str = ""
        for idx, item in enumerate(req.qna_history):
            qna_history_str += f"\n[Q&A 턴 {idx+1}]\nQ(면접관): {item.q}\nA(사용자): {item.a}\n"

        # 2. 강력한 컨설턴트 페르소나 프롬프트 작성
        prompt = f"""
        당신은 상위 1% 스피치 및 커뮤니케이션 코치입니다.
        아래 제공된 사용자의 '발표 분석 결과'와 '실시간 압박 Q&A 내역'을 종합적으로 분석하여 최종 평가 리포트를 작성하세요.

        [1. 발표 체공 분석 결과]
        {presentation_data}

        [2. 실시간 압박 Q&A 내역]
        {qna_history_str if qna_history_str else "Q&A 내역이 없습니다."}

        위 데이터를 바탕으로 반드시 아래 JSON 형식에 맞춰 응답하세요. 다른 설명은 절대 추가하지 마세요.
        - overall_score: 0~100 사이의 종합 점수 (정수)
        - strengths: 강점 2~3개 (문자열 배열)
        - weaknesses: 약점 또는 개선점 2~3개 (문자열 배열)
        - action_items: 실전에서 바로 적용할 수 있는 구체적인 행동 지침 2~3개 (문자열 배열)

        응답 예시:
        {{
          "overall_score": 85,
          "strengths": ["질문 의도를 정확히 파악함", "비식별화라는 구체적인 해결책 제시"],
          "weaknesses": ["압박 질문 시 추임새(어, 음)가 발표 때보다 2배 증가함", "시선 처리가 불안정함"],
          "action_items": ["답변 전 1초간 심호흡하기", "예상 꼬리 질문 3가지 더 준비하기"]
        }}
        """

        print(f"[{req.session_id}] 종합 리포트 생성 중...")

        # 3. Gemini 2.5 Flash에게 분석 요청 (텍스트 전용이라 아주 빠름)
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )

        # 4. JSON 안전 파싱
        try:
            result_data = json.loads(response.text)
        except json.JSONDecodeError:
            text = response.text.replace("```json", "").replace("```", "").strip()
            result_data = json.loads(text)

        # 5. 방어 로직을 적용하여 최종 리턴 (or 연산자 활용)
        return ReportGenerateResponse(
            overall_score=int(result_data.get("overall_score") or 70),
            strengths=result_data.get("strengths") or ["데이터 부족으로 강점 분석 불가"],
            weaknesses=result_data.get("weaknesses") or ["데이터 부족으로 약점 분석 불가"],
            action_items=result_data.get("action_items") or ["지속적인 스피치 훈련이 필요합니다."]
        )

    except Exception as e:
        print(f"❌ API 4 에러 발생: {str(e)}")
        raise HTTPException(status_code=500, detail=f"리포트 생성 중 오류 발생: {str(e)}")

# API 5: 임시 데이터 정리 (Cleanup API)
@app.delete("/api/v1/session/cleanup")
async def cleanup_session(req: CleanupRequest):
    session_path = os.path.join(TEMP_DIR, req.session_id)
    
    # 해당 세션의 폴더가 존재하는지 확인
    if os.path.exists(session_path):
        try:
            # 폴더와 그 안의 모든 내용물(영상, 음성 등)을 한 번에 삭제
            shutil.rmtree(session_path)
            print(f"🧹 [{req.session_id}] 임시 파일 정리 완료")
            return {"status": "success", "message": f"{req.session_id}의 모든 임시 파일이 깔끔하게 삭제되었습니다."}
        except Exception as e:
            print(f"❌ [{req.session_id}] 삭제 실패: {str(e)}")
            raise HTTPException(status_code=500, detail=f"파일 삭제 실패: {str(e)}")
            
    # 이미 지워졌거나 없는 경우에도 에러를 내지 않고 부드럽게 넘어감 (멱등성 보장)
    return {"status": "success", "message": "해당 세션 폴더가 이미 비워져 있습니다."}