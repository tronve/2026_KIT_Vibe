import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-lg space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-600">404</p>
        <h1 className="text-3xl font-black text-brand-900">페이지를 찾을 수 없습니다</h1>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          대시보드로 이동
        </Link>
      </Card>
    </div>
  )
}

