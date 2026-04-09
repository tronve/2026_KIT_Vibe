interface TopStatusBarProps {
  workspaceName: string
  statusLabel: string
  statusValue: string
  secondaryLabel: string
  secondaryValue: string
}

export function TopStatusBar({
  workspaceName,
  statusLabel,
  statusValue,
  secondaryLabel,
  secondaryValue,
}: TopStatusBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-950/70 px-5 py-4 backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{workspaceName}</p>
        <h1 className="mt-2 text-xl font-semibold text-white">워크스페이스</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{statusLabel}</p>
          <p className="mt-1 text-sm font-semibold text-white">{statusValue}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{secondaryLabel}</p>
          <p className="mt-1 text-sm font-semibold text-brand-300">{secondaryValue}</p>
        </div>
      </div>
    </div>
  )
}

