import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import heroImg from '../assets/hero.png'
import { Button, Card } from '../components'
import { useLocalStorage } from '../hooks'

const highlights = [
  {
    title: 'AI 가이드 연습',
    description: '구조화된 프롬프트와 즉시 피드백으로 아이디어를 설득력 있는 발표로 완성합니다.',
  },
  {
    title: '세션 이어하기',
    description: '훈련 진행 상황을 저장해 언제든 이어서 연습하고 꾸준히 개선할 수 있습니다.',
  },
  {
    title: '확장 가능한 구조',
    description: '페이지는 단순하게 유지하고 로직은 기능/스토어/API 모듈로 분리해 관리합니다.',
  },
]

export function HomePage() {
  const [speakerName, setSpeakerName] = useLocalStorage('ai-pitch-master:speaker-name', '게스트')
  const [draftName, setDraftName] = useState(speakerName)

  const handleSaveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSpeakerName(draftName.trim() || '게스트')
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-6">
          <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
            AI Pitch Master
          </span>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              AI 코치와 함께 연습하고, 다듬고, 최고의 발표를 완성하세요.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              React Router, Zustand, TailwindCSS 기반으로 구성된 실전형 스피치 훈련 플랫폼입니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/practice"
              className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              연습 세션 시작
            </Link>
            <a
              href="#architecture"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              아키텍처 가이드 보기
            </a>
          </div>

          <Card className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">개인화</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{speakerName}님, 다시 오신 것을 환영합니다.</h2>
            </div>

            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSaveProfile}>
              <input
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="이름을 입력하세요"
                className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
              <Button type="submit">프로필 저장</Button>
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
            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
            <p className="text-sm leading-6 text-slate-300">{item.description}</p>
          </Card>
        ))}
      </section>
    </div>
  )
}


