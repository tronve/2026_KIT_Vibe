import { Link } from 'react-router-dom'
import { Card } from '../components'
import { PitchSessionCard } from '../features/pitch-session'

const sessionSteps = [
  '프롬프트 선택',
  '연습 후 완료 처리',
  '다음 프롬프트 진행',
]

export function PracticePage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-300">연습 모드</p>
          <h1 className="text-3xl font-black text-white sm:text-4xl">프롬프트 연습</h1>
        </div>

        <PitchSessionCard />
      </div>

      <div className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-white">연습 진행 순서</h2>
          <ol className="space-y-3 text-sm leading-6 text-slate-300">
            {sessionSteps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-xs font-semibold text-brand-300">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-white">기능 확장 가이드</h2>
          <Link to="/" className="inline-flex text-sm font-semibold text-brand-300 hover:text-brand-200">
            홈으로 돌아가기
          </Link>
        </Card>
      </div>
    </div>
  )
}

