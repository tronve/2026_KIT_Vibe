export type Nullable<T> = T | null
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'
export type RoutePath =
  | '/'
  | '/dashboard'
  | '/upload-training'
  | '/ai-qa-session'
  | '/reports'
  | '/home'
  | '/practice'

