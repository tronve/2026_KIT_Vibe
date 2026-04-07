import { apiRequest } from './client'
import type { PresentationAnalyzeResponse } from '../types'

const analysisCache = new Map<string, PresentationAnalyzeResponse>()

export interface UploadPresentationVideoOptions {
  onUploadProgress?: (progress: number) => void
}

export async function uploadPresentationVideo(
  file: File,
  options: UploadPresentationVideoOptions = {},
): Promise<PresentationAnalyzeResponse> {
  const formData = new FormData()
  formData.append('video_file', file)

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

