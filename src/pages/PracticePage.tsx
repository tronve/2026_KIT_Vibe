import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

type PracticePrompt = {
  id: string
  title: string
  description: string
  focusArea: string
  estimatedMinutes: number
  completed: boolean
}

const initialPrompts = (): PracticePrompt[] => [
  { id: 'hook', title: '도입', description: '청중의 문제를 즉시 환기할 수 있는 강한 오프닝으로 시작하세요.', focusArea: '오프닝 한 문장', estimatedMinutes: 2, completed: false },
  { id: 'story', title: '스토리', description: '짧은 서사를 활용해 발표를 기억하기 쉽고 전달하기 쉽게 만드세요.', focusArea: '서사 흐름', estimatedMinutes: 3, completed: false },
  { id: 'close', title: '마무리', description: '명확한 요청으로 끝맺어 청중이 다음 행동을 이해하도록 하세요.', focusArea: '행동 유도 문구', estimatedMinutes: 2, completed: false },
]

const sessionSteps = ['프롬프트 선택', '연습 후 완료 처리', '다음 프롬프트 진행']

export function PracticePage() {
  const [prompts, setPrompts] = useState<PracticePrompt[]>(() => initialPrompts())
  const [activePromptId, setActivePromptId] = useState(() => initialPrompts()[0]?.id ?? '')

  const activePrompt = useMemo(() => prompts.find((prompt) => prompt.id === activePromptId) ?? prompts[0], [prompts, activePromptId])
  const completedCount = prompts.filter((prompt) => prompt.completed).length
  const progress = prompts.length === 0 ? 0 : Math.round((completedCount / prompts.length) * 100)

  const moveToNextPrompt = () => {
    const currentIndex = prompts.findIndex((prompt) => prompt.id === activePromptId)
    const nextId = prompts[(currentIndex + 1) % prompts.length]?.id ?? activePromptId
    setActivePromptId(nextId)
  }

  const markActivePromptComplete = () => {
    setPrompts((current) => current.map((prompt) => (prompt.id === activePromptId ? { ...prompt, completed: true } : prompt)))
  }

  const resetSession = () => {
    const nextPrompts = initialPrompts()
    setPrompts(nextPrompts)
    setActivePromptId(nextPrompts[0]?.id ?? '')
  }

  if (!activePrompt) {
    return null
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-600">연습 모드</p>
          <h1 className="text-3xl font-black text-brand-900 sm:text-4xl">프롬프트 연습</h1>
        </div>

        <Card className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-600">피치 세션</p>
              <h3 className="mt-2 text-2xl font-semibold text-brand-900">{activePrompt.title}</h3>
            </div>
            <span className="rounded-lg bg-brand-100 px-3 py-1 text-sm text-brand-700">
              {completedCount}/{prompts.length} 완료
            </span>
          </div>

          <p className="text-sm leading-6 text-brand-700">{activePrompt.description}</p>
          {activePrompt.completed ? <p className="text-sm font-medium text-emerald-600">이 프롬프트는 완료되었습니다.</p> : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-brand-600">
              <span>진행률</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-brand-200">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <dl className="grid gap-3 text-sm text-brand-700 sm:grid-cols-2">
            <div className="rounded-lg bg-brand-50 p-4">
              <dt className="text-xs uppercase tracking-[0.2em] text-brand-600">집중 영역</dt>
              <dd className="mt-2 font-medium text-brand-900">{activePrompt.focusArea}</dd>
            </div>
            <div className="rounded-lg bg-brand-50 p-4">
              <dt className="text-xs uppercase tracking-[0.2em] text-brand-600">예상 시간</dt>
              <dd className="mt-2 font-medium text-brand-900">{activePrompt.estimatedMinutes}분</dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-3">
            <Button onClick={markActivePromptComplete}>완료 처리</Button>
            <Button variant="secondary" onClick={moveToNextPrompt}>다음 프롬프트</Button>
            <Button variant="ghost" onClick={resetSession}>초기화</Button>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-brand-900">연습 진행 순서</h2>
          <ol className="space-y-3 text-sm leading-6 text-brand-700">
            {sessionSteps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-xs font-semibold text-brand-700">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-brand-900">기능 확장 가이드</h2>
          <Link to="/" className="inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700">홈으로 돌아가기</Link>
        </Card>
      </div>
    </div>
  )
}

