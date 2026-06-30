import { cn } from '@/lib/cn'
import { getIcon } from '@/lib/icons'

interface IconChipProps {
  /** lucide icon name. */
  icon: string
  className?: string
  /** Tailwind size classes for the wrapper, e.g. "h-8 w-8". */
  size?: string
  iconClassName?: string
}

/** Soft rounded icon chip — section accents. STYLE.md §5. */
export function IconChip({
  icon,
  className,
  size = 'h-9 w-9',
  iconClassName = 'h-4 w-4',
}: IconChipProps) {
  const Icon = getIcon(icon)
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700',
        size,
        className,
      )}
    >
      <Icon className={iconClassName} />
    </span>
  )
}
