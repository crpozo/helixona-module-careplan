// Chart + semantic color tokens for the LIGHT theme (white background).

export const COLORS = {
  brand: '#c2a163', // gold that reads on white
  brandSoft: '#d6b981',
  ink: '#3f3f46',
  accent: '#9c7e44',
  emerald: '#58cc02',
  amber: '#f59e0b',
  rose: '#f43f5e',
  slate: '#64748b',
  grid: 'rgba(0,0,0,0.06)',
  axis: '#94a3b8',
} as const

// Categorical palette — gold family, tuned darker for white backgrounds.
export const CATEGORICAL = [
  '#c2a163',
  '#d6b981',
  '#9c7e44',
  '#e0cba0',
  '#7a6234',
  '#94a3b8',
] as const

// Adherence intensity buckets. Green = doing great (encouraging, Duolingo-ish);
// never punish with red — low weeks are just gray "not started yet".
export function adherenceColor(pct: number): string {
  if (pct >= 90) return '#58cc02' // bright green — excellent
  if (pct >= 75) return '#7cd53b' // green — on track
  if (pct >= 50) return '#f5a623' // warm amber — getting there
  return '#cbd5e1' // light slate — just starting
}

// Semantic status -> tailwind chip classes (soft tints on white).
export const STATUS_CHIP: Record<string, string> = {
  good: 'bg-leaf-100 text-leaf-700 ring-1 ring-leaf-200',
  watch: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  bad: 'bg-rose-100 text-rose-600 ring-1 ring-rose-200',
  brand: 'bg-brand-100 text-brand-800 ring-1 ring-brand-200',
  neutral: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
}
