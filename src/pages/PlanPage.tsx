import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronRight, Plus, Trash2 } from 'lucide-react'
import type { Activity, ActivityCategory, ActivityLocation } from '@/types'
import { useApp } from '@/store/store'
import { Card } from '@/components/Card'
import { Pill } from '@/components/Pill'
import { IconChip } from '@/components/IconChip'
import { LearnTip } from '@/components/LearnTip'
import { Button } from '@/components/Button'
import {
  STAGES,
  STAGE_BY_KEY,
  CATEGORY_META,
  DEFAULT_ACTIVITY_ICON,
  LOCATION_LABEL,
  isSupplementLike,
  slugId,
} from '@/lib/plan'
import { WEEKDAY_LABELS, scheduledDays } from '@/lib/schedule'
import { getIcon } from '@/lib/icons'
import { cn } from '@/lib/cn'

const CATEGORY_KEYS: ActivityCategory[] = [
  'treatment',
  'iv',
  'office_visit',
  'home',
  'supplement',
  'medication',
]

/** Tiny "on these days" summary for a plan item. */
function DaysSummary({ activity }: { activity: Activity }) {
  const days = scheduledDays(activity)
  if (days.length === 0) return null
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {days.map((idx) => (
        <span
          key={idx}
          className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-slate-500"
        >
          {WEEKDAY_LABELS[idx]}
        </span>
      ))}
    </div>
  )
}

/** One read-only care-team item: icon, name + when, and how often per week. */
function ActivityRow({ activity }: { activity: Activity }) {
  return (
    <li className="flex items-center gap-3 rounded-3xl border-2 border-slate-200 bg-white p-4">
      <IconChip icon={activity.icon} size="h-12 w-12" iconClassName="h-6 w-6" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-extrabold text-slate-800">{activity.name}</p>
        <p className="mt-0.5 text-xs font-semibold text-slate-400">
          {activity.dose ??
            (activity.durationMin != null
              ? `≈${activity.durationMin} min`
              : CATEGORY_META[activity.category].label)}
        </p>
        <DaysSummary activity={activity} />
      </div>
      <LearnTip activity={activity} />
      <Pill tone="neutral" className="shrink-0">
        <span className="tnum">{activity.timesPerWeek}</span>x / week
      </Pill>
    </li>
  )
}

/** A labelled group of read-only activities. Renders nothing when empty. */
function ActivityGroup({ label, activities }: { label: string; activities: Activity[] }) {
  if (activities.length === 0) return null
  return (
    <div>
      <p className="mb-2 px-1 text-xs font-extrabold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <ul className="space-y-3">
        {activities.map((a) => (
          <ActivityRow key={a.id} activity={a} />
        ))}
      </ul>
    </div>
  )
}

/** Weekday toggles (Mon–Sun) for organizing a therapy across the week. */
function DayPicker({
  days,
  location,
  onToggle,
}: {
  days: number[]
  location: ActivityLocation
  onToggle: (idx: number) => void
}) {
  const span = location === 'in_office' ? 6 : 7 // clinic closed on Sundays
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

/** One patient-added therapy: editable days + remove. */
function OwnTherapyRow({ activity }: { activity: Activity }) {
  const { actions } = useApp()
  const days = scheduledDays(activity)

  function toggleDay(idx: number) {
    const set = new Set(days)
    if (set.has(idx)) {
      if (set.size === 1) return // keep at least one day
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
          <p className="truncate text-base font-extrabold text-slate-800">{activity.name}</p>
          <p className="text-xs font-semibold text-slate-400">
            {LOCATION_LABEL[activity.location]} · {days.length}x / week
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
      <div className="mt-3">
        <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
          Which days?
        </p>
        <DayPicker days={days} location={activity.location} onToggle={toggleDay} />
      </div>
    </li>
  )
}

const EMPTY_DRAFT = {
  name: '',
  location: 'at_home' as ActivityLocation,
  category: 'home' as ActivityCategory,
  days: [0, 2, 4] as number[], // Mon / Wed / Fri to start
}

/** Weekdays open for a location (clinic is closed on Sundays). */
function spanFor(location: ActivityLocation): number {
  return location === 'in_office' ? 6 : 7
}

/** Patient form: name a therapy, choose home/clinic + category, pick days. */
function AddTherapyForm() {
  const { state, actions } = useApp()
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [open, setOpen] = useState(false)

  const canAdd = draft.name.trim().length > 0 && draft.days.length > 0

  function toggleDay(idx: number) {
    setDraft((d) => {
      const set = new Set(d.days)
      if (set.has(idx)) set.delete(idx)
      else set.add(idx)
      return { ...d, days: [...set].sort((a, b) => a - b) }
    })
  }

  // Switching to the clinic drops Sunday (and anything else out of range) so
  // the chosen days can never exceed what's actually schedulable.
  function setLocation(location: ActivityLocation) {
    setDraft((d) => {
      const span = spanFor(location)
      let days = d.days.filter((x) => x < span)
      if (days.length === 0) days = [0]
      return { ...d, location, days }
    })
  }

  function add() {
    if (!canAdd) return
    const span = spanFor(draft.location)
    const days = [...new Set(draft.days.filter((x) => x >= 0 && x < span))].sort(
      (a, b) => a - b,
    )
    if (days.length === 0) return
    const points = draft.category === 'iv' || draft.category === 'treatment' ? 15 : 5
    const activity: Activity = {
      id: slugId(draft.name),
      name: draft.name.trim(),
      category: draft.category,
      location: draft.location,
      timesPerWeek: days.length,
      points,
      icon: DEFAULT_ACTIVITY_ICON[draft.category],
      days,
      addedBy: 'patient',
      startWeek: state.currentWeek,
    }
    actions.upsertActivity(activity)
    setDraft(EMPTY_DRAFT)
    setOpen(false)
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
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') add()
            }}
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
              value={draft.location}
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
              value={draft.category}
              onChange={(e) =>
                setDraft((d) => ({ ...d, category: e.target.value as ActivityCategory }))
              }
            >
              {CATEGORY_KEYS.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_META[cat].label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <p className={label}>Which days?</p>
          <DayPicker days={draft.days} location={draft.location} onToggle={toggleDay} />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
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

/**
 * "My Plan": the goal, a Duolingo-style vertical journey, the care-team plan
 * (read-only), and the patient's own therapies — which they can add and arrange
 * across the week.
 */
export function PlanPage() {
  const { state } = useApp()
  const { plan } = state
  const isStaff = state.role === 'staff'

  const currentOrder = STAGE_BY_KEY[plan.stage].order
  const stages = [...STAGES].sort((a, b) => a.order - b.order)

  const prescribed = plan.activities.filter((a) => a.addedBy !== 'patient')
  const own = plan.activities.filter((a) => a.addedBy === 'patient')

  const clinicActivities = prescribed.filter((a) => a.location === 'in_office')
  const homeActivities = prescribed.filter(
    (a) => a.location === 'at_home' && !isSupplementLike(a.category),
  )
  const supplementActivities = prescribed.filter((a) => isSupplementLike(a.category))

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* 1) Header */}
      <header className="animate-fade-up pt-2 text-center sm:text-left">
        <h1 className="text-3xl font-extrabold text-slate-800">My Plan</h1>
        <p className="mt-1 text-base font-semibold text-slate-500">
          Your road to feeling better.
        </p>
      </header>

      {/* 2) The goal */}
      <Card className="border-brand-200 bg-brand-50">
        <p className="text-xs font-extrabold uppercase tracking-wide text-brand-700">
          Your goal
        </p>
        <p className="mt-1.5 text-lg font-extrabold text-slate-800">{plan.goal}</p>
      </Card>

      {/* 3) The journey — vertical path of stages */}
      <ol className="px-1">
        {stages.map((stage, i) => {
          const isDone = stage.order < currentOrder
          const isCurrent = stage.order === currentOrder
          const StageIcon = getIcon(stage.icon)
          return (
            <li key={stage.key}>
              {i > 0 && (
                <div className="w-14">
                  <div
                    className={cn(
                      'mx-auto h-6 w-1.5 rounded-full',
                      stages[i - 1].order < currentOrder ? 'bg-brand-300' : 'bg-slate-200',
                    )}
                    aria-hidden
                  />
                </div>
              )}
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex h-14 w-14 shrink-0 items-center justify-center rounded-full',
                    isDone && 'bg-brand-500 text-ink-800',
                    isCurrent && 'bg-brand-500 text-ink-800 ring-4 ring-brand-200',
                    !isDone && !isCurrent && 'bg-slate-100 text-slate-300',
                  )}
                >
                  {isDone ? (
                    <Check className="h-7 w-7" strokeWidth={3} />
                  ) : (
                    <StageIcon className="h-7 w-7" />
                  )}
                </div>
                <div className="min-w-0 py-1">
                  <p
                    className={cn(
                      'font-extrabold',
                      isDone && 'text-slate-600',
                      isCurrent && 'text-lg text-brand-800',
                      !isDone && !isCurrent && 'text-slate-400',
                    )}
                  >
                    {stage.label}
                  </p>
                  {isCurrent && (
                    <>
                      <Pill tone="brand" className="mt-1">
                        You are here
                      </Pill>
                      <p className="mt-1.5 text-sm font-semibold text-slate-500">
                        {stage.description}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      {/* 4) The care-team plan (read-only) */}
      <section className="space-y-4">
        <h2 className="px-1 text-base font-extrabold text-slate-800">
          From your care team
        </h2>
        <ActivityGroup label="At the clinic" activities={clinicActivities} />
        <ActivityGroup label="At home" activities={homeActivities} />
        <ActivityGroup label="Supplements & medicines" activities={supplementActivities} />
      </section>

      {/* 5) The patient's own therapies — add & organize by day */}
      <section className="space-y-3">
        <div className="px-1">
          <h2 className="text-base font-extrabold text-slate-800">Your own therapies</h2>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            Add your own routines and arrange them across the week. Your care team's plan
            stays as prescribed.
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

      {/* 6) Staff shortcut (staff only) */}
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
