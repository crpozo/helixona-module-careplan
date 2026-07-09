import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import type {
  Activity,
  Appointment,
  AppState,
  Pacing,
  Redemption,
  StageKey,
  UserRole,
} from '@/types'
import { createSeedState } from '@/data/seed'
import { clamp } from '@/lib/format'
import {
  allWeekAdherence,
  computeWeekAdherence,
  evaluateBadges,
  levelInfo,
  pointsSummary,
  streakInfo,
} from '@/lib/gamification'

const STORAGE_KEY = 'helixona-careplan-v1'

// --- Actions ----------------------------------------------------------------

type Action =
  | { type: 'LOG_COMPLETION'; activityId: string; delta: number }
  | { type: 'SET_COMPLETION'; weekNumber: number; activityId: string; value: number }
  | { type: 'ADD_REDEMPTION'; redemption: Redemption }
  | { type: 'MARK_REDEMPTION_USED'; id: string }
  | { type: 'SET_STAGE'; stage: StageKey }
  | { type: 'SET_PACING'; pacing: Pacing }
  | { type: 'SET_PLAN_META'; goal?: string; focus?: string; startDate?: string }
  | { type: 'UPSERT_ACTIVITY'; activity: Activity }
  | { type: 'REMOVE_ACTIVITY'; id: string }
  | { type: 'UPSERT_APPOINTMENT'; appointment: Appointment }
  | { type: 'REMOVE_APPOINTMENT'; id: string }
  | { type: 'SET_CURRENT_WEEK'; weekNumber: number }
  | { type: 'ADD_WEEK' }
  | { type: 'SET_WEEK_NOTE'; weekNumber: number; note: string }
  | { type: 'SET_ADHERENCE_TARGET'; value: number }
  | { type: 'SET_ROLE'; role: UserRole }
  | { type: 'LOGIN'; role: UserRole }
  | { type: 'LOGOUT' }
  | { type: 'RESET' }

function orderedFor(state: AppState, activityId: string): number {
  return state.plan.activities.find((a) => a.id === activityId)?.timesPerWeek ?? 0
}

/** Return weeks with the given week's completions changed via `mutate`. */
function withWeek(
  state: AppState,
  weekNumber: number,
  mutate: (completions: Record<string, number>) => Record<string, number>,
): AppState['weeks'] {
  const exists = state.weeks.some((w) => w.weekNumber === weekNumber)
  if (!exists) {
    const startDate = nextWeekStart(state, weekNumber)
    return [
      ...state.weeks,
      { weekNumber, startDate, completions: mutate({}) },
    ].sort((a, b) => a.weekNumber - b.weekNumber)
  }
  return state.weeks.map((w) =>
    w.weekNumber === weekNumber ? { ...w, completions: mutate({ ...w.completions }) } : w,
  )
}

// Compute a Monday-aligned start date for a synthesized week.
function nextWeekStart(state: AppState, weekNumber: number): string {
  const base = state.plan.startDate
  const d = new Date(base)
  d.setDate(d.getDate() + (weekNumber - 1) * 7)
  return d.toISOString().slice(0, 10)
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOG_COMPLETION': {
      const ordered = orderedFor(state, action.activityId)
      return {
        ...state,
        weeks: withWeek(state, state.currentWeek, (c) => {
          const next = clamp((c[action.activityId] ?? 0) + action.delta, 0, ordered)
          return { ...c, [action.activityId]: next }
        }),
      }
    }
    case 'SET_COMPLETION': {
      const ordered = orderedFor(state, action.activityId)
      return {
        ...state,
        weeks: withWeek(state, action.weekNumber, (c) => ({
          ...c,
          [action.activityId]: clamp(Math.round(action.value), 0, ordered),
        })),
      }
    }
    case 'ADD_REDEMPTION':
      return { ...state, redemptions: [action.redemption, ...state.redemptions] }
    case 'MARK_REDEMPTION_USED':
      return {
        ...state,
        redemptions: state.redemptions.map((r) =>
          r.id === action.id ? { ...r, used: true } : r,
        ),
      }
    case 'SET_STAGE':
      return { ...state, plan: { ...state.plan, stage: action.stage } }
    case 'SET_PACING':
      return { ...state, plan: { ...state.plan, pacing: action.pacing } }
    case 'SET_PLAN_META':
      return {
        ...state,
        plan: {
          ...state.plan,
          goal: action.goal ?? state.plan.goal,
          focus: action.focus ?? state.plan.focus,
          startDate: action.startDate ?? state.plan.startDate,
        },
      }
    case 'UPSERT_ACTIVITY': {
      const exists = state.plan.activities.some((a) => a.id === action.activity.id)
      const activities = exists
        ? state.plan.activities.map((a) =>
            a.id === action.activity.id ? action.activity : a,
          )
        : [...state.plan.activities, action.activity]
      return { ...state, plan: { ...state.plan, activities } }
    }
    case 'REMOVE_ACTIVITY':
      return {
        ...state,
        plan: {
          ...state.plan,
          activities: state.plan.activities.filter((a) => a.id !== action.id),
        },
      }
    case 'UPSERT_APPOINTMENT': {
      const exists = state.appointments.some((a) => a.id === action.appointment.id)
      const appointments = exists
        ? state.appointments.map((a) =>
            a.id === action.appointment.id ? action.appointment : a,
          )
        : [...state.appointments, action.appointment]
      return { ...state, appointments }
    }
    case 'REMOVE_APPOINTMENT':
      return {
        ...state,
        appointments: state.appointments.filter((a) => a.id !== action.id),
      }
    case 'SET_CURRENT_WEEK':
      return { ...state, currentWeek: Math.max(1, action.weekNumber) }
    case 'ADD_WEEK': {
      const maxWeek = state.weeks.reduce((m, w) => Math.max(m, w.weekNumber), 0)
      const weekNumber = maxWeek + 1
      return {
        ...state,
        weeks: [
          ...state.weeks,
          { weekNumber, startDate: nextWeekStart(state, weekNumber), completions: {} },
        ],
        currentWeek: weekNumber,
      }
    }
    case 'SET_WEEK_NOTE':
      return {
        ...state,
        weeks: state.weeks.map((w) =>
          w.weekNumber === action.weekNumber ? { ...w, note: action.note } : w,
        ),
      }
    case 'SET_ADHERENCE_TARGET':
      return { ...state, adherenceTarget: clamp(Math.round(action.value), 10, 100) }
    case 'SET_ROLE':
      return { ...state, role: action.role }
    case 'LOGIN':
      return { ...state, role: action.role, authenticated: true }
    case 'LOGOUT':
      return { ...state, authenticated: false }
    case 'RESET':
      return { ...createSeedState(), role: state.role, authenticated: state.authenticated }
    default:
      return state
  }
}

// --- Persistence ------------------------------------------------------------

function loadState(): AppState {
  if (typeof window === 'undefined') return createSeedState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createSeedState()
    const parsed = JSON.parse(raw) as Partial<AppState>
    // Shallow validation — fall back to seed if the shape looks wrong.
    if (!parsed.patient || !parsed.plan || !Array.isArray(parsed.weeks)) {
      return createSeedState()
    }
    // Migrate older saves that predate the role/auth fields.
    return {
      ...(parsed as AppState),
      role: parsed.role ?? 'patient',
      authenticated: parsed.authenticated ?? false,
    }
  } catch {
    return createSeedState()
  }
}

// --- Bound action creators --------------------------------------------------

function makeActions(state: AppState, dispatch: React.Dispatch<Action>) {
  return {
    logCompletion: (activityId: string, delta = 1) =>
      dispatch({ type: 'LOG_COMPLETION', activityId, delta }),
    setCompletion: (weekNumber: number, activityId: string, value: number) =>
      dispatch({ type: 'SET_COMPLETION', weekNumber, activityId, value }),
    /** Redeem a reward. Returns the new Redemption, or null if unaffordable. */
    redeem: (rewardId: string): Redemption | null => {
      const reward = state.rewards.find((r) => r.id === rewardId)
      if (!reward) return null
      const { balance } = pointsSummary(state)
      if (balance < reward.cost) return null
      const redemption: Redemption = {
        id: `rdm-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`,
        rewardId: reward.id,
        title: reward.title,
        value: reward.value,
        cost: reward.cost,
        kind: reward.kind,
        code: makeCode(),
        date: new Date().toISOString(),
        used: false,
      }
      dispatch({ type: 'ADD_REDEMPTION', redemption })
      return redemption
    },
    markRedemptionUsed: (id: string) => dispatch({ type: 'MARK_REDEMPTION_USED', id }),
    setStage: (stage: StageKey) => dispatch({ type: 'SET_STAGE', stage }),
    setPacing: (pacing: Pacing) => dispatch({ type: 'SET_PACING', pacing }),
    setPlanMeta: (meta: { goal?: string; focus?: string; startDate?: string }) =>
      dispatch({ type: 'SET_PLAN_META', ...meta }),
    upsertActivity: (activity: Activity) =>
      dispatch({ type: 'UPSERT_ACTIVITY', activity }),
    removeActivity: (id: string) => dispatch({ type: 'REMOVE_ACTIVITY', id }),
    upsertAppointment: (appointment: Appointment) =>
      dispatch({ type: 'UPSERT_APPOINTMENT', appointment }),
    removeAppointment: (id: string) => dispatch({ type: 'REMOVE_APPOINTMENT', id }),
    setCurrentWeek: (weekNumber: number) =>
      dispatch({ type: 'SET_CURRENT_WEEK', weekNumber }),
    addWeek: () => dispatch({ type: 'ADD_WEEK' }),
    setWeekNote: (weekNumber: number, note: string) =>
      dispatch({ type: 'SET_WEEK_NOTE', weekNumber, note }),
    setAdherenceTarget: (value: number) =>
      dispatch({ type: 'SET_ADHERENCE_TARGET', value }),
    setRole: (role: UserRole) => dispatch({ type: 'SET_ROLE', role }),
    /** Sign in as the given role (demo auth — no real credentials). */
    login: (role: UserRole) => dispatch({ type: 'LOGIN', role }),
    /** Sign out and return to the login screen. */
    logout: () => dispatch({ type: 'LOGOUT' }),
    reset: () => dispatch({ type: 'RESET' }),
  }
}

function makeCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return `HLX-${s}-${Math.floor(1000 + Math.random() * 9000)}`
}

export type Actions = ReturnType<typeof makeActions>

// --- Context ----------------------------------------------------------------

interface Ctx {
  state: AppState
  actions: Actions
}

const AppContext = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage may be unavailable (private mode) — ignore */
    }
  }, [state])

  const actions = useMemo(() => makeActions(state, dispatch), [state])

  const value = useMemo(() => ({ state, actions }), [state, actions])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within <AppProvider>')
  return ctx
}

// --- Derived view-models (memoized) -----------------------------------------

export function useDerived() {
  const { state } = useApp()
  return useMemo(() => {
    const weekAdherences = allWeekAdherence(state)
    const currentWeekLog =
      state.weeks.find((w) => w.weekNumber === state.currentWeek) ?? {
        weekNumber: state.currentWeek,
        startDate: state.plan.startDate,
        completions: {},
      }
    const currentAdherence = computeWeekAdherence(
      state.plan.activities,
      currentWeekLog,
      state.adherenceTarget,
    )
    const points = pointsSummary(state)
    const level = levelInfo(points.lifetime)
    const streak = streakInfo(state)
    const badges = evaluateBadges(state)
    const upcoming = [...state.appointments]
      .filter((a) => a.status === 'scheduled')
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      weekAdherences,
      currentWeekLog,
      currentAdherence,
      points,
      level,
      streak,
      badges,
      earnedBadges: badges.filter((b) => b.earned),
      upcoming,
    }
  }, [state])
}

export type Derived = ReturnType<typeof useDerived>
