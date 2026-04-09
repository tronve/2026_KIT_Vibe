import axios, {
  AxiosHeaders,
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

export interface ApiError extends Error {
  name: 'ApiError'
  status?: number
  code?: string
  details?: unknown
  method?: string
  url?: string
  isNetworkError: boolean
}

const isFormDataPayload = (payload: unknown): payload is FormData => payload instanceof FormData

const shouldUseJsonContentType = (payload: unknown) => {
  if (payload === undefined || payload === null) {
    return false
  }

  if (
    payload instanceof FormData ||
    payload instanceof Blob ||
    payload instanceof File ||
    payload instanceof ArrayBuffer ||
    payload instanceof URLSearchParams
  ) {
    return false
  }

  return true
}

const normalizeApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError
    const normalized = new Error(
      (typeof axiosError.response?.data === 'object' &&
      axiosError.response?.data !== null &&
      'message' in axiosError.response.data
        ? String((axiosError.response.data as { message?: unknown }).message)
        : undefined) ?? axiosError.message,
    ) as ApiError

    normalized.name = 'ApiError'
    normalized.status = axiosError.response?.status
    normalized.code = axiosError.code
    normalized.details = axiosError.response?.data
    normalized.method = axiosError.config?.method?.toUpperCase()
    normalized.url = axiosError.config?.url
    normalized.isNetworkError = !axiosError.response

    return normalized
  }

  const fallback = new Error('Unexpected API error') as ApiError
  fallback.name = 'ApiError'
  fallback.isNetworkError = false
  return fallback
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const headers = AxiosHeaders.from(config.headers)

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  if (isFormDataPayload(config.data)) {
    // Let the browser set multipart boundary automatically.
    headers.delete('Content-Type')
  } else if (shouldUseJsonContentType(config.data) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  config.headers = headers
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error)),
)

export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof Error && error.name === 'ApiError'
}

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {

  const response = await apiClient.request<T>(config)
  return response.data
}



