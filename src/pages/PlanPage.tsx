import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import type { Activity, ActivityCategory, ActivityLocation, Recurrence } from '@/types'
import { useApp } from '@/store/store'
import { Card } from '@/components/Card'
import { IconChip } from '@/components/IconChip'
import { LearnTip } from '@/components/LearnTip'
import { Button } from '@/components/Button'
import {
  CATEGORY_META,
  DEFAULT_ACTIVITY_ICON,
  LOCATION_LABEL,
  slugId,
} from '@/lib/plan'
import {
  WEEKDAY_LABELS,
  occursOn,
  recurrenceLabel,
  scheduledDays,
  weekdayIndex,
} from '@/lib/schedule'
import { plural } from '@/lib/format'
import { cn } from '@/lib/cn'

const CATEGORY_KEYS: ActivityCategory[] = [
  'treatment',
  'iv',
  'office_visit',
  'home',
  'supplement',
  'medication',
]

/** Local YYYY-MM-DD (avoids the UTC shift toISOString would introduce). */
function localIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function spanFor(location: ActivityLocation): number {
  return location === 'in_office' ? 6 : 7
}

/** A colored dot per therapy kind, for the calendar cells. */
function dotClass(a: Activity): string {
  if (a.location === 'in_office') return 'bg-brand-500'
  if (a.category === 'supplement' || a.category === 'medication') return 'bg-emerald-500'
  return 'bg-sky-500'
}

// --- The therapy calendar ---------------------------------------------------

function TherapyCalendar({ activities }: { activities: Activity[] }) {
  const today = useMemo(() => new Date(), [])
  const [monthOffset, setMonthOffset] = useState(0)
  const [selected, setSelected] = useState<Date>(today)

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

  const onDay = (date: Date) => activities.filter((a) => occursOn(a, date))
  const selectedItems = onDay(selected)

  return (
    <>
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
          {monthCells.map((cell, i) => {
            if (cell === null) return <span key={i} />
            const items = onDay(cell)
            const isToday = sameDay(cell, today)
            const isSelected = sameDay(cell, selected)
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(cell)}
                aria-pressed={isSelected}
                aria-label={`${cell.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}, ${items.length} ${plural(items.length, 'therapy', 'therapies')}`}
                className={cn(
                  'flex min-h-[2.75rem] flex-col items-center rounded-xl border-2 py-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  isSelected ? 'border-brand-400 bg-brand-50' : 'border-transparent hover:bg-slate-50',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-sm font-extrabold tnum',
                    isToday ? 'bg-brand-500 text-ink-800' : 'text-slate-700',
                  )}
                >
                  {cell.getDate()}
                </span>
                <span className="mt-1 flex h-1.5 items-center gap-0.5">
                  {items.slice(0, 3).map((a) => (
                    <span key={a.id} className={cn('h-1.5 w-1.5 rounded-full', dotClass(a))} />
                  ))}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] font-bold text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-500" /> Clinic
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-500" /> Home therapy
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Supplement
          </span>
        </div>
      </Card>

      {/* Selected day's therapies */}
      <div className="space-y-2.5">
        <h2 className="px-1 text-base font-extrabold text-slate-800">
          {sameDay(selected, today)
            ? 'Today'
            : selected.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
        </h2>
        {selectedItems.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm font-semibold text-slate-400">
            No therapies scheduled this day.
          </div>
        ) : (
          selectedItems.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 rounded-3xl border-2 border-slate-200 bg-white p-3.5"
            >
              <IconChip icon={a.icon} size="h-11 w-11" iconClassName="h-5 w-5" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-slate-800">{a.name}</p>
                <p className="truncate text-xs font-semibold text-slate-400">
                  {LOCATION_LABEL[a.location]} · {recurrenceLabel(a)}
                </p>
              </div>
              <LearnTip activity={a} />
            </div>
          ))
        )}
      </div>
    </>
  )
}

// --- Managing therapies -----------------------------------------------------

/** Weekday toggles (Mon–Sun) for organizing a weekly therapy. */
function DayPicker({
  days,
  location,
  onToggle,
}: {
  days: number[]
  location: ActivityLocation
  onToggle: (idx: number) => void
}) {
  const span = spanFor(location)
  return (
    <div className="flex flex-wrap gap-1.5">
      {WEEKDAY_LABELS.map((label, idx) => {
        const disabled = idx >= span
        const on = days.includes(idx)
        return (
          <button
            key={label}
            type="button"
            disabled={disabled}
            aria-pressed={on}
            onClick={() => onToggle(idx)}
            className={cn(
              'h-9 w-11 rounded-xl border-2 text-xs font-extrabold uppercase transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              disabled && 'cursor-not-allowed border-slate-100 text-slate-300',
              !disabled && on && 'border-brand-400 bg-brand-500 text-ink-800',
              !disabled && !on && 'border-slate-200 bg-white text-slate-500 hover:border-brand-300',
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

/** One care-team (read-only) therapy row. */
function CareTeamRow({ activity }: { activity: Activity }) {
  return (
    <li className="flex items-center gap-3 rounded-3xl border-2 border-slate-200 bg-white p-4">
      <IconChip icon={activity.icon} size="h-11 w-11" iconClassName="h-5 w-5" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold text-slate-800">{activity.name}</p>
        <p className="mt-0.5 text-xs font-semibold text-slate-400">
          {LOCATION_LABEL[activity.location]} · {recurrenceLabel(activity)}
        </p>
      </div>
      <LearnTip activity={activity} />
    </li>
  )
}

/** One patient-added therapy: editable weekly days (or recurrence) + remove. */
function OwnTherapyRow({ activity }: { activity: Activity }) {
  const { actions } = useApp()
  const days = scheduledDays(activity)

  function toggleDay(idx: number) {
    const set = new Set(days)
    if (set.has(idx)) {
      if (set.size === 1) return
      set.delete(idx)
    } else {
      set.add(idx)
    }
    const nextDays = [...set].sort((a, b) => a - b)
    actions.upsertActivity({ ...activity, days: nextDays, timesPerWeek: nextDays.length })
  }

  return (
    <li className="rounded-3xl border-2 border-brand-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <IconChip icon={activity.icon} size="h-11 w-11" iconClassName="h-5 w-5" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-slate-800">{activity.name}</p>
          <p className="text-xs font-semibold text-slate-400">
            {LOCATION_LABEL[activity.location]} · {recurrenceLabel(activity)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
          aria-label={`Remove ${activity.name}`}
          onClick={() => {
            if (window.confirm(`Remove "${activity.name}" from your therapies?`)) {
              actions.removeActivity(activity.id)
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {/* Weekly therapies can be re-arranged by day; recurring ones show cadence. */}
      {!activity.recurrence && (
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
            Which days?
          </p>
          <DayPicker days={days} location={activity.location} onToggle={toggleDay} />
        </div>
      )}
    </li>
  )
}

type Cadence = 'weekly' | 'weeks' | 'months'

const WEEK_INTERVALS = [2, 3, 4, 6, 8]
const MONTH_INTERVALS = [1, 2, 3, 6, 12]

function AddTherapyForm() {
  const { state, actions } = useApp()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [location, setLoc] = useState<ActivityLocation>('at_home')
  const [category, setCategory] = useState<ActivityCategory>('home')
  const [cadence, setCadence] = useState<Cadence>('weekly')
  const [days, setDays] = useState<number[]>([0, 2, 4])
  const [interval, setInterval] = useState(2)
  const [anchor, setAnchor] = useState(() => localIso(new Date()))

  const canAdd =
    name.trim().length > 0 && (cadence !== 'weekly' || days.length > 0)

  function reset() {
    setName('')
    setLoc('at_home')
    setCategory('home')
    setCadence('weekly')
    setDays([0, 2, 4])
    setInterval(2)
    setAnchor(localIso(new Date()))
    setOpen(false)
  }

  function setLocation(loc: ActivityLocation) {
    setLoc(loc)
    const span = spanFor(loc)
    setDays((d) => {
      const next = d.filter((x) => x < span)
      return next.length ? next : [0]
    })
  }

  function toggleDay(idx: number) {
    setDays((d) => {
      const set = new Set(d)
      if (set.has(idx)) set.delete(idx)
      else set.add(idx)
      return [...set].sort((a, b) => a - b)
    })
  }

  function add() {
    if (!canAdd) return
    const points = category === 'iv' || category === 'treatment' ? 15 : 5
    const base = {
      id: slugId(name),
      name: name.trim(),
      category,
      location,
      points,
      icon: DEFAULT_ACTIVITY_ICON[category],
      addedBy: 'patient' as const,
      startWeek: state.currentWeek,
    }
    let activity: Activity
    if (cadence === 'weekly') {
      const span = spanFor(location)
      const chosen = [...new Set(days.filter((x) => x >= 0 && x < span))].sort((a, b) => a - b)
      if (chosen.length === 0) return
      activity = { ...base, timesPerWeek: chosen.length, days: chosen }
    } else {
      const recurrence: Recurrence = {
        unit: cadence === 'weeks' ? 'week' : 'month',
        interval: Math.max(1, interval),
        anchor,
      }
      // Recurring reminders aren't weekly-tracked — they live on the calendar.
      activity = { ...base, timesPerWeek: 0, recurrence }
    }
    actions.upsertActivity(activity)
    reset()
  }

  if (!open) {
    return (
      <Button variant="secondary" size="lg" className="w-full" onClick={() => setOpen(true)}>
        <Plus className="h-5 w-5" />
        Add a therapy of your own
      </Button>
    )
  }

  const input =
    'w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none'
  const label = 'mb-1 block text-xs font-extrabold uppercase tracking-wide text-slate-500'

  const CADENCES: { key: Cadence; label: string }[] = [
    { key: 'weekly', label: 'Weekly' },
    { key: 'weeks', label: 'Every N weeks' },
    { key: 'months', label: 'Every N months' },
  ]
  const intervals = cadence === 'months' ? MONTH_INTERVALS : WEEK_INTERVALS

  return (
    <div className="rounded-3xl border-2 border-slate-200 bg-slate-50 p-4">
      <div className="space-y-3">
        <div>
          <label className={label} htmlFor="own-name">
            Therapy name
          </label>
          <input
            id="own-name"
            type="text"
            className={input}
            placeholder="e.g. Morning meditation"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor="own-location">
              Where
            </label>
            <select
              id="own-location"
              className={input}
              value={location}
              onChange={(e) => setLocation(e.target.value as ActivityLocation)}
            >
              <option value="at_home">At home</option>
              <option value="in_office">At the clinic</option>
            </select>
          </div>
          <div>
            <label className={label} htmlFor="own-category">
              Type
            </label>
            <select
              id="own-category"
              className={input}
              value={category}
              onChange={(e) => setCategory(e.target.value as ActivityCategory)}
            >
              {CATEGORY_KEYS.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_META[cat].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cadence */}
        <div>
          <p className={label}>How often?</p>
          <div className="grid grid-cols-3 gap-1.5">
            {CADENCES.map((c) => (
              <button
                key={c.key}
                type="button"
                aria-pressed={cadence === c.key}
                onClick={() => setCadence(c.key)}
                className={cn(
                  'rounded-xl border-2 px-2 py-2 text-xs font-extrabold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  cadence === c.key
                    ? 'border-brand-400 bg-brand-50 text-brand-800'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {cadence === 'weekly' ? (
          <div>
            <p className={label}>Which days?</p>
            <DayPicker days={days} location={location} onToggle={toggleDay} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="own-interval">
                {cadence === 'weeks' ? 'Every … weeks' : 'Every … months'}
              </label>
              <select
                id="own-interval"
                className={input}
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
              >
                {intervals.map((n) => (
                  <option key={n} value={n}>
                    {n} {cadence === 'weeks' ? plural(n, 'week') : plural(n, 'month')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="own-anchor">
                Starting
              </label>
              <input
                id="own-anchor"
                type="date"
                className={cn(input, 'tnum')}
                value={anchor}
                onChange={(e) => setAnchor(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={reset}>
          Cancel
        </Button>
        <Button variant="primary" onClick={add} disabled={!canAdd}>
          <Plus className="h-4 w-4" />
          Add therapy
        </Button>
      </div>
    </div>
  )
}

// --- The page ---------------------------------------------------------------

/**
 * "My Plan": the goal, a calendar of the therapies in the patient's current
 * plan, and the patient's own therapies — which they can add (with weekly or
 * every-N-weeks/months recurrence) and arrange.
 */
export function PlanPage() {
  const { state } = useApp()
  const { plan } = state
  const isStaff = state.role === 'staff'

  const prescribed = plan.activities.filter((a) => a.addedBy !== 'patient')
  const own = plan.activities.filter((a) => a.addedBy === 'patient')

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* Header */}
      <header className="animate-fade-up pt-2 text-center sm:text-left">
        <h1 className="text-3xl font-extrabold text-slate-800">My Plan</h1>
        <p className="mt-1 text-base font-semibold text-slate-500">
          Your therapies, on a calendar.
        </p>
      </header>

      {/* Goal */}
      <Card className="border-brand-200 bg-brand-50">
        <p className="text-xs font-extrabold uppercase tracking-wide text-brand-700">
          Your goal
        </p>
        <p className="mt-1.5 text-lg font-extrabold text-slate-800">{plan.goal}</p>
      </Card>

      {/* Calendar of therapies */}
      <TherapyCalendar activities={plan.activities} />

      {/* All the therapies, listed */}
      {prescribed.length > 0 && (
        <section className="space-y-3">
          <h2 className="px-1 text-base font-extrabold text-slate-800">From your care team</h2>
          <ul className="space-y-3">
            {prescribed.map((a) => (
              <CareTeamRow key={a.id} activity={a} />
            ))}
          </ul>
        </section>
      )}

      {/* Patient's own therapies — add & arrange */}
      <section className="space-y-3">
        <div className="px-1">
          <h2 className="text-base font-extrabold text-slate-800">Your own therapies</h2>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            Add your own routines with a weekly, every-few-weeks or monthly recurrence. Your
            care team's plan stays as prescribed.
          </p>
        </div>
        {own.length > 0 && (
          <ul className="space-y-3">
            {own.map((a) => (
              <OwnTherapyRow key={a.id} activity={a} />
            ))}
          </ul>
        )}
        <AddTherapyForm />
      </section>

      {/* Staff shortcut */}
      {isStaff && (
        <Link
          to="/staff"
          className="flex items-center gap-3 rounded-3xl border-2 border-slate-200 bg-white p-4 transition-colors hover:border-brand-400 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <IconChip icon="Stethoscope" size="h-10 w-10" />
          <span className="flex-1 text-base font-extrabold text-slate-700">
            Edit this plan (staff)
          </span>
          <ChevronRight className="h-5 w-5 text-slate-400" aria-hidden />
        </Link>
      )}
    </div>
  )
}
