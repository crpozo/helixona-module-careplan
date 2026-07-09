import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, PartyPopper, Sparkles, X } from 'lucide-react'
import { useApp } from '@/store/store'
import { LOCATION_LABEL } from '@/lib/plan'
import { clamp, num, plural } from '@/lib/format'
import { getIcon } from '@/lib/icons'
import { cn } from '@/lib/cn'
import { Button } from '@/components/Button'
import { Pill } from '@/components/Pill'
import { ProgressBar } from '@/components/ProgressBar'
import { ProgressDots } from '@/components/ProgressDots'

interface Step {
  id: string
  name: string
  icon: string
  location: 'in_office' | 'at_home'
  instructions?: string
  points: number
  ordered: number
  /** Completions already logged when the check-in started. */
  doneAtStart: number
}

/**
 * Duolingo-style guided check-in: one activity per screen, two big buttons.
 * The step list is snapshotted on mount so answering never reshuffles it.
 */
export function CheckinPage() {
  const { state, actions } = useApp()
  const navigate = useNavigate()

  const [steps] = useState<Step[]>(() => {
    const week = state.weeks.find((w) => w.weekNumber === state.currentWeek)
    return state.plan.activities
      .map((a) => ({
        id: a.id,
        name: a.name,
        icon: a.icon,
        location: a.location,
        instructions: a.instructions,
        points: a.points,
        ordered: a.timesPerWeek,
        doneAtStart: clamp(Math.round(week?.completions[a.id] ?? 0), 0, a.timesPerWeek),
      }))
      .filter((s) => s.doneAtStart < s.ordered)
  })

  const [idx, setIdx] = useState(0)
  const [earned, setEarned] = useState(0)
  const [didCount, setDidCount] = useState(0)
  // Points just gained on the current step (shows the green "+N" feedback).
  const [justDid, setJustDid] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => clearTimeout(timer.current), [])

  const finished = idx >= steps.length
  const step = steps[idx]

  function advance() {
    setJustDid(null)
    setIdx((i) => i + 1)
  }

  function onDidIt() {
    if (!step || justDid !== null) return
    actions.logCompletion(step.id, 1)
    setEarned((e) => e + step.points)
    setDidCount((c) => c + 1)
    setJustDid(step.points)
    timer.current = setTimeout(advance, 900)
  }

  // ---- Celebration / all-caught-up screen ---------------------------------
  if (finished) {
    const nothingToDo = steps.length === 0
    const restedInstead = !nothingToDo && didCount === 0
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
          <div
            className={cn(
              'flex h-32 w-32 animate-pop-in items-center justify-center rounded-[2.5rem]',
              restedInstead ? 'bg-brand-100 text-brand-700' : 'bg-brand-100 text-brand-700',
            )}
          >
            {restedInstead ? (
              <Sparkles className="h-16 w-16" />
            ) : (
              <PartyPopper className="h-16 w-16" />
            )}
          </div>
          <h1 className="mt-8 text-3xl font-extrabold text-slate-800">
            {nothingToDo
              ? 'All caught up!'
              : restedInstead
                ? "That's okay!"
                : `Great job, ${state.patient.firstName}!`}
          </h1>
          {earned > 0 && (
            <p className="mt-3 animate-pop-in text-2xl font-extrabold text-brand-700 tnum">
              +{num(earned)} points
            </p>
          )}
          <p className="mt-3 max-w-xs text-base font-semibold text-slate-500">
            {nothingToDo
              ? "You've finished everything in your plan for this week. Amazing!"
              : restedInstead
                ? 'Rest matters too. Your plan will be right here when you are ready.'
                : `You checked off ${num(didCount)} ${plural(didCount, 'activity', 'activities')}. Keep it up!`}
          </p>
        </main>
        <footer className="safe-bottom mx-auto w-full max-w-md px-6 pb-8">
          <Button
            variant="primary"
            size="xl"
            className="w-full"
            onClick={() => navigate('/')}
          >
            Continue
          </Button>
        </footer>
      </div>
    )
  }

  // ---- One activity per screen ---------------------------------------------
  const StepIcon = getIcon(step.icon)
  const dotsDone = step.doneAtStart + (justDid !== null ? 1 : 0)

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="mx-auto flex w-full max-w-xl items-center gap-3 px-4 pt-5">
        <Link
          to="/"
          aria-label="Exit check-in"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-6 w-6" />
        </Link>
        <ProgressBar value={(idx / steps.length) * 100} height={16} className="flex-1" />
      </header>

      <main
        key={step.id}
        className="mx-auto flex w-full max-w-xl flex-1 animate-fade-up flex-col items-center justify-center px-6 py-8 text-center"
      >
        <p className="text-sm font-extrabold uppercase tracking-wide text-slate-400 tnum">
          Step {idx + 1} of {steps.length}
        </p>

        <div className="relative mt-6">
          <div
            className={cn(
              'flex h-28 w-28 items-center justify-center rounded-[2rem] transition-colors',
              justDid !== null ? 'bg-brand-100 text-brand-700' : 'bg-brand-100 text-brand-700',
            )}
          >
            {justDid !== null ? (
              <Check className="h-14 w-14 animate-pop-in" strokeWidth={3} />
            ) : (
              <StepIcon className="h-14 w-14" />
            )}
          </div>
          {justDid !== null && justDid > 0 && (
            <span className="absolute -right-4 -top-2 animate-float-up text-xl font-extrabold text-brand-700 tnum">
              +{num(justDid)}
            </span>
          )}
        </div>

        <h1 className="mt-6 text-3xl font-extrabold text-slate-800">{step.name}</h1>
        <p className="mt-2 text-lg font-semibold text-slate-500">Did you do this today?</p>

        <div className="mt-5 flex flex-col items-center gap-3">
          <Pill tone={step.location === 'at_home' ? 'brand' : 'neutral'}>
            {LOCATION_LABEL[step.location]}
          </Pill>
          <div className="flex items-center gap-2">
            <ProgressDots total={step.ordered} done={dotsDone} />
            <span className="text-sm font-bold text-slate-400 tnum">this week</span>
          </div>
        </div>

        {step.instructions && (
          <p className="mt-6 max-w-sm text-sm font-semibold text-slate-400">
            {step.instructions}
          </p>
        )}
      </main>

      <footer className="safe-bottom mx-auto w-full max-w-xl space-y-3 px-6 pb-8">
        <Button
          variant="primary"
          size="xl"
          className="w-full"
          onClick={onDidIt}
          disabled={justDid !== null}
        >
          <Check className="h-6 w-6" strokeWidth={3} />
          I did it!
        </Button>
        <Button
          variant="secondary"
          size="xl"
          className="w-full"
          onClick={advance}
          disabled={justDid !== null}
        >
          Not yet
        </Button>
      </footer>
    </div>
  )
}
