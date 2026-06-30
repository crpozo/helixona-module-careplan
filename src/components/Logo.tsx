import { cn } from '@/lib/cn'

/** Helixona wordmark with the gold helix glyph. */
export function Logo({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900">
        <svg viewBox="0 0 64 64" className="h-5 w-5" aria-hidden>
          <path
            d="M20 14c10 6 14 12 14 18s-4 12-14 18M44 14c-10 6-14 12-14 18s4 12 14 18"
            fill="none"
            stroke="#d6b981"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <div className="leading-none">
        <span
          className={cn(
            'block text-sm font-bold tracking-[0.18em]',
            dark ? 'text-white' : 'text-ink-900',
          )}
        >
          HELIXONA
        </span>
        <span className="block text-[10px] font-medium tracking-wide text-brand-600">
          Care Plan
        </span>
      </div>
    </div>
  )
}
