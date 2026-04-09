import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className = '', ...props }: CardProps) {
  return (
    <div
      className={`min-h-20 rounded-lg border border-brand-200 bg-white p-6 shadow-soft transition-all duration-200 ease-out ${className}`}
      {...props}
    />
  )
}


