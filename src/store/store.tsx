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
  Patient,
  PatientRecord,
  Redemption,
  RootState,
  StageKey,
  UserRole,
} from '@/types'
import { createSeedState, extraSeedRecords, REWARDS } from '@/data/seed'
import { clamp } from '@/lib/format'
import {
  allWeekAdherence,
  computeWeekAdherence,
  evaluateBadges,
  levelInfo,
  pointsSummary,
  streakInfo,
} from '@/lib/gamification'

// v4: multi-patient roster (staff CRUD) — each patient carries their own plan.
const STORAGE_KEY = 'helixona-careplan-v4'
// v3 (single patient, per-day logging) — upgraded in place on first load.
const LEGACY_KEY_V3 = 'helixona-careplan-v3'

// --- Actions ----------------------------------------------------------------
// Patient-scoped actions default to the active patient; the staff dashboard
// passes an explicit `patientId` to edit any record on the roster.

type Action =
  | { type: 'LOG_COMPLETION'; activityId: string; delta: number }
  | { type: 'LOG_DAILY'; activityId: string; weekday: number; done: boolean }
  | { type: 'SET_COMPLETION'; weekNumber: number; activityId: string; value: number }
  | { type: 'ADD_REDEMPTION'; redemption: Redemption }
  | { type: 'MARK_REDEMPTION_USED'; id: string }
  | { type: 'SET_STAGE'; stage: StageKey; patientId?: string }
  | { type: 'SET_PACING'; pacing: Pacing; patientId?: string }
  | {
      type: 'SET_PLAN_META'
      goal?: string
      focus?: string
      startDate?: string
      patientId?: string
    }
  | { type: 'UPSERT_ACTIVITY'; activity: Activity; patientId?: string }
  | { type: 'REMOVE_ACTIVITY'; id: string; patientId?: string }
  | { type: 'UPSERT_APPOINTMENT'; appointment: Appointment }
  | { type: 'REMOVE_APPOINTMENT'; id: string }
  | { type: 'SET_CURRENT_WEEK'; weekNumber: number }
  | { type: 'ADD_WEEK' }
  | { type: 'SET_WEEK_NOTE'; weekNumber: number; note: string }
  | { type: 'SET_ADHERENCE_TARGET'; value: number; patientId?: string }
  | { type: 'ADD_PATIENT'; record: PatientRecord }
  | { type: 'UPDATE_PATIENT'; id: string; patch: Partial<Omit<Patient, 'id'>> }
  | { type: 'REMOVE_PATIENT'; id: string }
  | { type: 'SET_ACTIVE_PATIENT'; id: string }
  | { type: 'SET_ROLE'; role: UserRole }
  | { type: 'LOGIN'; role: UserRole }
  | { type: 'LOGOUT' }
  | { type: 'RESET' }

// --- Record helpers ----------------------------------------------------------

function activeRecord(root: RootState): PatientRecord {
  return (
    root.patients.find((r) => r.patient.id === root.activePatientId) ?? root.patients[0]
  )
}

/** Apply `mutate` to one patient's record (default: the active one). */
function withRecord(
  root: RootState,
  patientId: string | undefined,
  mutate: (rec: PatientRecord) => PatientRecord,
): RootState {
  const id = patientId ?? root.activePatientId
  return {
    ...root,
    patients: root.patients.map((r) => (r.patient.id === id ? mutate(r) : r)),
  }
}

function orderedFor(rec: PatientRecord, activityId: string): number {
  return rec.plan.activities.find((a) => a.id === activityId)?.timesPerWeek ?? 0
}

/** Return the record's weeks with the given week's completions changed. */
function withWeek(
  rec: PatientRecord,
  weekNumber: number,
  mutate: (completions: Record<string, number>) => Record<string, number>,
): PatientRecord['weeks'] {
  const exists = rec.weeks.some((w) => w.weekNumber === weekNumber)
  if (!exists) {
    const startDate = nextWeekStart(rec, weekNumber)
    return [...rec.weeks, { weekNumber, startDate, completions: mutate({}) }].sort(
      (a, b) => a.weekNumber - b.weekNumber,
    )
  }
  return rec.weeks.map((w) =>
    w.weekNumber === weekNumber ? { ...w, completions: mutate({ ...w.completions }) } : w,
  )
}

// Compute a Monday-aligned start date for a synthesized week.
function nextWeekStart(rec: PatientRecord, weekNumber: number): string {
  const d = new Date(rec.plan.startDate)
  d.setDate(d.getDate() + (weekNumber - 1) * 7)
  return d.toISOString().slice(0, 10)
}

function reducer(state: RootState, action: Action): RootState {
  switch (action.type) {
    case 'LOG_COMPLETION':
      return withRecord(state, undefined, (rec) => {
        const ordered = orderedFor(rec, action.activityId)
        return {
          ...rec,
          weeks: withWeek(rec, rec.currentWeek, (c) => {
            const next = clamp((c[action.activityId] ?? 0) + action.delta, 0, ordered)
            return { ...c, [action.activityId]: next }
          }),
        }
      })
    // Mark a weekday "Yes"/undone: flips the day bit AND moves the weekly count.
    case 'LOG_DAILY':
      return withRecord(state, undefined, (rec) => {
        const ordered = orderedFor(rec, action.activityId)
        const bit = 1 << action.weekday
        if (!rec.weeks.some((w) => w.weekNumber === rec.currentWeek)) {
          return {
            ...rec,
            weeks: [
              ...rec.weeks,
              {
                weekNumber: rec.currentWeek,
                startDate: nextWeekStart(rec, rec.currentWeek),
                completions: { [action.activityId]: action.done ? 1 : 0 },
                dailyDone: { [action.activityId]: action.done ? bit : 0 },
              },
            ].sort((a, b) => a.weekNumber - b.weekNumber),
          }
        }
        return {
          ...rec,
          weeks: rec.weeks.map((w) => {
            if (w.weekNumber !== rec.currentWeek) return w
            const mask = w.dailyDone?.[action.activityId] ?? 0
            if (Boolean(mask & bit) === action.done) return w
            const count = clamp(
              (w.completions[action.activityId] ?? 0) + (action.done ? 1 : -1),
              0,
              ordered,
            )
            return {
              ...w,
              completions: { ...w.completions, [action.activityId]: count },
              dailyDone: {
                ...w.dailyDone,
                [action.activityId]: action.done ? mask | bit : mask & ~bit,
              },
            }
          }),
        }
      })
    case 'SET_COMPLETION':
      return withRecord(state, undefined, (rec) => ({
        ...rec,
        weeks: withWeek(rec, action.weekNumber, (c) => ({
          ...c,
          [action.activityId]: clamp(
            Math.round(action.value),
            0,
            orderedFor(rec, action.activityId),
          ),
        })),
      }))
    case 'ADD_REDEMPTION':
      return withRecord(state, undefined, (rec) => ({
        ...rec,
        redemptions: [action.redemption, ...rec.redemptions],
      }))
    case 'MARK_REDEMPTION_USED':
      return withRecord(state, undefined, (rec) => ({
        ...rec,
        redemptions: rec.redemptions.map((r) =>
          r.id === action.id ? { ...r, used: true } : r,
        ),
      }))
    case 'SET_STAGE':
      return withRecord(state, action.patientId, (rec) => ({
        ...rec,
        plan: { ...rec.plan, stage: action.stage },
      }))
    case 'SET_PACING':
      return withRecord(state, action.patientId, (rec) => ({
        ...rec,
        plan: { ...rec.plan, pacing: action.pacing },
      }))
    case 'SET_PLAN_META':
      return withRecord(state, action.patientId, (rec) => ({
        ...rec,
        plan: {
          ...rec.plan,
          goal: action.goal ?? rec.plan.goal,
          focus: action.focus ?? rec.plan.focus,
          startDate: action.startDate ?? rec.plan.startDate,
        },
      }))
    case 'UPSERT_ACTIVITY':
      return withRecord(state, action.patientId, (rec) => {
        const exists = rec.plan.activities.some((a) => a.id === action.activity.id)
        const activities = exists
          ? rec.plan.activities.map((a) =>
              a.id === action.activity.id ? action.activity : a,
            )
          : [...rec.plan.activities, action.activity]
        return { ...rec, plan: { ...rec.plan, activities } }
      })
    case 'REMOVE_ACTIVITY':
      return withRecord(state, action.patientId, (rec) => ({
        ...rec,
        plan: {
          ...rec.plan,
          activities: rec.plan.activities.filter((a) => a.id !== action.id),
        },
      }))
    case 'UPSERT_APPOINTMENT':
      return withRecord(state, undefined, (rec) => {
        const exists = rec.appointments.some((a) => a.id === action.appointment.id)
        const appointments = exists
          ? rec.appointments.map((a) =>
              a.id === action.appointment.id ? action.appointment : a,
            )
          : [...rec.appointments, action.appointment]
        return { ...rec, appointments }
      })
    case 'REMOVE_APPOINTMENT':
      return withRecord(state, undefined, (rec) => ({
        ...rec,
        appointments: rec.appointments.filter((a) => a.id !== action.id),
      }))
    case 'SET_CURRENT_WEEK':
      return withRecord(state, undefined, (rec) => ({
        ...rec,
        currentWeek: Math.max(1, action.weekNumber),
      }))
    case 'ADD_WEEK':
      return withRecord(state, undefined, (rec) => {
        const maxWeek = rec.weeks.reduce((m, w) => Math.max(m, w.weekNumber), 0)
        const weekNumber = maxWeek + 1
        return {
          ...rec,
          weeks: [
            ...rec.weeks,
            { weekNumber, startDate: nextWeekStart(rec, weekNumber), completions: {} },
          ],
          currentWeek: weekNumber,
        }
      })
    case 'SET_WEEK_NOTE':
      return withRecord(state, undefined, (rec) => ({
        ...rec,
        weeks: rec.weeks.map((w) =>
          w.weekNumber === action.weekNumber ? { ...w, note: action.note } : w,
        ),
      }))
    case 'SET_ADHERENCE_TARGET':
      return withRecord(state, action.patientId, (rec) => ({
        ...rec,
        adherenceTarget: clamp(Math.round(action.value), 10, 100),
      }))
    case 'ADD_PATIENT':
      if (state.patients.some((r) => r.patient.id === action.record.patient.id)) {
        return state
      }
      return { ...state, patients: [...state.patients, action.record] }
    case 'UPDATE_PATIENT':
      return withRecord(state, action.id, (rec) => ({
        ...rec,
        patient: { ...rec.patient, ...action.patch },
      }))
    case 'REMOVE_PATIENT': {
      // Never empty the roster — the app always needs an active patient.
      if (state.patients.length <= 1) return state
      const patients = state.patients.filter((r) => r.patient.id !== action.id)
      return {
        ...state,
        patients,
        activePatientId:
          state.activePatientId === action.id
            ? patients[0].patient.id
            : state.activePatientId,
      }
    }
    case 'SET_ACTIVE_PATIENT':
      if (!state.patients.some((r) => r.patient.id === action.id)) return state
      return { ...state, activePatientId: action.id }
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

/** Shape of the pre-roster (v3) save: one patient's data at the top level. */
type LegacyStateV3 = Omit<PatientRecord, 'adherenceTarget'> &
  Partial<Pick<RootState, 'role' | 'authenticated' | 'rewards'>> & {
    adherenceTarget?: number
  }

function loadState(): RootState {
  if (typeof window === 'undefined') return createSeedState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RootState>
      // Shallow validation — fall back to seed if the shape looks wrong.
      if (!Array.isArray(parsed.patients) || parsed.patients.length === 0) {
        return createSeedState()
      }
      return {
        ...(parsed as RootState),
        activePatientId: parsed.activePatientId ?? parsed.patients[0].patient.id,
        role: parsed.role ?? 'patient',
        authenticated: parsed.authenticated ?? false,
      }
    }
    // Upgrade an old single-patient save: it becomes one record on the roster.
    const legacy = window.localStorage.getItem(LEGACY_KEY_V3)
    if (legacy) {
      const old = JSON.parse(legacy) as Partial<LegacyStateV3>
      if (old.patient && old.plan && Array.isArray(old.weeks)) {
        return {
          authenticated: old.authenticated ?? false,
          role: old.role ?? 'patient',
          activePatientId: old.patient.id,
          patients: [
            {
              patient: old.patient,
              plan: old.plan,
              weeks: old.weeks,
              currentWeek: old.currentWeek ?? 1,
              redemptions: old.redemptions ?? [],
              appointments: old.appointments ?? [],
              adherenceTarget: old.adherenceTarget ?? 80,
            },
            ...extraSeedRecords().filter((r) => r.patient.id !== old.patient?.id),
          ],
          rewards: old.rewards ?? REWARDS,
        }
      }
    }
    return createSeedState()
  } catch {
    return createSeedState()
  }
}

// --- Bound action creators --------------------------------------------------

function makeActions(state: AppState, dispatch: React.Dispatch<Action>) {
  return {
    logCompletion: (activityId: string, delta = 1) =>
      dispatch({ type: 'LOG_COMPLETION', activityId, delta }),
    /** Patient marked (or un-marked) an activity as done for a weekday. */
    logDaily: (activityId: string, weekday: number, done: boolean) =>
      dispatch({ type: 'LOG_DAILY', activityId, weekday, done }),
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
    setStage: (stage: StageKey, patientId?: string) =>
      dispatch({ type: 'SET_STAGE', stage, patientId }),
    setPacing: (pacing: Pacing, patientId?: string) =>
      dispatch({ type: 'SET_PACING', pacing, patientId }),
    setPlanMeta: (
      meta: { goal?: string; focus?: string; startDate?: string },
      patientId?: string,
    ) => dispatch({ type: 'SET_PLAN_META', ...meta, patientId }),
    upsertActivity: (activity: Activity, patientId?: string) =>
      dispatch({ type: 'UPSERT_ACTIVITY', activity, patientId }),
    removeActivity: (id: string, patientId?: string) =>
      dispatch({ type: 'REMOVE_ACTIVITY', id, patientId }),
    upsertAppointment: (appointment: Appointment) =>
      dispatch({ type: 'UPSERT_APPOINTMENT', appointment }),
    removeAppointment: (id: string) => dispatch({ type: 'REMOVE_APPOINTMENT', id }),
    setCurrentWeek: (weekNumber: number) =>
      dispatch({ type: 'SET_CURRENT_WEEK', weekNumber }),
    addWeek: () => dispatch({ type: 'ADD_WEEK' }),
    setWeekNote: (weekNumber: number, note: string) =>
      dispatch({ type: 'SET_WEEK_NOTE', weekNumber, note }),
    setAdherenceTarget: (value: number, patientId?: string) =>
      dispatch({ type: 'SET_ADHERENCE_TARGET', value, patientId }),
    /** Staff: add a whole new patient record to the roster. */
    addPatient: (record: PatientRecord) => dispatch({ type: 'ADD_PATIENT', record }),
    /** Staff: edit a patient's profile fields. */
    updatePatient: (id: string, patch: Partial<Omit<Patient, 'id'>>) =>
      dispatch({ type: 'UPDATE_PATIENT', id, patch }),
    /** Staff: remove a patient (the roster never drops below one). */
    removePatient: (id: string) => dispatch({ type: 'REMOVE_PATIENT', id }),
    /** Staff: choose which patient the patient-facing app shows. */
    setActivePatient: (id: string) => dispatch({ type: 'SET_ACTIVE_PATIENT', id }),
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
  const [root, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(root))
    } catch {
      /* storage may be unavailable (private mode) — ignore */
    }
  }, [root])

  // Pages read the active patient's data at the top level (state.plan, …).
  const state = useMemo<AppState>(() => ({ ...root, ...activeRecord(root) }), [root])

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
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const upcoming = [...state.appointments]
      .filter(
        (a) => a.status === 'scheduled' && new Date(a.date).getTime() >= todayStart.getTime(),
      )
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
