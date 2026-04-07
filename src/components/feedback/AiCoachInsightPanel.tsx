import { Card } from '../ui/Card'

export interface CoachInsightItem {
  id: string
  message: string
  evidence?: string
  action?: string
  priority?: 'high' | 'medium' | 'low'
}

interface AiCoachInsightPanelProps {
  title?: string
  assistantName?: string
  insights: CoachInsightItem[]
}

const priorityStyles: Record<NonNullable<CoachInsightItem['priority']>, string> = {
  high: 'bg-rose-400/15 text-rose-200',
  medium: 'bg-amber-400/15 text-amber-200',
  low: 'bg-emerald-400/15 text-emerald-200',
}

const priorityLabels: Record<NonNullable<CoachInsightItem['priority']>, string> = {
  high: '높음',
  medium: '중간',
  low: '낮음',
}

export function AiCoachInsightPanel({
  title = 'AI 코치 인사이트 패널',
  assistantName = '코치 AI',
  insights,
}: AiCoachInsightPanelProps) {
  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">AI 코멘터리</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
        </div>
        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
          {assistantName}
        </span>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => (
          <article key={insight.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm leading-6 text-slate-100">"{insight.message}"</p>
              {insight.priority ? (
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] ${priorityStyles[insight.priority]}`}>
                  {priorityLabels[insight.priority]}
                </span>
              ) : null}
            </div>

            {insight.evidence ? <p className="mt-2 text-xs leading-5 text-slate-400">근거: {insight.evidence}</p> : null}
            {insight.action ? <p className="mt-2 text-sm leading-6 text-cyan-100">실행 항목: {insight.action}</p> : null}
          </article>
        ))}
      </div>
    </Card>
  )
}

