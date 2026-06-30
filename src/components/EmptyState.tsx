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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
      <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold text-ink-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-slate-400">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
