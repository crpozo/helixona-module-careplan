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
        'inline-flex items-center justify-center rounded-full bg-white/[0.06] text-sm font-bold text-brand-200 ring-1 ring-white/15',
        size,
        className,
      )}
      aria-hidden
    >
      {initials(firstName, lastName)}
    </span>
  )
}
