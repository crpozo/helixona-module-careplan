import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface CardProps {
  title?: ReactNode
  subtitle?: ReactNode
  /** Top-right slot for toggles, links, icon chips. */
  action?: ReactNode
  className?: string
  /** Removes inner padding (e.g. when the body is a table). */
  flush?: boolean
  children?: ReactNode
}

/** The default container. STYLE.md §4. */
export function Card({ title, subtitle, action, className, flush, children }: CardProps) {
  const hasHeader = title || subtitle || action
  return (
    <section
      className={cn(
        'rounded-2xl border border-slate-200 bg-white shadow-sm',
        flush ? '' : 'p-5',
        className,
      )}
    >
      {hasHeader && (
        <header
          className={cn(
            'flex items-start justify-between gap-3',
            flush && 'p-5 pb-0',
            !!children && 'mb-4',
          )}
        >
          <div className="min-w-0">
            {title ? (
              <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
            ) : null}
            {subtitle ? (
              <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
            ) : null}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
