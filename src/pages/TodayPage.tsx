import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronRight } from 'lucide-react'
import { useApp, useDerived } from '@/store/store'
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
      className="flex flex-col items-center gap-1 rounded-3xl border-2 border-slate-200 bg-white p-4 text-center transition-colors hover:border-brand-400 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <Icon className={`h-7 w-7 ${iconClass}`} />
      <span className="mt-1 text-2xl font-extrabold text-slate-800 tnum">{value}</span>
      <span className="text-xs font-bold text-slate-500">{label}</span>
    </Link>
  )
}

/**
 * The patient home: one clear next action ("start your check-in"),
 * three glanceable stats, and the next visit. Nothing else.
 */
export function TodayPage() {
  const { state } = useApp()
  const d = useDerived()
  const isStaff = state.role === 'staff'
  const { patient } = state

  const now = useMemo(() => new Date(), [])
  const hello = greeting(now)

  const adherence = d.currentAdherence
  const remaining = adherence.byActivity.reduce((n, a) => n + Math.max(0, a.ordered - a.actual), 0)
  const allDone = remaining === 0

  const next = d.upcoming[0]
  const nextIconName = next
    ? state.plan.activities.find((a) => a.id === next.activityId)?.icon ?? 'CalendarDays'
    : 'CalendarDays'

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* Greeting */}
      <header className="animate-fade-up pt-2 text-center sm:text-left">
        <h1 className="text-3xl font-extrabold text-slate-800">
          {hello}, {patient.firstName}!
        </h1>
        <p className="mt-1 text-base font-semibold text-slate-500">One small step at a time.</p>
      </header>

      {/* Hero: the one thing to do now */}
      <Card className="border-brand-200 bg-brand-50 p-6">
        <div className="flex flex-col items-center gap-5 text-center">
          <ProgressRing value={adherence.pct} size={128} stroke={14}>
            {allDone ? (
              <Check className="h-12 w-12 text-leaf-500" strokeWidth={3} />
            ) : (
              <>
                <span className="text-4xl font-extrabold text-slate-800 tnum">{remaining}</span>
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  to go
                </span>
              </>
            )}
          </ProgressRing>
          <div>
            <p className="text-xl font-extrabold text-slate-800">
              {allDone
                ? 'All done for this week! 🎉'
                : `${num(remaining)} ${plural(remaining, 'thing')} left this week`}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-500 tnum">
              {num(adherence.actual)} of {num(adherence.ordered)} done
            </p>
          </div>
          {allDone ? (
            <Link to="/progress" className="w-full">
              <Button variant="primary" size="xl" className="w-full">
                See your progress
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link to="/checkin" className="w-full">
              <Button variant="success" size="xl" className="w-full">
                Start today's check-in
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
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

      {/* Next visit (only if there is one) */}
      {next && (
        <Card title="Your next visit">
          <div className="flex items-center gap-3">
            <IconChip icon={nextIconName} size="h-12 w-12" iconClassName="h-6 w-6" />
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold text-slate-800">{next.title}</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-500">
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
          </div>
        </Card>
      )}

      {/* Staff shortcut (staff only) */}
      {isStaff && (
        <Link
          to="/staff"
          className="flex items-center gap-3 rounded-3xl border-2 border-slate-200 bg-white p-4 transition-colors hover:border-brand-400 hover:bg-brand-50"
        >
          <IconChip icon="Stethoscope" size="h-10 w-10" />
          <span className="flex-1 text-base font-extrabold text-slate-700">
            Edit the care plan
          </span>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </Link>
      )}
    </div>
  )
}
