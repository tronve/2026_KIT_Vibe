interface ScoreHeroProps {
  score: number
}

export function ScoreHero({ score }: ScoreHeroProps) {
  const boundedScore = Math.max(0, Math.min(100, score))

  const tone =
    boundedScore >= 85
      ? 'Excellent composure under pressure. Your delivery is interview-ready.'
      : boundedScore >= 70
        ? 'Strong foundation. A few focused adjustments will elevate your impact.'
        : 'Good start. With targeted practice, your confidence and clarity will rise quickly.'

  const levelLabel =
    boundedScore >= 85 ? 'High Performance' : boundedScore >= 70 ? 'Solid Progress' : 'Growth Opportunity'

  return (
    <section
      className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/15 to-slate-900 p-6"
      style={{ animation: 'reportReveal 500ms ease-out both' }}
    >
      <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Overall Score</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-5xl font-black text-white">{score}</p>
          <p className="mt-1 text-sm text-cyan-200">{levelLabel}</p>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-200">{tone}</p>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-300">
          <span>Coaching Progress</span>
          <span>{boundedScore}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 transition-all duration-700"
            style={{ width: `${boundedScore}%` }}
          />
        </div>
      </div>

      <style>{`@keyframes reportReveal { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} }`}</style>
    </section>
  )
}

