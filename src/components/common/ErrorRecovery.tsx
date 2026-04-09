import { isApiError } from '../../api'

interface ErrorRecoveryProps {
  error?: unknown
  sessionId?: string | null
  onRetry?: () => void | Promise<void>
  onRetryAudioUpload?: () => void | Promise<void>
  onRecoverSession?: () => void
}

export function ErrorRecovery({
  error,
  sessionId,
  onRetry,
  onRetryAudioUpload,
  onRecoverSession,
}: ErrorRecoveryProps) {
  const { title, message } = getFriendlyMessage(error)

  return (
    <div className="space-y-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-rose-300">AI 복구 도우미</p>
        <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-rose-100">{message}</p>
      </div>

      {sessionId ? (
        <p className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-mono text-xs text-rose-200">
          session_id: {sessionId}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {onRetry ? (
          <button
            type="button"
            onClick={() => {
              void onRetry()
            }}
            className="rounded-full bg-brand-500 px-4 py-2 text-xs font-semibold text-slate-950"
          >
            네트워크 요청 다시 시도
          </button>
        ) : null}

        {onRetryAudioUpload ? (
          <button
            type="button"
            onClick={() => {
              void onRetryAudioUpload()
            }}
            className="rounded-full border border-brand-300/50 bg-brand-500/20 px-4 py-2 text-xs font-semibold text-brand-100"
          >
            오디오 업로드 다시 시도
          </button>
        ) : null}

        {onRecoverSession ? (
          <button
            type="button"
            onClick={onRecoverSession}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white"
          >
            세션 복구
          </button>
        ) : null}
      </div>
    </div>
  )
}

function getFriendlyMessage(error: unknown): { title: string; message: string } {
  if (!error) {
    return {
      title: '일시적인 문제가 발생했습니다',
      message: '다시 시도해 주세요. 세션은 유지됩니다.',
    }
  }

  if (isApiError(error)) {
    if (error.isNetworkError) {
      return {
        title: '네트워크 연결이 끊어졌습니다',
        message: '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
      }
    }

    if ((error.status ?? 0) >= 500) {
      return {
        title: '서버 응답이 지연되고 있습니다',
        message: '일시적인 서버 오류입니다. 잠시 후 다시 시도해 주세요.',
      }
    }

    if (error.status === 404) {
      return {
        title: '세션 정보를 찾을 수 없습니다',
        message: 'session_id로 세션 복구를 진행해 주세요.',
      }
    }

    return {
      title: '요청을 다시 시도해 주세요',
      message: error.message || '예상치 못한 응답입니다. 다시 시도해 주세요.',
    }
  }

  if (error instanceof Error) {
    return {
      title: '예상치 못한 처리 오류',
      message: error.message,
    }
  }

  return {
    title: '알 수 없는 문제가 감지되었습니다',
    message: '다시 시도해 주세요. 반복되면 세션 복구를 진행해 주세요.',
  }
}

