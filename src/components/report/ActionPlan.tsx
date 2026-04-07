interface ActionPlanProps {
  items: string[]
  animationDelayMs?: number
}

export function ActionPlan({ items, animationDelayMs = 0 }: ActionPlanProps) {
  const actionItems = items.length > 0 ? items : ['Run one additional mock interview and focus on one improvement area.']

  return (
    <section
      className="rounded-3xl border border-cyan-400/20 bg-white/5 p-6"
      style={{ animation: `reportReveal 500ms ease-out ${animationDelayMs}ms both` }}
    >
      <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Actionable Improvement Plan</p>
      <p className="mt-2 text-sm text-slate-300">
        Focus on these next steps to improve your next interview round.
      </p>

      <ol className="mt-5 space-y-3">
        {actionItems.map((item, index) => (
          <li key={`action-${index}`} className="flex gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/20 text-xs font-semibold text-cyan-200">
              {index + 1}
            </span>
            <p className="text-sm leading-6 text-slate-100">{item}</p>
          </li>
        ))}
      </ol>

      <style>{`@keyframes reportReveal { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} }`}</style>
    </section>
  )
}

