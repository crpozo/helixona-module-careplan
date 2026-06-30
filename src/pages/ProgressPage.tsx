import { useMemo } from 'react'
import type { ReactNode } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { useApp, useDerived } from '@/store/store'
import { Card } from '@/components/Card'
import { KpiCard } from '@/components/KpiCard'
import { Pill } from '@/components/Pill'
import { EmptyState } from '@/components/EmptyState'
import { STAGES, STAGE_BY_KEY } from '@/lib/plan'
import { COLORS, adherenceColor } from '@/lib/colors'
import { weekPoints } from '@/lib/gamification'
import { num, pct, plural } from '@/lib/format'
import { getIcon } from '@/lib/icons'
import { cn } from '@/lib/cn'

// Shared chart axis styling (STYLE.md §charts).
const AXIS = {
  axisLine: false,
  tickLine: false,
  tick: { fontSize: 11, fill: COLORS.axis },
} as const

export function ProgressPage() {
  const { state } = useApp()
  const d = useDerived()
  const { plan, adherenceTarget, currentWeek } = state

  // Weeks already finished (strictly before the current week) drive averages.
  const completed = useMemo(
    () => d.weekAdherences.filter((w) => w.weekNumber < currentWeek),
    [d.weekAdherences, currentWeek],
  )

  const avgAdherence = useMemo(() => {
    if (completed.length === 0) return 0
    return Math.round(
      completed.reduce((sum, w) => sum + w.pct, 0) / completed.length,
    )
  }, [completed])

  const bestWeek = useMemo(
    () => d.weekAdherences.reduce((m, w) => Math.max(m, w.pct), 0),
    [d.weekAdherences],
  )

  // Trend = last completed week vs the one before it. We deliberately compare
  // FINISHED weeks (not the in-progress current week, which would show a scary
  // dip just because it isn't over yet).
  const trend = useMemo(() => {
    if (completed.length < 2) return { delta: null as number | null }
    const last = completed[completed.length - 1].pct
    const prev = completed[completed.length - 2].pct
    return { delta: last - prev }
  }, [completed])

  // 2) Adherence trend series.
  const trendData = useMemo(
    () => d.weekAdherences.map((w) => ({ name: `W${w.weekNumber}`, pct: w.pct })),
    [d.weekAdherences],
  )

  // 3) Per-activity (this week).
  const activityData = useMemo(
    () =>
      d.currentAdherence.byActivity.map((a) => ({
        name: a.activity.name,
        pct: a.pct,
        actual: a.actual,
        ordered: a.ordered,
      })),
    [d.currentAdherence],
  )

  // 4) Points per week.
  const pointsData = useMemo(
    () =>
      [...state.weeks]
        .sort((a, b) => a.weekNumber - b.weekNumber)
        .map((w) => ({
          name: `W${w.weekNumber}`,
          points: weekPoints(plan.activities, w, adherenceTarget),
        })),
    [state.weeks, plan.activities, adherenceTarget],
  )

  const currentStage = STAGE_BY_KEY[plan.stage]

  return (
    <div className="space-y-6">
      {/* Page hero — visible on mobile; desktop top bar already names the section. */}
      <header className="lg:hidden">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Progress
        </p>
        <h1 className="text-lg font-bold text-ink-900">Your journey over time</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          How your weeks, points and stages are trending.
        </p>
      </header>

      {/* 1) KPI ROW ----------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          to="/week"
          label="Avg adherence"
          value={pct(avgAdherence)}
          icon="Gauge"
          hint={
            completed.length > 0
              ? `Across ${completed.length} completed ${plural(completed.length, 'week')}`
              : 'No completed weeks yet'
          }
          delta={trend.delta == null ? undefined : `${pct(Math.abs(trend.delta))}`}
          trend={
            trend.delta == null || trend.delta === 0
              ? 'flat'
              : trend.delta > 0
                ? 'up'
                : 'down'
          }
        />
        <KpiCard
          to="/week"
          label="Best week"
          value={pct(bestWeek)}
          icon="Trophy"
          hint="Your highest weekly score"
        />
        <KpiCard
          to="/rewards"
          label="Current streak"
          value={
            <>
              {num(d.streak.current)}
              <span className="ml-1 text-sm font-semibold text-slate-400">
                {plural(d.streak.current, 'wk')}
              </span>
            </>
          }
          icon="Flame"
          hint={
            d.streak.atRisk
              ? 'At risk — finish strong this week'
              : `Best ever: ${d.streak.best}`
          }
        />
        <KpiCard
          to="/rewards"
          label="Lifetime points"
          value={num(d.points.lifetime)}
          icon="Star"
          hint={`${num(d.points.balance)} available to spend`}
        />
      </div>

      {/* 2) ADHERENCE TREND --------------------------------------------------- */}
      <Card
        title="Weekly adherence"
        subtitle={`Goal: ${pct(adherenceTarget)} each week`}
        action={
          trend.delta != null ? (
            <Pill tone={trend.delta >= 0 ? 'good' : 'bad'}>
              {trend.delta >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.delta >= 0 ? '+' : ''}
              <span className="tnum">{pct(trend.delta)}</span> vs prior week
            </Pill>
          ) : undefined
        }
      >
        {trendData.length === 0 ? (
          <ChartEmpty title="No weeks tracked yet" />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trendData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="adherenceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.brand} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={COLORS.brand} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGridLine />
              <XAxis dataKey="name" {...AXIS} />
              <YAxis domain={[0, 100]} width={40} {...AXIS} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                cursor={{ stroke: COLORS.brand, strokeWidth: 1, strokeDasharray: '3 3' }}
                content={<TrendTooltip />}
              />
              <ReferenceLine
                y={adherenceTarget}
                stroke={COLORS.accent}
                strokeDasharray="4 4"
                label={{
                  value: `Goal ${adherenceTarget}%`,
                  position: 'insideTopRight',
                  fontSize: 11,
                  fill: COLORS.accent,
                }}
              />
              <Area
                type="monotone"
                dataKey="pct"
                stroke={COLORS.brand}
                strokeWidth={2.5}
                fill="url(#adherenceFill)"
                dot={{ r: 3, fill: COLORS.brand, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: COLORS.brand, stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* 3) PER-ACTIVITY (this week) ----------------------------------------- */}
      <Card
        title="By activity (this week)"
        subtitle={`Week ${currentWeek} · how each item is going`}
      >
        {activityData.length === 0 ? (
          <ChartEmpty title="No activities in your plan" />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(180, activityData.length * 38)}>
            <BarChart
              layout="vertical"
              data={activityData}
              margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
              barCategoryGap="28%"
            >
              <CartesianGridLine horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                {...AXIS}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={104}
                {...AXIS}
                tick={{ fontSize: 11, fill: COLORS.ink }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(214,185,129,0.08)' }}
                content={<ActivityTooltip />}
              />
              <Bar
                dataKey="pct"
                radius={[0, 6, 6, 0]}
                maxBarSize={22}
                background={{ fill: '#f1f5f9' }}
              >
                {activityData.map((entry) => (
                  <Cell key={entry.name} fill={adherenceColor(entry.pct)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* 4) POINTS PER WEEK --------------------------------------------------- */}
      <Card title="Points earned" subtitle="Per week — completions plus bonuses">
        {pointsData.length === 0 ? (
          <ChartEmpty title="No points logged yet" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pointsData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGridLine />
              <XAxis dataKey="name" {...AXIS} />
              <YAxis width={40} {...AXIS} />
              <Tooltip
                cursor={{ fill: 'rgba(214,185,129,0.08)' }}
                content={<PointsTooltip />}
              />
              <Bar
                dataKey="points"
                fill={COLORS.brand}
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* 5) STAGE JOURNEY ----------------------------------------------------- */}
      <Card
        title="Care journey"
        subtitle={`Stage ${currentStage.order + 1} of ${STAGES.length} · ${currentStage.label}`}
      >
        <ol className="relative">
          {STAGES.map((stage, i) => {
            const isCurrent = stage.key === plan.stage
            const isDone = stage.order < currentStage.order
            const StageIcon = getIcon(stage.icon)
            const last = i === STAGES.length - 1
            return (
              <li key={stage.key} className="flex gap-4">
                {/* Rail + node */}
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors',
                      isCurrent &&
                        'border-brand-500 bg-brand-500 text-ink-900 shadow-sm ring-4 ring-brand-100',
                      isDone && 'border-brand-200 bg-brand-100 text-brand-700',
                      !isCurrent && !isDone && 'border-slate-200 bg-white text-slate-300',
                    )}
                  >
                    <StageIcon className="h-5 w-5" />
                  </span>
                  {!last && (
                    <span
                      className={cn(
                        'my-1 w-0.5 flex-1 rounded-full',
                        isDone ? 'bg-brand-300' : 'bg-slate-200',
                      )}
                      aria-hidden
                    />
                  )}
                </div>

                {/* Content */}
                <div className={cn('min-w-0 flex-1', last ? 'pb-0' : 'pb-6')}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        isCurrent || isDone ? 'text-ink-900' : 'text-slate-400',
                      )}
                    >
                      {stage.label}
                    </span>
                    {isCurrent && <Pill tone="brand">You are here</Pill>}
                    {isDone && <Pill tone="good">Done</Pill>}
                    {!isCurrent && !isDone && <Pill tone="neutral">Upcoming</Pill>}
                  </div>
                  <p
                    className={cn(
                      'mt-1 text-sm leading-relaxed',
                      isCurrent || isDone ? 'text-slate-600' : 'text-slate-400',
                    )}
                  >
                    {stage.description}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </Card>
    </div>
  )
}

// --- Chart helpers ------------------------------------------------------------

// Local CartesianGrid wrapper so the on-brand styling stays consistent.
function CartesianGridLine({ horizontal = true }: { horizontal?: boolean }) {
  return (
    <CartesianGrid
      stroke={COLORS.grid}
      strokeDasharray="3 3"
      horizontal={horizontal}
      vertical={!horizontal}
    />
  )
}

function ChartEmpty({ title }: { title: string }) {
  return (
    <EmptyState
      icon="Activity"
      title={title}
      description="Track a week in This Week and your charts will fill in here."
    />
  )
}

// --- Tooltips -----------------------------------------------------------------

function TooltipShell({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-md">
      {children}
    </div>
  )
}

function TrendTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null
  const value = payload[0].value ?? 0
  return (
    <TooltipShell>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="tnum text-sm font-bold text-ink-900">{pct(value)} adherence</p>
    </TooltipShell>
  )
}

function ActivityTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null
  const row = payload[0].payload as {
    name: string
    pct: number
    actual: number
    ordered: number
  }
  return (
    <TooltipShell>
      <p className="text-xs font-semibold text-ink-900">{row.name}</p>
      <p className="mt-0.5 tnum text-sm font-bold text-ink-900">{pct(row.pct)}</p>
      <p className="tnum text-xs text-slate-400">
        {row.actual} of {row.ordered} done
      </p>
    </TooltipShell>
  )
}

function PointsTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null
  const value = payload[0].value ?? 0
  return (
    <TooltipShell>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="tnum text-sm font-bold text-ink-900">{num(value)} pts</p>
    </TooltipShell>
  )
}
