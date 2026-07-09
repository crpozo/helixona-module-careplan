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
    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
      <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-800">
        <Icon className="h-6 w-6" />
      </span>
      <p className="text-base font-extrabold text-slate-800">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
