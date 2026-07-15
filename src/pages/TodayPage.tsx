import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronRight, ListChecks, Plus } from 'lucide-react'
import type { Activity, StageKey } from '@/types'
import { useApp, useDerived } from '@/store/store'
import { isDoneOnDay, isScheduledOn, weekdayIndex } from '@/lib/schedule'
import { STAGES, STAGE_BY_KEY } from '@/lib/plan'
import { formatDate, num, plural } from '@/lib/format'
import { getIcon } from '@/lib/icons'
import { sfx } from '@/lib/sound'
import { cn } from '@/lib/cn'
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

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Horizontal "where you are" journey — the plan stages as steps. Taps to Plan. */
function StageStrip({ stageKey }: { stageKey: StageKey }) {
  const currentOrder = STAGE_BY_KEY[stageKey]?.order ?? 0
  const stages = [...STAGES].sort((a, b) => a.order - b.order)
  const current = stages.find((s) => s.order === currentOrder)
  return (
    <Link
      to="/plan"
      aria-label={`Your stage: ${current?.label}. View your plan.`}
      className="block rounded-3xl border-2 border-slate-200 bg-white p-3 transition-colors hover:border-brand-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
          Your journey · step {currentOrder + 1} of {stages.length}
        </span>
        <span className="text-xs font-extrabold text-brand-700">{current?.label}</span>
      </div>
      <ol className="mt-2 flex items-center gap-1">
        {stages.map((stage, i) => {
          const isDone = stage.order < currentOrder
          const isCurrent = stage.order === currentOrder
          const StageIcon = getIcon(stage.icon)
          return (
            <li key={stage.key} className="flex flex-1 items-center gap-1">
              <span
                title={stage.label}
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  isDone && 'bg-brand-300 text-ink-800',
                  isCurrent && 'bg-brand-500 text-ink-800 ring-4 ring-brand-100',
                  !isDone && !isCurrent && 'bg-slate-100 text-slate-300',
                )}
              >
                {isDone ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : (
                  <StageIcon className="h-4 w-4" />
                )}
              </span>
              {i < stages.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    'h-1 flex-1 rounded-full',
                    stage.order < currentOrder ? 'bg-brand-300' : 'bg-slate-200',
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </Link>
  )
}

/** Compact Yes / Done control for a home item on the Today list. */
function HomeItemControl({
  done,
  name,
  onYes,
  onUndo,
}: {
  done: boolean
  name: string
  onYes: () => void
  onUndo: () => void
}) {
  if (done) {
    return (
      <span className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onUndo}
          aria-label={`Undo ${name}`}
          className="text-xs font-extrabold text-slate-400 underline-offset-2 transition-colors hover:text-slate-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          Undo
        </button>
        <span className="inline-flex items-center gap-1 rounded-2xl bg-brand-500 px-3 py-2 text-sm font-extrabold text-ink-800">
          <Check className="h-4 w-4" strokeWidth={3} />
          Done
        </span>
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={onYes}
      aria-label={`Yes, I did ${name}`}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-brand-500 px-4 py-2.5 text-sm font-extrabold text-ink-800 shadow-[0_4px_0_#9c7e44] transition-all hover:bg-brand-400 active:translate-y-1 active:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <Check className="h-4 w-4" strokeWidth={3} />
      Yes
    </button>
  )
}

/** One home-therapy / supplement row on the Today list. */
function HomeRow({
  activity,
  done,
  onYes,
  onUndo,
}: {
  activity: Activity
  done: boolean
  onYes: () => void
  onUndo: () => void
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-3xl border-2 p-3.5',
        done ? 'border-brand-200 bg-brand-50' : 'border-slate-200 bg-white',
      )}
    >
      <IconChip icon={activity.icon} size="h-11 w-11" iconClassName="h-5 w-5" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold text-slate-800">{activity.name}</p>
        {(activity.dose ?? activity.durationMin) && (
          <p className="truncate text-xs font-semibold text-slate-400">
            {activity.dose ?? `≈${activity.durationMin} min`}
          </p>
        )}
      </div>
      <HomeItemControl done={done} name={activity.name} onYes={onYes} onUndo={onUndo} />
    </div>
  )
}

/** One clinic therapy the patient still needs to book — jumps into booking. */
function ClinicBookRow({ activity }: { activity: Activity }) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border-2 border-slate-200 bg-white p-3.5">
      <IconChip icon={activity.icon} size="h-11 w-11" iconClassName="h-5 w-5" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold text-slate-800">{activity.name}</p>
        <p className="truncate text-xs font-semibold text-slate-500">
          <span className="tnum">{activity.timesPerWeek}</span>× / week
          {activity.durationMin ? ` · ≈${activity.durationMin} min` : ''}
        </p>
      </div>
      <Link to="/book" state={{ serviceId: activity.id }} className="shrink-0">
        <Button variant="primary" size="sm">
          <Plus className="h-4 w-4" />
          Book
        </Button>
      </Link>
    </div>
  )
}

/**
 * The patient home: where you are in the journey, then exactly what to do today
 * split into "At home" (things you do yourself, checkable here) and "At the
 * clinic" (your booked visits), plus your streak, points and week.
 */
export function TodayPage() {
  const { state, actions } = useApp()
  const d = useDerived()
  const isStaff = state.role === 'staff'
  const { patient } = state

  const now = useMemo(() => new Date(), [])
  const hello = greeting(now)
  const todayIdx = weekdayIndex(now)
  const HomeIcon = getIcon('Home')
  const ClinicIcon = getIcon('Building2')

  // Split today's plan into what you do at home vs. what happens at the clinic.
  const todayRows = d.currentAdherence.byActivity.filter((r) =>
    isScheduledOn(r.activity, todayIdx),
  )
  const homeRows = todayRows.filter((r) => r.activity.location === 'at_home')
  const homeDone = homeRows.filter((r) =>
    isDoneOnDay(d.currentWeekLog, r.activity.id, todayIdx),
  )
  const homeRemaining = homeRows.length - homeDone.length
  const homePct = homeRows.length > 0 ? (homeDone.length / homeRows.length) * 100 : 100
  const allHomeDone = homeRemaining === 0

  // Today's booked clinic visits (in chronological order).
  const clinicToday = useMemo(
    () =>
      [...state.appointments]
        .filter((a) => a.status === 'scheduled' && sameDay(new Date(a.date), now))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [state.appointments, now],
  )
  const nextVisit = d.upcoming.find((a) => !sameDay(new Date(a.date), now))

  // Clinic therapies the patient still needs to book: the in-office items on
  // the plan that don't yet have an upcoming scheduled visit.
  const clinicActivities = state.plan.activities.filter((a) => a.location === 'in_office')
  const bookedActivityIds = new Set(
    d.upcoming.map((a) => a.activityId).filter((id): id is string => Boolean(id)),
  )
  const clinicToBook = clinicActivities.filter((a) => !bookedActivityIds.has(a.id))

  function markAllHomeDone() {
    const pending = homeRows.filter(
      (r) => !isDoneOnDay(d.currentWeekLog, r.activity.id, todayIdx),
    )
    if (pending.length === 0) return
    sfx.complete()
    pending.forEach((r) => actions.logDaily(r.activity.id, todayIdx, true))
  }

  const ringInner = allHomeDone ? (
    <Check className="h-7 w-7 text-brand-600" strokeWidth={3} />
  ) : (
    <>
      <span className="text-xl font-extrabold text-slate-800 tnum">{homeRemaining}</span>
      <span className="text-[9px] font-bold uppercase tracking-wide text-slate-500">to go</span>
    </>
  )

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4">
      {/* Greeting */}
      <header className="animate-fade-up">
        <h1 className="text-2xl font-extrabold text-slate-800 sm:text-3xl">
          {hello}, {patient.firstName}!
        </h1>
        <p className="mt-0.5 text-sm font-semibold text-slate-500">
          Here's your day. One small step at a time.
        </p>
      </header>

      {/* Where you are — the plan stages as steps */}
      <StageStrip stageKey={state.plan.stage} />

      {/* AT HOME — the things you do yourself, checkable right here */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              <HomeIcon className="h-4 w-4" />
            </span>
            <h2 className="text-base font-extrabold text-slate-800">At home today</h2>
          </div>
          {homeRows.length > 0 && (
            <span className="text-xs font-bold text-slate-500 tnum">
              {num(homeDone.length)} of {num(homeRows.length)} done
            </span>
          )}
        </div>

        {homeRows.length === 0 ? (
          <Card className="border-brand-200 bg-brand-50">
            <div className="flex items-center gap-3">
              <ProgressRing value={100} size={52} stroke={7}>
                <Check className="h-6 w-6 text-brand-600" strokeWidth={3} />
              </ProgressRing>
              <p className="text-sm font-extrabold text-slate-800">
                Nothing to do at home today — enjoy the rest.
              </p>
            </div>
          </Card>
        ) : (
          <>
            <Card className="border-brand-200 bg-brand-50 p-4">
              <div className="flex items-center gap-4">
                <ProgressRing value={homePct} size={64} stroke={8} className="shrink-0">
                  {ringInner}
                </ProgressRing>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-extrabold leading-snug text-slate-800">
                    {allHomeDone
                      ? 'All done at home! 🎉'
                      : `${num(homeRemaining)} ${plural(homeRemaining, 'thing')} left at home`}
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-slate-500">
                    Supplements, medicines and at-home therapies.
                  </p>
                </div>
                {!allHomeDone && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="shrink-0"
                    onClick={markAllHomeDone}
                  >
                    <ListChecks className="h-4 w-4" />
                    All done
                  </Button>
                )}
              </div>
            </Card>

            <div className="space-y-2.5">
              {homeRows.map((r) => (
                <HomeRow
                  key={r.activity.id}
                  activity={r.activity}
                  done={isDoneOnDay(d.currentWeekLog, r.activity.id, todayIdx)}
                  onYes={() => {
                    sfx.done()
                    actions.logDaily(r.activity.id, todayIdx, true)
                  }}
                  onUndo={() => {
                    sfx.undo()
                    actions.logDaily(r.activity.id, todayIdx, false)
                  }}
                />
              ))}
            </div>

            {!allHomeDone && (
              <Link to="/checkin" className="block">
                <Button variant="primary" size="lg" className="w-full">
                  Start guided home check-in
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </Link>
            )}
          </>
        )}
      </section>

      {/* AT THE CLINIC — your booked visits */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              <ClinicIcon className="h-4 w-4" />
            </span>
            <h2 className="text-base font-extrabold text-slate-800">At the clinic</h2>
          </div>
          <Link
            to="/calendar"
            className="text-xs font-extrabold text-brand-700 hover:underline"
          >
            View calendar
          </Link>
        </div>

        {/* Booked clinic visits happening today */}
        {clinicToday.length > 0 && (
          <div className="space-y-2.5">
            {clinicToday.map((appt) => {
              const linked = appt.activityId
                ? state.plan.activities.find((a) => a.id === appt.activityId)
                : undefined
              const iconName = linked?.icon || 'CalendarCheck'
              const done = linked ? isDoneOnDay(d.currentWeekLog, linked.id, todayIdx) : false
              return (
                <div
                  key={appt.id}
                  className={cn(
                    'flex items-center gap-3 rounded-3xl border-2 p-3.5',
                    done ? 'border-brand-200 bg-brand-50' : 'border-slate-200 bg-white',
                  )}
                >
                  <IconChip icon={iconName} size="h-11 w-11" iconClassName="h-5 w-5" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-slate-800">{appt.title}</p>
                    <p className="truncate text-xs font-semibold text-slate-500">
                      {formatDate(appt.date, { hour: 'numeric', minute: '2-digit' })} ·{' '}
                      {appt.provider}
                    </p>
                  </div>
                  {linked ? (
                    <HomeItemControl
                      done={done}
                      name={appt.title}
                      onYes={() => {
                        sfx.done()
                        actions.logDaily(linked.id, todayIdx, true)
                      }}
                      onUndo={() => {
                        sfx.undo()
                        actions.logDaily(linked.id, todayIdx, false)
                      }}
                    />
                  ) : (
                    <span className="shrink-0 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-extrabold text-brand-800">
                      Today
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Clinic therapies still to book */}
        {clinicToBook.length > 0 && (
          <>
            <div className="flex items-center justify-between px-1 pt-1">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                To book · {num(clinicToBook.length)} {plural(clinicToBook.length, 'therapy', 'therapies')}
              </p>
              {clinicToBook.length > 1 && (
                <Link to="/book" className="text-xs font-extrabold text-brand-700 hover:underline">
                  Book all
                </Link>
              )}
            </div>
            <div className="space-y-2.5">
              {clinicToBook.map((a) => (
                <ClinicBookRow key={a.id} activity={a} />
              ))}
            </div>
          </>
        )}

        {/* Nothing today and nothing left to book */}
        {clinicToday.length === 0 && clinicToBook.length === 0 && (
          <div className="flex items-center gap-3 rounded-3xl border-2 border-slate-200 bg-white p-4">
            <IconChip icon="CalendarCheck" size="h-11 w-11" iconClassName="h-5 w-5" />
            <div className="min-w-0 flex-1">
              {nextVisit ? (
                <>
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                    All booked · next up
                  </p>
                  <p className="truncate text-sm font-extrabold text-slate-800">
                    {nextVisit.title}
                  </p>
                  <p className="truncate text-xs font-semibold text-slate-500">
                    {formatDate(nextVisit.date, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-extrabold text-slate-800">
                    {clinicActivities.length === 0
                      ? 'No clinic therapies in your plan yet'
                      : "You're all booked"}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    {clinicActivities.length === 0
                      ? 'Your care team will add in-office treatments.'
                      : 'Nothing left to schedule right now.'}
                  </p>
                </>
              )}
            </div>
            {clinicActivities.length > 0 && (
              <Link to="/book" className="shrink-0">
                <Button variant="secondary" size="sm">
                  <Plus className="h-4 w-4" />
                  Book
                </Button>
              </Link>
            )}
          </div>
        )}
      </section>

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
      className="flex flex-col items-center gap-0.5 rounded-3xl border-2 border-slate-200 bg-white p-3 text-center transition-colors hover:border-brand-400 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <Icon className={`h-6 w-6 ${iconClass}`} />
      <span className="mt-0.5 text-xl font-extrabold text-slate-800 tnum">{value}</span>
      <span className="text-[11px] font-bold text-slate-500">{label}</span>
    </Link>
  )
}
