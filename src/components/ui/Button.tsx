import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-700 text-white hover:bg-brand-600 active:translate-y-px shadow-soft',
  secondary:
    'bg-white text-brand-700 border border-brand-200 hover:bg-brand-50 active:translate-y-px',
  ghost:
    'bg-transparent text-brand-700 hover:bg-brand-100 active:translate-y-px',
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
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ${variantStyles[variant]} ${className}`}
      {...props}
    />
  )
}
