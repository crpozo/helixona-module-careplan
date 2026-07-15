// ---------------------------------------------------------------------------
// Daily schedule, derived from weekly frequencies.
// ---------------------------------------------------------------------------
// The plan of care is ordered per WEEK ("Red Light 2x/week"). Patients think
// in DAYS, so we spread each activity's repetitions across fixed weekdays
// (stable per activity, clinic closed on Sundays) and treat each scheduled
// day as one yes/no item. Tracking stays weekly underneath: "done today" is
// derived by comparing the weekly count against how many repetitions were
// scheduled up to (and including) today.
// ---------------------------------------------------------------------------

import type { Activity, WeekLog } from '@/types'

type Schedulable = Pick<Activity, 'id' | 'timesPerWeek' | 'location'> &
  Pick<Partial<Activity>, 'days'>

/** Midnight-local copy of a date (so day comparisons ignore the time). */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Monday-first weekday index (Mon=0 … Sun=6). */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Small stable hash so different activities land on different weekdays.
function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997
  return h
}

/** The fixed weekdays this activity is scheduled on (Mon=0 … Sun=6). */
export function scheduledDays(a: Schedulable): number[] {
  const span = a.location === 'in_office' ? 6 : 7 // clinic closed on Sundays
  // Patient-chosen days win over the auto-spread (clamped to open weekdays).
  if (a.days && a.days.length > 0) {
    return [...new Set(a.days.filter((d) => d >= 0 && d < span))].sort((x, y) => x - y)
  }
  const n = Math.min(Math.max(0, Math.round(a.timesPerWeek)), span)
  if (n === 0) return []
  const offset = hash(a.id) % span
  const days = new Set<number>()
  for (let i = 0; i < n; i++) days.add((offset + Math.floor((i * span) / n)) % span)
  return [...days].sort((x, y) => x - y)
}

/** Is this activity on today's list? */
export function isScheduledOn(a: Schedulable, weekday: number): boolean {
  return scheduledDays(a).includes(weekday)
}

/**
 * Whether a therapy occurs on a specific calendar date. Handles both the
 * weekly-weekday cadence and interval recurrence (every N weeks / N months).
 */
export function occursOn(a: Activity, date: Date): boolean {
  if (a.recurrence) {
    const anchor = startOfDay(new Date(`${a.recurrence.anchor}T00:00:00`))
    const day = startOfDay(date)
    if (day.getTime() < anchor.getTime()) return false
    const interval = Math.max(1, Math.round(a.recurrence.interval))
    if (a.recurrence.unit === 'week') {
      const diffDays = Math.round((day.getTime() - anchor.getTime()) / 86_400_000)
      return diffDays % (7 * interval) === 0
    }
    // Monthly: same day-of-month as the anchor, every N months.
    if (day.getDate() !== anchor.getDate()) return false
    const months =
      (day.getFullYear() - anchor.getFullYear()) * 12 + (day.getMonth() - anchor.getMonth())
    return months >= 0 && months % interval === 0
  }
  // Plain weekly cadence — its weekdays, every week.
  return scheduledDays(a).includes(weekdayIndex(date))
}

/** A short human label for how often a therapy repeats. */
export function recurrenceLabel(a: Activity): string {
  if (a.recurrence) {
    const { unit, interval } = a.recurrence
    if (interval <= 1) return unit === 'week' ? 'Every week' : 'Every month'
    return `Every ${interval} ${unit}s`
  }
  const days = scheduledDays(a)
  if (days.length === 0) return '—'
  if (days.length >= 6) return `${days.length}× / week`
  return days.map((d) => WEEKDAY_LABELS[d]).join(', ')
}

/** Whether the patient marked this activity "Yes" on the given weekday. */
export function isDoneOnDay(
  week: Pick<WeekLog, 'dailyDone'> | undefined,
  activityId: string,
  weekday: number,
): boolean {
  return Boolean(((week?.dailyDone?.[activityId] ?? 0) >> weekday) & 1)
}
