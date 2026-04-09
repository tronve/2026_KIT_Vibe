interface ActionPlanProps {
  items: string[]
  animationDelayMs?: number
}

export function ActionPlan({ items, animationDelayMs = 0 }: ActionPlanProps) {
  const actionItems = items.length > 0 ? items : ['모의 인터뷰를 한 번 더 진행하고, 한 가지 개선 포인트에 집중해 보세요.']

  return (
    <section
      className="rounded-3xl border border-brand-500/20 bg-white/5 p-6"
      style={{ animation: `reportReveal 500ms ease-out ${animationDelayMs}ms both` }}
    >
      <p className="text-xs uppercase tracking-[0.25em] text-brand-300">실행 계획</p>

      <ol className="mt-5 space-y-3">
        {actionItems.map((item, index) => (
          <li key={`action-${index}`} className="flex gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-semibold text-brand-200">
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

