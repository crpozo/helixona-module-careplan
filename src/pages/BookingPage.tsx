import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarCheck, ChevronLeft, ChevronRight, Clock, MapPin, X } from 'lucide-react'
import { useApp } from '@/store/store'
import type { Activity, Appointment } from '@/types'
import { formatDate, num } from '@/lib/format'
import { getIcon } from '@/lib/icons'
import { Button } from '@/components/Button'
import { IconChip } from '@/components/IconChip'
import { Pill } from '@/components/Pill'
import { ProgressBar } from '@/components/ProgressBar'

type Phase = 'service' | 'day' | 'time' | 'confirm' | 'done'

const PHASE_ORDER: Phase[] = ['service', 'day', 'time', 'confirm']

const QUESTION: Record<Exclude<Phase, 'done'>, string> = {
  service: 'What would you like to book?',
  day: 'Pick a day',
  time: 'Pick a time',
  confirm: 'Everything look right?',
}

/** Bookable clinic slots (hour of day, local). */
const SLOT_HOURS = [9, 10, 11, 13, 14, 15, 16]

function hourLabel(h: number): string {
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h > 12 ? h - 12 : h
  return `${h12}:00 ${ampm}`
}

/** Local YYYY-MM-DD (toISOString would shift across the UTC boundary). */
function localIso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
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
 * Guided in-app booking: one question per screen (treatment → day → time),
 * then a confirmation. Creates a scheduled Appointment in the plan.
 */
export function BookingPage() {
  const { state, actions } = useApp()
  const navigate = useNavigate()

  const services = useMemo(
    () => state.plan.activities.filter((a) => a.location === 'in_office'),
    [state.plan.activities],
  )
  const days = useMemo(() => nextClinicDays(8), [])

  const [phase, setPhase] = useState<Phase>('service')
  const [service, setService] = useState<Activity | null>(null)
  const [day, setDay] = useState<(typeof days)[number] | null>(null)
  const [hour, setHour] = useState<number | null>(null)
  const [booked, setBooked] = useState<Appointment | null>(null)

  // Hide slots already taken by another scheduled visit that day.
  const takenHours = useMemo(() => {
    if (!day) return new Set<number>()
    return new Set(
      state.appointments
        .filter((a) => a.status === 'scheduled' && a.date.startsWith(day.iso))
        .map((a) => new Date(a.date).getHours()),
    )
  }, [state.appointments, day])

  const stepIdx = PHASE_ORDER.indexOf(phase === 'done' ? 'confirm' : phase)

  function back() {
    if (phase === 'day') setPhase('service')
    else if (phase === 'time') setPhase('day')
    else if (phase === 'confirm') setPhase('time')
  }

  function confirm() {
    if (!service || !day || hour === null) return
    const appointment: Appointment = {
      id: `apt-${Date.now().toString(36)}`,
      activityId: service.id,
      title: service.name,
      date: `${day.iso}T${String(hour).padStart(2, '0')}:00:00`,
      provider: state.patient.provider,
      location: 'Helixona Clinic',
      status: 'scheduled',
    }
    actions.upsertAppointment(appointment)
    setBooked(appointment)
    setPhase('done')
  }

  // ---- Booked! ------------------------------------------------------------
  if (phase === 'done' && booked && service && day && hour !== null) {
    return (
      <div className="h-viewport flex flex-col bg-white">
        <main className="mx-auto flex w-full max-w-md min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-6 text-center">
          <div className="flex h-32 w-32 animate-pop-in items-center justify-center rounded-[2.5rem] bg-brand-100 text-brand-700">
            <CalendarCheck className="h-16 w-16" />
          </div>
          <h1 className="mt-8 text-3xl font-extrabold text-slate-800">You're booked!</h1>
          <p className="mt-3 text-lg font-extrabold text-brand-700">
            {booked.title}
          </p>
          <p className="mt-1 text-base font-bold text-slate-600 tnum">
            {day.weekday}, {day.label} · {hourLabel(hour)}
          </p>
          <p className="mt-3 max-w-xs text-sm font-semibold text-slate-500">
            With {booked.provider} at {booked.location}. You'll see it on your home screen.
          </p>
        </main>
        <footer className="safe-bottom mx-auto w-full max-w-md shrink-0 px-6 pb-6">
          <Button variant="primary" size="xl" className="w-full" onClick={() => navigate('/')}>
            Continue
          </Button>
        </footer>
      </div>
    )
  }

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

        {/* Step 1 — treatment */}
        {phase === 'service' && (
          <div className="mt-6 space-y-3">
            {services.map((a) => {
              const Icon = getIcon(a.icon)
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setService(a)
                    setPhase('day')
                  }}
                  className="flex w-full items-center gap-3 rounded-3xl border-2 border-slate-200 bg-white p-4 text-left transition-colors hover:border-brand-400 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
                </button>
              )
            })}
          </div>
        )}

        {/* Step 2 — day */}
        {phase === 'day' && service && (
          <>
            <p className="mt-1 text-center text-sm font-bold text-slate-500">
              for your {service.name}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {days.map((d) => (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => {
                    setDay(d)
                    setHour(null)
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

        {/* Step 3 — time */}
        {phase === 'time' && service && day && (
          <>
            <p className="mt-1 text-center text-sm font-bold text-slate-500 tnum">
              {service.name} · {day.weekday}, {day.label}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {SLOT_HOURS.filter((h) => !takenHours.has(h)).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    setHour(h)
                    setPhase('confirm')
                  }}
                  className="flex items-center justify-center gap-2 rounded-3xl border-2 border-slate-200 bg-white px-3 py-4 text-lg font-extrabold text-slate-800 tnum transition-colors hover:border-brand-400 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <Clock className="h-5 w-5 text-brand-600" />
                  {hourLabel(h)}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 4 — confirm */}
        {phase === 'confirm' && service && day && hour !== null && (
          <div className="mt-6 rounded-3xl border-2 border-brand-200 bg-brand-50 p-5">
            <div className="flex items-center gap-3">
              <IconChip icon={service.icon} size="h-14 w-14" iconClassName="h-7 w-7" />
              <div className="min-w-0">
                <p className="text-lg font-extrabold text-slate-800">{service.name}</p>
                {service.durationMin && (
                  <p className="text-sm font-semibold text-slate-500">
                    ≈{num(service.durationMin)} min
                  </p>
                )}
              </div>
            </div>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex items-center gap-2.5">
                <CalendarCheck className="h-5 w-5 shrink-0 text-brand-700" />
                <dd className="font-extrabold text-slate-800 tnum">
                  {day.weekday}, {formatDate(day.iso)}
                </dd>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="h-5 w-5 shrink-0 text-brand-700" />
                <dd className="font-extrabold text-slate-800 tnum">{hourLabel(hour)}</dd>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="h-5 w-5 shrink-0 text-brand-700" />
                <dd className="font-bold text-slate-600">
                  Helixona Clinic · {state.patient.provider}
                </dd>
              </div>
            </dl>
            <div className="mt-3">
              <Pill tone="brand">No payment needed — part of your plan</Pill>
            </div>
          </div>
        )}
      </main>

      {phase === 'confirm' && (
        <footer className="safe-bottom mx-auto w-full max-w-xl shrink-0 space-y-3 px-6 pb-6">
          <Button variant="primary" size="xl" className="w-full" onClick={confirm}>
            <CalendarCheck className="h-6 w-6" />
            Book it
          </Button>
          <Button variant="secondary" size="xl" className="w-full" onClick={back}>
            Change something
          </Button>
        </footer>
      )}
    </div>
  )
}
