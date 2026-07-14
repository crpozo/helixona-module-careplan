// ---------------------------------------------------------------------------
// Personal-calendar export.
// ---------------------------------------------------------------------------
// Patients want their booked visits in Apple/Google/Outlook. We build a plain
// .ics file (works everywhere) and offer a Google Calendar "add event" link as
// a one-tap alternative. Appointment times are clinic-local wall-clock strings
// (e.g. "2026-07-01T10:00:00"); the .ics keeps them as floating local time so
// they land at the same hour on the patient's calendar.
// ---------------------------------------------------------------------------

import type { Appointment } from '@/types'

const DEFAULT_MINUTES = 60

/** Minutes for an appointment, falling back to a sensible default. */
export function appointmentMinutes(a: Appointment): number {
  return a.durationMin && a.durationMin > 0 ? a.durationMin : DEFAULT_MINUTES
}

/** Pad to 2 digits. */
function p2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Floating local stamp: YYYYMMDDTHHMMSS (no timezone). */
function floatingStamp(d: Date): string {
  return (
    `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}` +
    `T${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`
  )
}

/** UTC stamp with trailing Z — used for DTSTAMP and Google's date params. */
function utcStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${p2(d.getUTCMonth() + 1)}${p2(d.getUTCDate())}` +
    `T${p2(d.getUTCHours())}${p2(d.getUTCMinutes())}${p2(d.getUTCSeconds())}Z`
  )
}

/** Escape a value for an ICS text field (RFC 5545 §3.3.11). */
function esc(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

function endDate(a: Appointment): Date {
  const start = new Date(a.date)
  return new Date(start.getTime() + appointmentMinutes(a) * 60_000)
}

function describe(a: Appointment): string {
  const parts = [`With ${a.provider}`]
  if (a.notes) parts.push(a.notes)
  parts.push('Booked through the Helixona Care Plan app.')
  return parts.join('\n')
}

/** One VEVENT block. `stamp` is a shared DTSTAMP for the whole file. */
function toVEvent(a: Appointment, stamp: string): string {
  const start = new Date(a.date)
  return [
    'BEGIN:VEVENT',
    `UID:${a.id}@helixona`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${floatingStamp(start)}`,
    `DTEND:${floatingStamp(endDate(a))}`,
    `SUMMARY:${esc(a.title)}`,
    `LOCATION:${esc(a.location)}`,
    `DESCRIPTION:${esc(describe(a))}`,
    'END:VEVENT',
  ].join('\r\n')
}

/** Build a full VCALENDAR string for one or more appointments. */
export function toICS(appointments: Appointment[], calName = 'Helixona Care Plan'): string {
  // A single shared timestamp keeps the file deterministic within one export.
  const stamp = utcStamp(new Date())
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Helixona//Care Plan//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${esc(calName)}`,
    ...appointments.map((a) => toVEvent(a, stamp)),
    'END:VCALENDAR',
  ].join('\r\n')
}

/** Trigger a download of the given appointments as an .ics file. */
export function downloadICS(appointments: Appointment[], filename = 'helixona.ics'): void {
  if (appointments.length === 0) return
  const blob = new Blob([toICS(appointments)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Give the click a tick before releasing the object URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** A "add to Google Calendar" URL for a single appointment. */
export function googleCalendarUrl(a: Appointment): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: a.title,
    dates: `${utcStamp(new Date(a.date))}/${utcStamp(endDate(a))}`,
    location: a.location,
    details: describe(a),
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** A safe-ish filename slug for an appointment's .ics download. */
export function icsFilename(a: Appointment): string {
  const slug =
    a.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'visit'
  return `helixona-${slug}.ics`
}
