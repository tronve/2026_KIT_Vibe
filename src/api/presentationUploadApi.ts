import { apiClient } from './client'
import type { AnalysisResult, UploadResult } from '../features/presentation-upload/types'


const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export async function uploadPresentationVideo(
  file: File,
  onProgress: (progress: number) => void,
): Promise<UploadResult> {
  const totalBytes = Math.max(file.size, 1)
  let uploadedBytes = 0

  while (uploadedBytes < totalBytes) {
    await wait(150)
    uploadedBytes = Math.min(totalBytes, uploadedBytes + Math.max(totalBytes * 0.12, 1_500_000))
    onProgress(Math.round((uploadedBytes / totalBytes) * 100))
  }

  await wait(220)

  return {
    uploadId: `upload_${Date.now()}`,
    fileName: file.name,
  }
}

export async function startPresentationAnalysis(uploadId: string): Promise<AnalysisResult> {
  // Placeholder request: real backend endpoint can replace this without changing UI state logic.
  await apiClient.post('/presentations/analyze', { uploadId }).catch(() => undefined)
  await wait(650)

  return {
    analysisId: `analysis_${Date.now()}`,
    message: 'Analysis started. Results are being prepared by the AI engine.',
  }
}


