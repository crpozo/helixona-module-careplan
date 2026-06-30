import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  Check,
  MapPin,
  Plus,
  Sparkles,
} from 'lucide-react'
import type { Reward } from '@/types'
import { useApp, useDerived } from '@/store/store'
import { STAGE_BY_KEY, PACING_BY_KEY } from '@/lib/plan'
import { formatDate, formatWeekday, num, pct, plural } from '@/lib/format'
import { adherenceColor } from '@/lib/colors'
import { getIcon } from '@/lib/icons'
import { Card } from '@/components/Card'
import { KpiCard } from '@/components/KpiCard'
import { Pill } from '@/components/Pill'
import { ProgressRing } from '@/components/ProgressRing'
import { ProgressBar } from '@/components/ProgressBar'
import { Button } from '@/components/Button'
import { Avatar } from '@/components/Avatar'
import { EmptyState } from '@/components/EmptyState'
import { SectionHeading } from '@/components/SectionHeading'

const STATUS_PILL: Record<
  'good' | 'watch' | 'bad',
  { tone: 'good' | 'watch' | 'bad'; label: string }
> = {
  good: { tone: 'good', label: 'On track' },
  watch: { tone: 'watch', label: 'Keep going' },
  bad: { tone: 'bad', label: 'Behind' },
}

function greeting(date: Date): string {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function TodayPage() {
  const { state, actions } = useApp()
  const d = useDerived()

  const now = useMemo(() => new Date(), [])
  const hello = greeting(now)

  const { patient, plan, rewards } = state
  const stage = STAGE_BY_KEY[plan.stage]
  const pacing = PACING_BY_KEY[plan.pacing]
  const StageIcon = getIcon(stage.icon)
  const PacingIcon = getIcon(pacing.icon)

  const adherence = d.currentAdherence
  const ringColor = adherenceColor(adherence.pct)
  const status = STATUS_PILL[adherence.status]

  // Today's quick-log = at-home activities, with this week's remaining count.
  const homeFocus = useMemo(() => {
    const byId = new Map(adherence.byActivity.map((a) => [a.activity.id, a]))
    return plan.activities
      .filter((a) => a.location === 'at_home')
      .map((activity) => {
        const row = byId.get(activity.id)
        const ordered = row?.ordered ?? activity.timesPerWeek
        const actual = row?.actual ?? 0
        return { activity, ordered, actual, remaining: Math.max(0, ordered - actual) }
      })
  }, [plan.activities, adherence.byActivity])

  const upcoming = d.upcoming.slice(0, 3)

  // Reward nudge: the most valuable reward they can already afford (most
  // enticing "you unlocked this" moment); else progress toward the cheapest.
  const affordable = useMemo<Reward | null>(() => {
    const list = rewards
      .filter((r) => r.cost <= d.points.balance)
      .sort((a, b) => b.cost - a.cost)
    return list[0] ?? null
  }, [rewards, d.points.balance])

  const cheapest = useMemo<Reward | null>(() => {
    return [...rewards].sort((a, b) => a.cost - b.cost)[0] ?? null
  }, [rewards])

  return (
    <div className="space-y-6">
      {/* 1) GREETING HERO ---------------------------------------------------- */}
      <section className="animate-fade-up overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-brand-100 shadow-soft">
        <div className="relative p-5 sm:p-7">
          {/* warm gold glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-300/40 blur-3xl"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                {formatDate(now.toISOString(), {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
                {hello}, <span className="text-brand-700">{patient.firstName}</span>
              </h1>
              <p className="mt-2 max-w-md text-sm text-slate-600">
                Your goal:{' '}
                <span className="font-semibold text-ink-900">&ldquo;{plan.goal}&rdquo;</span>
              </p>
            </div>
            <Avatar
              firstName={patient.firstName}
              lastName={patient.lastName}
              size="h-12 w-12 shrink-0 ring-2 ring-brand-300"
            />
          </div>

          {/* context chips */}
          <div className="relative mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-medium text-ink-800">
              <StageIcon className="h-3.5 w-3.5 text-brand-600" />
              {stage.label}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-medium text-ink-800">
              <PacingIcon className="h-3.5 w-3.5 text-brand-600" />
              {pacing.label} pace
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-medium text-ink-800">
              <Sparkles className="h-3.5 w-3.5 text-brand-600" />
              {patient.programLabel}
            </span>
          </div>
        </div>
      </section>

      {/* 2) THIS WEEK SNAPSHOT ---------------------------------------------- */}
      <Card>
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <ProgressRing value={adherence.pct} size={132} stroke={12} color={ringColor}>
            <span className="text-3xl font-bold tracking-tight text-ink-900 tnum">
              {pct(adherence.pct)}
            </span>
            <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
              this week
            </span>
          </ProgressRing>

          <div className="w-full flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-sm font-semibold text-ink-900">This week so far</h2>
              <Pill tone={status.tone}>{status.label}</Pill>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              <span className="font-semibold text-ink-900 tnum">{adherence.actual}</span> of{' '}
              <span className="font-semibold text-ink-900 tnum">{adherence.ordered}</span> things
              done
            </p>

            <div className="mt-3 flex items-center justify-center gap-4 sm:justify-start">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Points this week
                </p>
                <p className="text-xl font-bold tracking-tight text-brand-700 tnum">
                  +{num(d.points.thisWeek)}
                </p>
              </div>
              <Link to="/week" className="ml-auto sm:ml-0">
                <Button>
                  Log activities
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* 3) QUICK STATS ROW -------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Current streak"
          icon="Flame"
          value={
            <span className="flex items-baseline gap-1">
              {num(d.streak.current)}
              <span className="text-sm font-medium text-slate-400">
                {plural(d.streak.current, 'wk')}
              </span>
            </span>
          }
          hint={`Best: ${num(d.streak.best)} ${plural(d.streak.best, 'week')}`}
        />
        <KpiCard
          label="Loyalty tier"
          icon={d.level.icon}
          value={d.level.tier}
          hint={
            d.level.nextTier
              ? `${num(d.level.toNext)} pts to ${d.level.nextTier}`
              : 'Top tier — radiant!'
          }
        />
        <KpiCard
          label="Points balance"
          icon="Coins"
          value={num(d.points.balance)}
          hint={`${num(d.points.lifetime)} earned all-time`}
        />
      </div>

      {/* 4) TODAY'S FOCUS ---------------------------------------------------- */}
      <section>
        <SectionHeading
          icon="Home"
          title="Today's focus"
          subtitle="Quick-log your at-home routine"
        />
        <Card flush={homeFocus.length === 0}>
          {homeFocus.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon="Home"
                title="No at-home activities yet"
                description="When your plan includes at-home routines, you'll log them here."
              />
            </div>
          ) : (
          <ul className="divide-y divide-slate-100">
            {homeFocus.map(({ activity, remaining, ordered }) => {
              const ActIcon = getIcon(activity.icon)
              const done = remaining <= 0
              return (
                <li
                  key={activity.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                    <ActIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">
                      {activity.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {done ? (
                        <span className="font-medium text-emerald-600">All done this week</span>
                      ) : (
                        <>
                          <span className="font-medium text-slate-500 tnum">{remaining}</span> of{' '}
                          <span className="tnum">{ordered}</span> left this week
                        </>
                      )}
                    </p>
                  </div>
                  {done ? (
                    <span className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                      <Check className="h-4 w-4" />
                      Done
                    </span>
                  ) : (
                    <Button
                      className="min-h-10 shrink-0"
                      onClick={() => actions.logCompletion(activity.id)}
                      aria-label={`Log ${activity.name}`}
                    >
                      <Plus className="h-4 w-4" />
                      Done
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
          )}
        </Card>
      </section>

      {/* 5) NEXT APPOINTMENTS ------------------------------------------------ */}
      <section>
        <SectionHeading
          icon="CalendarDays"
          title="Next appointments"
          subtitle="What's coming up at the clinic"
          action={
            <Link
              to="/plan"
              className="text-xs font-semibold text-brand-700 hover:text-brand-600"
            >
              View plan
            </Link>
          }
        />
        <Card flush>
          {upcoming.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon="CalendarDays"
                title="No upcoming visits"
                description="When new appointments are scheduled, they'll appear here."
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcoming.map((appt) => {
                const linked = plan.activities.find((a) => a.id === appt.activityId)
                const ApptIcon = linked ? getIcon(linked.icon) : CalendarDays
                return (
                  <li key={appt.id} className="flex items-center gap-3 p-4">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                      <ApptIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900">
                        {appt.title}
                      </p>
                      <p className="flex items-center gap-1 truncate text-xs text-slate-400">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {appt.provider}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-semibold text-ink-900">
                        {formatWeekday(appt.date)}
                      </p>
                      <p className="text-xs text-slate-400 tnum">
                        {formatDate(appt.date, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </section>

      {/* 6) REWARD NUDGE ----------------------------------------------------- */}
      {affordable ? (
        <Card className="border-brand-200 bg-gradient-to-br from-brand-50 to-white">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-ink-900">
              {(() => {
                const RewardIcon = getIcon(affordable.icon)
                return <RewardIcon className="h-6 w-6" />
              })()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                Reward unlocked
              </p>
              <p className="mt-0.5 text-sm font-semibold text-ink-900">
                You have{' '}
                <span className="tnum">{num(d.points.balance)}</span> pts — redeem{' '}
                <span className="text-brand-700">{affordable.title}</span>
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{affordable.description}</p>
            </div>
            <Link to="/rewards" className="w-full shrink-0 sm:w-auto">
              <Button className="w-full sm:w-auto">
                Redeem
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      ) : cheapest ? (
        <Card className="border-brand-200 bg-gradient-to-br from-brand-50 to-white">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  {(() => {
                    const RewardIcon = getIcon(cheapest.icon)
                    return <RewardIcon className="h-5 w-5" />
                  })()}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink-900">
                    Closing in on {cheapest.title}
                  </p>
                  <p className="text-xs text-slate-500 tnum">
                    {num(Math.max(0, cheapest.cost - d.points.balance))} pts to go
                  </p>
                </div>
              </div>
              <Link to="/rewards">
                <Button variant="secondary" size="sm">
                  Rewards
                </Button>
              </Link>
            </div>
            <ProgressBar
              value={cheapest.cost > 0 ? (d.points.balance / cheapest.cost) * 100 : 100}
            />
            <p className="text-right text-[11px] text-slate-400 tnum">
              {num(d.points.balance)} / {num(cheapest.cost)} pts
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
