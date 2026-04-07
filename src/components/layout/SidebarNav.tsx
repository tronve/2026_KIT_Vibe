import { NavLink } from 'react-router-dom'

export interface SidebarNavItem {
  label: string
  to: string
  description: string
}

interface SidebarNavProps {
  items: SidebarNavItem[]
}

export function SidebarNav({ items }: SidebarNavProps) {
  return (
    <nav className="flex flex-col gap-2">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `group rounded-2xl border px-4 py-3 transition ${
              isActive
                ? 'border-cyan-400/25 bg-cyan-400/10 text-white shadow-glow'
                : 'border-transparent bg-white/0 text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <span className="block text-sm font-semibold">{item.label}</span>
          <span className="mt-1 block text-xs leading-5 text-slate-400 group-hover:text-slate-300">
            {item.description}
          </span>
        </NavLink>
      ))}
    </nav>
  )
}

