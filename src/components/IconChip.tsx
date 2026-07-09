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

/** Rounded squircle icon chip — soft gold tint on white. */
export function IconChip({
  icon,
  className,
  size = 'h-10 w-10',
  iconClassName = 'h-5 w-5',
}: IconChipProps) {
  const Icon = getIcon(icon)
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-800',
        size,
        className,
      )}
    >
      <Icon className={iconClassName} />
    </span>
  )
}
