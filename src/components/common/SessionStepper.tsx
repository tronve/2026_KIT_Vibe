interface StepperStep {
  id: 'upload' | 'analysis' | 'interview' | 'report'
  label: string
  icon: string
}

interface SessionStepperProps {
  currentStep: StepperStep['id'] | null
  sessionId: string | null
}

/**
 * Session progress stepper showing interview workflow stages
 * - Upload: User uploads presentation video
 * - Analysis: AI analyzes presentation
 * - Interview: Real-time Q&A session
 * - Report: Final coaching report
 *
 * Displays current step with smooth animations
 */
export function SessionStepper({ currentStep, sessionId }: SessionStepperProps) {
  const steps: StepperStep[] = [
    {
      id: 'upload',
      label: '업로드',
      icon: '📹',
    },
    {
      id: 'analysis',
      label: '분석',
      icon: '🔍',
    },
    {
      id: 'interview',
      label: '인터뷰',
      icon: '🎤',
    },
    {
      id: 'report',
      label: '리포트',
      icon: '📊',
    },
  ]

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep)
  const progressPercentage = currentStepIndex >= 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0

  if (!sessionId && !currentStep) {
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/30 px-6 py-4">
        <p className="text-center text-sm text-slate-500">
          발표 자료를 업로드하면 인터뷰 워크플로가 시작됩니다.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Steps Container */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        {/* Step Items */}
        <div className="flex gap-2 md:gap-4 justify-between relative">
          {/* Progress Bar */}
          <div className="absolute top-8 left-0 right-0 h-1 bg-slate-700/30 rounded-full -z-10">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Step Items */}
          {steps.map((step, index) => {
            const isActive = step.id === currentStep
            const isPassed = currentStepIndex >= index

            return (
              <div key={step.id} className="flex-1 flex flex-col items-center gap-3">
                {/* Step Circle */}
                <div className="relative z-10">
                  <button
                    type="button"
                    disabled
                    className={`
                      w-16 h-16 md:w-20 md:h-20 rounded-full font-semibold text-xl
                      transition-all duration-300 flex items-center justify-center
                      relative border-2
                      ${
                        isActive
                          ? 'bg-gradient-to-r from-brand-500/20 to-brand-400/20 border-brand-400 shadow-lg shadow-brand-600/20 scale-110'
                          : isPassed
                            ? 'bg-emerald-500/20 border-emerald-400'
                            : 'bg-slate-700/20 border-slate-600'
                      }
                    `}
                  >
                    <span className="text-2xl">{step.icon}</span>

                    {/* Step Number Badge */}
                    {isActive && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-400 text-slate-950 text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </div>
                    )}

                    {isPassed && !isActive && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center">
                        ✓
                      </div>
                    )}
                  </button>

                  {/* Active Indicator Ring */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-full border-2 border-brand-400 animate-pulse" />
                  )}
                </div>

                {/* Step Label */}
                <div className="text-center">
                  <p
                    className={`text-sm md:text-base font-semibold transition-colors ${
                      isActive
                        ? 'text-brand-200'
                        : isPassed
                          ? 'text-emerald-200'
                          : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Session ID Info */}
      {sessionId && (
        <div className="text-center text-xs text-slate-500">
          세션 ID: <span className="font-mono text-slate-400">{sessionId.slice(0, 16)}...</span>
        </div>
      )}
    </div>
  )
}

