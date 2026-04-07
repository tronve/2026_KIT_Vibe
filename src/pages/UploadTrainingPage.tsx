import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const mockFeedbackItems: VideoFeedbackItem[] = [
  {
    id: 'feedback-1',
    timestamp: 8,
    severity: 'medium',
    message: 'Eye contact drops while introducing the problem statement.',
  },
  {
    id: 'feedback-2',
    timestamp: 22,
    severity: 'high',
    message: 'Speech speed increases above target WPM. Pause briefly before next key point.',
  },
  {
    id: 'feedback-3',
    timestamp: 37,
    severity: 'low',
    message: 'Great posture and confident gesture emphasis during the solution section.',
  },
  {
    id: 'feedback-4',
    timestamp: 51,
    severity: 'medium',
    message: 'Logical transition to call-to-action can be clearer for stronger close.',
  },
]

const analysisStages = [
  { id: 'stage-upload', label: 'Uploading presentation video' },
  { id: 'stage-transcript', label: 'Extracting transcript and speech signals' },
  { id: 'stage-evaluation', label: 'Evaluating delivery and response quality' },
  { id: 'stage-insights', label: 'Preparing personalized coaching insights' },
]

const friendlyMessages = [
  'Analyzing voice rhythm and pacing patterns in real time.',
  'Scanning response structure for confidence and clarity signals.',
  'Comparing your performance with top-pitch communication patterns.',
  'Generating coach-ready recommendations you can apply immediately.',
]

export function UploadTrainingPage() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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
      setAiStatus('analyzing', 'Processing your presentation...')
    } else if (status === 'success') {
      clearAiStatus()
    } else if (status === 'error') {
      clearAiStatus()
    }
  }, [isUploading, status, setAiStatus, clearAiStatus])

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        setLocalError('Only MP4 or MOV video files are allowed.')
        return
      }

      const nextFile = acceptedFiles[0]
      if (!nextFile) {
        return
      }

      setLocalError(null)
      setSelectedFile(nextFile)
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

  const handleStartUpload = async () => {
    if (!selectedFile) {
      setLocalError('Please select a video file first.')
      return
    }

    const response = await upload(selectedFile)
    navigate(`/reports?sessionId=${encodeURIComponent(response.session_id)}`)
  }

  const handleRetryUpload = useCallback(async () => {
    if (!selectedFile) {
      setLocalError('Please select a video file first.')
      return
    }

    setLocalError(null)
    const response = await upload(selectedFile)
    navigate(`/reports?sessionId=${encodeURIComponent(response.session_id)}`)
  }, [navigate, selectedFile, upload])

  const canStartWorkflow = Boolean(selectedFile) && !isUploading

  const previewUrl = useMemo(() => {
    if (!selectedFile) {
      return null
    }

    return URL.createObjectURL(selectedFile)
  }, [selectedFile])

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
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Presentation Upload</p>
          <h2 className="mt-2 text-3xl font-black text-white">Upload your pitch video for AI analysis.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Drop an MP4 or MOV recording. We will prepare a transcript, assess delivery quality, and launch
            analysis insights in your coaching workspace.
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
            <p className="text-lg font-semibold text-white">Drag and drop your video here</p>
            <p className="text-sm text-slate-400">Supported formats: .mp4, .mov (max 500MB)</p>
            <div className="pt-2">
              <Button variant="secondary" onClick={open}>
                Browse video
              </Button>
            </div>
          </div>
        </div>

        {selectedFile ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Selected file</p>
            <p className="mt-2 font-semibold text-white">{selectedFile?.name}</p>
            <p className="mt-1 text-sm text-slate-400">{selectedFile ? formatFileSize(selectedFile.size) : '-'}</p>
          </div>
        ) : null}

        {previewUrl ? (
          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Video preview</p>
              <p className="mt-1 text-sm text-slate-300">Click timeline items to jump to specific feedback moments.</p>
            </div>

            <video
              ref={videoRef}
              src={previewUrl}
              controls
              className="w-full rounded-2xl border border-white/10 bg-slate-900"
            />

            <VideoFeedbackTimeline videoRef={videoRef} items={mockFeedbackItems} />
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
              <span>Upload progress</span>
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
            {isUploading ? 'Uploading...' : 'Start analysis'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              reset()
              setSelectedFile(null)
              setLocalError(null)
            }}
          >
            Reset
          </Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">AI analysis status</p>

        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Workflow state</p>
            <p className="mt-2 text-lg font-semibold text-white">{status}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Session ID</p>
            <p className="mt-2 break-all text-sm font-medium text-slate-200">
              {sessionId ?? 'Not available'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Analysis</p>
            <p className="mt-2 text-sm text-slate-200">
              {data?.analysis_result.logic_summary ?? 'Analysis has not started yet.'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

