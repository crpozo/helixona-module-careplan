import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

interface ProgressDotsProps {
  /** Ordered repetitions (dots to draw). */
  total: number
  /** Completed repetitions (filled dots). */
  done: number
  className?: string
}

/**
 * One big friendly dot per ordered repetition — green check when done.
 * Falls back to a "3/10" chip when there are too many to show as dots.
 */
export function ProgressDots({ total, done, className }: ProgressDotsProps) {
  const clampedDone = Math.max(0, Math.min(total, done))
  if (total > 7) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-600 tnum',
          className,
        )}
        aria-label={`${clampedDone} of ${total} done`}
      >
        {clampedDone}/{total}
      </span>
    )
  }
  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      role="img"
      aria-label={`${clampedDone} of ${total} done`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            'inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors',
            i < clampedDone ? 'bg-brand-500 text-ink-800' : 'bg-slate-200',
          )}
        >
          {i < clampedDone && <Check className="h-3.5 w-3.5" strokeWidth={3.5} />}
        </span>
      ))}
    </span>
  )
}
