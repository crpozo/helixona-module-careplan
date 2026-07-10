import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  MonitorSmartphone,
  Plus,
  Search,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react'
import type {
  Activity,
  ActivityCategory,
  ActivityLocation,
  PatientRecord,
  ProgramKey,
} from '@/types'
import { useApp } from '@/store/store'
import {
  CATEGORY_META,
  DEFAULT_ACTIVITY_ICON,
  LOCATION_LABEL,
  PACINGS,
  PROGRAM_LABEL,
  STAGES,
  STAGE_BY_KEY,
  slugId,
} from '@/lib/plan'
import { computeWeekAdherence } from '@/lib/gamification'
import { pct, plural } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'
import { IconChip } from '@/components/IconChip'
import { KpiCard } from '@/components/KpiCard'
import { Pill } from '@/components/Pill'

// Shared field styling — matches the Staff Entry forms.
const INPUT =
  'w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 ' +
  'placeholder:text-slate-400 focus:border-brand-400 focus:outline-none'

const LABEL = 'mb-1 block text-xs font-extrabold uppercase tracking-wide text-slate-500'

const PROGRAM_KEYS: ProgramKey[] = ['wellness', 'chronic', 'neuro']

// Compact program names so the roster row fits without scrolling.
const PROGRAM_SHORT: Record<ProgramKey, string> = {
  wellness: 'Wellness',
  chronic: 'Chronic',
  neuro: 'Neuro',
}
const CATEGORY_KEYS: ActivityCategory[] = [
  'treatment',
  'iv',
  'office_visit',
  'home',
  'supplement',
  'medication',
]
const LOCATION_KEYS: ActivityLocation[] = ['in_office', 'at_home']

/** Adherence for the record's current week (used in the roster table). */
function weekSnapshot(rec: PatientRecord) {
  const log = rec.weeks.find((w) => w.weekNumber === rec.currentWeek) ?? {
    weekNumber: rec.currentWeek,
    startDate: rec.plan.startDate,
    completions: {},
  }
  return computeWeekAdherence(rec.plan.activities, log, rec.adherenceTarget)
}

/**
 * "Patients" — the staff dashboard: the whole roster with full CRUD over each
 * patient's profile, plan settings and treatments.
 */
export function PatientsPage() {
  const { state } = useApp()
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const records = state.patients
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return records
    return records.filter((r) => {
      const p = r.patient
      return [
        `${p.firstName} ${p.lastName}`,
        p.ecwId ?? '',
        p.email ?? '',
        p.provider,
        PROGRAM_LABEL[p.program],
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [records, query])

  const selected = records.find((r) => r.patient.id === selectedId) ?? null

  const onTrack = records.filter((r) => {
    const snap = weekSnapshot(r)
    return snap.pct >= r.adherenceTarget
  }).length
  const orderedPerWeek = records.reduce(
    (sum, r) => sum + r.plan.activities.reduce((s, a) => s + a.timesPerWeek, 0),
    0,
  )

  return (
    <div className="space-y-5">
      {/* Page hero */}
      <header className="flex animate-fade-up flex-wrap items-end justify-between gap-3 pt-2">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-brand-700">
            Staff console
          </p>
          <h1 className="text-3xl font-extrabold text-slate-800">Patients</h1>
          <p className="mt-0.5 text-sm font-semibold text-slate-500">
            Add, edit and manage patients and their treatments.
          </p>
        </div>
        <Button variant="primary" onClick={() => setCreating((c) => !c)}>
          {creating ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {creating ? 'Cancel' : 'New patient'}
        </Button>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard icon="Users" label="Patients" value={records.length} />
        <KpiCard
          icon="Target"
          label="On track"
          value={`${onTrack}/${records.length}`}
          hint="At their adherence target this week"
        />
        <KpiCard
          icon="Zap"
          label="Ordered / week"
          value={orderedPerWeek}
          hint="Treatment slots across all plans"
        />
      </div>

      {/* New patient form */}
      {creating && (
        <NewPatientCard
          onCreated={(id) => {
            setCreating(false)
            setSelectedId(id)
          }}
        />
      )}

      {/* Roster */}
      <Card
        flush
        title="Patient roster"
        subtitle={`${filtered.length} of ${records.length} ${plural(records.length, 'patient', 'patients')} shown`}
        action={
          <label className="relative block w-full sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              aria-label="Search patients"
              placeholder="Search patients…"
              className={cn(INPUT, 'pl-9')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        }
      >
        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon="Users"
              title="No patients match"
              description="Try a different name, ECW ID or program — or add a new patient."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[660px] text-sm">
              <thead>
                <tr className="border-y-2 border-slate-100 text-left text-xs font-extrabold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-2.5">Patient</th>
                  <th className="px-2 py-2.5">ECW ID</th>
                  <th className="px-2 py-2.5">Program</th>
                  <th className="px-2 py-2.5">Stage</th>
                  <th className="px-2 py-2.5 text-right">Items</th>
                  <th className="px-2 py-2.5 text-right">Week</th>
                  <th className="px-4 py-2.5 text-right">
                    <span className="sr-only">Manage</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((rec) => (
                  <RosterRow
                    key={rec.patient.id}
                    record={rec}
                    live={rec.patient.id === state.activePatientId}
                    selected={rec.patient.id === selectedId}
                    onSelect={() =>
                      setSelectedId((id) => (id === rec.patient.id ? null : rec.patient.id))
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detail: profile + plan + treatments for the chosen patient */}
      {selected && (
        <PatientDetail
          key={selected.patient.id}
          record={selected}
          live={selected.patient.id === state.activePatientId}
          canDelete={records.length > 1}
          onDeleted={() => setSelectedId(null)}
        />
      )}
      {!selected && (
        <EmptyState
          icon="Users"
          title="Pick a patient to manage"
          description="Select a row above to edit their profile, plan settings and treatments."
        />
      )}
    </div>
  )
}

// --- Roster row ---------------------------------------------------------------

function RosterRow({
  record,
  live,
  selected,
  onSelect,
}: {
  record: PatientRecord
  live: boolean
  selected: boolean
  onSelect: () => void
}) {
  const { patient, plan } = record
  const snap = weekSnapshot(record)

  return (
    <tr
      onClick={onSelect}
      className={cn(
        'cursor-pointer align-middle transition-colors',
        selected ? 'bg-brand-50' : 'hover:bg-slate-50',
      )}
    >
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <Avatar firstName={patient.firstName} lastName={patient.lastName} size="h-9 w-9" />
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-extrabold text-slate-800">
              <span className="truncate">
                {patient.firstName} {patient.lastName}
              </span>
              {live && (
                <Pill tone="brand" className="shrink-0">
                  <MonitorSmartphone className="h-3 w-3" /> Live
                </Pill>
              )}
            </p>
            {patient.email && (
              <p className="truncate text-xs font-semibold text-slate-400">{patient.email}</p>
            )}
          </div>
        </div>
      </td>
      <td className="tnum whitespace-nowrap px-2 py-3 font-semibold text-slate-500">
        {patient.ecwId ?? '—'}
      </td>
      <td className="px-2 py-3">
        <Pill tone="neutral">{PROGRAM_SHORT[patient.program]}</Pill>
      </td>
      <td className="px-2 py-3 font-semibold text-slate-500">
        {STAGE_BY_KEY[plan.stage].short}
      </td>
      <td className="tnum px-2 py-3 text-right font-semibold text-slate-500">
        {plan.activities.length}
      </td>
      <td className="px-2 py-3 text-right">
        <Pill tone={snap.status}>
          <span className="tnum">{pct(snap.pct)}</span>
        </Pill>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          aria-expanded={selected}
          aria-label={`${selected ? 'Close' : 'Manage'} ${patient.firstName} ${patient.lastName}`}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 transition-all',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
            selected
              ? 'border-brand-400 bg-brand-100 text-brand-800'
              : 'border-slate-200 bg-white text-slate-400 hover:border-brand-400 hover:text-brand-800',
          )}
        >
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', selected && 'rotate-180')}
            strokeWidth={3}
          />
        </button>
      </td>
    </tr>
  )
}

// --- New patient --------------------------------------------------------------

const EMPTY_PATIENT_DRAFT = {
  firstName: '',
  lastName: '',
  ecwId: '',
  email: '',
  provider: 'Dr. Drannikov',
  program: 'wellness' as ProgramKey,
  startDate: new Date().toISOString().slice(0, 10),
}

function NewPatientCard({ onCreated }: { onCreated: (id: string) => void }) {
  const { actions } = useApp()
  const [draft, setDraft] = useState(EMPTY_PATIENT_DRAFT)

  const canCreate = draft.firstName.trim().length > 0 && draft.lastName.trim().length > 0

  function create() {
    if (!canCreate) return
    const id = `pt-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`
    const record: PatientRecord = {
      patient: {
        id,
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        program: draft.program,
        programLabel: PROGRAM_LABEL[draft.program],
        provider: draft.provider.trim() || '—',
        ecwId:
          draft.ecwId.trim() || `ECW-${Math.floor(10000 + Math.random() * 89999)}`,
        email: draft.email.trim() || undefined,
      },
      plan: {
        stage: 'identification',
        pacing: 'standard',
        startDate: draft.startDate,
        goal: '',
        focus: '',
        activities: [],
      },
      weeks: [{ weekNumber: 1, startDate: draft.startDate, completions: {} }],
      currentWeek: 1,
      redemptions: [],
      appointments: [],
      adherenceTarget: 80,
    }
    actions.addPatient(record)
    setDraft(EMPTY_PATIENT_DRAFT)
    onCreated(id)
  }

  return (
    <Card
      title="New patient"
      subtitle="Create the record, then add their treatments below."
      className="border-brand-200"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        <div className="col-span-1 sm:col-span-2">
          <label className={LABEL} htmlFor="np-first">
            First name
          </label>
          <input
            id="np-first"
            type="text"
            className={INPUT}
            placeholder="e.g. Ana"
            value={draft.firstName}
            onChange={(e) => setDraft((d) => ({ ...d, firstName: e.target.value }))}
          />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <label className={LABEL} htmlFor="np-last">
            Last name
          </label>
          <input
            id="np-last"
            type="text"
            className={INPUT}
            placeholder="e.g. Duarte"
            value={draft.lastName}
            onChange={(e) => setDraft((d) => ({ ...d, lastName: e.target.value }))}
          />
        </div>
        <div className="col-span-2 sm:col-span-2">
          <label className={LABEL} htmlFor="np-ecw">
            ECW ID <span className="normal-case text-slate-400">(blank = auto)</span>
          </label>
          <input
            id="np-ecw"
            type="text"
            className={cn(INPUT, 'tnum')}
            placeholder="ECW-00000"
            value={draft.ecwId}
            onChange={(e) => setDraft((d) => ({ ...d, ecwId: e.target.value }))}
          />
        </div>
        <div className="col-span-2 sm:col-span-2">
          <label className={LABEL} htmlFor="np-email">
            Email
          </label>
          <input
            id="np-email"
            type="email"
            className={INPUT}
            placeholder="name@example.com"
            value={draft.email}
            onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
          />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <label className={LABEL} htmlFor="np-program">
            Program
          </label>
          <select
            id="np-program"
            className={INPUT}
            value={draft.program}
            onChange={(e) =>
              setDraft((d) => ({ ...d, program: e.target.value as ProgramKey }))
            }
          >
            {PROGRAM_KEYS.map((p) => (
              <option key={p} value={p}>
                {PROGRAM_LABEL[p]}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-1 sm:col-span-1">
          <label className={LABEL} htmlFor="np-provider">
            Provider
          </label>
          <input
            id="np-provider"
            type="text"
            className={INPUT}
            value={draft.provider}
            onChange={(e) => setDraft((d) => ({ ...d, provider: e.target.value }))}
          />
        </div>
        <div className="col-span-1 sm:col-span-1">
          <label className={LABEL} htmlFor="np-start">
            Plan start
          </label>
          <input
            id="np-start"
            type="date"
            className={cn(INPUT, 'tnum')}
            value={draft.startDate}
            onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant="primary" onClick={create} disabled={!canCreate}>
          <UserPlus className="h-4 w-4" />
          Create patient
        </Button>
      </div>
    </Card>
  )
}

// --- Patient detail -------------------------------------------------------------

function PatientDetail({
  record,
  live,
  canDelete,
  onDeleted,
}: {
  record: PatientRecord
  live: boolean
  canDelete: boolean
  onDeleted: () => void
}) {
  const { actions } = useApp()
  const navigate = useNavigate()
  const { patient, plan } = record
  const id = patient.id

  return (
    <div className="space-y-5">
      {/* Profile + plan settings */}
      <Card
        title={`${patient.firstName} ${patient.lastName}`}
        subtitle="Profile, program and plan settings — saved as you edit."
        action={
          live ? (
            <Pill tone="brand">
              <MonitorSmartphone className="h-3 w-3" /> Live in app
            </Pill>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              title="Show this patient in the patient-facing app"
              onClick={() => actions.setActivePatient(id)}
            >
              <MonitorSmartphone className="h-4 w-4" />
              Set live
            </Button>
          )
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className={LABEL} htmlFor="pd-first">
                First name
              </label>
              <input
                id="pd-first"
                type="text"
                className={INPUT}
                value={patient.firstName}
                onChange={(e) => actions.updatePatient(id, { firstName: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="pd-last">
                Last name
              </label>
              <input
                id="pd-last"
                type="text"
                className={INPUT}
                value={patient.lastName}
                onChange={(e) => actions.updatePatient(id, { lastName: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="pd-ecw">
                ECW ID
              </label>
              <input
                id="pd-ecw"
                type="text"
                className={cn(INPUT, 'tnum')}
                value={patient.ecwId ?? ''}
                onChange={(e) =>
                  actions.updatePatient(id, { ecwId: e.target.value || undefined })
                }
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="pd-email">
                Email
              </label>
              <input
                id="pd-email"
                type="email"
                className={INPUT}
                value={patient.email ?? ''}
                onChange={(e) =>
                  actions.updatePatient(id, { email: e.target.value || undefined })
                }
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="pd-program">
                Program
              </label>
              <select
                id="pd-program"
                className={INPUT}
                value={patient.program}
                onChange={(e) => {
                  const program = e.target.value as ProgramKey
                  actions.updatePatient(id, {
                    program,
                    programLabel: PROGRAM_LABEL[program],
                  })
                }}
              >
                {PROGRAM_KEYS.map((p) => (
                  <option key={p} value={p}>
                    {PROGRAM_LABEL[p]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="pd-provider">
                Provider
              </label>
              <input
                id="pd-provider"
                type="text"
                className={INPUT}
                value={patient.provider}
                onChange={(e) => actions.updatePatient(id, { provider: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="pd-stage">
                Stage
              </label>
              <select
                id="pd-stage"
                className={INPUT}
                value={plan.stage}
                onChange={(e) => actions.setStage(e.target.value as typeof plan.stage, id)}
              >
                {STAGES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="pd-pacing">
                Pacing
              </label>
              <select
                id="pd-pacing"
                className={INPUT}
                value={plan.pacing}
                onChange={(e) => actions.setPacing(e.target.value as typeof plan.pacing, id)}
              >
                {PACINGS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="pd-start">
                Plan start
              </label>
              <input
                id="pd-start"
                type="date"
                className={cn(INPUT, 'tnum')}
                value={plan.startDate}
                onChange={(e) => actions.setPlanMeta({ startDate: e.target.value }, id)}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="pd-target">
                Target (%)
              </label>
              <input
                id="pd-target"
                type="number"
                min={10}
                max={100}
                step={5}
                className={cn(INPUT, 'tnum')}
                value={record.adherenceTarget}
                onChange={(e) => actions.setAdherenceTarget(Number(e.target.value), id)}
              />
            </div>
            <div className="col-span-2">
              <label className={LABEL} htmlFor="pd-focus">
                Current focus
              </label>
              <input
                id="pd-focus"
                type="text"
                className={INPUT}
                placeholder="What this stage is targeting…"
                value={plan.focus}
                onChange={(e) => actions.setPlanMeta({ focus: e.target.value }, id)}
              />
            </div>
          </div>

          <div>
            <label className={LABEL} htmlFor="pd-goal">
              Patient goal (in their words)
            </label>
            <textarea
              id="pd-goal"
              rows={2}
              className={cn(INPUT, 'resize-y')}
              placeholder="The patient's overarching goal…"
              value={plan.goal}
              onChange={(e) => actions.setPlanMeta({ goal: e.target.value }, id)}
            />
          </div>

          {/* Row actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-slate-100 pt-4">
            <Button
              variant="secondary"
              size="sm"
              title="Open Staff Entry with this patient selected"
              onClick={() => {
                actions.setActivePatient(id)
                navigate('/staff')
              }}
            >
              Open in Staff Entry
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
              disabled={!canDelete}
              title={canDelete ? undefined : 'The roster always keeps at least one patient'}
              onClick={() => {
                if (
                  window.confirm(
                    `Delete ${patient.firstName} ${patient.lastName} and all their data? This cannot be undone.`,
                  )
                ) {
                  actions.removePatient(id)
                  onDeleted()
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete patient
            </Button>
          </div>
        </div>
      </Card>

      {/* Treatments */}
      <TreatmentsCard record={record} />
    </div>
  )
}

// --- Treatments editor ----------------------------------------------------------

function TreatmentsCard({ record }: { record: PatientRecord }) {
  const { activities } = record.plan
  const patientId = record.patient.id

  return (
    <Card
      flush
      title="Treatments & activities"
      subtitle={`${activities.length} ${plural(activities.length, 'item', 'items')} on ${record.patient.firstName}'s plan`}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-y-2 border-slate-100 text-left text-xs font-extrabold uppercase tracking-wide text-slate-400">
              <th className="px-5 py-2.5">Treatment</th>
              <th className="px-3 py-2.5">Dose / timing</th>
              <th className="px-3 py-2.5 text-right">Times / wk</th>
              <th className="px-3 py-2.5 text-right">Points</th>
              <th className="px-5 py-2.5 text-right">Remove</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activities.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-8 text-center text-sm font-semibold text-slate-400"
                >
                  No treatments yet. Add the first one below.
                </td>
              </tr>
            ) : (
              activities.map((a) => (
                <TreatmentRow key={a.id} activity={a} patientId={patientId} />
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddTreatmentForm patientId={patientId} />
    </Card>
  )
}

function TreatmentRow({ activity, patientId }: { activity: Activity; patientId: string }) {
  const { actions } = useApp()

  return (
    <tr className="align-middle hover:bg-slate-50">
      <td className="px-5 py-2.5">
        <div className="flex items-center gap-2.5">
          <IconChip icon={activity.icon} size="h-8 w-8" iconClassName="h-4 w-4" />
          <div className="min-w-0">
            <p className="font-extrabold text-slate-800">{activity.name}</p>
            <p className="text-xs font-semibold text-slate-400">
              {CATEGORY_META[activity.category].label} ·{' '}
              {LOCATION_LABEL[activity.location]}
            </p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <input
          type="text"
          aria-label={`${activity.name} dose and timing`}
          placeholder="e.g. 400 mg · bed"
          className={cn(INPUT, 'w-40')}
          value={activity.dose ?? ''}
          onChange={(e) =>
            actions.upsertActivity(
              { ...activity, dose: e.target.value || undefined },
              patientId,
            )
          }
        />
      </td>
      <td className="px-3 py-2.5 text-right">
        <input
          type="number"
          min={0}
          max={21}
          aria-label={`${activity.name} times per week`}
          className={cn(INPUT, 'tnum w-16 text-right')}
          value={activity.timesPerWeek}
          onChange={(e) =>
            actions.upsertActivity(
              {
                ...activity,
                timesPerWeek: Math.max(0, Math.round(Number(e.target.value) || 0)),
              },
              patientId,
            )
          }
        />
      </td>
      <td className="px-3 py-2.5 text-right">
        <input
          type="number"
          min={0}
          aria-label={`${activity.name} points`}
          className={cn(INPUT, 'tnum w-16 text-right')}
          value={activity.points}
          onChange={(e) =>
            actions.upsertActivity(
              { ...activity, points: Math.max(0, Math.round(Number(e.target.value) || 0)) },
              patientId,
            )
          }
        />
      </td>
      <td className="px-5 py-2.5 text-right">
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-10 w-10 rounded-xl p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
          aria-label={`Remove ${activity.name}`}
          onClick={() => {
            if (window.confirm(`Remove "${activity.name}" from the plan?`)) {
              actions.removeActivity(activity.id, patientId)
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  )
}

const EMPTY_TREATMENT_DRAFT = {
  name: '',
  location: 'in_office' as ActivityLocation,
  category: 'treatment' as ActivityCategory,
  timesPerWeek: 1,
  points: 10,
  dose: '',
}

function AddTreatmentForm({ patientId }: { patientId: string }) {
  const { actions } = useApp()
  const [draft, setDraft] = useState(EMPTY_TREATMENT_DRAFT)

  const canAdd = draft.name.trim().length > 0

  function add() {
    if (!canAdd) return
    const activity: Activity = {
      id: slugId(draft.name),
      name: draft.name.trim(),
      category: draft.category,
      location: draft.location,
      timesPerWeek: Math.max(0, Math.round(draft.timesPerWeek) || 0),
      points: Math.max(0, Math.round(draft.points) || 0),
      dose: draft.dose.trim() || undefined,
      icon: DEFAULT_ACTIVITY_ICON[draft.category],
    }
    actions.upsertActivity(activity, patientId)
    setDraft(EMPTY_TREATMENT_DRAFT)
  }

  return (
    <div className="rounded-b-[22px] border-t-2 border-slate-100 bg-slate-50 p-5">
      <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-slate-500">
        Add treatment
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        <div className="col-span-2 sm:col-span-2">
          <label className={LABEL} htmlFor="tr-name">
            Name
          </label>
          <input
            id="tr-name"
            type="text"
            className={INPUT}
            placeholder="e.g. Lymphatic Massage"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') add()
            }}
          />
        </div>
        <div className="col-span-1">
          <label className={LABEL} htmlFor="tr-category">
            Category
          </label>
          <select
            id="tr-category"
            className={INPUT}
            value={draft.category}
            onChange={(e) =>
              setDraft((d) => ({ ...d, category: e.target.value as ActivityCategory }))
            }
          >
            {CATEGORY_KEYS.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_META[cat].label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-1">
          <label className={LABEL} htmlFor="tr-location">
            Location
          </label>
          <select
            id="tr-location"
            className={INPUT}
            value={draft.location}
            onChange={(e) =>
              setDraft((d) => ({ ...d, location: e.target.value as ActivityLocation }))
            }
          >
            {LOCATION_KEYS.map((loc) => (
              <option key={loc} value={loc}>
                {LOCATION_LABEL[loc]}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-1">
          <label className={LABEL} htmlFor="tr-times">
            Times / wk
          </label>
          <input
            id="tr-times"
            type="number"
            min={0}
            max={21}
            className={cn(INPUT, 'tnum')}
            value={draft.timesPerWeek}
            onChange={(e) => setDraft((d) => ({ ...d, timesPerWeek: Number(e.target.value) }))}
          />
        </div>
        <div className="col-span-1">
          <label className={LABEL} htmlFor="tr-points">
            Points
          </label>
          <input
            id="tr-points"
            type="number"
            min={0}
            className={cn(INPUT, 'tnum')}
            value={draft.points}
            onChange={(e) => setDraft((d) => ({ ...d, points: Number(e.target.value) }))}
          />
        </div>
        <div className="col-span-2 sm:col-span-2">
          <label className={LABEL} htmlFor="tr-dose">
            Dose / timing <span className="normal-case text-slate-400">(optional)</span>
          </label>
          <input
            id="tr-dose"
            type="text"
            className={INPUT}
            placeholder="e.g. 400 mg · before bed"
            value={draft.dose}
            onChange={(e) => setDraft((d) => ({ ...d, dose: e.target.value }))}
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button variant="primary" onClick={add} disabled={!canAdd}>
          <Plus className="h-4 w-4" />
          Add treatment
        </Button>
      </div>
    </div>
  )
}
