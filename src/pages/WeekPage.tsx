import { useMemo } from 'react'
import { Check, ChevronLeft, ChevronRight, Coins, Minus, Plus } from 'lucide-react'
import type { ActivityAdherence, ActivityLocation } from '@/types'
import { useApp, useDerived } from '@/store/store'
import { LOCATION_LABEL } from '@/lib/plan'
import { addDays, formatShortDate, num, pct, plural } from '@/lib/format'
import { adherenceColor } from '@/lib/colors'
import { getIcon } from '@/lib/icons'
import { Card } from '@/components/Card'
import { Pill } from '@/components/Pill'
import { ProgressRing } from '@/components/ProgressRing'
import { ProgressBar } from '@/components/ProgressBar'
import { Button } from '@/components/Button'
import { SectionHeading } from '@/components/SectionHeading'
import { EmptyState } from '@/components/EmptyState'

// Status pill copy/tone for the week header.
const STATUS_PILL: Record<
  'good' | 'watch' | 'bad',
  { tone: 'good' | 'watch' | 'bad'; label: string }
> = {
  good: { tone: 'good', label: 'On track' },
  watch: { tone: 'watch', label: 'Keep going' },
  bad: { tone: 'bad', label: 'Behind' },
}

// Encouraging line that shifts with how the week is going.
function encouragement(pctVal: number, target: number): string {
  if (pctVal >= 100) return "Perfect week — you've done everything on your plan. Incredible."
  if (pctVal >= target) return "You're on track for the week. Keep the momentum going!"
  if (pctVal >= 50) return "Good progress — a few more and you'll hit your goal this week."
  if (pctVal > 0) return "Nice start. Check off what you've done and watch it climb."
  return "Fresh week, clean slate. Log your first activity to get rolling."
}

// Ordered list of locations so In office always renders before At home.
const LOCATION_ORDER: ActivityLocation[] = ['in_office', 'at_home']
const LOCATION_ICON: Record<ActivityLocation, string> = {
  in_office: 'Stethoscope',
  at_home: 'Home',
}

export function WeekPage() {
  const { state, actions } = useApp()
  const d = useDerived()

  const { currentWeek } = state
  const adherence = d.currentAdherence
  const log = d.currentWeekLog
  const status = STATUS_PILL[adherence.status]
  const ringColor = adherenceColor(adherence.pct)

  const rangeStart = formatShortDate(log.startDate)
  const rangeEnd = formatShortDate(addDays(log.startDate, 6))

  // Group the activity adherence rows by location, preserving plan order.
  const grouped = useMemo(() => {
    return LOCATION_ORDER.map((location) => ({
      location,
      rows: adherence.byActivity.filter((r) => r.activity.location === location),
    })).filter((g) => g.rows.length > 0)
  }, [adherence.byActivity])

  const hasActivities = adherence.byActivity.length > 0

  return (
    <div className="space-y-6">
      {/* 1) WEEK HEADER --------------------------------------------------- */}
      <div>
        <h1 className="text-lg font-bold text-ink-900">This Week</h1>
        <p className="text-sm text-slate-400">Check off everything you do this week.</p>
      </div>

      <Card className="animate-fade-up">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
          <ProgressRing value={adherence.pct} size={132} stroke={12} color={ringColor}>
            <span className="text-3xl font-bold tracking-tight text-ink-900 tnum">
              {pct(adherence.pct)}
            </span>
            <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
              complete
            </span>
          </ProgressRing>

          <div className="w-full flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-lg font-bold text-ink-900 tnum">Week {currentWeek}</h2>
              <Pill tone={status.tone}>{status.label}</Pill>
            </div>
            <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-slate-400 tnum">
              {rangeStart} &ndash; {rangeEnd}
            </p>

            {/* stat row */}
            <div className="mt-4 flex items-center justify-center gap-6 sm:justify-start">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Activities
                </p>
                <p className="text-xl font-bold tracking-tight text-ink-900 tnum">
                  {adherence.actual}
                  <span className="text-slate-300">/</span>
                  {adherence.ordered}
                </p>
              </div>
              <div className="h-9 w-px bg-slate-200" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Points this week
                </p>
                <p className="flex items-center gap-1.5 text-xl font-bold tracking-tight text-brand-700 tnum">
                  <Coins className="h-4 w-4 text-brand-600" />+{num(d.points.thisWeek)}
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm text-slate-500">
              {encouragement(adherence.pct, state.adherenceTarget)}
            </p>
          </div>
        </div>
      </Card>

      {/* 2) CHECKLIST ----------------------------------------------------- */}
      {!hasActivities ? (
        <Card>
          <EmptyState
            icon="Sparkles"
            title="No activities yet"
            description="Once your care plan has activities, you'll check them off here each week."
          />
        </Card>
      ) : (
        grouped.map(({ location, rows }) => {
          const groupActual = rows.reduce((s, r) => s + r.actual, 0)
          const groupOrdered = rows.reduce((s, r) => s + r.ordered, 0)
          return (
            <section key={location}>
              <SectionHeading
                icon={LOCATION_ICON[location]}
                title={LOCATION_LABEL[location]}
                subtitle={`${rows.length} ${plural(rows.length, 'activity', 'activities')} this week`}
                action={
                  <span className="text-xs font-semibold text-slate-400 tnum">
                    {groupActual} / {groupOrdered}
                  </span>
                }
              />
              <Card flush>
                <ul className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <ActivityRow
                      key={row.activity.id}
                      row={row}
                      onAdd={() => actions.logCompletion(row.activity.id, 1)}
                      onRemove={() => actions.logCompletion(row.activity.id, -1)}
                    />
                  ))}
                </ul>
              </Card>
            </section>
          )
        })
      )}

      {/* 3) TOTAL SUMMARY ------------------------------------------------- */}
      {hasActivities && (
        <Card className="border-brand-200 bg-gradient-to-br from-brand-100 to-brand-50">
          <div className="flex items-center gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-ink-900">
              <Check className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                Total this week
              </p>
              <p className="mt-0.5 text-sm text-slate-600">
                <span className="font-bold text-ink-900 tnum">{adherence.actual}</span> of{' '}
                <span className="font-bold text-ink-900 tnum">{adherence.ordered}</span> activities
                completed
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-3xl font-bold tracking-tight text-brand-700 tnum">
                {pct(adherence.pct)}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                adherence
              </p>
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar
              value={adherence.pct}
              color="#d6b981"
              height={10}
              trackClassName="bg-white/70"
            />
          </div>
        </Card>
      )}

      {/* WEEK SWITCHER ---------------------------------------------------- */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <Button
          variant="secondary"
          onClick={() => actions.setCurrentWeek(currentWeek - 1)}
          disabled={currentWeek <= 1}
          aria-label="Previous week"
        >
          <ChevronLeft className="h-4 w-4" />
          Week {Math.max(1, currentWeek - 1)}
        </Button>
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400 tnum">
          Week {currentWeek}
        </span>
        <Button
          variant="secondary"
          onClick={() => actions.setCurrentWeek(currentWeek + 1)}
          aria-label="Next week"
        >
          Week {currentWeek + 1}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// --- Single checklist row ---------------------------------------------------

function ActivityRow({
  row,
  onAdd,
  onRemove,
}: {
  row: ActivityAdherence
  onAdd: () => void
  onRemove: () => void
}) {
  const { activity, ordered, actual, pct: pctVal } = row
  const Icon = getIcon(activity.icon)
  const done = actual >= ordered
  const barColor = adherenceColor(pctVal)

  return (
    <li className="flex items-center gap-3 p-4 sm:gap-4">
      <span
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700"
        aria-hidden
      >
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-ink-900">{activity.name}</p>
          {done && (
            <Pill tone="good" className="shrink-0">
              <Check className="h-3 w-3" />
              Done
            </Pill>
          )}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <ProgressBar value={pctVal} color={barColor} className="max-w-[160px] flex-1" />
          <span className="shrink-0 text-xs font-medium text-slate-500 tnum">
            {/* key on actual remounts the count so it pops on each change */}
            <span key={actual} className="inline-block animate-pop-in font-semibold text-ink-900">
              {actual}
            </span>{' '}
            / {ordered}
          </span>
        </div>
      </div>

      {/* stepper */}
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="secondary"
          onClick={onRemove}
          disabled={actual <= 0}
          aria-label={`Remove ${activity.name}`}
          className="h-10 w-10 rounded-full p-0"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant="primary"
          onClick={onAdd}
          disabled={actual >= ordered}
          aria-label={`Add ${activity.name}`}
          className="h-10 w-10 rounded-full p-0"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </li>
  )
}
