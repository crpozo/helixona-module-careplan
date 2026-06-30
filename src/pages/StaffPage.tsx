import { useMemo, useState } from 'react'
import { Plus, Trash2, ClipboardList, AlertTriangle } from 'lucide-react'
import type {
  Activity,
  ActivityCategory,
  ActivityLocation,
  StageKey,
  Pacing,
  WeekLog,
} from '@/types'
import { useApp } from '@/store/store'
import {
  STAGES,
  PACINGS,
  CATEGORY_META,
  LOCATION_LABEL,
  PROGRAM_LABEL,
} from '@/lib/plan'
import { computeWeekAdherence, statusFromPct } from '@/lib/gamification'
import { pct, plural } from '@/lib/format'
import { adherenceColor } from '@/lib/colors'
import { cn } from '@/lib/cn'
import { Card } from '@/components/Card'
import { Pill } from '@/components/Pill'
import { Button } from '@/components/Button'
import { IconChip } from '@/components/IconChip'
import { ProgressBar } from '@/components/ProgressBar'

// Shared field styling — STYLE.md form inputs.
const INPUT =
  'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-ink-900 ' +
  'placeholder:text-slate-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100'

const LABEL = 'mb-1 block text-xs font-medium text-slate-400'

const CATEGORY_KEYS: ActivityCategory[] = ['treatment', 'iv', 'office_visit', 'home']
const LOCATION_KEYS: ActivityLocation[] = ['in_office', 'at_home']

// Default icon to attach to a new activity, keyed off its category.
const DEFAULT_ICON: Record<ActivityCategory, string> = {
  treatment: 'Zap',
  iv: 'Droplets',
  office_visit: 'Stethoscope',
  home: 'Home',
}

// Slugify a name into a stable-ish id with a short random suffix.
function slugId(name: string): string {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'activity'
  return `${base}-${Math.random().toString(36).slice(2, 6)}`
}

export function StaffPage() {
  const { state, actions } = useApp()
  const { patient } = state

  return (
    <div className="space-y-6">
      {/* Page hero — visible on mobile; desktop top bar already names the section. */}
      <header className="lg:hidden">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Staff console
        </p>
        <h1 className="text-lg font-bold text-ink-900">Manual data entry</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Author the plan and log actual visits from ECW.
        </p>
      </header>

      {/* 1) INTRO ----------------------------------------------------------- */}
      <Card className="border-ink-700/40 bg-ink-900 text-white">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-ink-900">
            <ClipboardList className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-300">
              ECW → app bridge
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              Clinic data entry — author the plan of care and log actual visits from ECW
              for{' '}
              <span className="font-semibold text-white">
                {patient.firstName} {patient.lastName}
              </span>{' '}
              (
              <span className="tnum font-semibold text-white">
                {patient.ecwId ?? '—'}
              </span>
              ).
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Pill tone="brand">{PROGRAM_LABEL[patient.program]}</Pill>
              <span className="text-xs text-slate-400">
                Provider:{' '}
                <span className="font-semibold text-slate-200">{patient.provider}</span>
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 2) PLAN SETTINGS --------------------------------------------------- */}
      <PlanSettingsCard />

      {/* 3) ACTIVITIES EDITOR ---------------------------------------------- */}
      <ActivitiesEditorCard />

      {/* 4) WEEKLY LOG ------------------------------------------------------ */}
      <WeeklyLogCard />

      {/* 5) DANGER ZONE ----------------------------------------------------- */}
      <Card
        title="Danger zone"
        subtitle="Restore the demo to its seeded state."
        className="border-rose-200"
      >
        <div className="flex flex-col gap-3 rounded-xl border border-rose-100 bg-rose-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900">Reset demo data</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Discards every plan edit, weekly log and redemption for {patient.firstName}.
              </p>
            </div>
          </div>
          <Button
            variant="dark"
            className="shrink-0"
            onClick={() => {
              if (
                window.confirm(
                  'Reset all demo data to the seeded state? This cannot be undone.',
                )
              ) {
                actions.reset()
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            Reset demo data
          </Button>
        </div>
      </Card>
    </div>
  )
}

// --- 2) Plan settings -------------------------------------------------------

function PlanSettingsCard() {
  const { state, actions } = useApp()
  const { plan, adherenceTarget } = state

  return (
    <Card
      title="Plan settings"
      subtitle="Stage, pacing and the headline goal — saved as you edit."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Stage */}
        <div>
          <label className={LABEL} htmlFor="staff-stage">
            Stage
          </label>
          <select
            id="staff-stage"
            className={INPUT}
            value={plan.stage}
            onChange={(e) => actions.setStage(e.target.value as StageKey)}
          >
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Pacing */}
        <div>
          <label className={LABEL} htmlFor="staff-pacing">
            Pacing
          </label>
          <select
            id="staff-pacing"
            className={INPUT}
            value={plan.pacing}
            onChange={(e) => actions.setPacing(e.target.value as Pacing)}
          >
            {PACINGS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Adherence target */}
        <div>
          <label className={LABEL} htmlFor="staff-target">
            Adherence target (%)
          </label>
          <input
            id="staff-target"
            type="number"
            min={10}
            max={100}
            step={5}
            className={cn(INPUT, 'tnum')}
            value={adherenceTarget}
            onChange={(e) => actions.setAdherenceTarget(Number(e.target.value))}
          />
        </div>

        {/* Start date */}
        <div>
          <label className={LABEL} htmlFor="staff-start">
            Plan start date (week 1)
          </label>
          <input
            id="staff-start"
            type="date"
            className={cn(INPUT, 'tnum')}
            value={plan.startDate}
            onChange={(e) => actions.setPlanMeta({ startDate: e.target.value })}
          />
        </div>

        {/* Focus */}
        <div className="sm:col-span-2 lg:col-span-2">
          <label className={LABEL} htmlFor="staff-focus">
            Current focus (lead actor)
          </label>
          <input
            id="staff-focus"
            type="text"
            className={INPUT}
            value={plan.focus}
            placeholder="What this stage is targeting…"
            onChange={(e) => actions.setPlanMeta({ focus: e.target.value })}
          />
        </div>

        {/* Goal */}
        <div className="sm:col-span-2 lg:col-span-3">
          <label className={LABEL} htmlFor="staff-goal">
            Patient goal (in their words)
          </label>
          <textarea
            id="staff-goal"
            rows={2}
            className={cn(INPUT, 'resize-y')}
            value={plan.goal}
            placeholder="The patient's overarching goal…"
            onChange={(e) => actions.setPlanMeta({ goal: e.target.value })}
          />
        </div>
      </div>
    </Card>
  )
}

// --- 3) Activities editor ---------------------------------------------------

function ActivitiesEditorCard() {
  const { state } = useApp()
  const { activities } = state.plan

  return (
    <Card
      flush
      title="Activities"
      subtitle={`${activities.length} ${plural(activities.length, 'item', 'items')} on the plan of care`}
    >
      {/* Table (desktop) / stacked rows (mobile) */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-y border-slate-100 text-left text-xs font-medium text-slate-400">
              <th className="px-5 py-2.5 font-medium">Activity</th>
              <th className="px-3 py-2.5 font-medium">Location</th>
              <th className="px-3 py-2.5 font-medium">Category</th>
              <th className="px-3 py-2.5 font-medium text-right">Times / wk</th>
              <th className="px-3 py-2.5 font-medium text-right">Points</th>
              <th className="px-5 py-2.5 font-medium text-right">Remove</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activities.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">
                  No activities yet. Add the first one below.
                </td>
              </tr>
            ) : (
              activities.map((a) => (
                <ActivityEditRow key={a.id} activity={a} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add activity */}
      <AddActivityForm />
    </Card>
  )
}

function ActivityEditRow({ activity }: { activity: Activity }) {
  const { actions } = useApp()
  const meta = CATEGORY_META[activity.category]

  return (
    <tr className="align-middle hover:bg-slate-50/60">
      <td className="px-5 py-2.5">
        <div className="flex items-center gap-2.5">
          <IconChip icon={activity.icon} size="h-8 w-8" iconClassName="h-4 w-4" />
          <span className="font-semibold text-ink-900">{activity.name}</span>
        </div>
      </td>
      <td className="px-3 py-2.5 text-slate-500">{LOCATION_LABEL[activity.location]}</td>
      <td className="px-3 py-2.5">
        <span className="text-slate-500">{meta.label}</span>
      </td>
      <td className="px-3 py-2.5 text-right">
        <input
          type="number"
          min={0}
          max={21}
          aria-label={`${activity.name} times per week`}
          className={cn(INPUT, 'tnum w-16 text-right')}
          value={activity.timesPerWeek}
          onChange={(e) =>
            actions.upsertActivity({
              ...activity,
              timesPerWeek: Math.max(0, Math.round(Number(e.target.value) || 0)),
            })
          }
        />
      </td>
      <td className="px-3 py-2.5 text-right">
        <input
          type="number"
          min={0}
          aria-label={`${activity.name} points`}
          className={cn(INPUT, 'tnum w-16 text-right')}
          value={activity.points}
          onChange={(e) =>
            actions.upsertActivity({
              ...activity,
              points: Math.max(0, Math.round(Number(e.target.value) || 0)),
            })
          }
        />
      </td>
      <td className="px-5 py-2.5 text-right">
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-10 w-10 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          aria-label={`Remove ${activity.name}`}
          onClick={() => {
            if (window.confirm(`Remove "${activity.name}" from the plan?`)) {
              actions.removeActivity(activity.id)
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  )
}

const EMPTY_DRAFT = {
  name: '',
  location: 'in_office' as ActivityLocation,
  category: 'treatment' as ActivityCategory,
  timesPerWeek: 1,
  points: 10,
}

function AddActivityForm() {
  const { actions } = useApp()
  const [draft, setDraft] = useState(EMPTY_DRAFT)

  const canAdd = draft.name.trim().length > 0

  function add() {
    if (!canAdd) return
    const activity: Activity = {
      id: slugId(draft.name),
      name: draft.name.trim(),
      category: draft.category,
      location: draft.location,
      timesPerWeek: Math.max(0, Math.round(draft.timesPerWeek) || 0),
      points: Math.max(0, Math.round(draft.points) || 0),
      icon: DEFAULT_ICON[draft.category],
    }
    actions.upsertActivity(activity)
    setDraft(EMPTY_DRAFT)
  }

  return (
    <div className="border-t border-slate-100 bg-slate-50/60 p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Add activity
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        <div className="col-span-2 sm:col-span-2">
          <label className={LABEL} htmlFor="add-name">
            Name
          </label>
          <input
            id="add-name"
            type="text"
            className={INPUT}
            placeholder="e.g. Lymphatic Massage"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') add()
            }}
          />
        </div>

        <div className="col-span-1">
          <label className={LABEL} htmlFor="add-location">
            Location
          </label>
          <select
            id="add-location"
            className={INPUT}
            value={draft.location}
            onChange={(e) =>
              setDraft((d) => ({ ...d, location: e.target.value as ActivityLocation }))
            }
          >
            {LOCATION_KEYS.map((loc) => (
              <option key={loc} value={loc}>
                {LOCATION_LABEL[loc]}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-1">
          <label className={LABEL} htmlFor="add-category">
            Category
          </label>
          <select
            id="add-category"
            className={INPUT}
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

        <div className="col-span-1">
          <label className={LABEL} htmlFor="add-times">
            Times / wk
          </label>
          <input
            id="add-times"
            type="number"
            min={0}
            max={21}
            className={cn(INPUT, 'tnum')}
            value={draft.timesPerWeek}
            onChange={(e) =>
              setDraft((d) => ({ ...d, timesPerWeek: Number(e.target.value) }))
            }
          />
        </div>

        <div className="col-span-1">
          <label className={LABEL} htmlFor="add-points">
            Points
          </label>
          <input
            id="add-points"
            type="number"
            min={0}
            className={cn(INPUT, 'tnum')}
            value={draft.points}
            onChange={(e) => setDraft((d) => ({ ...d, points: Number(e.target.value) }))}
          />
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <Button onClick={add} disabled={!canAdd}>
          <Plus className="h-4 w-4" />
          Add activity
        </Button>
      </div>
    </div>
  )
}

// --- 4) Weekly log ----------------------------------------------------------

function WeeklyLogCard() {
  const { state, actions } = useApp()
  const { plan, weeks, currentWeek, adherenceTarget } = state

  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek)

  // Whether the chosen week actually exists in the store.
  const weekExists = weeks.some((w) => w.weekNumber === selectedWeek)

  // Resolve the chosen week (falling back to an empty synthesized log).
  const weekLog = useMemo<WeekLog>(
    () =>
      weeks.find((w) => w.weekNumber === selectedWeek) ?? {
        weekNumber: selectedWeek,
        startDate: plan.startDate,
        completions: {},
      },
    [weeks, selectedWeek, plan.startDate],
  )

  const adherence = useMemo(
    () => computeWeekAdherence(plan.activities, weekLog, adherenceTarget),
    [plan.activities, weekLog, adherenceTarget],
  )

  const status = statusFromPct(adherence.pct, adherenceTarget)
  const barColor = adherenceColor(adherence.pct)
  const sortedWeeks = useMemo(
    () => [...weeks].sort((a, b) => a.weekNumber - b.weekNumber),
    [weeks],
  )

  return (
    <Card
      title="Weekly log — ordered vs actual"
      subtitle="Enter the actual completions logged in ECW for the selected week."
      action={
        <Button variant="secondary" size="sm" onClick={() => actions.addWeek()}>
          <Plus className="h-4 w-4" />
          Add next week
        </Button>
      }
    >
      {/* Week picker + summary */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-[220px]">
          <label className={LABEL} htmlFor="staff-week">
            Week
          </label>
          <select
            id="staff-week"
            className={INPUT}
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
          >
            {sortedWeeks.map((w) => (
              <option key={w.weekNumber} value={w.weekNumber}>
                Week {w.weekNumber}
                {w.weekNumber === currentWeek ? ' (current)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-slate-400">Week adherence</p>
            <p className="tnum text-2xl font-bold tracking-tight text-ink-900">
              {pct(adherence.pct)}
            </p>
          </div>
          <Pill tone={status}>
            <span className="tnum">{adherence.actual}</span>/
            <span className="tnum">{adherence.ordered}</span> done
          </Pill>
        </div>
      </div>

      <div className="mt-3">
        <ProgressBar value={adherence.pct} color={barColor} />
      </div>

      {/* Per-activity actual entry */}
      {plan.activities.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
          Add activities above before logging actuals.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100">
          {adherence.byActivity.map((row) => {
            const value = weekLog.completions[row.activity.id] ?? 0
            return (
              <li
                key={row.activity.id}
                className="flex items-center gap-3 px-3 py-2.5 sm:px-4"
              >
                <IconChip
                  icon={row.activity.icon}
                  size="h-8 w-8"
                  iconClassName="h-4 w-4"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {row.activity.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {LOCATION_LABEL[row.activity.location]} · ordered{' '}
                    <span className="tnum">{row.ordered}</span>/wk
                  </p>
                </div>
                <Pill
                  tone={row.status}
                  className="hidden shrink-0 sm:inline-flex"
                >
                  <span className="tnum">{pct(row.pct)}</span>
                </Pill>
                <div className="flex shrink-0 items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={row.ordered}
                    aria-label={`Actual completions for ${row.activity.name}`}
                    className={cn(INPUT, 'tnum w-16 text-right')}
                    value={value}
                    onChange={(e) =>
                      actions.setCompletion(
                        selectedWeek,
                        row.activity.id,
                        Number(e.target.value),
                      )
                    }
                  />
                  <span className="text-xs text-slate-400 tnum">/ {row.ordered}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Week note */}
      <div className="mt-4">
        <label className={LABEL} htmlFor="staff-week-note">
          Week note
        </label>
        <textarea
          id="staff-week-note"
          rows={2}
          className={cn(INPUT, 'resize-y', !weekExists && 'opacity-60')}
          placeholder={
            weekExists
              ? 'Clinical note for this week (optional)…'
              : 'Add this week (or log an actual) before noting it…'
          }
          value={weekLog.note ?? ''}
          disabled={!weekExists}
          onChange={(e) => actions.setWeekNote(selectedWeek, e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          {selectedWeek === currentWeek
            ? 'This is the patient’s current week.'
            : `Currently set to week ${currentWeek}.`}
        </p>
        <Button
          variant="dark"
          onClick={() => actions.setCurrentWeek(selectedWeek)}
          disabled={selectedWeek === currentWeek}
        >
          Set as current week
        </Button>
      </div>
    </Card>
  )
}
