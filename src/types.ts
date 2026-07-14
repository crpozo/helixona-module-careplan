// ---------------------------------------------------------------------------
// Helixona Care Plan — domain model
// ---------------------------------------------------------------------------
// A "Plan of Care" (POC) is created by the provider and entered manually by
// staff. The patient follows it week by week; we track ordered vs. actual to
// produce adherence, progress, points and rewards.
// ---------------------------------------------------------------------------

/** The patient's position along the care journey (POC Layout — image 1). */
export type StageKey =
  | 'identification'
  | 'stabilization'
  | 'lead_actor_1'
  | 'lead_actor_2'
  | 'lead_actor_3'
  | 'repair'
  | 'graduation'

export interface StageDef {
  key: StageKey
  /** Full label, e.g. "Lead Actor 1". */
  label: string
  /** Short label for compact chips. */
  short: string
  /** Patient-friendly explanation of what happens in this stage. */
  description: string
  /** lucide-react icon name. */
  icon: string
  /** 0-based position in the journey. */
  order: number
}

/** How fast the plan moves the patient through the work (image 1). */
export type Pacing = 'gentle' | 'standard' | 'aggressive'

export interface PacingDef {
  key: Pacing
  label: string
  description: string
  /** lucide-react icon name. */
  icon: string
}

export type ActivityLocation = 'in_office' | 'at_home'

export type ActivityCategory =
  | 'treatment' // nano bath, red light, hydrogen, salt room, eboo …
  | 'iv' // IV therapy
  | 'office_visit' // provider visits / check-ins
  | 'home' // rebounding, dry brushing, salt bath …
  | 'supplement' // omega-3, vitamin D, magnesium …
  | 'medication' // prescribed medicines (e.g. LDN)

/** A single recurring item in the plan of care. */
export interface Activity {
  id: string
  name: string
  category: ActivityCategory
  location: ActivityLocation
  /** Ordered frequency — "times per week" on the POC. */
  timesPerWeek: number
  /** Points earned per completion (capped at the ordered frequency). */
  points: number
  /** Patient-facing how/why. */
  instructions?: string
  /** Dose + timing for supplements/medications, e.g. "400 mg · before bed". */
  dose?: string
  /** Approx duration in minutes (in-office items). */
  durationMin?: number
  /** lucide-react icon name. */
  icon: string
  /**
   * Explicit weekdays this runs on (Mon=0 … Sun=6). When set, it overrides the
   * auto-spread schedule — this is how a patient "organizes therapies by day".
   */
  days?: number[]
  /**
   * Who put this on the plan. Clinician-authored items are read-only to the
   * patient; items the patient added themselves they can also edit/remove.
   * Missing is treated as 'staff' (all seeded/prescribed items).
   */
  addedBy?: 'staff' | 'patient'
}

/** One week of tracking — ordered comes from the plan, this holds actuals. */
export interface WeekLog {
  weekNumber: number
  /** ISO date (YYYY-MM-DD) of the week start (Monday). */
  startDate: string
  /** activityId -> actual completions logged this week. */
  completions: Record<string, number>
  /**
   * activityId -> bitmask of weekdays (Mon=bit 0 … Sun=bit 6) the patient
   * marked "Yes" on. Powers the per-day views; counts stay in completions.
   */
  dailyDone?: Record<string, number>
  /** Optional free-text note from staff or patient. */
  note?: string
}

export type RewardKind = 'discount' | 'service' | 'gift' | 'merch'

/** A redeemable item in the rewards catalog. */
export interface Reward {
  id: string
  title: string
  description: string
  /** Cost in points. */
  cost: number
  kind: RewardKind
  /** Short value badge, e.g. "10% off", "$25", "Free". */
  value: string
  /** lucide-react icon name. */
  icon: string
}

/** A reward the patient has redeemed (becomes a gift-card / discount code). */
export interface Redemption {
  id: string
  rewardId: string
  title: string
  value: string
  cost: number
  kind: RewardKind
  /** Human-readable redemption / gift-card code. */
  code: string
  /** ISO datetime of redemption. */
  date: string
  /** Whether the patient has applied / used it. */
  used: boolean
}

export type BadgeTone = 'brand' | 'emerald' | 'amber' | 'rose' | 'slate'

/** Definition of an achievement; earned state is derived from AppState. */
export interface BadgeDef {
  id: string
  name: string
  description: string
  /** lucide-react icon name. */
  icon: string
  tone: BadgeTone
}

/** A badge plus its computed earned state. */
export interface EvaluatedBadge extends BadgeDef {
  earned: boolean
  /** ISO date the badge was (or would have been) earned, if known. */
  earnedDate?: string
  /** Progress toward earning (0..1) for locked, countable badges. */
  progress?: number
  /** Short hint for locked badges: how to earn it. */
  hint?: string
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'missed'

export interface Appointment {
  id: string
  /** Optional link to a plan activity. */
  activityId?: string
  title: string
  /** ISO datetime. */
  date: string
  provider: string
  location: string
  status: AppointmentStatus
  /** Length in minutes — drives calendar export (defaults to 60 when absent). */
  durationMin?: number
  /** Groups the occurrences of a recurring booking so a series reads as one. */
  seriesId?: string
  /** Optional free-text note carried onto the calendar event. */
  notes?: string
}

export type ProgramKey = 'wellness' | 'chronic' | 'neuro'

/**
 * Who is using the app. The patient can view and track their plan; only a
 * clinic employee (staff) can edit/modify the plan of care.
 */
export type UserRole = 'patient' | 'staff'

export interface Patient {
  id: string
  firstName: string
  lastName: string
  program: ProgramKey
  programLabel: string
  provider: string
  /** Optional MRN-style id from ECW. */
  ecwId?: string
  email?: string
}

/** The plan of care, authored by the provider / entered by staff. */
export interface CarePlan {
  stage: StageKey
  pacing: Pacing
  /** ISO date the plan started (week 1 Monday). */
  startDate: string
  /** The overarching health goal in the patient's words. */
  goal: string
  /** What the current stage focuses on (the "lead actor"). */
  focus: string
  activities: Activity[]
}

/** Everything the clinic tracks for one patient — profile, plan and history. */
export interface PatientRecord {
  patient: Patient
  plan: CarePlan
  weeks: WeekLog[]
  /** weekNumber treated as "this week". */
  currentWeek: number
  redemptions: Redemption[]
  appointments: Appointment[]
  /** Adherence % threshold considered "on track" (e.g. 80). */
  adherenceTarget: number
}

/** The persisted root — the clinic's whole panel of patients. */
export interface RootState {
  /** Whether someone is signed in (login screen shows until true). */
  authenticated: boolean
  /** Current viewer. Patients can't edit the plan; staff can. */
  role: UserRole
  /** The patient the patient-facing app (Today, Plan, …) is showing. */
  activePatientId: string
  patients: PatientRecord[]
  rewards: Reward[]
}

/**
 * What pages consume: the root plus the active patient's record flattened in,
 * so the single-patient views keep reading `state.plan`, `state.weeks`, etc.
 */
export interface AppState extends RootState, PatientRecord {}

// --- Derived view-models -----------------------------------------------------

export type AdherenceStatus = 'good' | 'watch' | 'bad'

/** Per-activity adherence for a given week. */
export interface ActivityAdherence {
  activity: Activity
  ordered: number
  actual: number
  pct: number
  status: AdherenceStatus
}

/** Aggregate adherence for a week. */
export interface WeekAdherence {
  weekNumber: number
  startDate: string
  ordered: number
  actual: number
  pct: number
  status: AdherenceStatus
  byActivity: ActivityAdherence[]
}

export interface PointsSummary {
  /** Spendable balance (lifetime minus redeemed). */
  balance: number
  /** Total ever earned (drives level/tier). */
  lifetime: number
  /** Total spent on redemptions. */
  spent: number
  /** Points earned this (current) week so far. */
  thisWeek: number
}

export interface LevelInfo {
  /** Tier name, e.g. "Gold". */
  tier: string
  /** lucide icon for the tier. */
  icon: string
  /** Points floor for the current tier. */
  floor: number
  /** Points needed for the next tier (null at max). */
  nextFloor: number | null
  /** Next tier name (null at max). */
  nextTier: string | null
  /** Progress 0..1 within the current tier band. */
  progress: number
  /** Points remaining to the next tier (0 at max). */
  toNext: number
  /** 1-based tier index. */
  index: number
  /** Total number of tiers. */
  total: number
}

export interface StreakInfo {
  /** Current consecutive on-target completed weeks. */
  current: number
  /** Best streak ever. */
  best: number
  /** Whether the current (in-progress) week is on pace to extend it. */
  atRisk: boolean
}
