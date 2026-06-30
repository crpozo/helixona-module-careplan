// Chart + semantic color tokens. Mirrors STYLE.md §1 / §6.
// Cash vs Insurance = gold vs near-black; categorical = gold → bronze → charcoal.

export const COLORS = {
  brand: '#d6b981',
  brandSoft: '#f3ebd9',
  ink: '#2a241e',
  accent: '#b08d4f',
  emerald: '#22c55e',
  amber: '#f59e0b',
  rose: '#e11d48',
  slate: '#a99f8c',
  grid: '#efe7d8',
  axis: '#a99f8c',
} as const

// Categorical palette — on-brand gold family, not a rainbow.
export const CATEGORICAL = [
  '#d6b981',
  '#1c1c1c',
  '#b08d4f',
  '#8a6d3b',
  '#cbb892',
  '#6b7280',
] as const

// Adherence intensity buckets (mirrors "occupancy intensity" in STYLE.md §6).
// Returns a hex usable for bars / heat cells.
export function adherenceColor(pct: number): string {
  if (pct >= 90) return '#9c7e44' // deep gold — excellent
  if (pct >= 75) return '#d6b981' // gold — on track
  if (pct >= 50) return '#e8d7b4' // light gold — watch
  return '#d8cdb7' // warm sand — behind
}

// Semantic status -> tailwind chip classes (pill backgrounds).
export const STATUS_CHIP: Record<string, string> = {
  good: 'bg-emerald-50 text-emerald-700',
  watch: 'bg-amber-50 text-amber-700',
  bad: 'bg-rose-50 text-rose-700',
  brand: 'bg-brand-50 text-brand-700',
  neutral: 'bg-slate-100 text-slate-600',
}
