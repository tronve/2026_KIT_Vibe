import { Link } from 'react-router-dom'
import { Card } from '../components'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-lg space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">404</p>
        <h1 className="text-3xl font-black text-white">Page not found</h1>
        <p className="text-sm leading-6 text-slate-300">
          The page you tried to open does not exist yet. Return to the dashboard or start a practice session.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Go home
        </Link>
      </Card>
    </div>
  )
}

