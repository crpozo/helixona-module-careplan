// Number, money, percent and date formatting. Mirrors STYLE.md §8.

const moneyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function money(value: number): string {
  return moneyFmt.format(value)
}

// Compact currency for chart axes: $12k / $1.2M.
export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}k`
  return `$${value}`
}

// Whole-number percent: 86%.
export function pct(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`
}

// Ratio (0..1 or already a percentage) -> safe whole percent number.
export function ratioToPct(done: number, ordered: number): number {
  if (ordered <= 0) return 0
  return Math.round((done / ordered) * 100)
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return n === 1 ? one : many
}

// Compact number with thousands separators (points, etc.).
const numFmt = new Intl.NumberFormat('en-US')
export function num(value: number): string {
  return numFmt.format(value)
}

// Dates -------------------------------------------------------------------

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', opts ?? { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatShortDate(iso: string): string {
  return formatDate(iso, { month: 'short', day: 'numeric' })
}

export function formatWeekday(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

// Add N days to an ISO date string, returning a new ISO (date-only) string.
export function addDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// Relative "x days ago / in x days" given a reference "today" ISO.
export function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso).getTime()
  const b = new Date(toIso).getTime()
  return Math.round((b - a) / 86_400_000)
}

export function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
