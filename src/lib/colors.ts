// Chart + semantic color tokens for the DARK gold theme.

export const COLORS = {
  brand: '#d6b981',
  brandSoft: '#e8d7b4',
  ink: '#e7e5e4', // light "ink" so text/series read on dark
  accent: '#c2a163',
  emerald: '#34d399',
  amber: '#fbbf24',
  rose: '#fb7185',
  slate: '#94a3b8',
  grid: 'rgba(255,255,255,0.06)',
  axis: '#94a3b8',
} as const

// Categorical palette — gold family, tuned brighter for dark backgrounds.
export const CATEGORICAL = [
  '#d6b981',
  '#e8d7b4',
  '#b08d4f',
  '#c2a163',
  '#8a6d3b',
  '#9ca3af',
] as const

// Adherence intensity buckets (bright gold = best on dark).
export function adherenceColor(pct: number): string {
  if (pct >= 90) return '#e8d7b4' // bright gold — excellent
  if (pct >= 75) return '#d6b981' // gold — on track
  if (pct >= 50) return '#b08d4f' // bronze — watch
  return '#52525b' // dim slate — behind
}

// Semantic status -> tailwind chip classes (soft tints on dark).
export const STATUS_CHIP: Record<string, string> = {
  good: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20',
  watch: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20',
  bad: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/20',
  brand: 'bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/25',
  neutral: 'bg-white/5 text-slate-300 ring-1 ring-white/10',
}
