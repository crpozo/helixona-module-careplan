import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronRight } from 'lucide-react'
import { useApp, useDerived } from '@/store/store'
import { isDoneOnDay, isScheduledOn, weekdayIndex } from '@/lib/schedule'
import { formatDate, formatWeekday, num, plural } from '@/lib/format'
import { getIcon } from '@/lib/icons'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { ProgressRing } from '@/components/ProgressRing'
import { IconChip } from '@/components/IconChip'

function greeting(date: Date): string {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

/** One tap-able mini stat: big number, tiny label. */
function StatTile({
  to,
  icon,
  iconClass,
  value,
  label,
}: {
  to: string
  icon: string
  iconClass: string
  value: string
  label: string
}) {
  const Icon = getIcon(icon)
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-0.5 rounded-3xl border-2 border-slate-200 bg-white p-3 text-center transition-colors hover:border-brand-400 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:p-4"
    >
      <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${iconClass}`} />
      <span className="mt-0.5 text-xl font-extrabold text-slate-800 tnum sm:text-2xl">{value}</span>
      <span className="text-[11px] font-bold text-slate-500 sm:text-xs">{label}</span>
    </Link>
  )
}

/**
 * The patient home: one clear next action ("start your check-in"),
 * three glanceable stats, and the next visit. Compact on purpose —
 * the whole page fits in the viewport without scrolling.
 */
export function TodayPage() {
  const { state } = useApp()
  const d = useDerived()
  const isStaff = state.role === 'staff'
  const { patient } = state

  const now = useMemo(() => new Date(), [])
  const hello = greeting(now)

  // Today's list only — never the whole week's treatment at once.
  const todayIdx = weekdayIndex(now)
  const adherence = d.currentAdherence
  const todayItems = adherence.byActivity.filter((r) => isScheduledOn(r.activity, todayIdx))
  const doneCount = todayItems.filter((r) =>
    isDoneOnDay(d.currentWeekLog, r.activity.id, todayIdx),
  ).length
  const remaining = todayItems.length - doneCount
  const allDone = remaining === 0
  const todayPct = todayItems.length > 0 ? (doneCount / todayItems.length) * 100 : 100

  const next = d.upcoming[0]
  const nextIconName = next
    ? state.plan.activities.find((a) => a.id === next.activityId)?.icon ?? 'CalendarDays'
    : 'CalendarDays'

  const ringInner = (big: boolean) =>
    allDone ? (
      <Check className={big ? 'h-12 w-12 text-brand-600' : 'h-8 w-8 text-brand-600'} strokeWidth={3} />
    ) : (
      <>
        <span
          className={`font-extrabold text-slate-800 tnum ${big ? 'text-4xl' : 'text-2xl'}`}
        >
          {remaining}
        </span>
        <span
          className={`font-bold uppercase tracking-wide text-slate-500 ${big ? 'text-xs' : 'text-[9px]'}`}
        >
          to go
        </span>
      </>
    )

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 sm:gap-5">
      {/* Greeting */}
      <header className="animate-fade-up">
        <h1 className="text-2xl font-extrabold text-slate-800 sm:text-3xl">
          {hello}, {patient.firstName}!
        </h1>
        <p className="mt-0.5 text-sm font-semibold text-slate-500 sm:text-base">
          One small step at a time.
        </p>
      </header>

      {/* Hero: the one thing to do now. Grows to fill the free height so the
          page always uses the whole viewport without scrolling. */}
      <Card className="flex max-h-[24rem] min-h-0 flex-1 flex-col justify-center border-brand-200 bg-brand-50 p-5 sm:p-6">
        <div className="flex items-center justify-center gap-4 text-left sm:gap-6">
          {/* Big ring only when the window is both wide AND tall enough. */}
          <ProgressRing
            value={todayPct}
            size={92}
            stroke={10}
            className="shrink-0 [@media(min-width:640px)_and_(min-height:780px)]:hidden"
          >
            {ringInner(false)}
          </ProgressRing>
          <ProgressRing
            value={todayPct}
            size={148}
            stroke={14}
            className="hidden shrink-0 [@media(min-width:640px)_and_(min-height:780px)]:block"
          >
            {ringInner(true)}
          </ProgressRing>
          <div className="min-w-0">
            <p className="text-lg font-extrabold leading-snug text-slate-800 sm:text-2xl">
              {allDone
                ? 'All done for today! 🎉'
                : `${num(remaining)} ${plural(remaining, 'thing')} to do today`}
            </p>
            <p className="mt-0.5 text-sm font-bold text-slate-500 tnum sm:text-base">
              {num(doneCount)} of {num(todayItems.length)} done today
            </p>
          </div>
        </div>
        <Link to={allDone ? '/progress' : '/checkin'} className="mt-4 block sm:mt-6">
          <Button variant="primary" size="lg" className="w-full">
            {allDone ? 'See your progress' : "Start today's check-in"}
            <ChevronRight className="h-5 w-5" />
          </Button>
        </Link>
      </Card>

      {/* Three glanceable stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile
          to="/progress"
          icon="Flame"
          iconClass="text-amber-500"
          value={num(d.streak.current)}
          label={`week ${plural(d.streak.current, 'streak', 'streak')}`}
        />
        <StatTile
          to="/rewards"
          icon="Coins"
          iconClass="text-brand-600"
          value={num(d.points.balance)}
          label="points"
        />
        <StatTile
          to="/week"
          icon="CalendarDays"
          iconClass="text-sky-500"
          value={num(state.currentWeek)}
          label="week of plan"
        />
      </div>

      {/* Next visit — or a nudge to book one */}
      {next ? (
        <div className="flex items-center gap-3 rounded-3xl border-2 border-slate-200 bg-white p-4 sm:p-5">
          <IconChip icon={nextIconName} size="h-11 w-11" iconClassName="h-5 w-5" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
              Your next visit
            </p>
            <p className="truncate text-sm font-extrabold text-slate-800">{next.title}</p>
            <p className="truncate text-xs font-semibold text-slate-500">
              {formatWeekday(next.date)},{' '}
              {formatDate(next.date, {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}{' '}
              · {next.provider}
            </p>
          </div>
          <Link to="/book" className="shrink-0">
            <Button variant="secondary" size="sm">
              Book
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-3xl border-2 border-brand-200 bg-white p-4 sm:p-5">
          <IconChip icon="CalendarDays" size="h-11 w-11" iconClassName="h-5 w-5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-slate-800">No visits booked</p>
            <p className="text-xs font-semibold text-slate-500">
              Book your next treatment in under a minute.
            </p>
          </div>
          <Link to="/book" className="shrink-0">
            <Button variant="primary" size="sm">
              Book a visit
            </Button>
          </Link>
        </div>
      )}

      {/* Staff shortcut (staff only) */}
      {isStaff && (
        <Link
          to="/staff"
          className="flex items-center gap-3 rounded-3xl border-2 border-slate-200 bg-white p-3 transition-colors hover:border-brand-400 hover:bg-brand-50"
        >
          <IconChip icon="Stethoscope" size="h-9 w-9" iconClassName="h-4 w-4" />
          <span className="flex-1 text-sm font-extrabold text-slate-700">Edit the care plan</span>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </Link>
      )}
    </div>
  )
}
