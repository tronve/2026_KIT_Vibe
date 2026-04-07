import { Button } from '../../../components'
import { Card } from '../../../components'
import { usePitchSessionStore } from '../store/usePitchSessionStore'

export function PitchSessionCard() {
  const prompts = usePitchSessionStore((state) => state.prompts)
  const activePromptId = usePitchSessionStore((state) => state.activePromptId)
  const moveToNextPrompt = usePitchSessionStore((state) => state.moveToNextPrompt)
  const markActivePromptComplete = usePitchSessionStore((state) => state.markActivePromptComplete)
  const resetSession = usePitchSessionStore((state) => state.resetSession)

  const activePrompt = prompts.find((prompt) => prompt.id === activePromptId) ?? prompts[0]
  const completedCount = prompts.filter((prompt) => prompt.completed).length
  const progress = prompts.length === 0 ? 0 : Math.round((completedCount / prompts.length) * 100)

  if (!activePrompt) {
    return null
  }

  return (
    <Card className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">피치 세션</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{activePrompt.title}</h3>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-slate-300">
          {completedCount}/{prompts.length} 완료
        </span>
      </div>

      <p className="text-sm leading-6 text-slate-300">{activePrompt.description}</p>
      {activePrompt.completed ? (
        <p className="text-sm font-medium text-emerald-300">이 프롬프트는 완료되었습니다.</p>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-400">
          <span>진행률</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <dl className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/5 p-4">
          <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">집중 영역</dt>
          <dd className="mt-2 font-medium text-white">{activePrompt.focusArea}</dd>
        </div>
        <div className="rounded-2xl bg-white/5 p-4">
          <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">예상 시간</dt>
          <dd className="mt-2 font-medium text-white">{activePrompt.estimatedMinutes}분</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-3">
        <Button onClick={markActivePromptComplete}>완료 처리</Button>
        <Button variant="secondary" onClick={moveToNextPrompt}>
          다음 프롬프트
        </Button>
        <Button variant="ghost" onClick={resetSession}>
          초기화
        </Button>
      </div>
    </Card>
  )
}


