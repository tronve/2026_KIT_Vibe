import { apiRequest } from './client'
import type { PresentationAnalyzeResponse } from '../types'

const analysisCache = new Map<string, PresentationAnalyzeResponse>()

export interface UploadPresentationVideoOptions {
  onUploadProgress?: (progress: number) => void
}

export interface AnalysisUploadInput {
  videoFile?: File | null
  pptRecordingVideoFile?: File | null
}

export async function uploadPresentationVideo(
  input: File | AnalysisUploadInput,
  options: UploadPresentationVideoOptions = {},
): Promise<PresentationAnalyzeResponse> {
  const normalizedInput: AnalysisUploadInput =
    input instanceof File
      ? { videoFile: input }
      : {
          videoFile: input.videoFile ?? null,
          pptRecordingVideoFile: input.pptRecordingVideoFile ?? null,
        }

  if (!normalizedInput.videoFile && !normalizedInput.pptRecordingVideoFile) {
    throw new Error('At least one source file is required for analysis.')
  }

  const formData = new FormData()
  if (normalizedInput.videoFile) {
    formData.append('video_file', normalizedInput.videoFile)
  }
  if (normalizedInput.pptRecordingVideoFile) {
    formData.append('ppt_recording_video_file', normalizedInput.pptRecordingVideoFile)
  }

  const response = await apiRequest<PresentationAnalyzeResponse>({
    method: 'POST',
    // API spec: POST /api/v1/presentation/analyze
    // baseURL is configured with /api/v1 in the shared axios client.
    url: '/presentation/analyze',
    data: formData,
    onUploadProgress: (event) => {
      if (!event.total) {
        return
      }

      const progress = Math.round((event.loaded / event.total) * 100)
      options.onUploadProgress?.(progress)
    },
  })

  analysisCache.set(response.session_id, response)
  return response
}

export async function getAnalysisResult(sessionId: string): Promise<PresentationAnalyzeResponse> {
  const cachedResult = analysisCache.get(sessionId)

  if (!cachedResult) {
    throw new Error('Analysis result is not available for the provided session_id.')
  }

  return cachedResult
}

