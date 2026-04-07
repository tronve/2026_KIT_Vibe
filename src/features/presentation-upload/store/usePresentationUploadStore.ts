import { create } from 'zustand'
import { startPresentationAnalysis, uploadPresentationVideo } from '../../../api/presentationUploadApi'
import type { AnalysisResult, UploadResult, UploadStatus } from '../types'

const SUPPORTED_EXTENSIONS = ['.mp4', '.mov']
const SUPPORTED_MIME_TYPES = ['video/mp4', 'video/quicktime']
const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024

interface PresentationUploadState {
  file: File | null
  status: UploadStatus
  progress: number
  errorMessage: string | null
  uploadResult: UploadResult | null
  analysisResult: AnalysisResult | null
  setFile: (file: File | null) => void
  setStatus: (status: UploadStatus) => void
  setProgress: (progress: number) => void
  setErrorMessage: (errorMessage: string | null) => void
  setUploadResult: (uploadResult: UploadResult | null) => void
  setAnalysisResult: (analysisResult: AnalysisResult | null) => void
  validateAndSetFile: (file: File) => boolean
  startUploadWorkflow: () => Promise<void>
  reset: () => void
}

const normalizeProgress = (progress: number) => {
  if (progress < 0) {
    return 0
  }

  if (progress > 100) {
    return 100
  }

  return Math.round(progress)
}

const hasSupportedExtension = (fileName: string) => {
  const lowerFileName = fileName.toLowerCase()
  return SUPPORTED_EXTENSIONS.some((extension) => lowerFileName.endsWith(extension))
}

export const usePresentationUploadStore = create<PresentationUploadState>((set) => ({
  file: null,
  status: 'idle',
  progress: 0,
  errorMessage: null,
  uploadResult: null,
  analysisResult: null,
  setFile: (file) => set({ file }),
  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress: normalizeProgress(progress) }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  setUploadResult: (uploadResult) => set({ uploadResult }),
  setAnalysisResult: (analysisResult) => set({ analysisResult }),
  validateAndSetFile: (file) => {
    const isSupportedMimeType = SUPPORTED_MIME_TYPES.includes(file.type)
    const isSupportedFileName = hasSupportedExtension(file.name)

    if (!isSupportedMimeType && !isSupportedFileName) {
      set({
        file: null,
        status: 'error',
        progress: 0,
        uploadResult: null,
        analysisResult: null,
        errorMessage: 'Only MP4 and MOV files are supported.',
      })
      return false
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      set({
        file: null,
        status: 'error',
        progress: 0,
        uploadResult: null,
        analysisResult: null,
        errorMessage: 'File is too large. Maximum size is 500MB.',
      })
      return false
    }

    set({
      file,
      status: 'idle',
      progress: 0,
      uploadResult: null,
      analysisResult: null,
      errorMessage: null,
    })
    return true
  },
  startUploadWorkflow: async () => {
    const currentFile = usePresentationUploadStore.getState().file

    if (!currentFile) {
      set({
        status: 'error',
        errorMessage: 'Please select an MP4 or MOV file before starting upload.',
      })
      return
    }

    set({
      status: 'uploading',
      progress: 0,
      errorMessage: null,
      uploadResult: null,
      analysisResult: null,
    })

    try {
      const uploadResult = await uploadPresentationVideo(currentFile, (nextProgress) => {
        set({ progress: normalizeProgress(nextProgress) })
      })

      set({
        status: 'processing',
        progress: 100,
        uploadResult,
      })

      const analysisResult = await startPresentationAnalysis(uploadResult.uploadId)

      set({
        status: 'completed',
        analysisResult,
      })
    } catch {
      set({
        status: 'error',
        errorMessage: 'Upload workflow failed. Please retry.',
      })
    }
  },
  reset: () =>
    set({
      file: null,
      status: 'idle',
      progress: 0,
      uploadResult: null,
      analysisResult: null,
      errorMessage: null,
    }),
}))

