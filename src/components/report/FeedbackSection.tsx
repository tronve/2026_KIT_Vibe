interface FeedbackSectionProps {
  title: string
  items: string[]
  variant: 'strength' | 'weakness'
  animationDelayMs?: number
}

export function FeedbackSection({
  title,
  items,
  variant,
  animationDelayMs = 0,
}: FeedbackSectionProps) {
  const isStrength = variant === 'strength'

  return (
    <section
      className="space-y-4"
      style={{ animation: `reportReveal 500ms ease-out ${animationDelayMs}ms both` }}
    >
      <p className={`text-xs uppercase tracking-[0.25em] ${isStrength ? 'text-emerald-300' : 'text-amber-300'}`}>
        {title}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {(items.length > 0 ? items : ['아직 피드백 데이터가 없습니다.']).map((item, index) => (
          <article
            key={`${variant}-${index}`}
            className={`rounded-2xl border p-4 ${
              isStrength
                ? 'border-emerald-400/30 bg-emerald-500/10'
                : 'border-amber-400/30 bg-amber-500/10'
            }`}
          >
            <div className="mb-2 flex items-center gap-2">
              <span>{isStrength ? '✅' : '⚠️'}</span>
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${isStrength ? 'text-emerald-200' : 'text-amber-200'}`}>
                {isStrength ? '강점' : '주의'} {index + 1}
              </p>
            </div>
            <p className="text-sm leading-6 text-slate-100">{item}</p>
          </article>
        ))}
      </div>

      <style>{`@keyframes reportReveal { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} }`}</style>
    </section>
  )
}

