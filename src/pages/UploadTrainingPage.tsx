import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import {
  AIThinking,
  AiProcessingLoadingScreen,
  Button,
  Card,
  ErrorRecovery,
  VideoFeedbackTimeline,
  type VideoFeedbackItem,
} from '../components'
import { useAnalysisUpload } from '../hooks'
import { useAppStore } from '../store'
import type { PresentationAnalyzeResponse } from '../types'

const ANALYSIS_DATA_STORAGE_KEY = 'kit_vibe_analysis_data'

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const buildFeedbackTimeline = (
  analysis: PresentationAnalyzeResponse['analysis_result'] | undefined,
): VideoFeedbackItem[] => {
  if (!analysis) {
    return []
  }

  return [
    {
      id: 'feedback-gaze',
      timestamp: 8,
      severity: analysis.gaze_score < 65 ? 'high' : analysis.gaze_score < 80 ? 'medium' : 'low',
      message:
        analysis.gaze_score >= 80
          ? `아이 컨택 점수 ${analysis.gaze_score}/100점. 청중과의 시선 연결이 안정적입니다.`
          : `아이 컨택 점수 ${analysis.gaze_score}/100점. 전환 구간에서 청중을 더 자주 바라보세요.`,
    },
    {
      id: 'feedback-wpm',
      timestamp: 22,
      severity: analysis.wpm > 160 || analysis.wpm < 90 ? 'high' : analysis.wpm > 145 || analysis.wpm < 105 ? 'medium' : 'low',
      message:
        analysis.wpm > 150
          ? `말하기 속도는 ${analysis.wpm} WPM입니다. 핵심 포인트에서 속도를 조금 낮춰보세요.`
          : analysis.wpm < 95
            ? `말하기 속도는 ${analysis.wpm} WPM입니다. 템포를 약간 올리면 전달력이 좋아집니다.`
            : `말하기 속도는 ${analysis.wpm} WPM입니다. 발표에 적절한 속도 범위입니다.`,
    },
    {
      id: 'feedback-filler',
      timestamp: 36,
      severity: analysis.filler_words_count >= 8 ? 'high' : analysis.filler_words_count >= 3 ? 'medium' : 'low',
      message:
        analysis.filler_words_count === 0
          ? '불필요한 군더더기 표현이 감지되지 않았습니다. 전달이 깔끔합니다.'
          : `군더더기 표현이 ${analysis.filler_words_count}회 감지되었습니다. 짧은 침묵으로 대체해 보세요.`,
    },
    {
      id: 'feedback-logic',
      timestamp: 52,
      severity: 'medium',
      message: analysis.logic_summary,
    },
  ]
}

const analysisStages = [
  { id: 'stage-upload', label: '발표 자료 업로드 중' },
  { id: 'stage-transcript', label: '스크립트 및 음성 신호 분석 중' },
  { id: 'stage-evaluation', label: '전달력과 답변 품질 평가 중' },
  { id: 'stage-insights', label: '개인 맞춤 코칭 인사이트 생성 중' },
]

const friendlyMessages = [
  '발화 리듬과 속도 패턴을 실시간으로 분석하고 있어요.',
  '답변 구조에서 자신감과 명료도 신호를 추출하고 있어요.',
  '우수 발표 패턴과 현재 발표를 비교 분석하고 있어요.',
  '바로 적용할 수 있는 코칭 제안을 정리하고 있어요.',
]

const statusLabels: Record<string, string> = {
  idle: '대기',
  uploading: '업로드 중',
  success: '완료',
  error: '오류',
}

export function UploadTrainingPage() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [pptVideoFile, setPptVideoFile] = useState<File | null>(null)
  const [nextStep, setNextStep] = useState<'analysis' | 'qa'>('analysis')
  const [localError, setLocalError] = useState<string | null>(null)

  const { setAiStatus, clearAiStatus, setCurrentStep, setSessionId } = useAppStore()

  const {
    upload,
    reset,
    status,
    uploadProgress,
    isUploading,
    sessionId,
    data,
    errorMessage,
  } = useAnalysisUpload()

  // Update session step and ID
  useEffect(() => {
    setCurrentStep('upload')
    if (sessionId) {
      setSessionId(sessionId)
    }
  }, [sessionId, setCurrentStep, setSessionId])

  // Update AI status based on upload state
  useEffect(() => {
    if (isUploading) {
      setAiStatus('analyzing', '발표 자료를 분석하고 있습니다...')
    } else if (status === 'success') {
      clearAiStatus()
    } else if (status === 'error') {
      clearAiStatus()
    }
  }, [isUploading, status, setAiStatus, clearAiStatus])

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        setLocalError('영상 드롭존에는 MP4 또는 MOV 파일만 업로드할 수 있습니다.')
        return
      }

      const nextFile = acceptedFiles[0]
      if (!nextFile) {
        return
      }

      setLocalError(null)
      setVideoFile(nextFile)
    },
    [],
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    maxFiles: 1,
    noClick: true,
    noKeyboard: true,
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
    },
  })

  const handlePptVideoFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null
    setPptVideoFile(nextFile)
  }, [])

  const validateSources = useCallback(() => {
    if (!videoFile && !pptVideoFile) {
      setLocalError('발표 영상 또는 PPT 화면 녹화 영상 중 하나 이상을 업로드해 주세요.')
      return false
    }

    setLocalError(null)
    return true
  }, [pptVideoFile, videoFile])

  const persistAnalysis = useCallback((response: PresentationAnalyzeResponse) => {
    try {
      window.localStorage.setItem(
        ANALYSIS_DATA_STORAGE_KEY,
        JSON.stringify({
          sessionId: response.session_id,
          analysis: response,
          timestamp: new Date().toISOString(),
        }),
      )
    } catch {
      // Ignore storage write failures without interrupting upload flow.
    }
  }, [])

  const handleUploadSuccess = useCallback(
    (response: PresentationAnalyzeResponse) => {
      setSessionId(response.session_id)
      setCurrentStep('analysis')
      persistAnalysis(response)

      const destinationPath =
        nextStep === 'qa'
          ? `/ai-qa-session?sessionId=${encodeURIComponent(response.session_id)}`
          : `/analysis?sessionId=${encodeURIComponent(response.session_id)}`

      navigate(destinationPath)
    },
    [navigate, nextStep, persistAnalysis, setCurrentStep, setSessionId],
  )

  const handleStartUpload = async () => {
    if (!validateSources()) {
      return
    }

    const response = await upload({
      videoFile,
      pptRecordingVideoFile: pptVideoFile,
    })
    handleUploadSuccess(response)
  }

  const handleRetryUpload = useCallback(async () => {
    if (!validateSources()) {
      return
    }

    setLocalError(null)
    const response = await upload({
      videoFile,
      pptRecordingVideoFile: pptVideoFile,
    })
    handleUploadSuccess(response)
  }, [handleUploadSuccess, pptVideoFile, upload, validateSources, videoFile])

  const canStartWorkflow = (Boolean(videoFile) || Boolean(pptVideoFile)) && !isUploading

  const previewUrl = useMemo(() => {
    if (!videoFile) {
      return null
    }

    return URL.createObjectURL(videoFile)
  }, [videoFile])

  const feedbackItems = useMemo(() => buildFeedbackTimeline(data?.analysis_result), [data])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">발표 업로드</p>
          <h2 className="mt-2 text-3xl font-black text-white">AI 분석을 위해 발표 영상을 업로드하세요.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            메인 발표 영상에 더해 PPT 화면 녹화 영상을 선택적으로 업로드할 수 있습니다. 두 영상을 함께 업로드하면
            AI가 종합 분석하여 더 정밀한 코칭 신호를 제공합니다.
          </p>
        </div>

        <div
          {...getRootProps()}
          className={`rounded-[28px] border-2 border-dashed p-8 transition ${
            isDragActive
              ? 'border-cyan-300 bg-cyan-400/10 shadow-glow'
              : 'border-cyan-400/30 bg-gradient-to-br from-cyan-400/5 to-transparent'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-3 text-center">
            <p className="text-lg font-semibold text-white">여기에 발표 영상을 드래그 앤 드롭하세요</p>
            <p className="text-sm text-slate-400">지원 형식: .mp4, .mov</p>
            <div className="pt-2">
              <Button variant="secondary" onClick={open}>
                영상 선택
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">선택 업로드: PPT 화면 녹화 영상</p>
            <p className="mt-2 text-sm text-slate-300">`.mp4` 또는 `.mov`</p>
            <input
              type="file"
              accept="video/mp4,video/quicktime,.mp4,.mov"
              onChange={handlePptVideoFileChange}
              className="mt-3 block w-full cursor-pointer text-sm text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-100"
            />
            <p className="mt-2 text-xs text-slate-500">{pptVideoFile ? pptVideoFile.name : '선택된 PPT 화면 녹화 영상 없음'}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">분석 완료 후 이동</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant={nextStep === 'analysis' ? 'primary' : 'secondary'}
              onClick={() => setNextStep('analysis')}
            >
              분석 페이지로 이동
            </Button>
            <Button
              variant={nextStep === 'qa' ? 'primary' : 'secondary'}
              onClick={() => setNextStep('qa')}
            >
              AI Q&A 세션으로 이동
            </Button>
          </div>
        </div>

        {videoFile || pptVideoFile ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">선택된 소스</p>
            {videoFile ? <p className="mt-2 text-sm text-slate-200">발표 영상: {videoFile.name} ({formatFileSize(videoFile.size)})</p> : null}
            {pptVideoFile ? <p className="mt-2 text-sm text-slate-200">PPT 녹화 영상: {pptVideoFile.name} ({formatFileSize(pptVideoFile.size)})</p> : null}
          </div>
        ) : null}

        {previewUrl ? (
          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">영상 미리보기</p>
               <p className="mt-1 text-sm text-slate-300">타임라인은 현재 분석 결과를 기반으로 생성됩니다.</p>
            </div>

            <video
              ref={videoRef}
              src={previewUrl}
              controls
              className="w-full rounded-2xl border border-white/10 bg-slate-900"
            />

            {feedbackItems.length > 0 ? (
              <VideoFeedbackTimeline videoRef={videoRef} items={feedbackItems} />
            ) : (
              <p className="text-sm text-slate-400">분석을 시작하면 피드백 타임라인이 표시됩니다.</p>
            )}
          </div>
        ) : null}

        {status === 'uploading' ? (
          <div className="space-y-4">
            <AIThinking />
            <AiProcessingLoadingScreen
              status="uploading"
              progress={uploadProgress}
              stages={analysisStages}
              friendlyMessages={friendlyMessages}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
               <span>업로드 진행률</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {localError ? (
          <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {localError}
          </p>
        ) : null}

        {!localError && status === 'error' ? (
          <ErrorRecovery
            error={errorMessage ? new Error(errorMessage) : undefined}
            sessionId={sessionId}
            onRetry={() => {
              void handleRetryUpload()
            }}
            onRecoverSession={() => {
              if (!sessionId) {
                return
              }
              navigate(`/reports?sessionId=${encodeURIComponent(sessionId)}`)
            }}
          />
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleStartUpload} disabled={!canStartWorkflow || isUploading}>
            {isUploading ? '업로드 중...' : '분석 시작'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              reset()
              setVideoFile(null)
              setPptVideoFile(null)
              setLocalError(null)
            }}
          >
            초기화
          </Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">AI 분석 상태</p>

        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">워크플로 상태</p>
            <p className="mt-2 text-lg font-semibold text-white">{statusLabels[status] ?? status}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">세션 ID</p>
            <p className="mt-2 break-all text-sm font-medium text-slate-200">
              {sessionId ?? '없음'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">분석 요약</p>
            <p className="mt-2 text-sm text-slate-200">
              {data?.analysis_result.logic_summary ?? '아직 분석이 시작되지 않았습니다.'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

