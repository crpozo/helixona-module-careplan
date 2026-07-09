import { cn } from '@/lib/cn'

/** Helixona wordmark with the gold helix glyph (light theme). */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 ring-2 ring-brand-200">
        <svg viewBox="0 0 64 64" className="h-5 w-5" aria-hidden>
          <path
            d="M20 14c10 6 14 12 14 18s-4 12-14 18M44 14c-10 6-14 12-14 18s4 12 14 18"
            fill="none"
            stroke="#9c7e44"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <div className="leading-none">
        <span className="block text-sm font-extrabold tracking-[0.18em] text-slate-800">
          HELIXONA
        </span>
        <span className="block text-[10px] font-bold tracking-wide text-brand-700">
          Care Plan
        </span>
      </div>
    </div>
  )
}
