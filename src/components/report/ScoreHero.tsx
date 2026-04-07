interface ScoreHeroProps {
  score: number
}

export function ScoreHero({ score }: ScoreHeroProps) {
  const boundedScore = Math.max(0, Math.min(100, score))

  const tone =
    boundedScore >= 85
      ? '압박 상황에서도 안정적인 전달력을 보여줬습니다. 실전 인터뷰 준비가 잘 되어 있습니다.'
      : boundedScore >= 70
        ? '기본기가 탄탄합니다. 핵심 포인트 몇 가지만 보완하면 전달력이 크게 향상됩니다.'
        : '좋은 출발입니다. 집중 연습을 통해 자신감과 명료도를 빠르게 높일 수 있습니다.'

  const levelLabel =
    boundedScore >= 85 ? '상위 퍼포먼스' : boundedScore >= 70 ? '안정적 성장' : '집중 개선 구간'

  return (
    <section
      className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/15 to-slate-900 p-6"
      style={{ animation: 'reportReveal 500ms ease-out both' }}
    >
      <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">종합 점수</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-5xl font-black text-white">{score}</p>
          <p className="mt-1 text-sm text-cyan-200">{levelLabel}</p>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-200">{tone}</p>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-300">
          <span>코칭 진행도</span>
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

