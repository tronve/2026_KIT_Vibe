import { useMemo } from 'react'

export type AIStatus = 'analyzing' | 'generating' | 'thinking' | 'preparing' | null

interface AIStatusIndicatorProps {
  status: AIStatus
  message?: string
}

/**
 * Global AI system status indicator
 * Shows animated status with smooth transitions
 * Non-blocking UI overlay
 *
 * States:
 * - analyzing: Processing presentation video
 * - generating: Creating AI questions
 * - thinking: AI is reasoning
 * - preparing: Building final report
 */
export function AIStatusIndicator({ status, message }: AIStatusIndicatorProps) {
  const config = useMemo(() => {
    switch (status) {
      case 'analyzing':
        return {
          icon: '📹',
          label: 'Analyzing presentation',
          color: 'from-cyan-500 to-blue-500',
          textColor: 'text-cyan-200',
          bgColor: 'bg-cyan-500/10 border-cyan-400/30',
          dotColor: 'bg-cyan-400',
        }
      case 'generating':
        return {
          icon: '✨',
          label: 'Generating AI question',
          color: 'from-purple-500 to-pink-500',
          textColor: 'text-purple-200',
          bgColor: 'bg-purple-500/10 border-purple-400/30',
          dotColor: 'bg-purple-400',
        }
      case 'thinking':
        return {
          icon: '🧠',
          label: 'AI is thinking',
          color: 'from-amber-500 to-orange-500',
          textColor: 'text-amber-200',
          bgColor: 'bg-amber-500/10 border-amber-400/30',
          dotColor: 'bg-amber-400',
        }
      case 'preparing':
        return {
          icon: '📊',
          label: 'Preparing report',
          color: 'from-emerald-500 to-teal-500',
          textColor: 'text-emerald-200',
          bgColor: 'bg-emerald-500/10 border-emerald-400/30',
          dotColor: 'bg-emerald-400',
        }
      default:
        return null
    }
  }, [status])

  if (!config || !status) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      {/* Animated background glow */}
      <div className={`absolute inset-0 rounded-2xl blur-xl opacity-30 bg-gradient-to-r ${config.color}`} />

      {/* Main indicator card */}
      <div
        className={`relative rounded-2xl border px-4 py-3 backdrop-blur-sm ${config.bgColor} shadow-xl`}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <span className="text-2xl animate-bounce">{config.icon}</span>

          {/* Text content */}
          <div className="flex flex-col gap-1">
            <p className={`text-sm font-semibold ${config.textColor}`}>
              {config.label}
            </p>
            {message && (
              <p className="text-xs text-slate-300">
                {message}
              </p>
            )}
          </div>

          {/* Animated dots */}
          <div className="ml-2 flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${config.dotColor} animate-pulse`}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1.4s',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Smooth transition styles */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

