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

type Schedulable = Pick<Activity, 'id' | 'timesPerWeek' | 'location'>

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

/** Whether the patient marked this activity "Yes" on the given weekday. */
export function isDoneOnDay(
  week: Pick<WeekLog, 'dailyDone'> | undefined,
  activityId: string,
  weekday: number,
): boolean {
  return Boolean(((week?.dailyDone?.[activityId] ?? 0) >> weekday) & 1)
}
