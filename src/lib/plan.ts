import type {
  StageDef,
  StageKey,
  Pacing,
  PacingDef,
  ProgramKey,
  ActivityCategory,
} from '@/types'

// The care journey (POC Layout — image 1), in order.
export const STAGES: StageDef[] = [
  {
    key: 'identification',
    label: 'Identification',
    short: 'Identify',
    description:
      'We map your history, run diagnostics and labs, and identify the root drivers behind how you feel.',
    icon: 'Search',
    order: 0,
  },
  {
    key: 'stabilization',
    label: 'Stabilization',
    short: 'Stabilize',
    description:
      'We calm the system down — reduce inflammation, steady energy and sleep, and build a stable baseline.',
    icon: 'HeartPulse',
    order: 1,
  },
  {
    key: 'lead_actor_1',
    label: 'Lead Actor 1',
    short: 'Actor 1',
    description:
      'We focus on the single biggest driver of your symptoms and treat it directly.',
    icon: 'Target',
    order: 2,
  },
  {
    key: 'lead_actor_2',
    label: 'Lead Actor 2',
    short: 'Actor 2',
    description: 'With the first driver handled, we move to the next priority system.',
    icon: 'Target',
    order: 3,
  },
  {
    key: 'lead_actor_3',
    label: 'Lead Actor 3',
    short: 'Actor 3',
    description: 'We address the remaining contributing drivers one at a time.',
    icon: 'Target',
    order: 4,
  },
  {
    key: 'repair',
    label: 'Repair',
    short: 'Repair',
    description:
      'Your body rebuilds — we support regeneration, resilience and full function.',
    icon: 'Sparkles',
    order: 5,
  },
  {
    key: 'graduation',
    label: 'Graduation',
    short: 'Graduate',
    description:
      'You hit your goals and move to a light maintenance rhythm to protect your progress.',
    icon: 'GraduationCap',
    order: 6,
  },
]

export const STAGE_BY_KEY: Record<StageKey, StageDef> = Object.fromEntries(
  STAGES.map((s) => [s.key, s]),
) as Record<StageKey, StageDef>

export function stageProgress(stage: StageKey): number {
  const def = STAGE_BY_KEY[stage]
  return Math.round((def.order / (STAGES.length - 1)) * 100)
}

// Pacing options (image 1).
export const PACINGS: PacingDef[] = [
  {
    key: 'gentle',
    label: 'Gentle',
    description: 'A slower, lighter cadence — fewer visits per week, easy to sustain.',
    icon: 'Feather',
  },
  {
    key: 'standard',
    label: 'Standard',
    description: 'The recommended cadence — steady, balanced progress.',
    icon: 'Gauge',
  },
  {
    key: 'aggressive',
    label: 'Aggressive',
    description: 'A faster cadence — more visits per week for the quickest results.',
    icon: 'Rocket',
  },
]

export const PACING_BY_KEY: Record<Pacing, PacingDef> = Object.fromEntries(
  PACINGS.map((p) => [p.key, p]),
) as Record<Pacing, PacingDef>

export const PROGRAM_LABEL: Record<ProgramKey, string> = {
  wellness: 'Wellness & Longevity',
  chronic: 'Chronic Illness',
  neuro: 'Functional Neuro',
}

// Display metadata per activity category.
export const CATEGORY_META: Record<
  ActivityCategory,
  { label: string; icon: string }
> = {
  treatment: { label: 'In-office treatment', icon: 'Zap' },
  iv: { label: 'IV therapy', icon: 'Droplets' },
  office_visit: { label: 'Office visit', icon: 'Stethoscope' },
  home: { label: 'At-home', icon: 'Home' },
  supplement: { label: 'Supplement', icon: 'Pill' },
  medication: { label: 'Medication', icon: 'Tablets' },
}

/** Supplements & medicines get their own patient-facing group. */
export function isSupplementLike(category: ActivityCategory): boolean {
  return category === 'supplement' || category === 'medication'
}

/** Default icon to attach to a new activity, keyed off its category. */
export const DEFAULT_ACTIVITY_ICON: Record<ActivityCategory, string> = {
  treatment: 'Zap',
  iv: 'Droplets',
  office_visit: 'Stethoscope',
  home: 'Home',
  supplement: 'Pill',
  medication: 'Tablets',
}

/** Slugify a name into a stable-ish id with a short random suffix. */
export function slugId(name: string, fallback = 'activity'): string {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || fallback
  return `${base}-${Math.random().toString(36).slice(2, 6)}`
}

export const LOCATION_LABEL: Record<'in_office' | 'at_home', string> = {
  in_office: 'In office',
  at_home: 'At home',
}
