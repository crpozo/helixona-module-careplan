import { useMemo } from 'react'
import { Flame } from 'lucide-react'
import { useApp, useDerived } from '@/store/store'
import { Card } from '@/components/Card'
import { Pill } from '@/components/Pill'
import { ProgressBar } from '@/components/ProgressBar'
import { ProgressRing } from '@/components/ProgressRing'
import { adherenceColor } from '@/lib/colors'
import { num, pct, plural } from '@/lib/format'

/**
 * Patient-facing progress: one big ring for this week, the streak,
 * and a simple week-by-week list. No charts, no tables.
 */
export function ProgressPage() {
  const { state } = useApp()
  const d = useDerived()

  const { actual, ordered } = d.currentAdherence

  // Most recent weeks first, capped so the list stays calm.
  const weeks = useMemo(
    () =>
      d.weekAdherences
        .filter((w) => w.weekNumber <= state.currentWeek)
        .sort((a, b) => b.weekNumber - a.weekNumber)
        .slice(0, 8),
    [d.weekAdherences, state.currentWeek],
  )

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* 1) Header */}
      <header className="animate-fade-up pt-2 text-center sm:text-left">
        <h1 className="text-3xl font-extrabold text-slate-800">Progress</h1>
        <p className="mt-1 text-base font-semibold text-slate-500">
          Look how far you've come.
        </p>
      </header>

      {/* 2) Hero: this week's ring */}
      <Card className="border-brand-200 bg-brand-50 p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <ProgressRing value={d.currentAdherence.pct} size={150} stroke={14}>
            <span className="text-4xl font-extrabold text-slate-800 tnum">
              {pct(d.currentAdherence.pct)}
            </span>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              this week
            </span>
          </ProgressRing>
          <div>
            <p className="text-base font-bold text-slate-500 tnum">
              {num(actual)} of {num(ordered)} done
            </p>
            <p className="mt-1 text-base font-extrabold text-brand-700 tnum">
              +{num(d.points.thisWeek)} points this week
            </p>
          </div>
        </div>
      </Card>

      {/* 3) Streak */}
      <Card>
        <div className="flex items-center gap-4">
          <Flame className="h-10 w-10 shrink-0 text-amber-500" />
          <div className="min-w-0">
            <p className="text-xl font-extrabold text-slate-800 tnum">
              {num(d.streak.current)} {plural(d.streak.current, 'week')} in a row
            </p>
            <p className="text-sm font-semibold text-slate-500 tnum">
              Best ever: {num(d.streak.best)}
            </p>
            {d.streak.atRisk && (
              <Pill tone="watch" className="mt-2">
                Log a bit more to keep your streak
              </Pill>
            )}
          </div>
        </div>
      </Card>

      {/* 4) Week by week */}
      <Card title="Week by week">
        <ul className="space-y-3">
          {weeks.map((w) => (
            <li key={w.weekNumber} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-sm font-extrabold text-slate-600 tnum">
                Week {w.weekNumber}
                {w.weekNumber === state.currentWeek && (
                  <Pill tone="brand" className="ml-1.5">
                    now
                  </Pill>
                )}
              </span>
              <ProgressBar
                value={w.pct}
                color={adherenceColor(w.pct)}
                className="flex-1"
              />
              <span className="w-12 text-right text-sm font-bold text-slate-500 tnum">
                {w.pct}%
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
