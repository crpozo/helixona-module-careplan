import { Link } from 'react-router-dom'
import { Check, Minus, PartyPopper, Plus } from 'lucide-react'
import type { ActivityAdherence } from '@/types'
import { useApp, useDerived } from '@/store/store'
import { cn } from '@/lib/cn'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'
import { IconChip } from '@/components/IconChip'
import { Pill } from '@/components/Pill'
import { ProgressDots } from '@/components/ProgressDots'

/** One tappable activity row: icon, name + dots, undo, big + / done disc. */
function ActivityRow({
  row,
  onLog,
}: {
  row: ActivityAdherence
  onLog: (delta: 1 | -1) => void
}) {
  const { activity, ordered, actual } = row
  const done = actual >= ordered

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-3xl border-2 p-4',
        done ? 'border-brand-200 bg-brand-50' : 'border-slate-200 bg-white',
      )}
    >
      <IconChip icon={activity.icon} size="h-12 w-12" iconClassName="h-6 w-6" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-extrabold text-slate-800">{activity.name}</p>
        <ProgressDots total={ordered} done={actual} className="mt-1.5" />
      </div>

      {actual > 0 && (
        <button
          type="button"
          onClick={() => onLog(-1)}
          aria-label={`Undo one ${activity.name}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Minus className="h-4 w-4" />
        </button>
      )}

      {done ? (
        <span
          role="img"
          aria-label={`${activity.name} completed`}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500 text-ink-800"
        >
          <Check className="h-6 w-6" strokeWidth={3} />
        </span>
      ) : (
        <button
          type="button"
          onClick={() => onLog(1)}
          aria-label={`Log ${activity.name}`}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500 text-ink-800 shadow-[0_4px_0_#9c7e44] transition-all hover:bg-brand-400 active:translate-y-1 active:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Plus className="h-6 w-6" strokeWidth={3} />
        </button>
      )}
    </div>
  )
}

/** Small bold label above each activity group. */
function GroupLabel({ children }: { children: string }) {
  return (
    <p className="px-1 text-sm font-extrabold uppercase tracking-wide text-slate-400">{children}</p>
  )
}

/**
 * "This Week" — the direct logging page. Tap + each time you finish an
 * activity; each repetition fills a green dot. No tables, no math.
 */
export function WeekPage() {
  const { state, actions } = useApp()
  const d = useDerived()

  const rows = d.currentAdherence.byActivity
  const hasActivities = rows.length > 0
  const totalOrdered = rows.reduce((n, r) => n + r.ordered, 0)
  const allDone = totalOrdered > 0 && rows.every((r) => r.actual >= r.ordered)

  const clinicRows = rows.filter((r) => r.activity.location === 'in_office')
  const homeRows = rows.filter((r) => r.activity.location === 'at_home')

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* Header */}
      <header className="animate-fade-up flex items-start justify-between gap-3 pt-2">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">This Week</h1>
          <p className="mt-1 text-base font-semibold text-slate-500">
            Tap + each time you finish something.
          </p>
        </div>
        <Pill tone="brand" className="tnum mt-2 shrink-0">
          Week {state.currentWeek}
        </Pill>
      </header>

      {!hasActivities ? (
        <EmptyState
          icon="Sparkles"
          title="No activities yet"
          description="Once your care plan has activities, you'll log them here each week."
        />
      ) : (
        <>
          {/* Bridge to the guided flow — or a little party when done */}
          {allDone ? (
            <Card className="border-brand-200 bg-brand-50">
              <div className="flex flex-col items-center gap-2 text-center">
                <PartyPopper className="h-8 w-8 text-brand-700" />
                <p className="text-lg font-extrabold text-slate-800">
                  All done for this week! 🎉
                </p>
              </div>
            </Card>
          ) : (
            <Card className="border-brand-200 bg-brand-50">
              <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
                <p className="text-base font-extrabold text-slate-800">
                  Prefer one step at a time?
                </p>
                <Link to="/checkin" className="shrink-0">
                  <Button variant="primary" size="lg">
                    Start check-in
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* At the clinic */}
          {clinicRows.length > 0 && (
            <section className="space-y-3">
              <GroupLabel>At the clinic</GroupLabel>
              {clinicRows.map((row) => (
                <ActivityRow
                  key={row.activity.id}
                  row={row}
                  onLog={(delta) => actions.logCompletion(row.activity.id, delta)}
                />
              ))}
            </section>
          )}

          {/* At home */}
          {homeRows.length > 0 && (
            <section className="space-y-3">
              <GroupLabel>At home</GroupLabel>
              {homeRows.map((row) => (
                <ActivityRow
                  key={row.activity.id}
                  row={row}
                  onLog={(delta) => actions.logCompletion(row.activity.id, delta)}
                />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}
