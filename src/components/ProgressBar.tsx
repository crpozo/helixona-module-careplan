import { cn } from '@/lib/cn'

interface ProgressBarProps {
  /** 0..100 */
  value: number
  className?: string
  /** Override fill color (hex or tailwind via style). */
  color?: string
  height?: number
  trackClassName?: string
}

/** Slim horizontal progress / adherence bar. */
export function ProgressBar({
  value,
  className,
  color = '#d6b981',
  height = 8,
  trackClassName,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-slate-100', trackClassName, className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
    </div>
  )
}
