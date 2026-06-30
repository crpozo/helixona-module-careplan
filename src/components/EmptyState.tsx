import type { ReactNode } from 'react'
import { getIcon } from '@/lib/icons'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  children?: ReactNode
}

export function EmptyState({ icon = 'Sparkles', title, description, children }: EmptyStateProps) {
  const Icon = getIcon(icon)
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
      <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.06] text-brand-300 ring-1 ring-white/10">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold text-white">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-slate-400">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
