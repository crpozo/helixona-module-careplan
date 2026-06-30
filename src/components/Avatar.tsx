import { initials } from '@/lib/format'
import { cn } from '@/lib/cn'

interface AvatarProps {
  firstName: string
  lastName: string
  className?: string
  size?: string
}

/** Gold-on-black monogram avatar. */
export function Avatar({ firstName, lastName, className, size = 'h-10 w-10' }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-ink-900 text-sm font-bold text-brand-500',
        size,
        className,
      )}
      aria-hidden
    >
      {initials(firstName, lastName)}
    </span>
  )
}
