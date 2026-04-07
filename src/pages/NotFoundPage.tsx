import { Link } from 'react-router-dom'
import { Card } from '../components'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-lg space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">404</p>
        <h1 className="text-3xl font-black text-white">페이지를 찾을 수 없습니다</h1>
        <p className="text-sm leading-6 text-slate-300">
          요청하신 페이지가 존재하지 않습니다. 대시보드로 돌아가거나 연습 세션을 시작해 주세요.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          홈으로 이동
        </Link>
      </Card>
    </div>
  )
}

