import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarCheck,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Repeat,
  X,
} from 'lucide-react'
import { useApp } from '@/store/store'
import type { Activity, Appointment } from '@/types'
import { downloadICS, googleCalendarUrl } from '@/lib/calendar'
import { formatDate, num, plural } from '@/lib/format'
import { getIcon } from '@/lib/icons'
import { cn } from '@/lib/cn'
import { Button } from '@/components/Button'
import { Pill } from '@/components/Pill'
import { ProgressBar } from '@/components/ProgressBar'

type Phase = 'service' | 'day' | 'time' | 'repeat' | 'confirm' | 'done'

const PHASE_ORDER: Phase[] = ['service', 'day', 'time', 'repeat', 'confirm']

const QUESTION: Record<Exclude<Phase, 'done'>, string> = {
  service: 'What would you like to book?',
  day: 'Pick a day',
  time: 'Pick a start time',
  repeat: 'Repeat this booking?',
  confirm: 'Everything look right?',
}

/** Bookable clinic slots (hour of day, local). */
const SLOT_HOURS = [9, 10, 11, 13, 14, 15, 16]

/** Weekly-repeat options offered on the repeat step. */
const REPEAT_OPTIONS = [1, 2, 3, 4, 6, 8]

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function hourLabel(h: number): string {
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h > 12 ? h - 12 : h
  return `${h12}:00 ${ampm}`
}

/** Local YYYY-MM-DD (toISOString would shift across the UTC boundary). */
function localIso(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** The next `count` clinic days (tomorrow onward, closed Sundays). */
function nextClinicDays(count: number): { iso: string; weekday: string; label: string }[] {
  const out: { iso: string; weekday: string; label: string }[] = []
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  while (out.length < count) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() === 0) continue
    out.push({
      iso: localIso(d),
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })
  }
  return out
}

/**
 * Guided in-app booking. Book one treatment or several at once ("select all &
 * book"): pick day → a start time (multiple line up back-to-back) → optionally
 * repeat weekly. Creates scheduled Appointments and offers a calendar export.
 */
export function BookingPage() {
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  const services = useMemo(
    () => state.plan.activities.filter((a) => a.location === 'in_office'),
    [state.plan.activities],
  )
  const days = useMemo(() => nextClinicDays(8), [])

  // A "Book" tap on a specific clinic therapy (Today) preselects it here.
  const preselectId = (location.state as { serviceId?: string } | null)?.serviceId
  const [phase, setPhase] = useState<Phase>('service')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() =>
    preselectId && services.some((s) => s.id === preselectId)
      ? new Set([preselectId])
      : new Set(),
  )
  const [day, setDay] = useState<(typeof days)[number] | null>(null)
  const [startHour, setStartHour] = useState<number | null>(null)
  const [repeatWeeks, setRepeatWeeks] = useState(1)
  const [booked, setBooked] = useState<Appointment[] | null>(null)

  const selectedServices = useMemo(
    () => services.filter((s) => selectedIds.has(s.id)),
    [services, selectedIds],
  )

  // Slots already taken by another scheduled visit that day (base week only).
  const takenHours = useMemo(() => {
    if (!day) return new Set<number>()
    return new Set(
      state.appointments
        .filter((a) => a.status === 'scheduled' && a.date.startsWith(day.iso))
        .map((a) => new Date(a.date).getHours()),
    )
  }, [state.appointments, day])

  const availableHours = useMemo(
    () => SLOT_HOURS.filter((h) => !takenHours.has(h)),
    [takenHours],
  )

  // Only offer start times that leave room for EVERY selected treatment, so a
  // "select all" can never silently drop the ones that wouldn't fit.
  const startableHours = useMemo(
    () =>
      availableHours.filter(
        (_, i) => i + Math.max(1, selectedServices.length) <= availableHours.length,
      ),
    [availableHours, selectedServices.length],
  )

  // Line the chosen treatments up in consecutive open slots from the start.
  const assigned = useMemo<{ service: Activity; hour: number }[]>(() => {
    if (startHour === null) return []
    const start = Math.max(0, availableHours.indexOf(startHour))
    return selectedServices
      .map((service, i) => ({ service, hour: availableHours[start + i] }))
      .filter((x): x is { service: Activity; hour: number } => x.hour !== undefined)
  }, [selectedServices, availableHours, startHour])

  // Every appointment this booking will create (treatments × repeat weeks).
  const planned = useMemo<Appointment[]>(() => {
    if (!day || assigned.length === 0) return []
    const base = `apt-${Date.now().toString(36)}`
    const seriesId = repeatWeeks > 1 ? `series-${base}` : undefined
    // A repeat week could land on a slot already booked in that later week;
    // skip any occurrence that exactly matches an existing scheduled visit.
    const taken = new Set(
      state.appointments.filter((a) => a.status === 'scheduled').map((a) => a.date),
    )
    const out: Appointment[] = []
    for (let w = 0; w < repeatWeeks; w++) {
      for (const { service, hour } of assigned) {
        const d = new Date(`${day.iso}T00:00:00`)
        d.setDate(d.getDate() + 7 * w)
        const date = `${localIso(d)}T${pad2(hour)}:00:00`
        if (taken.has(date)) continue
        out.push({
          id: `${base}-${w}-${service.id}`,
          activityId: service.id,
          title: service.name,
          date,
          provider: state.patient.provider,
          location: 'Helixona Clinic',
          status: 'scheduled',
          durationMin: service.durationMin,
          seriesId,
        })
      }
    }
    return out.sort((a, b) => a.date.localeCompare(b.date))
  }, [day, assigned, repeatWeeks, state.patient.provider, state.appointments])

  const stepIdx = PHASE_ORDER.indexOf(phase === 'done' ? 'confirm' : phase)

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelectedIds((prev) =>
      prev.size === services.length ? new Set() : new Set(services.map((s) => s.id)),
    )
  }

  function back() {
    if (phase === 'day') setPhase('service')
    else if (phase === 'time') setPhase('day')
    else if (phase === 'repeat') setPhase('time')
    else if (phase === 'confirm') setPhase('repeat')
  }

  function confirm() {
    if (planned.length === 0) return
    planned.forEach((a) => actions.upsertAppointment(a))
    setBooked(planned)
    setPhase('done')
  }

  // ---- Booked! ------------------------------------------------------------
  if (phase === 'done' && booked && booked.length > 0) {
    const first = booked[0]
    const many = booked.length > 1
    return (
      <div className="h-viewport flex flex-col bg-white">
        <main className="mx-auto flex w-full max-w-md min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-6 text-center">
          <div className="flex h-32 w-32 animate-pop-in items-center justify-center rounded-[2.5rem] bg-brand-100 text-brand-700">
            <CalendarCheck className="h-16 w-16" />
          </div>
          <h1 className="mt-8 text-3xl font-extrabold text-slate-800">You're booked!</h1>
          <p className="mt-3 text-lg font-extrabold text-brand-700">
            {many ? `${num(booked.length)} visits booked` : first.title}
          </p>
          <p className="mt-1 text-base font-bold text-slate-600 tnum">
            {formatDate(first.date, { weekday: 'short', month: 'short', day: 'numeric' })}
            {many ? ' onward' : ` · ${hourLabel(new Date(first.date).getHours())}`}
          </p>
          <p className="mt-3 max-w-xs text-sm font-semibold text-slate-500">
            With {first.provider} at {first.location}. You'll see{' '}
            {many ? 'them' : 'it'} on your Calendar and home screen.
          </p>
          <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => downloadICS(booked, 'helixona-visits.ics')}
            >
              <CalendarPlus className="h-5 w-5" />
              Add to my calendar
            </Button>
            {!many && (
              <a href={googleCalendarUrl(first)} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="w-full">
                  Add to Google Calendar
                </Button>
              </a>
            )}
          </div>
        </main>
        <footer className="safe-bottom mx-auto w-full max-w-md shrink-0 space-y-2 px-6 pb-6">
          <Button variant="primary" size="xl" className="w-full" onClick={() => navigate('/calendar')}>
            See my calendar
          </Button>
          <Button variant="ghost" size="lg" className="w-full" onClick={() => navigate('/')}>
            Back to home
          </Button>
        </footer>
      </div>
    )
  }

  const allSelected = services.length > 0 && selectedIds.size === services.length

  // ---- One question per screen ---------------------------------------------
  return (
    <div className="h-viewport flex flex-col bg-white">
      <header className="mx-auto flex w-full max-w-xl shrink-0 items-center gap-3 px-4 pt-4">
        {phase === 'service' ? (
          <Link
            to="/"
            aria-label="Exit booking"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-6 w-6" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={back}
            aria-label="Go back"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        <ProgressBar
          value={(stepIdx / PHASE_ORDER.length) * 100}
          height={16}
          color="#d6b981"
          className="flex-1"
        />
      </header>

      <main
        key={phase}
        className="mx-auto flex w-full max-w-xl min-h-0 flex-1 animate-fade-up flex-col overflow-y-auto px-4 py-6"
      >
        <p className="text-center text-sm font-extrabold uppercase tracking-wide text-slate-400 tnum">
          Step {stepIdx + 1} of {PHASE_ORDER.length}
        </p>
        <h1 className="mt-2 text-center text-2xl font-extrabold text-slate-800 sm:text-3xl">
          {QUESTION[phase === 'done' ? 'confirm' : phase]}
        </h1>

        {/* Step 1 — treatments (multi-select) */}
        {phase === 'service' && services.length === 0 && (
          <div className="mt-8 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <p className="text-base font-extrabold text-slate-800">
              No clinic treatments to book yet
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Your care team will add in-office treatments to your plan, or you can add your
              own in My Plan.
            </p>
            <Link to="/" className="mt-5 inline-block">
              <Button variant="secondary" size="lg">
                Back to home
              </Button>
            </Link>
          </div>
        )}
        {phase === 'service' && services.length > 0 && (
          <>
            <p className="mt-1 text-center text-sm font-bold text-slate-500">
              Pick one or several — book them together.
            </p>
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={toggleAll}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-600 transition-colors hover:border-brand-400 hover:text-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <Check className="h-4 w-4" strokeWidth={3} />
                {allSelected ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {services.map((a) => {
                const Icon = getIcon(a.icon)
                const on = selectedIds.has(a.id)
                return (
                  <button
                    key={a.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(a.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-3xl border-2 p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                      on
                        ? 'border-brand-400 bg-brand-50'
                        : 'border-slate-200 bg-white hover:border-brand-300',
                    )}
                  >
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-800">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-extrabold text-slate-800">
                        {a.name}
                      </span>
                      {a.durationMin && (
                        <span className="block text-xs font-semibold text-slate-400">
                          ≈{num(a.durationMin)} min
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-colors',
                        on ? 'border-brand-500 bg-brand-500 text-ink-800' : 'border-slate-300 bg-white',
                      )}
                    >
                      {on && <Check className="h-4 w-4" strokeWidth={3} />}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* Step 2 — day */}
        {phase === 'day' && (
          <>
            <p className="mt-1 text-center text-sm font-bold text-slate-500">
              for {selectedServices.length === 1 ? selectedServices[0].name : `${num(selectedServices.length)} treatments`}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {days.map((d) => (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => {
                    setDay(d)
                    setStartHour(null)
                    setPhase('time')
                  }}
                  className="flex flex-col items-center rounded-3xl border-2 border-slate-200 bg-white px-3 py-4 transition-colors hover:border-brand-400 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <span className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                    {d.weekday}
                  </span>
                  <span className="mt-0.5 text-lg font-extrabold text-slate-800 tnum">
                    {d.label}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 3 — start time */}
        {phase === 'time' && day && (
          <>
            <p className="mt-1 text-center text-sm font-bold text-slate-500 tnum">
              {day.weekday}, {day.label}
              {selectedServices.length > 1 && ' · we’ll line them up back-to-back'}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {startableHours.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    setStartHour(h)
                    setPhase('repeat')
                  }}
                  className="flex items-center justify-center gap-2 rounded-3xl border-2 border-slate-200 bg-white px-3 py-4 text-lg font-extrabold text-slate-800 tnum transition-colors hover:border-brand-400 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <Clock className="h-5 w-5 text-brand-600" />
                  {hourLabel(h)}
                </button>
              ))}
            </div>
            {startableHours.length === 0 && (
              <p className="mt-6 rounded-2xl border-2 border-dashed border-slate-200 px-4 py-6 text-center text-sm font-semibold text-slate-400">
                {availableHours.length === 0
                  ? 'No open times left that day — go back and pick another.'
                  : `Only ${num(availableHours.length)} open ${plural(availableHours.length, 'slot')} that day — go back and pick fewer treatments or another day.`}
              </p>
            )}
          </>
        )}

        {/* Step 4 — repeat */}
        {phase === 'repeat' && (
          <>
            <p className="mt-1 text-center text-sm font-bold text-slate-500">
              Book the same slot every week?
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {REPEAT_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setRepeatWeeks(n)
                    setPhase('confirm')
                  }}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-3xl border-2 px-3 py-4 text-base font-extrabold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    'border-slate-200 bg-white text-slate-800 hover:border-brand-400 hover:bg-brand-50',
                  )}
                >
                  {n === 1 ? (
                    'Just once'
                  ) : (
                    <>
                      <Repeat className="h-5 w-5 text-brand-600" />
                      {n} weeks
                    </>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 5 — confirm */}
        {phase === 'confirm' && day && (
          <div className="mt-6 space-y-3">
            <div className="rounded-3xl border-2 border-brand-200 bg-brand-50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-extrabold uppercase tracking-wide text-brand-700">
                  {num(planned.length)} {plural(planned.length, 'visit')}
                </p>
                {repeatWeeks > 1 && (
                  <Pill tone="brand">
                    <Repeat className="h-3.5 w-3.5" /> Weekly · {repeatWeeks} wks
                  </Pill>
                )}
              </div>
              <ul className="mt-3 space-y-2.5">
                {planned.slice(0, 6).map((a) => (
                  <li key={a.id} className="flex items-center gap-2.5 text-sm">
                    <CalendarCheck className="h-5 w-5 shrink-0 text-brand-700" />
                    <span className="min-w-0 flex-1 truncate font-extrabold text-slate-800">
                      {a.title}
                    </span>
                    <span className="shrink-0 font-bold text-slate-600 tnum">
                      {formatDate(a.date, { month: 'short', day: 'numeric' })} ·{' '}
                      {hourLabel(new Date(a.date).getHours())}
                    </span>
                  </li>
                ))}
                {planned.length > 6 && (
                  <li className="text-xs font-semibold text-slate-500">
                    + {num(planned.length - 6)} more…
                  </li>
                )}
              </ul>
              <div className="mt-4 flex items-center gap-2.5 border-t-2 border-brand-100 pt-3 text-sm">
                <MapPin className="h-5 w-5 shrink-0 text-brand-700" />
                <span className="font-bold text-slate-600">
                  Helixona Clinic · {state.patient.provider}
                </span>
              </div>
            </div>
            <div>
              <Pill tone="brand">No payment needed — part of your plan</Pill>
            </div>
          </div>
        )}
      </main>

      {phase === 'service' && services.length > 0 && (
        <footer className="safe-bottom mx-auto w-full max-w-xl shrink-0 px-6 pb-6">
          <Button
            variant="primary"
            size="xl"
            className="w-full"
            disabled={selectedIds.size === 0}
            onClick={() => setPhase('day')}
          >
            {selectedIds.size === 0
              ? 'Pick a treatment'
              : `Continue with ${num(selectedIds.size)} ${plural(selectedIds.size, 'treatment')}`}
            <ChevronRight className="h-5 w-5" />
          </Button>
        </footer>
      )}

      {phase === 'confirm' && (
        <footer className="safe-bottom mx-auto w-full max-w-xl shrink-0 space-y-3 px-6 pb-6">
          <Button
            variant="primary"
            size="xl"
            className="w-full"
            onClick={confirm}
            disabled={planned.length === 0}
          >
            <CalendarCheck className="h-6 w-6" />
            {planned.length > 1 ? `Book ${num(planned.length)} visits` : 'Book it'}
          </Button>
          <Button variant="secondary" size="xl" className="w-full" onClick={back}>
            Change something
          </Button>
        </footer>
      )}
    </div>
  )
}
