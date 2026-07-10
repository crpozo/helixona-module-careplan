import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight, PartyPopper } from 'lucide-react'
import type { Activity } from '@/types'
import { useApp, useDerived } from '@/store/store'
import { isSupplementLike } from '@/lib/plan'
import {
  WEEKDAY_LABELS,
  isDoneOnDay,
  isScheduledOn,
  scheduledDays,
  weekdayIndex,
} from '@/lib/schedule'
import { adherenceColor } from '@/lib/colors'
import { cn } from '@/lib/cn'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'
import { IconChip } from '@/components/IconChip'
import { Pill } from '@/components/Pill'
import { ProgressBar } from '@/components/ProgressBar'
import { ProgressDots } from '@/components/ProgressDots'

type View = 'day' | 'week' | 'month' | 'treatment'

const VIEWS: { key: View; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'treatment', label: 'Treatment' },
]

const SUBTITLE: Record<View, string> = {
  day: 'One day at a time.',
  week: 'Your whole week.',
  month: 'Your month at a glance.',
  treatment: 'One treatment, up close.',
}

// --- Shared bits -------------------------------------------------------------

/** Clear words instead of +/−: a big "Yes ✓", or "Done ✓" with a small Undo. */
function YesControl({
  name,
  done,
  canUndo,
  onYes,
  onUndo,
}: {
  name: string
  done: boolean
  canUndo: boolean
  onYes: () => void
  onUndo: () => void
}) {
  if (done) {
    return (
      <span className="flex shrink-0 items-center gap-2">
        {canUndo && (
          <button
            type="button"
            onClick={onUndo}
            aria-label={`Undo ${name}`}
            className="text-xs font-extrabold text-slate-400 underline-offset-2 transition-colors hover:text-slate-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Undo
          </button>
        )}
        <span
          role="img"
          aria-label={`${name} done`}
          className="inline-flex items-center gap-1 rounded-2xl bg-brand-500 px-3 py-2 text-sm font-extrabold text-ink-800"
        >
          <Check className="h-4 w-4" strokeWidth={3} />
          Done
        </span>
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={onYes}
      aria-label={`Yes, I did ${name}`}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-brand-500 px-4 py-2.5 text-sm font-extrabold text-ink-800 shadow-[0_4px_0_#9c7e44] transition-all hover:bg-brand-400 active:translate-y-1 active:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <Check className="h-4 w-4" strokeWidth={3} />
      Yes
    </button>
  )
}

function ItemRow({
  activity,
  detail,
  highlight,
  children,
}: {
  activity: Activity
  detail?: ReactNode
  highlight?: boolean
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-3xl border-2 p-4',
        highlight ? 'border-brand-200 bg-brand-50' : 'border-slate-200 bg-white',
      )}
    >
      <IconChip icon={activity.icon} size="h-12 w-12" iconClassName="h-6 w-6" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-extrabold text-slate-800">{activity.name}</p>
        {detail && <div className="mt-0.5 text-xs font-semibold text-slate-400">{detail}</div>}
      </div>
      {children}
    </div>
  )
}

function GroupLabel({ children }: { children: string }) {
  return (
    <p className="px-1 text-sm font-extrabold uppercase tracking-wide text-slate-400">{children}</p>
  )
}

function groupRows(activities: Activity[]) {
  return {
    clinic: activities.filter((a) => a.location === 'in_office'),
    home: activities.filter((a) => a.location === 'at_home' && !isSupplementLike(a.category)),
    supps: activities.filter((a) => isSupplementLike(a.category)),
  }
}

const GROUP_LABELS: [keyof ReturnType<typeof groupRows>, string][] = [
  ['clinic', 'At the clinic'],
  ['home', 'At home'],
  ['supps', 'Supplements & medicines'],
]

// --- The page ------------------------------------------------------------------

/**
 * "Schedule" — the plan, filtered the way the patient thinks about it:
 * by day (default: today, big Yes/Undo), by week, by month, by treatment.
 */
export function WeekPage() {
  const { state, actions } = useApp()
  const d = useDerived()

  const [view, setView] = useState<View>('day')

  const today = useMemo(() => new Date(), [])
  const todayIdx = weekdayIndex(today)
  const [selectedDay, setSelectedDay] = useState(todayIdx)
  const [monthOffset, setMonthOffset] = useState(0)

  const activities = state.plan.activities
  const actualOf = (id: string) =>
    d.currentAdherence.byActivity.find((r) => r.activity.id === id)?.actual ?? 0
  const orderedOf = (id: string) =>
    d.currentAdherence.byActivity.find((r) => r.activity.id === id)?.ordered ?? 0

  const [selectedTreatment, setSelectedTreatment] = useState(activities[0]?.id ?? '')

  // Dates for the current week's strip, Monday first.
  const weekDates = useMemo(() => {
    const monday = new Date(today)
    monday.setDate(monday.getDate() - todayIdx)
    return Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(monday)
      dt.setDate(dt.getDate() + i)
      return dt
    })
  }, [today, todayIdx])

  // ---- Day view ------------------------------------------------------------
  const dayItems = activities.filter((a) => isScheduledOn(a, selectedDay))
  const dayGroups = groupRows(dayItems)
  const isTodaySelected = selectedDay === todayIdx
  const weekLog = d.currentWeekLog
  const allDoneToday =
    dayItems.length > 0 && dayItems.every((a) => isDoneOnDay(weekLog, a.id, selectedDay))

  function dayControl(a: Activity) {
    const covered = isDoneOnDay(weekLog, a.id, selectedDay)
    if (isTodaySelected) {
      return (
        <YesControl
          name={a.name}
          done={covered}
          canUndo={covered}
          onYes={() => actions.logDaily(a.id, selectedDay, true)}
          onUndo={() => actions.logDaily(a.id, selectedDay, false)}
        />
      )
    }
    if (covered) {
      return (
        <Pill tone="brand" className="shrink-0">
          <Check className="h-3.5 w-3.5" strokeWidth={3} /> Done
        </Pill>
      )
    }
    return (
      <Pill tone="neutral" className="shrink-0">
        {selectedDay < todayIdx ? 'Not logged' : 'Planned'}
      </Pill>
    )
  }

  // Week/Treatment logging: prefer marking TODAY done; fall back to the
  // plain weekly counter for catch-up logging on unscheduled days.
  function logOne(a: Activity) {
    if (isScheduledOn(a, todayIdx) && !isDoneOnDay(weekLog, a.id, todayIdx)) {
      actions.logDaily(a.id, todayIdx, true)
    } else {
      actions.logCompletion(a.id, 1)
    }
  }
  function undoOne(a: Activity) {
    if (isDoneOnDay(weekLog, a.id, todayIdx)) {
      actions.logDaily(a.id, todayIdx, false)
    } else {
      actions.logCompletion(a.id, -1)
    }
  }

  // ---- Month view ------------------------------------------------------------
  const monthBase = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + monthOffset, 1),
    [today, monthOffset],
  )

  const monthCells = useMemo(() => {
    const lead = weekdayIndex(monthBase)
    const daysInMonth = new Date(monthBase.getFullYear(), monthBase.getMonth() + 1, 0).getDate()
    const cells: (Date | null)[] = Array.from({ length: lead }, () => null)
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(monthBase.getFullYear(), monthBase.getMonth(), day))
    }
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [monthBase])

  const perWeekdayCount = useMemo(
    () =>
      Array.from({ length: 7 }, (_, idx) => activities.filter((a) => isScheduledOn(a, idx)).length),
    [activities],
  )

  const isSameDay = (x: Date, y: Date) =>
    x.getFullYear() === y.getFullYear() &&
    x.getMonth() === y.getMonth() &&
    x.getDate() === y.getDate()

  // ---- Treatment view --------------------------------------------------------
  const treatment = activities.find((a) => a.id === selectedTreatment) ?? activities[0]
  const treatmentHistory = useMemo(() => {
    if (!treatment) return []
    return d.weekAdherences
      .filter((w) => w.weekNumber <= state.currentWeek)
      .sort((a, b) => b.weekNumber - a.weekNumber)
      .slice(0, 6)
      .map((w) => ({
        weekNumber: w.weekNumber,
        pct: w.byActivity.find((x) => x.activity.id === treatment.id)?.pct ?? 0,
      }))
  }, [d.weekAdherences, state.currentWeek, treatment])

  if (activities.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <EmptyState
          icon="CalendarDays"
          title="No activities yet"
          description="Your care plan doesn't have activities yet — your clinic will add them."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-5">
      {/* Header */}
      <header className="animate-fade-up pt-2">
        <h1 className="text-3xl font-extrabold text-slate-800">Schedule</h1>
        <p className="mt-1 text-base font-semibold text-slate-500">{SUBTITLE[view]}</p>
      </header>

      {/* Filter: day / week / month / treatment */}
      <div
        className="grid grid-cols-4 gap-1 rounded-2xl border-2 border-slate-200 bg-slate-100 p-1"
        role="tablist"
        aria-label="Schedule view"
      >
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            role="tab"
            aria-selected={view === v.key}
            onClick={() => setView(v.key)}
            className={cn(
              'rounded-xl px-2 py-2 text-sm font-extrabold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              view === v.key
                ? 'bg-white text-brand-800 shadow-soft'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* ---- DAY ---- */}
      {view === 'day' && (
        <>
          {/* Week strip: tap a day to see its plan; you log on today */}
          <div className="grid grid-cols-7 gap-1">
            {weekDates.map((dt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDay(idx)}
                aria-pressed={selectedDay === idx}
                className={cn(
                  'flex flex-col items-center rounded-2xl border-2 px-1 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  selectedDay === idx
                    ? 'border-brand-400 bg-brand-50'
                    : 'border-transparent hover:bg-slate-50',
                )}
              >
                <span
                  className={cn(
                    'text-[10px] font-extrabold uppercase',
                    selectedDay === idx ? 'text-brand-800' : 'text-slate-400',
                  )}
                >
                  {WEEKDAY_LABELS[idx]}
                </span>
                <span
                  className={cn(
                    'mt-0.5 text-base font-extrabold tnum',
                    idx === todayIdx ? 'text-brand-700' : 'text-slate-700',
                  )}
                >
                  {dt.getDate()}
                </span>
                {idx === todayIdx && <span className="mt-0.5 h-1 w-1 rounded-full bg-brand-500" />}
              </button>
            ))}
          </div>

          <p className="text-center text-sm font-extrabold text-slate-500">
            {isTodaySelected
              ? `Today, ${today.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}`
              : weekDates[selectedDay].toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
          </p>

          {isTodaySelected && allDoneToday ? (
            <Card className="border-brand-200 bg-brand-50">
              <div className="flex flex-col items-center py-2 text-center">
                <PartyPopper className="h-10 w-10 text-brand-700" />
                <p className="mt-2 text-lg font-extrabold text-slate-800">All done for today! 🎉</p>
              </div>
            </Card>
          ) : (
            isTodaySelected &&
            dayItems.length > 0 && (
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
            )
          )}

          {dayItems.length === 0 ? (
            <EmptyState
              icon="Sparkles"
              title="Nothing planned this day"
              description="A rest day — enjoy it."
            />
          ) : (
            GROUP_LABELS.map(([key, label]) =>
              dayGroups[key].length === 0 ? null : (
                <section key={key} className="space-y-3">
                  <GroupLabel>{label}</GroupLabel>
                  {dayGroups[key].map((a) => (
                    <ItemRow
                      key={a.id}
                      activity={a}
                      detail={a.dose ?? (a.durationMin ? `≈${a.durationMin} min` : undefined)}
                      highlight={isDoneOnDay(weekLog, a.id, selectedDay)}
                    >
                      {dayControl(a)}
                    </ItemRow>
                  ))}
                </section>
              ),
            )
          )}
        </>
      )}

      {/* ---- WEEK ---- */}
      {view === 'week' && (
        <>
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-extrabold text-slate-500">Each dot is one time this week.</p>
            <Pill tone="brand" className="tnum shrink-0">
              Week {state.currentWeek}
            </Pill>
          </div>
          {GROUP_LABELS.map(([key, label]) => {
            const items = groupRows(activities)[key]
            if (items.length === 0) return null
            return (
              <section key={key} className="space-y-3">
                <GroupLabel>{label}</GroupLabel>
                {items.map((a) => {
                  const actual = actualOf(a.id)
                  const ordered = orderedOf(a.id)
                  return (
                    <ItemRow
                      key={a.id}
                      activity={a}
                      detail={<ProgressDots total={ordered} done={actual} className="mt-1" />}
                      highlight={ordered > 0 && actual >= ordered}
                    >
                      <YesControl
                        name={a.name}
                        done={ordered > 0 && actual >= ordered}
                        canUndo={actual > 0}
                        onYes={() => logOne(a)}
                        onUndo={() => undoOne(a)}
                      />
                    </ItemRow>
                  )
                })}
              </section>
            )
          })}
        </>
      )}

      {/* ---- MONTH ---- */}
      {view === 'month' && (
        <Card>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMonthOffset((m) => m - 1)}
              aria-label="Previous month"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="text-base font-extrabold text-slate-800">
              {monthBase.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
            <button
              type="button"
              onClick={() => setMonthOffset((m) => m + 1)}
              aria-label="Next month"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center">
            {WEEKDAY_LABELS.map((w) => (
              <span key={w} className="text-[10px] font-extrabold uppercase text-slate-400">
                {w}
              </span>
            ))}
            {monthCells.map((cell, i) =>
              cell === null ? (
                <span key={i} />
              ) : (
                <span
                  key={i}
                  className={cn(
                    'flex flex-col items-center rounded-xl py-1.5',
                    isSameDay(cell, today) && 'bg-brand-500',
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-extrabold tnum',
                      isSameDay(cell, today) ? 'text-ink-800' : 'text-slate-700',
                    )}
                  >
                    {cell.getDate()}
                  </span>
                  <span
                    className={cn(
                      'text-[9px] font-bold tnum',
                      isSameDay(cell, today) ? 'text-ink-800/70' : 'text-brand-700',
                    )}
                  >
                    {perWeekdayCount[weekdayIndex(cell)] > 0
                      ? `${perWeekdayCount[weekdayIndex(cell)]}`
                      : ''}
                  </span>
                </span>
              ),
            )}
          </div>
          <p className="mt-3 text-center text-xs font-semibold text-slate-400">
            The small number is how many plan items that day has.
          </p>
        </Card>
      )}

      {/* ---- TREATMENT ---- */}
      {view === 'treatment' && treatment && (
        <>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {activities.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelectedTreatment(a.id)}
                aria-pressed={treatment.id === a.id}
                className={cn(
                  'shrink-0 rounded-2xl border-2 px-3 py-2 text-sm font-extrabold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  treatment.id === a.id
                    ? 'border-brand-400 bg-brand-50 text-brand-800'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                )}
              >
                {a.name}
              </button>
            ))}
          </div>

          <Card className="border-brand-200 bg-brand-50">
            <div className="flex items-center gap-3">
              <IconChip icon={treatment.icon} size="h-14 w-14" iconClassName="h-7 w-7" />
              <div className="min-w-0 flex-1">
                <p className="text-lg font-extrabold text-slate-800">{treatment.name}</p>
                {(treatment.dose ?? treatment.durationMin) && (
                  <p className="text-sm font-semibold text-slate-500">
                    {treatment.dose ?? `≈${treatment.durationMin} min`}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-extrabold uppercase tracking-wide text-slate-400">
                On
              </span>
              {scheduledDays(treatment).map((idx) => (
                <Pill key={idx} tone={idx === todayIdx ? 'brand' : 'neutral'}>
                  {WEEKDAY_LABELS[idx]}
                </Pill>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <ProgressDots total={orderedOf(treatment.id)} done={actualOf(treatment.id)} />
              <YesControl
                name={treatment.name}
                done={
                  orderedOf(treatment.id) > 0 && actualOf(treatment.id) >= orderedOf(treatment.id)
                }
                canUndo={actualOf(treatment.id) > 0}
                onYes={() => logOne(treatment)}
                onUndo={() => undoOne(treatment)}
              />
            </div>
          </Card>

          <Card title="Week by week" subtitle={`How your ${treatment.name} is going`}>
            <ul className="space-y-3">
              {treatmentHistory.map((w) => (
                <li key={w.weekNumber} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-sm font-extrabold text-slate-600 tnum">
                    Week {w.weekNumber}
                  </span>
                  <ProgressBar value={w.pct} color={adherenceColor(w.pct)} className="flex-1" />
                  <span className="w-11 shrink-0 text-right text-sm font-bold text-slate-500 tnum">
                    {w.pct}%
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  )
}
