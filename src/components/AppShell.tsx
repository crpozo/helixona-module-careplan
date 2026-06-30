import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Coins, Menu, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { getIcon } from '@/lib/icons'
import { num } from '@/lib/format'
import { Logo } from '@/components/Logo'
import { Avatar } from '@/components/Avatar'
import { PATIENT_NAV, STAFF_NAV, ALL_NAV, type NavItem } from '@/components/nav'
import { useApp, useDerived } from '@/store/store'

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = getIcon(item.icon)
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
          isActive
            ? 'bg-brand-500 font-semibold text-ink-900'
            : 'text-slate-300 hover:bg-ink-700 hover:text-white',
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  )
}

function PointsChip() {
  const { points, level } = useDerived()
  const TierIcon = getIcon(level.icon)
  return (
    <NavLink
      to="/rewards"
      className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:border-brand-400"
      title={`${level.tier} tier`}
    >
      <Coins className="h-3.5 w-3.5" />
      <span className="tnum">{num(points.balance)}</span>
      <span className="hidden text-brand-600 sm:inline">pts</span>
      <span className="ml-1 hidden items-center gap-1 border-l border-brand-200 pl-2 text-brand-600 sm:inline-flex">
        <TierIcon className="h-3.5 w-3.5" />
        {level.tier}
      </span>
    </NavLink>
  )
}

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur safe-bottom lg:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        {PATIENT_NAV.map((item) => {
          const Icon = getIcon(item.icon)
          return (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors',
                    isActive ? 'text-brand-700' : 'text-slate-400',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                        isActive && 'bg-brand-100',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function AppShell() {
  const { state } = useApp()
  const { level } = useDerived()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Close on Escape while the menu is open.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const active =
    ALL_NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to) && n.to !== '/')) ??
    ALL_NAV[0]
  const TierIcon = getIcon(level.icon)

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-ink-900 p-4 lg:flex">
        <div className="px-2 py-2">
          <Logo dark />
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl bg-ink-800 p-3">
          <Avatar firstName={state.patient.firstName} lastName={state.patient.lastName} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {state.patient.firstName} {state.patient.lastName}
            </p>
            <p className="truncate text-[11px] text-slate-400">
              {state.patient.programLabel}
            </p>
          </div>
        </div>

        <nav className="mt-5 space-y-1">
          {PATIENT_NAV.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="my-4 border-t border-ink-700" />
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Clinic
        </p>
        <nav className="space-y-1">
          {STAFF_NAV.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="mt-auto rounded-xl border border-ink-700 p-3">
          <div className="flex items-center gap-2 text-brand-500">
            <TierIcon className="h-4 w-4" />
            <span className="text-xs font-semibold">{level.tier} tier</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {level.nextTier
              ? `${num(level.toNext)} pts to ${level.nextTier}`
              : 'Top tier reached'}
          </p>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-60">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-ink-900 transition-colors hover:border-brand-300 hover:text-brand-700"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Logo />
          </div>
          <PointsChip />
        </header>

        {/* Desktop header */}
        <header className="sticky top-0 z-20 hidden items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur lg:flex">
          <div>
            <h1 className="text-lg font-bold text-ink-900">{active.label}</h1>
            {active.subtitle && (
              <p className="text-xs text-slate-400">{active.subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <PointsChip />
            <Avatar
              firstName={state.patient.firstName}
              lastName={state.patient.lastName}
              size="h-9 w-9"
            />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-safe-nav lg:px-8 lg:py-7 lg:pb-10">
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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] animate-fade-up flex-col bg-ink-900 p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <Logo dark />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-ink-700 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-xl bg-ink-800 p-3">
              <Avatar firstName={state.patient.firstName} lastName={state.patient.lastName} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {state.patient.firstName} {state.patient.lastName}
                </p>
                <p className="truncate text-[11px] text-slate-400">
                  {state.patient.programLabel}
                </p>
              </div>
            </div>

            <nav className="mt-5 space-y-1">
              {PATIENT_NAV.map((item) => (
                <SidebarLink key={item.to} item={item} onNavigate={() => setMenuOpen(false)} />
              ))}
            </nav>

            <div className="my-4 border-t border-ink-700" />
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Clinic
            </p>
            <nav className="space-y-1">
              {STAFF_NAV.map((item) => (
                <SidebarLink key={item.to} item={item} onNavigate={() => setMenuOpen(false)} />
              ))}
            </nav>

            <div className="mt-auto rounded-xl border border-ink-700 p-3">
              <div className="flex items-center gap-2 text-brand-500">
                <TierIcon className="h-4 w-4" />
                <span className="text-xs font-semibold">{level.tier} tier</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {level.nextTier
                  ? `${num(level.toNext)} pts to ${level.nextTier}`
                  : 'Top tier reached'}
              </p>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
