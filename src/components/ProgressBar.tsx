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

/** Chunky rounded progress bar (Duolingo-style). */
export function ProgressBar({
  value,
  className,
  color = '#58cc02',
  height = 12,
  trackClassName,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-slate-200', trackClassName, className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="relative h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${clamped}%`, backgroundColor: color }}
      >
        {/* Soft top highlight, like Duolingo's lesson bar. */}
        {clamped > 0 && (
          <span className="absolute inset-x-2 top-[2px] h-1 rounded-full bg-white/30" />
        )}
      </div>
    </div>
  )
}
