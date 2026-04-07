import { useMemo, useState } from 'react'
import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { uploadPresentationVideo, type AnalysisUploadInput } from '../api/analysis'
import { isApiError, type ApiError } from '../api/client'
import type { PresentationAnalyzeResponse } from '../types'

export type AnalysisUploadStatus = 'idle' | 'uploading' | 'success' | 'error'

export interface UseAnalysisUploadResult {
  upload: (input: AnalysisUploadInput) => Promise<PresentationAnalyzeResponse>
  uploadAsync: UseMutationResult<
    PresentationAnalyzeResponse,
    ApiError | Error,
    AnalysisUploadInput
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

  const mutation = useMutation<PresentationAnalyzeResponse, ApiError | Error, AnalysisUploadInput>({
    mutationFn: (input) =>
      uploadPresentationVideo(input, {
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

    return mutation.error.message || '업로드에 실패했습니다. 다시 시도해 주세요.'
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

