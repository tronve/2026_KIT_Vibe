import { useMemo } from 'react'

export interface InsightCardData {
  metricType: 'wpm' | 'filler_words' | 'gaze_score'
  value: number
}

interface InsightCardProps {
  data: InsightCardData
}

/**
 * Transforms raw metrics into coaching insights
 * Displays metric value with contextual coaching language
 *
 * Examples:
 * - WPM 125 → "Your speaking speed increases under pressure"
 * - Gaze score 85 → "Eye contact is strong but drops during transitions"
 * - Filler words 4 → "You use natural pauses effectively"
 */
export function InsightCard({ data }: InsightCardProps) {
  const insight = useMemo(() => {
    switch (data.metricType) {
      case 'wpm': {
        if (data.value < 80) {
          return {
            icon: '🐢',
            title: 'Speaking Pace',
            insight: 'Your speaking speed is below average (< 80 WPM).',
            explanation: 'You may be speaking too slowly, which can reduce engagement.',
            tip: 'Try increasing your pace slightly to maintain audience attention while ensuring clarity.',
            color: 'amber',
          }
        }
        if (data.value > 160) {
          return {
            icon: '🚀',
            title: 'Speaking Pace',
            insight: 'Your speaking speed is very fast (> 160 WPM).',
            explanation: 'You speak rapidly, which can indicate nervousness or high energy.',
            tip: 'Add strategic pauses to emphasize key points and give your audience time to process.',
            color: 'orange',
          }
        }
        return {
          icon: '⏱️',
          title: 'Speaking Pace',
          insight: `Your speaking speed is ${data.value} WPM - ideal for presentations.`,
          explanation: 'Your pace is well-balanced, allowing clear communication without rushing.',
          tip: 'Maintain this pace but watch for acceleration during stressful Q&A moments.',
          color: 'emerald',
        }
      }

      case 'filler_words': {
        if (data.value === 0) {
          return {
            icon: '✨',
            title: 'Verbal Fluency',
            insight: 'You used zero filler words - excellent control!',
            explanation: 'No "ums," "ahs," or "likes" detected in your presentation.',
            tip: 'This is excellent! Continue practicing silence over filler words.',
            color: 'emerald',
          }
        }
        if (data.value < 3) {
          return {
            icon: '👍',
            title: 'Verbal Fluency',
            insight: 'You use very few filler words - great job!',
            explanation: 'Only occasional "ums" or "ahs" detected, showing good control.',
            tip: 'Keep this up! Replace any remaining filler words with intentional pauses.',
            color: 'emerald',
          }
        }
        if (data.value < 8) {
          return {
            icon: '🎯',
            title: 'Verbal Fluency',
            insight: 'You use a moderate amount of filler words.',
            explanation: `${data.value} filler words detected throughout your presentation.`,
            tip: 'Practice pausing instead of filling silence. Record yourself to identify your habit words.',
            color: 'cyan',
          }
        }
        return {
          icon: '⚠️',
          title: 'Verbal Fluency',
          insight: `You used ${data.value}+ filler words frequently.`,
          explanation: 'Frequent "ums," "ahs," and "likes" can distract your audience.',
          tip: 'Practice deliberate pauses. Record practice sessions and count your filler words.',
          color: 'amber',
        }
      }

      case 'gaze_score': {
        if (data.value >= 90) {
          return {
            icon: '👀',
            title: 'Eye Contact',
            insight: `Your eye contact score is ${data.value}/100 - exceptional!`,
            explanation: 'You maintain strong, consistent eye contact throughout your presentation.',
            tip: 'Maintain this level of engagement. You\'re connecting well with your audience.',
            color: 'emerald',
          }
        }
        if (data.value >= 75) {
          return {
            icon: '👁️',
            title: 'Eye Contact',
            insight: `Your eye contact score is ${data.value}/100 - strong performance.`,
            explanation: 'Generally good eye contact with minor drops during complex sections.',
            tip: 'Practice maintaining eye contact during technical transitions or difficult slides.',
            color: 'cyan',
          }
        }
        if (data.value >= 60) {
          return {
            icon: '🔍',
            title: 'Eye Contact',
            insight: `Your eye contact score is ${data.value}/100 - room for improvement.`,
            explanation: 'Your gaze frequently drifts to slides or notes.',
            tip: 'Practice looking at your audience between slides. Memorize key transition points.',
            color: 'amber',
          }
        }
        return {
          icon: '⬇️',
          title: 'Eye Contact',
          insight: `Your eye contact score is ${data.value}/100 - needs attention.`,
          explanation: 'You\'re looking down significantly, reducing audience connection.',
          tip: 'Spend 60% of your time looking at the audience, 40% at slides. Use a speaker remote.',
          color: 'rose',
        }
      }

      default:
        return {
          icon: '❓',
          title: 'Unknown Metric',
          insight: 'Unknown metric type',
          explanation: '',
          tip: '',
          color: 'slate',
        }
    }
  }, [data])

  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-400/30',
      icon: 'text-emerald-300',
      title: 'text-emerald-200',
      badge: 'bg-emerald-400/20 text-emerald-300',
    },
    cyan: {
      bg: 'bg-brand-500/10',
      border: 'border-brand-400/30',
      icon: 'text-brand-300',
      title: 'text-brand-200',
      badge: 'bg-brand-400/20 text-brand-300',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-400/30',
      icon: 'text-amber-300',
      title: 'text-amber-200',
      badge: 'bg-amber-400/20 text-amber-300',
    },
    orange: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-400/30',
      icon: 'text-orange-300',
      title: 'text-orange-200',
      badge: 'bg-orange-400/20 text-orange-300',
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-400/30',
      icon: 'text-rose-300',
      title: 'text-rose-200',
      badge: 'bg-rose-400/20 text-rose-300',
    },
    slate: {
      bg: 'bg-slate-500/10',
      border: 'border-slate-400/30',
      icon: 'text-slate-300',
      title: 'text-slate-200',
      badge: 'bg-slate-400/20 text-slate-300',
    },
  }

  const colors = colorClasses[insight.color as keyof typeof colorClasses]

  return (
    <div
      className={`rounded-3xl border p-6 transition-all hover:shadow-lg ${colors.bg} ${colors.border}`}
    >
      {/* Icon + Title */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${colors.title}`}>
            {insight.title}
          </p>
        </div>
        <span className={`text-4xl ${colors.icon}`}>{insight.icon}</span>
      </div>

      {/* Insight Text */}
      <p className="mb-3 text-base font-semibold text-white leading-6">
        {insight.insight}
      </p>

      {/* Explanation */}
      <p className="mb-4 text-sm text-slate-300 leading-6">
        {insight.explanation}
      </p>

      {/* Metric Value Badge */}
      <div className="mb-4 flex items-center gap-3">
        <span className={`inline-block rounded-full ${colors.badge} px-3 py-1 text-xs font-semibold`}>
          {data.metricType === 'gaze_score' ? `${data.value}/100` : data.value}
          {data.metricType === 'wpm' && ' WPM'}
          {data.metricType === 'filler_words' && ' instances'}
        </span>
      </div>

      {/* Improvement Tip */}
      <div className={`rounded-2xl border ${colors.border} ${colors.bg} p-3`}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 mb-2">
          💡 Coaching Tip
        </p>
        <p className="text-sm leading-6 text-slate-200">
          {insight.tip}
        </p>
      </div>
    </div>
  )
}

