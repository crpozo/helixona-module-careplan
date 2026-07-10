import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Info, X } from 'lucide-react'
import type { Activity } from '@/types'
import { findEducation } from '@/data/education'
import { CATEGORY_META } from '@/lib/plan'
import { sfx } from '@/lib/sound'
import { cn } from '@/lib/cn'
import { Button } from '@/components/Button'
import { IconChip } from '@/components/IconChip'
import { Pill } from '@/components/Pill'

interface LearnTipProps {
  activity: Pick<Activity, 'name' | 'category' | 'icon'>
  /** When set, the trigger is a labelled pill (e.g. "What is this?") instead of a bare ⓘ. */
  label?: string
  className?: string
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-wide text-brand-700">{title}</p>
      <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-600">{children}</p>
    </div>
  )
}

/**
 * Patient education tooltip: a small ⓘ next to a treatment opens a card that
 * explains what it is and why it's on the plan (see src/data/education.ts).
 */
export function LearnTip({ activity, label, className }: LearnTipProps) {
  const [open, setOpen] = useState(false)
  const edu = findEducation(activity)

  // Close on Escape while the card is open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function show(e: React.MouseEvent) {
    e.stopPropagation()
    sfx.tick()
    setOpen(true)
  }

  return (
    <>
      {label ? (
        <button
          type="button"
          onClick={show}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border-2 border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-500 transition-colors',
            'hover:border-brand-400 hover:text-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
            className,
          )}
        >
          <Info className="h-3.5 w-3.5" />
          {label}
        </button>
      ) : (
        <button
          type="button"
          onClick={show}
          aria-label={`Learn about ${activity.name}`}
          title={`What is ${activity.name}?`}
          className={cn(
            'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 transition-colors',
            'hover:bg-brand-50 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
            className,
          )}
        >
          <Info className="h-[18px] w-[18px]" />
        </button>
      )}

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-label={`About ${activity.name}`}
          >
            {/* Backdrop */}
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-slate-900/40"
            />
            {/* Card — bottom sheet on phones, centered on larger screens */}
            <div className="relative z-10 w-full max-w-md animate-fade-up rounded-t-3xl border-2 border-slate-200 bg-white p-6 shadow-xl sm:m-4 sm:rounded-3xl">
              <div className="flex items-start gap-3">
                <IconChip icon={activity.icon} size="h-12 w-12" iconClassName="h-6 w-6" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-extrabold leading-tight text-slate-800">
                    {activity.name}
                  </h2>
                  <Pill tone="neutral" className="mt-1">
                    {CATEGORY_META[activity.category].label}
                  </Pill>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close explanation"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <Section title="What it is">{edu.what}</Section>
                <Section title="Why it's in your plan">{edu.why}</Section>
                {edu.expect && <Section title="Good to know">{edu.expect}</Section>}
              </div>

              <Button
                variant="primary"
                className="mt-5 w-full"
                onClick={() => setOpen(false)}
                autoFocus
              >
                Got it
              </Button>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
