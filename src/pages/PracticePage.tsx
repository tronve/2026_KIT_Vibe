import { Link } from 'react-router-dom'
import { Card } from '../components'
import { PitchSessionCard } from '../features/pitch-session'

const sessionSteps = [
  '현재 발표 고민에 맞는 프롬프트를 선택합니다.',
  '소리 내어 연습한 뒤 자신 있으면 완료 처리합니다.',
  '다음 프롬프트로 넘어가거나 필요할 때 세션을 초기화합니다.',
]

export function PracticePage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">연습 모드</p>
          <h1 className="text-3xl font-black text-white sm:text-4xl">프롬프트 단위로 발표 전달력을 훈련하세요.</h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            이 페이지는 기능 단위 구조에서 상태/컴포넌트/타입을 분리해 확장하는 예시입니다.
          </p>
        </div>

        <PitchSessionCard />
      </div>

      <div className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-white">연습 진행 순서</h2>
          <ol className="space-y-3 text-sm leading-6 text-slate-300">
            {sessionSteps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-semibold text-cyan-300">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-white">기능 확장 가이드</h2>
          <p className="text-sm leading-6 text-slate-300">
            새로운 발표 경험은 `src/features`에 추가하고, 공통 UI는 `src/components`,
            서버 연동은 `src/api`에서 관리하세요.
          </p>
          <Link to="/" className="inline-flex text-sm font-semibold text-cyan-300 hover:text-cyan-200">
            홈으로 돌아가기
          </Link>
        </Card>
      </div>
    </div>
  )
}

