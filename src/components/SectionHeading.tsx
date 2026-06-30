import type { ReactNode } from 'react'
import { IconChip } from '@/components/IconChip'

interface SectionHeadingProps {
  icon?: string
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
}

/** Inline section heading with an icon chip — used inside pages. */
export function SectionHeading({ icon, title, subtitle, action }: SectionHeadingProps) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {icon && <IconChip icon={icon} size="h-8 w-8" />}
        <div>
          <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
