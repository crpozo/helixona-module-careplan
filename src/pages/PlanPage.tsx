import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { Activity, ActivityLocation } from '@/types'
import { useApp } from '@/store/store'
import { Card } from '@/components/Card'
import { Pill } from '@/components/Pill'
import { IconChip } from '@/components/IconChip'
import { ProgressBar } from '@/components/ProgressBar'
import {
  STAGES,
  STAGE_BY_KEY,
  stageProgress,
  PACING_BY_KEY,
  CATEGORY_META,
  LOCATION_LABEL,
} from '@/lib/plan'
import { formatDate, plural } from '@/lib/format'
import { getIcon } from '@/lib/icons'
import { cn } from '@/lib/cn'

export function PlanPage() {
  const { state } = useApp()
  const { plan, patient } = state

  const currentStage = STAGE_BY_KEY[plan.stage]
  const pacing = PACING_BY_KEY[plan.pacing]
  const PacingIcon = getIcon(pacing.icon)
  const progress = stageProgress(plan.stage)

  const grouped = useMemo(() => {
    const by: Record<ActivityLocation, Activity[]> = { in_office: [], at_home: [] }
    for (const a of plan.activities) by[a.location].push(a)
    return by
  }, [plan.activities])

  return (
    <div className="space-y-6">
      {/* Page hero — visible on mobile; desktop top bar already names the section. */}
      <header className="lg:hidden">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Plan of Care
        </p>
        <h1 className="text-lg font-bold text-ink-900">Your full plan</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Everything {patient.provider} mapped out for you.
        </p>
      </header>

      {/* 1) JOURNEY ----------------------------------------------------------- */}
      <Card
        title="Your care journey"
        subtitle={`Stage ${currentStage.order + 1} of ${STAGES.length} · ${currentStage.label}`}
      >
        {/* Horizontal stepper — scrollable on mobile. */}
        <div className="-mx-1 overflow-x-auto pb-1">
          <ol className="flex min-w-max items-start gap-1.5 px-1">
            {STAGES.map((stage, i) => {
              const isCurrent = stage.key === plan.stage
              const isDone = stage.order < currentStage.order
              const StageIcon = getIcon(stage.icon)
              return (
                <li key={stage.key} className="flex items-start">
                  <div className="flex w-16 flex-col items-center gap-1.5 text-center">
                    <span
                      className={cn(
                        'inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors',
                        isCurrent &&
                          'border-brand-500 bg-brand-500 text-ink-900 shadow-sm ring-4 ring-brand-100',
                        isDone && 'border-brand-200 bg-brand-100 text-brand-700',
                        !isCurrent && !isDone && 'border-slate-200 bg-white text-slate-300',
                      )}
                    >
                      <StageIcon className="h-5 w-5" />
                    </span>
                    <span
                      className={cn(
                        'text-[11px] font-semibold leading-tight',
                        isCurrent && 'text-ink-900',
                        isDone && 'text-brand-700',
                        !isCurrent && !isDone && 'text-slate-400',
                      )}
                    >
                      {stage.short}
                    </span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <span
                      className={cn(
                        'mt-5 h-0.5 w-4 rounded-full',
                        stage.order < currentStage.order ? 'bg-brand-300' : 'bg-slate-200',
                      )}
                      aria-hidden
                    />
                  )}
                </li>
              )
            })}
          </ol>
        </div>

        {/* Overall journey progress. */}
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500">Journey progress</span>
            <span className="tnum font-semibold text-ink-900">{progress}%</span>
          </div>
          <ProgressBar value={progress} />
        </div>

        {/* Current stage description. */}
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-brand-50 p-3.5">
          <IconChip icon={currentStage.icon} size="h-9 w-9" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900">
              You are here · {currentStage.label}
            </p>
            <p className="mt-0.5 text-sm text-slate-600">{currentStage.description}</p>
          </div>
        </div>
      </Card>

      {/* 2) PLAN META --------------------------------------------------------- */}
      <Card title="Plan details" subtitle="Set by your provider">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Pacing */}
          <div className="rounded-xl border border-slate-100 bg-white p-4">
            <p className="text-xs text-slate-400">Pacing</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                <PacingIcon className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-ink-900">{pacing.label}</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{pacing.description}</p>
          </div>

          {/* Provider + start date */}
          <div className="rounded-xl border border-slate-100 bg-white p-4">
            <p className="text-xs text-slate-400">Your provider</p>
            <p className="mt-1.5 text-sm font-semibold text-ink-900">{patient.provider}</p>
            <p className="mt-3 text-xs text-slate-400">Plan started</p>
            <p className="mt-1 tnum text-sm font-semibold text-ink-900">
              {formatDate(plan.startDate)}
            </p>
          </div>

          {/* Goal */}
          <div className="rounded-xl border border-slate-100 bg-white p-4">
            <p className="text-xs text-slate-400">Your goal</p>
            <p className="mt-1.5 text-sm font-medium leading-relaxed text-ink-900">
              {plan.goal}
            </p>
          </div>

          {/* Current focus */}
          <div className="rounded-xl border border-slate-100 bg-white p-4">
            <p className="text-xs text-slate-400">Current focus</p>
            <p className="mt-1.5 text-sm font-medium leading-relaxed text-ink-900">
              {plan.focus}
            </p>
          </div>
        </div>
      </Card>

      {/* 3) ACTIVITIES -------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ActivityGroup title={LOCATION_LABEL.in_office} activities={grouped.in_office} />
        <ActivityGroup title={LOCATION_LABEL.at_home} activities={grouped.at_home} />
      </div>

      {/* Footer note ---------------------------------------------------------- */}
      <Link
        to="/week"
        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-colors hover:border-brand-300"
      >
        <p className="text-sm text-slate-500">
          Your plan is set by{' '}
          <span className="font-semibold text-ink-900">{patient.provider}</span>. Tap{' '}
          <span className="font-semibold text-brand-700">This Week</span> to track it.
        </p>
        <ChevronRight className="h-5 w-5 shrink-0 text-brand-600" aria-hidden />
      </Link>
    </div>
  )
}

// --- Activity group card ------------------------------------------------------

function ActivityGroup({
  title,
  activities,
}: {
  title: string
  activities: Activity[]
}) {
  const subtitle = `${activities.length} ${plural(activities.length, 'activity', 'activities')}`
  return (
    <Card title={title} subtitle={subtitle} flush>
      {activities.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-slate-400">No activities in your {title.toLowerCase()} plan.</p>
      ) : (
        <ul>
          {activities.map((a, i) => (
            <ActivityRow
              key={a.id}
              activity={a}
              first={i === 0}
              last={i === activities.length - 1}
            />
          ))}
        </ul>
      )}
    </Card>
  )
}

function ActivityRow({
  activity,
  first,
  last,
}: {
  activity: Activity
  first: boolean
  last: boolean
}) {
  const meta = CATEGORY_META[activity.category]
  return (
    <li className={cn(!first && 'border-t border-slate-100')}>
      <Link
        to="/week"
        className={cn(
          'group flex items-start gap-3 px-5 py-4 transition-colors hover:bg-slate-50',
          last && 'pb-5',
        )}
      >
      <IconChip icon={activity.icon} size="h-10 w-10" iconClassName="h-5 w-5" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-ink-900">{activity.name}</span>
          <span className="text-xs text-slate-400">{meta.label}</span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Pill tone="brand">
            <span className="tnum">{activity.timesPerWeek}</span>x / week
          </Pill>
          {activity.durationMin != null && (
            <Pill tone="neutral">
              <span className="tnum">{activity.durationMin}</span> min
            </Pill>
          )}
          <Pill tone="neutral">
            <span className="tnum">{activity.points}</span> pts
          </Pill>
        </div>

        {activity.instructions && (
          <p className="mt-2 text-sm text-slate-600">{activity.instructions}</p>
        )}
      </div>
      <ChevronRight
        className="h-4 w-4 shrink-0 self-center text-slate-300 transition-colors group-hover:text-brand-500"
        aria-hidden
      />
      </Link>
    </li>
  )
}
