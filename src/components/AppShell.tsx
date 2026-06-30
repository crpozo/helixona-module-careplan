import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Coins, Menu, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { getIcon } from '@/lib/icons'
import { num } from '@/lib/format'
import { Logo } from '@/components/Logo'
import { Avatar } from '@/components/Avatar'
import { PATIENT_NAV, STAFF_NAV, type NavItem } from '@/components/nav'
import { useApp, useDerived } from '@/store/store'
import type { UserRole } from '@/types'

function HelixGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path
        d="M20 14c10 6 14 12 14 18s-4 12-14 18M44 14c-10 6-14 12-14 18s4 12 14 18"
        fill="none"
        stroke="#d6b981"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PointsChip() {
  const { points, level } = useDerived()
  const TierIcon = getIcon(level.icon)
  return (
    <NavLink
      to="/rewards"
      title={`${level.tier} tier`}
      className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-xs font-semibold text-brand-300 transition-colors hover:border-brand-500/60"
    >
      <Coins className="h-3.5 w-3.5" />
      <span className="tnum">{num(points.balance)}</span>
      <span className="hidden text-brand-400/80 sm:inline">pts</span>
      <span className="ml-1 hidden items-center gap-1 border-l border-brand-500/20 pl-2 text-brand-400 sm:inline-flex">
        <TierIcon className="h-3.5 w-3.5" />
        {level.tier}
      </span>
    </NavLink>
  )
}

/** Patient/Staff role switcher (demo: simulates the two distinct users). */
function RoleSwitch({
  role,
  onChange,
  className,
}: {
  role: UserRole
  onChange: (r: UserRole) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] p-0.5 text-xs font-semibold',
        className,
      )}
      role="group"
      aria-label="Switch user role"
    >
      {(['patient', 'staff'] as const).map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          aria-pressed={role === r}
          className={cn(
            'rounded-full px-3 py-1 transition-colors',
            role === r ? 'bg-brand-500 text-ink-900' : 'text-slate-400 hover:text-white',
          )}
        >
          {r === 'staff' ? 'Staff' : 'Patient'}
        </button>
      ))}
    </div>
  )
}

/** Icon-only nav button for the left rail. */
function RailIcon({ item }: { item: NavItem }) {
  const Icon = getIcon(item.icon)
  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={item.label}
      aria-label={item.label}
      className={({ isActive }) =>
        cn(
          'flex h-11 w-11 items-center justify-center rounded-2xl transition-colors',
          isActive
            ? 'bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/40'
            : 'text-slate-500 hover:bg-white/5 hover:text-white',
        )
      }
    >
      <Icon className="h-5 w-5" />
    </NavLink>
  )
}

/** Labelled pill nav item for the top bar. */
function TopPill({ item }: { item: NavItem }) {
  const Icon = getIcon(item.icon)
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-white/10 text-brand-300 ring-1 ring-white/10'
            : 'text-slate-400 hover:text-white',
        )
      }
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </NavLink>
  )
}

/** Full-width nav row used inside the mobile drawer. */
function DrawerLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const Icon = getIcon(item.icon)
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
          isActive
            ? 'bg-brand-500/15 font-semibold text-brand-300 ring-1 ring-brand-500/30'
            : 'text-slate-300 hover:bg-white/5 hover:text-white',
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  )
}

export function AppShell() {
  const { state, actions } = useApp()
  const { level } = useDerived()
  const isStaff = state.role === 'staff'
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const TierIcon = getIcon(level.icon)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <div className="app-bg relative min-h-screen">
      {/* Desktop left icon rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[76px] flex-col items-center gap-2 border-r border-white/5 bg-black/40 py-5 backdrop-blur lg:flex">
        <NavLink
          to="/"
          aria-label="Helixona home"
          className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 ring-1 ring-brand-500/30"
        >
          <HelixGlyph className="h-5 w-5" />
        </NavLink>
        <nav className="flex flex-1 flex-col items-center gap-2">
          {PATIENT_NAV.map((item) => (
            <RailIcon key={item.to} item={item} />
          ))}
        </nav>
        {isStaff && (
          <nav className="flex flex-col items-center gap-2 border-t border-white/5 pt-3">
            {STAFF_NAV.map((item) => (
              <RailIcon key={item.to} item={item} />
            ))}
          </nav>
        )}
      </aside>

      {/* Main column */}
      <div className="relative z-10 flex min-h-screen flex-col lg:pl-[76px]">
        {/* Top header */}
        <header className="sticky top-0 z-20 border-b border-white/5 bg-black/40 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 lg:px-8">
            {/* Mobile: hamburger + logo */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition-colors hover:border-brand-500/40 hover:text-brand-300 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="lg:hidden">
              <Logo />
            </div>

            {/* Desktop: pill nav */}
            <nav className="hidden items-center gap-1 rounded-full border border-white/5 bg-white/[0.03] p-1 lg:flex">
              {PATIENT_NAV.map((item) => (
                <TopPill key={item.to} item={item} />
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-2.5">
              <RoleSwitch
                role={state.role}
                onChange={actions.setRole}
                className="hidden md:inline-flex"
              />
              <PointsChip />
              <Avatar
                firstName={state.patient.firstName}
                lastName={state.patient.lastName}
                size="h-9 w-9"
              />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile slide-in menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] animate-fade-up flex-col border-r border-white/10 bg-[#0c0c0e] p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <Avatar firstName={state.patient.firstName} lastName={state.patient.lastName} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {state.patient.firstName} {state.patient.lastName}
                </p>
                <p className="truncate text-[11px] text-slate-400">{state.patient.programLabel}</p>
              </div>
            </div>

            <div className="mt-5">
              <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Viewing as
              </p>
              <RoleSwitch role={state.role} onChange={actions.setRole} className="w-full justify-center" />
            </div>

            <nav className="mt-5 space-y-1">
              {PATIENT_NAV.map((item) => (
                <DrawerLink key={item.to} item={item} onNavigate={() => setMenuOpen(false)} />
              ))}
            </nav>

            {isStaff && (
              <>
                <div className="my-4 border-t border-white/5" />
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Clinic
                </p>
                <nav className="space-y-1">
                  {STAFF_NAV.map((item) => (
                    <DrawerLink key={item.to} item={item} onNavigate={() => setMenuOpen(false)} />
                  ))}
                </nav>
              </>
            )}

            <div className="mt-auto rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <div className="flex items-center gap-2 text-brand-300">
                <TierIcon className="h-4 w-4" />
                <span className="text-xs font-semibold">{level.tier} tier</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {level.nextTier ? `${num(level.toNext)} pts to ${level.nextTier}` : 'Top tier reached'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
