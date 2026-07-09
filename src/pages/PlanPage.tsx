import { Link } from 'react-router-dom'
import { Check, ChevronRight } from 'lucide-react'
import type { Activity } from '@/types'
import { useApp } from '@/store/store'
import { Card } from '@/components/Card'
import { Pill } from '@/components/Pill'
import { IconChip } from '@/components/IconChip'
import { STAGES, STAGE_BY_KEY, CATEGORY_META } from '@/lib/plan'
import { getIcon } from '@/lib/icons'
import { cn } from '@/lib/cn'

/** One activity row: icon, name + tiny detail, and how often per week. */
function ActivityRow({ activity }: { activity: Activity }) {
  return (
    <li className="flex items-center gap-3 rounded-3xl border-2 border-slate-200 bg-white p-4">
      <IconChip icon={activity.icon} size="h-12 w-12" iconClassName="h-6 w-6" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-extrabold text-slate-800">{activity.name}</p>
        <p className="mt-0.5 text-xs font-semibold text-slate-400">
          {activity.durationMin != null
            ? `≈${activity.durationMin} min`
            : CATEGORY_META[activity.category].label}
        </p>
      </div>
      <Pill tone="neutral" className="shrink-0">
        <span className="tnum">{activity.timesPerWeek}</span>x / week
      </Pill>
    </li>
  )
}

/** A labelled group of activities. Renders nothing when empty. */
function ActivityGroup({ label, activities }: { label: string; activities: Activity[] }) {
  if (activities.length === 0) return null
  return (
    <div>
      <p className="mb-2 px-1 text-xs font-extrabold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <ul className="space-y-3">
        {activities.map((a) => (
          <ActivityRow key={a.id} activity={a} />
        ))}
      </ul>
    </div>
  )
}

/**
 * Read-only "My Plan": the goal, a Duolingo-style vertical journey path,
 * and what to do each week. Calm — no editing, no numbers to worry about.
 */
export function PlanPage() {
  const { state } = useApp()
  const { plan } = state
  const isStaff = state.role === 'staff'

  const currentOrder = STAGE_BY_KEY[plan.stage].order
  const stages = [...STAGES].sort((a, b) => a.order - b.order)

  const clinicActivities = plan.activities.filter((a) => a.location === 'in_office')
  const homeActivities = plan.activities.filter((a) => a.location === 'at_home')

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* 1) Header */}
      <header className="animate-fade-up pt-2 text-center sm:text-left">
        <h1 className="text-3xl font-extrabold text-slate-800">My Plan</h1>
        <p className="mt-1 text-base font-semibold text-slate-500">
          Your road to feeling better.
        </p>
      </header>

      {/* 2) The goal */}
      <Card className="border-brand-200 bg-brand-50">
        <p className="text-xs font-extrabold uppercase tracking-wide text-brand-700">
          Your goal
        </p>
        <p className="mt-1.5 text-lg font-extrabold text-slate-800">{plan.goal}</p>
      </Card>

      {/* 3) The journey — vertical path of stages */}
      <ol className="px-1">
        {stages.map((stage, i) => {
          const isDone = stage.order < currentOrder
          const isCurrent = stage.order === currentOrder
          const StageIcon = getIcon(stage.icon)
          return (
            <li key={stage.key}>
              {/* Connector from the node above */}
              {i > 0 && (
                <div className="w-14">
                  <div
                    className={cn(
                      'mx-auto h-6 w-1.5 rounded-full',
                      stages[i - 1].order < currentOrder ? 'bg-brand-300' : 'bg-slate-200',
                    )}
                    aria-hidden
                  />
                </div>
              )}
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex h-14 w-14 shrink-0 items-center justify-center rounded-full',
                    isDone && 'bg-brand-500 text-ink-800',
                    isCurrent && 'bg-brand-500 text-ink-800 ring-4 ring-brand-200',
                    !isDone && !isCurrent && 'bg-slate-100 text-slate-300',
                  )}
                >
                  {isDone ? (
                    <Check className="h-7 w-7" strokeWidth={3} />
                  ) : (
                    <StageIcon className="h-7 w-7" />
                  )}
                </div>
                <div className="min-w-0 py-1">
                  <p
                    className={cn(
                      'font-extrabold',
                      isDone && 'text-slate-600',
                      isCurrent && 'text-lg text-brand-800',
                      !isDone && !isCurrent && 'text-slate-400',
                    )}
                  >
                    {stage.label}
                  </p>
                  {isCurrent && (
                    <>
                      <Pill tone="brand" className="mt-1">
                        You are here
                      </Pill>
                      <p className="mt-1.5 text-sm font-semibold text-slate-500">
                        {stage.description}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      {/* 4) What you do each week */}
      <section className="space-y-4">
        <h2 className="px-1 text-base font-extrabold text-slate-800">
          What you do each week
        </h2>
        <ActivityGroup label="At the clinic" activities={clinicActivities} />
        <ActivityGroup label="At home" activities={homeActivities} />
      </section>

      {/* 5) Staff shortcut (staff only) */}
      {isStaff && (
        <Link
          to="/staff"
          className="flex items-center gap-3 rounded-3xl border-2 border-slate-200 bg-white p-4 transition-colors hover:border-brand-400 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <IconChip icon="Stethoscope" size="h-10 w-10" />
          <span className="flex-1 text-base font-extrabold text-slate-700">
            Edit this plan (staff)
          </span>
          <ChevronRight className="h-5 w-5 text-slate-400" aria-hidden />
        </Link>
      )}
    </div>
  )
}
