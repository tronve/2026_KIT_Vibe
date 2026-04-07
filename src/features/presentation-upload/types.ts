export type UploadStatus =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'error'

export interface UploadResult {
  uploadId: string
  fileName: string
}

export interface AnalysisResult {
  analysisId: string
  message: string
}

