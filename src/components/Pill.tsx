import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { STATUS_CHIP } from '@/lib/colors'

export type PillTone = 'good' | 'watch' | 'bad' | 'brand' | 'neutral'

interface PillProps {
  tone?: PillTone
  className?: string
  children: ReactNode
}

/** Rounded-full status chip. STYLE.md §4. */
export function Pill({ tone = 'neutral', className, children }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold',
        STATUS_CHIP[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
