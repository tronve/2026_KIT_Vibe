import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import heroImg from '../assets/hero.png'
import { Button, Card } from '../components'
import { useLocalStorage } from '../hooks'

const highlights = [
  {
    title: 'AI guided practice',
    description: 'Turn a rough idea into a confident pitch with structured prompts and instant feedback loops.',
  },
  {
    title: 'Reusable sessions',
    description: 'Save progress across training sessions so founders can come back and keep improving.',
  },
  {
    title: 'Feature-first scaling',
    description: 'Keep pages thin and push logic into dedicated features, stores, and API modules.',
  },
]

export function HomePage() {
  const [speakerName, setSpeakerName] = useLocalStorage('ai-pitch-master:speaker-name', 'Guest')
  const [draftName, setDraftName] = useState(speakerName)

  const handleSaveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSpeakerName(draftName.trim() || 'Guest')
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
              Practice, refine, and deliver your best pitch with AI support.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              A feature-based React architecture for speech training, with React Router, Zustand, and
              TailwindCSS-ready building blocks.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/practice"
              className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Start a practice session
            </Link>
            <a
              href="#architecture"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              View architecture guide
            </a>
          </div>

          <Card className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Personalization</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Welcome back, {speakerName}.</h2>
            </div>

            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSaveProfile}>
              <input
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="Your name"
                className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
              <Button type="submit">Save profile</Button>
            </form>
          </Card>
        </div>

        <Card className="overflow-hidden p-0">
          <img src={heroImg} alt="AI Pitch Master preview" className="h-full w-full object-cover" />
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


