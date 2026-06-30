import { cn } from '@/lib/cn'

/** Helixona wordmark with the gold helix glyph (dark theme). */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/15 ring-1 ring-brand-500/30">
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
        <span className="block text-sm font-bold tracking-[0.18em] text-white">HELIXONA</span>
        <span className="block text-[10px] font-medium tracking-wide text-brand-400">
          Care Plan
        </span>
      </div>
    </div>
  )
}
