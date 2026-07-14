import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Download,
  MapPin,
  Plus,
  Trash2,
} from 'lucide-react'
import type { Appointment } from '@/types'
import { useApp } from '@/store/store'
import { WEEKDAY_LABELS, weekdayIndex } from '@/lib/schedule'
import { appointmentMinutes, downloadICS, googleCalendarUrl, icsFilename } from '@/lib/calendar'
import { formatDate, num, plural } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Pill } from '@/components/Pill'
import { IconChip } from '@/components/IconChip'
import { EmptyState } from '@/components/EmptyState'

/** Local YYYY-MM-DD key for grouping appointments by day. */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function hourLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/** One appointment card with its export + cancel controls. */
function AppointmentRow({
  appt,
  iconName,
  onCancel,
}: {
  appt: Appointment
  iconName: string
  onCancel: () => void
}) {
  const past = new Date(appt.date).getTime() < Date.now()
  const tone: 'bad' | 'neutral' | 'brand' =
    appt.status === 'missed' ? 'bad' : past || appt.status === 'completed' ? 'neutral' : 'brand'
  return (
    <div
      className={cn(
        'rounded-3xl border-2 p-4',
        past ? 'border-slate-200 bg-slate-50' : 'border-brand-200 bg-white',
      )}
    >
      <div className="flex items-center gap-3">
        <IconChip icon={iconName} size="h-11 w-11" iconClassName="h-5 w-5" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-slate-800">{appt.title}</p>
          <p className="truncate text-xs font-semibold text-slate-500">
            {formatDate(appt.date, { weekday: 'short', month: 'short', day: 'numeric' })} ·{' '}
            {hourLabel(appt.date)} · {num(appointmentMinutes(appt))} min
          </p>
        </div>
        <Pill tone={tone} className="shrink-0 capitalize">
          {appt.status === 'scheduled' && past ? 'past' : appt.status}
        </Pill>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="truncate">
          {appt.location} · {appt.provider}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => downloadICS([appt], icsFilename(appt))}
        >
          <CalendarPlus className="h-4 w-4" />
          Add to calendar
        </Button>
        <a href={googleCalendarUrl(appt)} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm">
            Google
          </Button>
        </a>
        {appt.status === 'scheduled' && !past && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-rose-500 hover:bg-rose-50 hover:text-rose-600"
            onClick={onCancel}
          >
            <Trash2 className="h-4 w-4" />
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * "Calendar" — every booked visit in one place: a month grid you can page
 * through (Google-Calendar style), the selected day's visits, and everything
 * upcoming, each exportable to a personal calendar.
 */
export function CalendarPage() {
  const { state, actions } = useApp()

  const today = useMemo(() => new Date(), [])
  const [monthOffset, setMonthOffset] = useState(0)
  const [selected, setSelected] = useState<Date>(today)

  const iconFor = (appt: Appointment): string =>
    (appt.activityId && state.plan.activities.find((a) => a.id === appt.activityId)?.icon) ||
    'CalendarCheck'

  // Group appointments by local day for quick per-cell lookups.
  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const a of state.appointments) {
      const key = dayKey(new Date(a.date))
      const list = map.get(key) ?? []
      list.push(a)
      map.set(key, list)
    }
    for (const list of map.values()) list.sort((a, b) => a.date.localeCompare(b.date))
    return map
  }, [state.appointments])

  const monthBase = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + monthOffset, 1),
    [today, monthOffset],
  )

  const monthCells = useMemo(() => {
    const lead = weekdayIndex(monthBase)
    const daysInMonth = new Date(monthBase.getFullYear(), monthBase.getMonth() + 1, 0).getDate()
    const cells: (Date | null)[] = Array.from({ length: lead }, () => null)
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(monthBase.getFullYear(), monthBase.getMonth(), day))
    }
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [monthBase])

  const selectedAppts = byDay.get(dayKey(selected)) ?? []

  const upcoming = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    return [...state.appointments]
      .filter((a) => a.status === 'scheduled' && new Date(a.date).getTime() >= start.getTime())
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [state.appointments])

  function cancel(appt: Appointment) {
    if (window.confirm(`Cancel "${appt.title}" on ${formatDate(appt.date)}?`)) {
      actions.removeAppointment(appt.id)
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-5">
      {/* Header */}
      <header className="flex items-end justify-between gap-3 pt-2">
        <div className="animate-fade-up">
          <h1 className="text-3xl font-extrabold text-slate-800">Calendar</h1>
          <p className="mt-1 text-base font-semibold text-slate-500">All your booked visits.</p>
        </div>
        <Link to="/book" className="shrink-0">
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4" />
            Book
          </Button>
        </Link>
      </header>

      {/* Month grid */}
      <Card>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonthOffset((m) => m - 1)}
            aria-label="Previous month"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className="text-base font-extrabold text-slate-800">
            {monthBase.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
          <button
            type="button"
            onClick={() => setMonthOffset((m) => m + 1)}
            aria-label="Next month"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center">
          {WEEKDAY_LABELS.map((w) => (
            <span key={w} className="text-[10px] font-extrabold uppercase text-slate-400">
              {w}
            </span>
          ))}
          {monthCells.map((cell, i) => {
            if (cell === null) return <span key={i} />
            const appts = byDay.get(dayKey(cell)) ?? []
            const isToday = sameDay(cell, today)
            const isSelected = sameDay(cell, selected)
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(cell)}
                aria-pressed={isSelected}
                aria-label={`${cell.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}, ${appts.length} ${plural(appts.length, 'visit')}`}
                className={cn(
                  'flex min-h-[2.75rem] flex-col items-center rounded-xl border-2 py-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  isSelected
                    ? 'border-brand-400 bg-brand-50'
                    : 'border-transparent hover:bg-slate-50',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-sm font-extrabold tnum',
                    isToday ? 'bg-brand-500 text-ink-800' : 'text-slate-700',
                  )}
                >
                  {cell.getDate()}
                </span>
                <span className="mt-1 flex h-1.5 items-center gap-0.5">
                  {appts.slice(0, 3).map((a) => (
                    <span
                      key={a.id}
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        a.status === 'missed'
                          ? 'bg-rose-400'
                          : new Date(a.date).getTime() < Date.now()
                            ? 'bg-slate-300'
                            : 'bg-brand-500',
                      )}
                    />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-center text-xs font-semibold text-slate-400">
          Tap a day to see its visits. Each dot is one booking.
        </p>
      </Card>

      {/* Selected day's visits */}
      <section className="space-y-3">
        <h2 className="px-1 text-base font-extrabold text-slate-800">
          {sameDay(selected, today)
            ? 'Today'
            : selected.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
        </h2>
        {selectedAppts.length === 0 ? (
          <div className="flex items-center gap-3 rounded-3xl border-2 border-dashed border-slate-200 bg-white p-4">
            <IconChip icon="CalendarCheck" size="h-10 w-10" iconClassName="h-5 w-5" />
            <p className="flex-1 text-sm font-semibold text-slate-500">
              No visits booked this day.
            </p>
            <Link to="/book" className="shrink-0">
              <Button variant="secondary" size="sm">
                Book
              </Button>
            </Link>
          </div>
        ) : (
          selectedAppts.map((a) => (
            <AppointmentRow
              key={a.id}
              appt={a}
              iconName={iconFor(a)}
              onCancel={() => cancel(a)}
            />
          ))
        )}
      </section>

      {/* Everything upcoming */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-extrabold text-slate-800">Upcoming</h2>
          {upcoming.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadICS(upcoming, 'helixona-visits.ics')}
            >
              <Download className="h-4 w-4" />
              Export all
            </Button>
          )}
        </div>
        {upcoming.length === 0 ? (
          <EmptyState
            icon="CalendarCheck"
            title="No upcoming visits"
            description="Book your next treatment in under a minute."
          >
            <Link to="/book">
              <Button variant="primary">
                <Plus className="h-4 w-4" />
                Book a visit
              </Button>
            </Link>
          </EmptyState>
        ) : (
          upcoming.map((a) => (
            <AppointmentRow
              key={a.id}
              appt={a}
              iconName={iconFor(a)}
              onCancel={() => cancel(a)}
            />
          ))
        )}
      </section>
    </div>
  )
}
