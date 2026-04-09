import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-500 text-slate-950 shadow-lg shadow-brand-600/20 hover:bg-brand-400 active:translate-y-px',
  secondary:
    'bg-slate-800 text-slate-100 ring-1 ring-inset ring-slate-700 hover:bg-slate-700 active:translate-y-px',
  ghost:
    'bg-transparent text-slate-300 ring-1 ring-transparent hover:bg-white/5 hover:text-white hover:ring-white/10 active:translate-y-px',
}

export function Button({
  className = '',
  variant = 'primary',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${variantStyles[variant]} ${className}`}
      {...props}
    />
  )
}
