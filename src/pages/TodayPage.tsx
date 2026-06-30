import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useApp, useDerived } from '@/store/store'
import { STAGE_BY_KEY, stageProgress, CATEGORY_META } from '@/lib/plan'
import { formatWeekday, formatDate, num, pct } from '@/lib/format'
import { adherenceColor } from '@/lib/colors'
import { Card } from '@/components/Card'
import { KpiCard } from '@/components/KpiCard'
import { Pill } from '@/components/Pill'
import { IconChip } from '@/components/IconChip'
import { ProgressRing } from '@/components/ProgressRing'
import { ProgressBar } from '@/components/ProgressBar'
import { Button } from '@/components/Button'
import { SectionHeading } from '@/components/SectionHeading'

function greeting(date: Date): string {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

const ADJUST_ACTIONS: { icon: string; label: string; to: string }[] = [
  { icon: 'Stethoscope', label: 'Edit plan & visits', to: '/staff' },
  { icon: 'HeartPulse', label: 'View full plan', to: '/plan' },
  { icon: 'Gift', label: 'Redeem rewards', to: '/rewards' },
]

export function TodayPage() {
  const { state } = useApp()
  const d = useDerived()
  const isStaff = state.role === 'staff'
  const quickActions = isStaff ? ADJUST_ACTIONS : ADJUST_ACTIONS.filter((a) => a.to !== '/staff')

  const now = useMemo(() => new Date(), [])
  const hello = greeting(now)

  const { patient, plan } = state
  const stage = STAGE_BY_KEY[plan.stage]
  const stagePct = stageProgress(plan.stage)

  const adherence = d.currentAdherence
  const ringColor = adherenceColor(adherence.pct)

  // Weekly in-office training: sum the ordered times-per-week across in-office items.
  const inOffice = useMemo(
    () => plan.activities.filter((a) => a.location === 'in_office'),
    [plan.activities],
  )
  const sessionsPerWeek = useMemo(
    () => inOffice.reduce((sum, a) => sum + a.timesPerWeek, 0),
    [inOffice],
  )

  // Care-focus chips: program label + a couple of distinct activity categories present.
  const focusChips = useMemo(() => {
    const cats = Array.from(new Set(plan.activities.map((a) => a.category)))
      .slice(0, 2)
      .map((c) => CATEGORY_META[c].label)
    return [patient.programLabel, ...cats]
  }, [plan.activities, patient.programLabel])

  // This week's schedule cards — in-office activities, up to 4.
  const scheduleCards = useMemo(
    () => adherence.byActivity.filter((a) => a.activity.location === 'in_office').slice(0, 4),
    [adherence.byActivity],
  )

  // Top activities for the "By activity" intensity breakdown.
  const topActivities = useMemo(
    () => adherence.byActivity.slice(0, 4),
    [adherence.byActivity],
  )

  const next = d.upcoming[0]
  const nextLinked = next ? plan.activities.find((a) => a.id === next.activityId) : undefined
  const nextIcon = nextLinked ? nextLinked.icon : 'CalendarDays'

  return (
    <div className="space-y-6">
      {/* 1) PAGE HEADER ---------------------------------------------------- */}
      <header className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-300">
            Your care roadmap
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {hello}, <span className="text-brand-300">{patient.firstName}</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" className="cursor-default tnum" tabIndex={-1}>
            Week {num(state.currentWeek)}
          </Button>
          {isStaff && (
            <Link to="/staff">
              <Button variant="secondary" size="sm">
                Adjust
              </Button>
            </Link>
          )}
          <Link to="/week">
            <Button size="sm">Log activity</Button>
          </Link>
        </div>
      </header>

      {/* 2) KPI CARD ROW --------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          to="/plan"
          icon="HeartPulse"
          label="Current plan"
          value={stage.label}
          badge={<Pill tone="brand">Active</Pill>}
          hint={
            <span className="block">
              <ProgressBar value={stagePct} className="mb-1.5" />
              <span className="tnum">{pct(stagePct)} complete</span>
            </span>
          }
        />
        <KpiCard
          to="/week"
          icon="CalendarDays"
          label="Weekly training"
          value={
            <span className="tnum">
              {num(sessionsPerWeek)} session{sessionsPerWeek === 1 ? '' : 's'}
            </span>
          }
          hint="Avg 30–60 min per session"
        />
        <KpiCard
          to="/plan"
          icon="Target"
          label="Care focus"
          value={stage.short}
          hint={
            <span className="mt-1 flex flex-wrap gap-1">
              {focusChips.map((label) => (
                <Pill key={label} tone="neutral">
                  {label}
                </Pill>
              ))}
            </span>
          }
        />
        <KpiCard
          to="/plan"
          icon={nextIcon}
          label="Next visit"
          value={next ? next.title : 'No visits'}
          hint={
            next
              ? `${formatWeekday(next.date)} · ${formatDate(next.date, {
                  hour: 'numeric',
                  minute: '2-digit',
                })} · ${next.provider}`
              : 'All clear'
          }
        />
      </div>

      {/* 3) THIS WEEK'S SCHEDULE ------------------------------------------ */}
      <section>
        <SectionHeading
          icon="CalendarDays"
          title="This week"
          subtitle="Your in-office sessions"
          action={
            <Link to="/week" className="text-xs font-semibold text-brand-300 hover:text-brand-200">
              Log activity
            </Link>
          }
        />
        {scheduleCards.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-400">No in-office sessions scheduled this week.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {scheduleCards.map(({ activity, ordered, actual, pct: aPct }) => {
              const tone =
                actual >= ordered && ordered > 0 ? 'good' : actual > 0 ? 'brand' : 'neutral'
              const label =
                actual >= ordered && ordered > 0 ? 'Done' : actual > 0 ? 'In progress' : 'To do'
              return (
                <Link
                  key={activity.id}
                  to="/week"
                  className="group flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 backdrop-blur transition-colors hover:border-brand-500/40 hover:bg-white/[0.055] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <IconChip icon={activity.icon} size="h-10 w-10" />
                    <Pill tone={tone}>{label}</Pill>
                  </div>
                  <p className="mt-4 truncate text-sm font-semibold text-white">{activity.name}</p>
                  <dl className="mt-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-400">Per week</dt>
                      <dd className="font-medium text-white tnum">{num(ordered)}x</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-400">Done</dt>
                      <dd className="font-medium text-white tnum">{num(actual)}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-400">Adherence</dt>
                      <dd className="font-medium text-white tnum">{pct(aPct)}</dd>
                    </div>
                  </dl>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* 4) BOTTOM ROW ----------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* a) Overall progress */}
        <Card title="Overall progress">
          <div className="flex flex-col items-center text-center">
            <ProgressRing value={adherence.pct} size={160} stroke={14} color={ringColor}>
              <span className="text-3xl font-bold tracking-tight text-white tnum">
                {pct(adherence.pct)}
              </span>
              <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                this week
              </span>
            </ProgressRing>
            <p className="mt-4 text-sm text-slate-300">
              <span className="font-semibold text-white tnum">{num(adherence.actual)}</span> of{' '}
              <span className="font-semibold text-white tnum">{num(adherence.ordered)}</span> done
            </p>
            <p className="mt-1 text-xs text-slate-400">
              <span className="font-semibold text-brand-300 tnum">+{num(d.points.thisWeek)}</span>{' '}
              points this week
            </p>
          </div>
        </Card>

        {/* b) By activity */}
        <Card title="By activity" subtitle="Adherence per item">
          {topActivities.length === 0 ? (
            <p className="text-sm text-slate-400">No activities in your plan yet.</p>
          ) : (
            <ul className="space-y-4">
              {topActivities.map(({ activity, pct: aPct }) => (
                <li key={activity.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-medium text-white">{activity.name}</span>
                    <span className="shrink-0 text-slate-400 tnum">{pct(aPct)}</span>
                  </div>
                  <ProgressBar value={aPct} color={adherenceColor(aPct)} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* c) Adjust your plan */}
        <Card title={isStaff ? 'Adjust your plan' : 'Quick links'} subtitle="Jump to">
          <ul className="space-y-2">
            {quickActions.map(({ icon, label, to }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 transition-colors hover:border-brand-500/40 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                >
                  <IconChip icon={icon} size="h-9 w-9" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
                    {label}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-brand-300" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
