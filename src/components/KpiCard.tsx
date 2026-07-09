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
  delta?: string
  trend?: 'up' | 'down' | 'flat'
  goodWhenUp?: boolean
  className?: string
  /** Navigate here on click (renders as a link). */
  to?: string
  /** Custom click handler (renders as a button). Ignored if `to` is set. */
  onClick?: () => void
  /** Optional top-right slot (e.g. an "Active" badge). */
  badge?: ReactNode
}

/** White stat card with a 2px border. Optionally clickable. */
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
  badge,
}: KpiCardProps) {
  const isGood = trend === 'flat' ? null : (trend === 'up') === goodWhenUp
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : ArrowRight
  const interactive = Boolean(to || onClick)

  const base = cn(
    'group block w-full rounded-3xl border-2 border-slate-200 bg-white p-4 text-left transition-colors',
    interactive &&
      'cursor-pointer hover:border-brand-400 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
    className,
  )

  const topRight = badge ? (
    badge
  ) : delta ? (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold',
        isGood === null && 'bg-slate-100 text-slate-600',
        isGood === true && 'bg-brand-100 text-brand-800',
        isGood === false && 'bg-rose-100 text-rose-600',
      )}
    >
      <TrendIcon className="h-3 w-3" />
      {delta}
    </span>
  ) : interactive ? (
    <ChevronRight className="h-4 w-4 text-slate-400 transition-colors group-hover:text-brand-700" />
  ) : null

  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        {icon ? <IconChip icon={icon} size="h-10 w-10" /> : <span />}
        {topRight}
      </div>
      <p className="mt-4 text-sm font-bold text-slate-500">{label}</p>
      <div className="mt-1 text-2xl font-extrabold tracking-tight text-slate-800 tnum">{value}</div>
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
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
