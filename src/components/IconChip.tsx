import { cn } from '@/lib/cn'
import { getIcon } from '@/lib/icons'

interface IconChipProps {
  /** lucide icon name. */
  icon: string
  className?: string
  /** Tailwind size classes for the wrapper, e.g. "h-10 w-10". */
  size?: string
  iconClassName?: string
}

/** Circular glassy icon chip with a gold glyph. */
export function IconChip({
  icon,
  className,
  size = 'h-10 w-10',
  iconClassName = 'h-4 w-4',
}: IconChipProps) {
  const Icon = getIcon(icon)
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-brand-300 ring-1 ring-white/10',
        size,
        className,
      )}
    >
      <Icon className={iconClassName} />
    </span>
  )
}
