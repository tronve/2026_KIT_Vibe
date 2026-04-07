import { Link } from 'react-router-dom'
import { Card } from '../components'
import { PitchSessionCard } from '../features/pitch-session'

const sessionSteps = [
  'Choose a prompt that matches your current pitch challenge.',
  'Rehearse out loud, then mark the prompt as complete when confident.',
  'Move to the next prompt or reset the session when you need a fresh round.',
]

export function PracticePage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Practice mode</p>
          <h1 className="text-3xl font-black text-white sm:text-4xl">Train your delivery one prompt at a time.</h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            This starter page demonstrates how a single feature owns its state, components, and types while
            the page stays focused on layout and composition.
          </p>
        </div>

        <PitchSessionCard />
      </div>

      <div className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Practice workflow</h2>
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
          <h2 className="text-xl font-semibold text-white">Where to add new work</h2>
          <p className="text-sm leading-6 text-slate-300">
            Build new pitch experiences inside `src/features`. Keep reusable primitives in `src/components`
            and server communication inside `src/api`.
          </p>
          <Link to="/" className="inline-flex text-sm font-semibold text-cyan-300 hover:text-cyan-200">
            Back to home
          </Link>
        </Card>
      </div>
    </div>
  )
}

