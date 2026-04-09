import { useState, type FormEvent, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import heroImg from '../assets/hero.png'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAppStore } from '../store/useAppStore'

const highlights = [
  {
    title: 'AI 가이드 연습',
    description: '질문 기반 연습',
  },
  {
    title: '세션 이어하기',
    description: '중단한 지점부터 복원',
  },
  {
    title: '확장 가능한 구조',
    description: '기능 단위 구조',
  },
]

export function HomePage() {
  const navigate = useNavigate()
  const [speakerName, setSpeakerName] = useLocalStorage('ai-pitch-master:speaker-name', '게스트')
  const [draftName, setDraftName] = useState(speakerName)
  const { clearSessionFromStorage, currentStep, sessionId } = useAppStore()

  // 홈페이지 진입 시 세션 정리
  useEffect(() => {
    // 이미 세션 중이면 대시보드로 리다이렉트
    if (sessionId && currentStep && currentStep !== 'upload') {
      navigate('/dashboard', { replace: true })
    }
  }, [])

  const handleSaveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSpeakerName(draftName.trim() || '게스트')
  }

  const handleStartPractice = async () => {
    await clearSessionFromStorage()
    navigate('/upload-training')
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-6">
          <span className="inline-flex rounded-full border border-brand-300 bg-brand-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-700">
            AI Pitch Master
          </span>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-black leading-tight text-brand-900 sm:text-5xl lg:text-6xl">
              발표 연습을 간결하게
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleStartPractice}>
              연습 세션 시작
            </Button>
            <a
              href="#architecture"
              className="inline-flex items-center justify-center rounded-lg border border-brand-300 bg-brand-50 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:bg-brand-100"
            >
              아키텍처 가이드 보기
            </a>
          </div>

          <Card className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-brand-600">개인화</p>
              <h2 className="mt-2 text-2xl font-semibold text-brand-900">{speakerName}님</h2>
            </div>

            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSaveProfile}>
              <input
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="이름을 입력하세요"
                className="min-w-0 flex-1 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900 placeholder:text-brand-600 focus:border-brand-400 focus:outline-none"
              />
              <Button type="submit">저장</Button>
            </form>
          </Card>
        </div>

        <Card className="overflow-hidden p-0">
          <img src={heroImg} alt="AI Pitch Master 미리보기 이미지" className="h-full w-full object-cover" />
        </Card>
      </section>

      <section id="architecture" className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => (
          <Card key={item.title} className="space-y-3">
            <h3 className="text-lg font-semibold text-brand-900">{item.title}</h3>
            <p className="text-sm leading-6 text-brand-700">{item.description}</p>
          </Card>
        ))}
      </section>
    </div>
  )
}


