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
        <p className="text-xs uppercase tracking-[0.25em] text-rose-300">AI Recovery Assistant</p>
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
            Retry network request
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
            Retry audio upload
          </button>
        ) : null}

        {onRecoverSession ? (
          <button
            type="button"
            onClick={onRecoverSession}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white"
          >
            Recover session
          </button>
        ) : null}
      </div>
    </div>
  )
}

function getFriendlyMessage(error: unknown): { title: string; message: string } {
  if (!error) {
    return {
      title: 'I hit a temporary issue',
      message: 'Please try again. I will continue from your current session context.',
    }
  }

  if (isApiError(error)) {
    if (error.isNetworkError) {
      return {
        title: 'Connection interrupted',
        message:
          'I could not reach the server right now. Your progress is safe, and retry usually resolves this quickly.',
      }
    }

    if ((error.status ?? 0) >= 500) {
      return {
        title: 'Server is under load',
        message:
          'The AI coaching server responded with a temporary issue. Please retry in a moment while I keep your context ready.',
      }
    }

    if (error.status === 404) {
      return {
        title: 'Session context not found',
        message:
          'I could not locate this session on the server. Use session recovery to re-sync using your session_id.',
      }
    }

    return {
      title: 'Request needs another try',
      message: error.message || 'I received an unexpected response. Retry to continue your coaching flow.',
    }
  }

  if (error instanceof Error) {
    return {
      title: 'Unexpected processing issue',
      message: error.message,
    }
  }

  return {
    title: 'Unknown issue detected',
    message: 'Retrying should recover this flow. If it persists, recover the session first and try again.',
  }
}

