import type {
  Activity,
  ActivityAdherence,
  AdherenceStatus,
  AppState,
  EvaluatedBadge,
  LevelInfo,
  PointsSummary,
  StreakInfo,
  WeekAdherence,
  WeekLog,
} from '@/types'
import { STAGE_BY_KEY } from '@/lib/plan'
import { BADGES } from '@/data/seed'
import { clamp, ratioToPct } from '@/lib/format'

// --- Points economy ---------------------------------------------------------

/** Bonus for finishing a week at or above the adherence target. */
export const ON_TARGET_BONUS = 25
/** Bonus for a flawless (100%) week. */
export const PERFECT_WEEK_BONUS = 100

// Loyalty tiers — a luxe gold ladder.
export interface Tier {
  name: string
  floor: number
  icon: string
}
export const TIERS: Tier[] = [
  { name: 'Initiate', floor: 0, icon: 'Sparkles' },
  { name: 'Bronze', floor: 400, icon: 'Medal' },
  { name: 'Silver', floor: 1200, icon: 'Award' },
  { name: 'Gold', floor: 2500, icon: 'Crown' },
  { name: 'Platinum', floor: 4500, icon: 'Trophy' },
  { name: 'Radiant', floor: 7000, icon: 'Star' },
]

// --- Adherence --------------------------------------------------------------

export function statusFromPct(pct: number, target: number): AdherenceStatus {
  if (pct >= target) return 'good'
  if (pct >= 50) return 'watch'
  return 'bad'
}

/** Completions logged for an activity in a week, clamped to [0, ordered]. */
export function actualFor(activity: Activity, week: WeekLog): number {
  const raw = week.completions[activity.id] ?? 0
  return clamp(Math.round(raw), 0, activity.timesPerWeek)
}

export function computeWeekAdherence(
  activities: Activity[],
  week: WeekLog,
  target: number,
): WeekAdherence {
  const byActivity: ActivityAdherence[] = activities.map((activity) => {
    const ordered = activity.timesPerWeek
    const actual = actualFor(activity, week)
    const pct = ratioToPct(actual, ordered)
    return { activity, ordered, actual, pct, status: statusFromPct(pct, target) }
  })
  const ordered = byActivity.reduce((sum, a) => sum + a.ordered, 0)
  const actual = byActivity.reduce((sum, a) => sum + a.actual, 0)
  const pct = ratioToPct(actual, ordered)
  return {
    weekNumber: week.weekNumber,
    startDate: week.startDate,
    ordered,
    actual,
    pct,
    status: statusFromPct(pct, target),
    byActivity,
  }
}

/** All weeks' adherence, ascending by week number. */
export function allWeekAdherence(state: AppState): WeekAdherence[] {
  return [...state.weeks]
    .sort((a, b) => a.weekNumber - b.weekNumber)
    .map((w) => computeWeekAdherence(state.plan.activities, w, state.adherenceTarget))
}

// --- Points -----------------------------------------------------------------

/** Raw completion points for a single week (capped per activity). */
export function weekCompletionPoints(activities: Activity[], week: WeekLog): number {
  return activities.reduce(
    (sum, activity) => sum + actualFor(activity, week) * activity.points,
    0,
  )
}

/** Bonus points (on-target + perfect) for a week. */
export function weekBonus(
  activities: Activity[],
  week: WeekLog,
  target: number,
): number {
  const adh = computeWeekAdherence(activities, week, target)
  let bonus = 0
  if (adh.pct >= target) bonus += ON_TARGET_BONUS
  if (adh.pct >= 100) bonus += PERFECT_WEEK_BONUS
  return bonus
}

/** Total points a week is worth (completion + bonus). */
export function weekPoints(
  activities: Activity[],
  week: WeekLog,
  target: number,
): number {
  return weekCompletionPoints(activities, week) + weekBonus(activities, week, target)
}

export function lifetimePoints(state: AppState): number {
  return state.weeks.reduce(
    (sum, w) => sum + weekPoints(state.plan.activities, w, state.adherenceTarget),
    0,
  )
}

export function spentPoints(state: AppState): number {
  return state.redemptions.reduce((sum, r) => sum + r.cost, 0)
}

export function pointsSummary(state: AppState): PointsSummary {
  const lifetime = lifetimePoints(state)
  const spent = spentPoints(state)
  const current = state.weeks.find((w) => w.weekNumber === state.currentWeek)
  const thisWeek = current
    ? weekPoints(state.plan.activities, current, state.adherenceTarget)
    : 0
  return {
    lifetime,
    spent,
    balance: Math.max(0, lifetime - spent),
    thisWeek,
  }
}

// --- Levels -----------------------------------------------------------------

export function levelInfo(lifetime: number): LevelInfo {
  let idx = 0
  for (let i = 0; i < TIERS.length; i++) {
    if (lifetime >= TIERS[i].floor) idx = i
  }
  const tier = TIERS[idx]
  const next = TIERS[idx + 1] ?? null
  const floor = tier.floor
  const nextFloor = next ? next.floor : null
  const band = next ? next.floor - tier.floor : 1
  const progress = next ? clamp((lifetime - floor) / band, 0, 1) : 1
  const toNext = next ? Math.max(0, next.floor - lifetime) : 0
  return {
    tier: tier.name,
    icon: tier.icon,
    floor,
    nextFloor,
    nextTier: next ? next.name : null,
    progress,
    toNext,
    index: idx + 1,
    total: TIERS.length,
  }
}

// --- Streaks ----------------------------------------------------------------

/** Weeks already finished (strictly before the current week), ascending. */
export function completedWeeks(state: AppState): WeekLog[] {
  return [...state.weeks]
    .filter((w) => w.weekNumber < state.currentWeek)
    .sort((a, b) => a.weekNumber - b.weekNumber)
}

export function streakInfo(state: AppState): StreakInfo {
  const done = completedWeeks(state)
  const onTarget = done.map(
    (w) =>
      computeWeekAdherence(state.plan.activities, w, state.adherenceTarget).pct >=
      state.adherenceTarget,
  )

  // Current streak — count back from the last completed week.
  let current = 0
  for (let i = onTarget.length - 1; i >= 0; i--) {
    if (onTarget[i]) current++
    else break
  }

  // Best streak anywhere.
  let best = 0
  let run = 0
  for (const ok of onTarget) {
    run = ok ? run + 1 : 0
    if (run > best) best = run
  }

  const currentWeekLog = state.weeks.find((w) => w.weekNumber === state.currentWeek)
  const currentPct = currentWeekLog
    ? computeWeekAdherence(state.plan.activities, currentWeekLog, state.adherenceTarget)
        .pct
    : 0
  const atRisk = current > 0 && currentPct < state.adherenceTarget

  return { current, best, atRisk }
}

// --- Badges -----------------------------------------------------------------

function fullyCompleted(activities: Activity[], week: WeekLog): boolean {
  if (activities.length === 0) return false
  return activities.every((a) => actualFor(a, week) >= a.timesPerWeek)
}

export function evaluateBadges(state: AppState): EvaluatedBadge[] {
  const { plan, weeks, adherenceTarget, redemptions } = state
  const adherences = weeks
    .map((w) => ({
      week: w,
      adh: computeWeekAdherence(plan.activities, w, adherenceTarget),
    }))
    .sort((a, b) => a.week.weekNumber - b.week.weekNumber)

  const lifetime = lifetimePoints(state)
  const streak = streakInfo(state)
  const stageOrder = STAGE_BY_KEY[plan.stage].order
  const homeActivities = plan.activities.filter((a) => a.location === 'at_home')
  const officeActivities = plan.activities.filter((a) => a.location === 'in_office')

  const firstCompletionWeek = adherences.find((x) => x.adh.actual > 0)?.week.startDate
  const firstOnTargetWeek = adherences.find((x) => x.adh.pct >= adherenceTarget)?.week
    .startDate
  const perfectWeek = adherences.find((x) => x.adh.pct >= 100)?.week.startDate
  const homeWeek = adherences.find((x) => fullyCompleted(homeActivities, x.week))?.week
    .startDate
  const officeWeek = adherences.find((x) => fullyCompleted(officeActivities, x.week))
    ?.week.startDate
  const bestWeekPct = adherences.reduce((m, x) => Math.max(m, x.adh.pct), 0)
  const firstRedemptionDate = [...redemptions].sort((a, b) =>
    a.date.localeCompare(b.date),
  )[0]?.date

  const earned = (cond: boolean, date?: string) => ({
    earned: cond,
    earnedDate: cond ? date : undefined,
  })

  const result: Record<string, Partial<EvaluatedBadge>> = {
    first_step: {
      ...earned(!!firstCompletionWeek, firstCompletionWeek),
      hint: 'Log your first activity in This Week.',
    },
    on_target: {
      ...earned(!!firstOnTargetWeek, firstOnTargetWeek),
      hint: `Finish a week at ${adherenceTarget}% or above.`,
    },
    consistency: {
      ...earned(streak.best >= 2, firstOnTargetWeek),
      progress: clamp(streak.best / 2, 0, 1),
      hint: 'Hit your goal 2 weeks in a row.',
    },
    streak_4: {
      ...earned(streak.best >= 4),
      progress: clamp(streak.best / 4, 0, 1),
      hint: `4 on-target weeks in a row (best so far: ${streak.best}).`,
    },
    perfect_week: {
      ...earned(!!perfectWeek, perfectWeek),
      progress: clamp(bestWeekPct / 100, 0, 1),
      hint: `Complete 100% of a week (best: ${bestWeekPct}%).`,
    },
    home_body: {
      ...earned(!!homeWeek, homeWeek),
      hint: 'Do every at-home activity in one week.',
    },
    fully_charged: {
      ...earned(!!officeWeek, officeWeek),
      hint: 'Attend every in-office treatment in one week.',
    },
    stabilized: {
      ...earned(stageOrder >= STAGE_BY_KEY['stabilization'].order),
      hint: 'Advance to the Stabilization stage.',
    },
    lead_actor: {
      ...earned(stageOrder >= STAGE_BY_KEY['lead_actor_1'].order),
      hint: 'Advance to a Lead Actor stage.',
    },
    graduate: {
      ...earned(plan.stage === 'graduation'),
      hint: 'Reach the Graduation stage.',
    },
    first_reward: {
      ...earned(redemptions.length > 0, firstRedemptionDate),
      hint: 'Redeem any reward.',
    },
    bronze_member: {
      ...earned(lifetime >= 400),
      progress: clamp(lifetime / 400, 0, 1),
      hint: 'Earn 400 lifetime points.',
    },
    gold_member: {
      ...earned(lifetime >= 2500),
      progress: clamp(lifetime / 2500, 0, 1),
      hint: 'Earn 2,500 lifetime points.',
    },
  }

  return BADGES.map((def) => ({
    ...def,
    earned: false,
    ...result[def.id],
  }))
}
