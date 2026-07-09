import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

// Chunky "press me" buttons: a hard bottom shadow that collapses on :active
// (shadow, not border, so pressing never shifts the layout around it).
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-500 text-ink-800 shadow-[0_4px_0_#9c7e44] hover:bg-brand-400 active:shadow-none active:translate-y-1',
  secondary:
    'border-2 border-slate-200 bg-white text-slate-600 shadow-[0_3px_0_#e2e8f0] hover:bg-slate-50 hover:text-slate-800 active:shadow-none active:translate-y-[3px]',
  ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
  dark: 'bg-slate-800 text-white shadow-[0_4px_0_#0f172a] hover:bg-slate-700 active:shadow-none active:translate-y-1',
  danger:
    'bg-rose-500 text-white shadow-[0_4px_0_#be123c] hover:bg-rose-400 active:shadow-none active:translate-y-1',
}

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-xl',
  md: 'px-4 py-2.5 text-sm rounded-2xl',
  lg: 'px-6 py-3 text-base rounded-2xl',
  xl: 'px-6 py-4 text-lg rounded-2xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 font-extrabold transition-all',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0',
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
