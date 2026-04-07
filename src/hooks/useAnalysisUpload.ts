import { useMemo, useState } from 'react'
import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { uploadPresentationVideo } from '../api/analysis'
import { isApiError, type ApiError } from '../api/client'
import type { PresentationAnalyzeResponse } from '../types'

export type AnalysisUploadStatus = 'idle' | 'uploading' | 'success' | 'error'

export interface UseAnalysisUploadResult {
  upload: (file: File) => Promise<PresentationAnalyzeResponse>
  uploadAsync: UseMutationResult<
    PresentationAnalyzeResponse,
    ApiError | Error,
    File
  >['mutateAsync']
  reset: () => void
  data: PresentationAnalyzeResponse | undefined
  sessionId: string | null
  uploadProgress: number
  status: AnalysisUploadStatus
  isUploading: boolean
  isSuccess: boolean
  isError: boolean
  error: ApiError | Error | null
  errorMessage: string | null
}

export function useAnalysisUpload(): UseAnalysisUploadResult {
  const [uploadProgress, setUploadProgress] = useState(0)

  const mutation = useMutation<PresentationAnalyzeResponse, ApiError | Error, File>({
    mutationFn: (file) =>
      uploadPresentationVideo(file, {
        onUploadProgress: (progress) => {
          setUploadProgress(progress)
        },
      }),
    onMutate: () => {
      setUploadProgress(0)
    },
    onSuccess: () => {
      setUploadProgress(100)
    },
    onError: () => {
      setUploadProgress(0)
    },
  })

  const status: AnalysisUploadStatus =
    mutation.status === 'pending'
      ? 'uploading'
      : mutation.status === 'success'
        ? 'success'
        : mutation.status === 'error'
          ? 'error'
          : 'idle'

  const errorMessage = useMemo(() => {
    if (!mutation.error) {
      return null
    }

    if (isApiError(mutation.error) && mutation.error.message) {
      return mutation.error.message
    }

    return mutation.error.message || 'Upload failed. Please try again.'
  }, [mutation.error])

  const reset = () => {
    setUploadProgress(0)
    mutation.reset()
  }

  return {
    upload: mutation.mutateAsync,
    uploadAsync: mutation.mutateAsync,
    reset,
    data: mutation.data,
    sessionId: mutation.data?.session_id ?? null,
    uploadProgress,
    status,
    isUploading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error ?? null,
    errorMessage,
  }
}

