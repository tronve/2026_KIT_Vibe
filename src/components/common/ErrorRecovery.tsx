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
            className="rounded-full bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950"
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
            className="rounded-full border border-cyan-300/50 bg-cyan-500/20 px-4 py-2 text-xs font-semibold text-cyan-100"
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
      message: '다시 시도해 주세요. 현재 세션 맥락을 유지한 채 이어서 진행합니다.',
    }
  }

  if (isApiError(error)) {
    if (error.isNetworkError) {
      return {
        title: '네트워크 연결이 끊어졌습니다',
        message:
          '현재 서버에 연결할 수 없습니다. 진행 내용은 보존되며, 다시 시도하면 대부분 바로 복구됩니다.',
      }
    }

    if ((error.status ?? 0) >= 500) {
      return {
        title: '서버 응답이 지연되고 있습니다',
        message:
          'AI 코칭 서버에서 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      }
    }

    if (error.status === 404) {
      return {
        title: '세션 정보를 찾을 수 없습니다',
        message:
          '서버에서 해당 세션을 찾지 못했습니다. session_id로 세션 복구를 진행해 동기화해 주세요.',
      }
    }

    return {
      title: '요청을 다시 시도해 주세요',
      message: error.message || '예상치 못한 응답을 받았습니다. 다시 시도하면 코칭 흐름을 이어갈 수 있습니다.',
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
    message: '다시 시도하면 복구되는 경우가 많습니다. 계속 발생하면 세션 복구 후 다시 시도해 주세요.',
  }
}

