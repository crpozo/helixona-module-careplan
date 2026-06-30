import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowRight, ArrowUpRight, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { IconChip } from '@/components/IconChip'

interface KpiCardProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: string
  /** Delta pill text, e.g. "+12%". */
  delta?: string
  /** Direction of the delta. */
  trend?: 'up' | 'down' | 'flat'
  /** Whether an "up" trend is good (default true). Inverts coloring. */
  goodWhenUp?: boolean
  className?: string
  /** Navigate here on click (renders the card as a link). */
  to?: string
  /** Custom click handler (renders the card as a button). Ignored if `to` is set. */
  onClick?: () => void
}

/** Label + delta pill + big value + hint. Optionally clickable. STYLE.md §4. */
export function KpiCard({
  label,
  value,
  hint,
  icon,
  delta,
  trend = 'flat',
  goodWhenUp = true,
  className,
  to,
  onClick,
}: KpiCardProps) {
  const isGood = trend === 'flat' ? null : (trend === 'up') === goodWhenUp
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : ArrowRight
  const interactive = Boolean(to || onClick)

  const base = cn(
    'group block w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md',
    interactive &&
      'cursor-pointer hover:border-brand-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200',
    className,
  )

  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon && <IconChip icon={icon} size="h-8 w-8" />}
          <span className="text-xs font-medium text-slate-400">{label}</span>
        </div>
        {delta ? (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
              isGood === null && 'bg-slate-100 text-slate-600',
              isGood === true && 'bg-emerald-50 text-emerald-700',
              isGood === false && 'bg-rose-50 text-rose-700',
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {delta}
          </span>
        ) : (
          interactive && (
            <ChevronRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-brand-500" />
          )
        )}
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-ink-900 tnum">{value}</div>
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={base}>
        {inner}
      </Link>
    )
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={base}>
        {inner}
      </button>
    )
  }
  return <div className={base}>{inner}</div>
}
