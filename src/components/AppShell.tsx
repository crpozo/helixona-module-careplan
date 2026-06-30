import { NavLink, Outlet } from 'react-router-dom'
import { Coins, Stethoscope } from 'lucide-react'
import { cn } from '@/lib/cn'
import { getIcon } from '@/lib/icons'
import { num } from '@/lib/format'
import { Logo } from '@/components/Logo'
import { Avatar } from '@/components/Avatar'
import { PATIENT_NAV } from '@/components/nav'
import { useApp, useDerived } from '@/store/store'

function PointsChip() {
  const { points, level } = useDerived()
  const TierIcon = getIcon(level.icon)
  return (
    <NavLink
      to="/rewards"
      className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:border-brand-400"
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
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-3 safe-bottom">
      <div className="pointer-events-auto mx-auto flex max-w-md items-stretch justify-between gap-1 rounded-full border border-slate-200 bg-white/90 p-1.5 shadow-warm backdrop-blur">
        {PATIENT_NAV.map((item) => {
          const Icon = getIcon(item.icon)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="flex-1"
              aria-label={item.label}
            >
              {({ isActive }) => (
                <span
                  className={cn(
                    'flex flex-col items-center gap-0.5 rounded-full px-1 py-2 text-[10px] font-semibold transition-colors',
                    isActive
                      ? 'bg-brand-500 text-ink-900'
                      : 'text-slate-500 hover:text-brand-700',
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  <span className="leading-none">{item.label}</span>
                </span>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export function AppShell() {
  const { state } = useApp()

  return (
    <div className="min-h-screen">
      {/* Soft top header */}
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-[#f7f3ea]/85 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <PointsChip />
            <NavLink
              to="/staff"
              aria-label="Clinic staff entry"
              title="Clinic staff entry"
              className={({ isActive }) =>
                cn(
                  'inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
                  isActive
                    ? 'border-brand-400 bg-brand-500 text-ink-900'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-brand-300 hover:text-brand-700',
                )
              }
            >
              <Stethoscope className="h-4 w-4" />
            </NavLink>
            <Avatar
              firstName={state.patient.firstName}
              lastName={state.patient.lastName}
              size="h-9 w-9"
            />
          </div>
        </div>
      </header>

      {/* Centered, single-column app content */}
      <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-5 sm:px-6">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
