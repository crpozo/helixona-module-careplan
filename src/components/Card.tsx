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

/** White rounded card with a friendly 2px border. */
export function Card({ title, subtitle, action, className, flush, children }: CardProps) {
  const hasHeader = title || subtitle || action
  const cls = className ?? ''
  const overridesBg = /(?:^|\s)bg-/.test(cls)
  const overridesBorder = /(?:^|\s)border-\[|(?:^|\s)border-(?:slate|ink|brand|white|black|emerald|rose|amber|transparent)/.test(
    cls,
  )
  return (
    <section
      className={cn(
        'rounded-3xl border-2',
        !overridesBg && 'bg-white',
        !overridesBorder && 'border-slate-200',
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
              <h2 className="text-base font-extrabold text-slate-800">{title}</h2>
            ) : null}
            {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
