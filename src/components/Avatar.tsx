import { initials } from '@/lib/format'
import { cn } from '@/lib/cn'

interface AvatarProps {
  firstName: string
  lastName: string
  className?: string
  size?: string
}

/** Gold monogram avatar (light theme). */
export function Avatar({ firstName, lastName, className, size = 'h-10 w-10' }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-brand-100 text-sm font-extrabold text-brand-800 ring-2 ring-brand-200',
        size,
        className,
      )}
      aria-hidden
    >
      {initials(firstName, lastName)}
    </span>
  )
}
