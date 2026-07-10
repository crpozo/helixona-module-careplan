import { NavLink, Outlet } from 'react-router-dom'
import { Coins, Flame, LogOut } from 'lucide-react'
import { cn } from '@/lib/cn'
import { getIcon } from '@/lib/icons'
import { num } from '@/lib/format'
import { Logo } from '@/components/Logo'
import { Avatar } from '@/components/Avatar'
import { PATIENT_NAV, STAFF_NAV, type NavItem } from '@/components/nav'
import { useApp, useDerived } from '@/store/store'

function PointsChip() {
  const { points } = useDerived()
  return (
    <NavLink
      to="/rewards"
      title="Your points"
      className="inline-flex items-center gap-1.5 rounded-full border-2 border-brand-200 bg-brand-50 px-3 py-1 text-sm font-extrabold text-brand-800 transition-colors hover:border-brand-400"
    >
      <Coins className="h-4 w-4" />
      <span className="tnum">{num(points.balance)}</span>
    </NavLink>
  )
}

function StreakChip() {
  const { streak } = useDerived()
  return (
    <NavLink
      to="/progress"
      title="Weeks in a row on target"
      className="inline-flex items-center gap-1 rounded-full border-2 border-amber-200 bg-amber-50 px-3 py-1 text-sm font-extrabold text-amber-600 transition-colors hover:border-amber-400"
    >
      <Flame className="h-4 w-4" />
      <span className="tnum">{streak.current}</span>
    </NavLink>
  )
}

/** Sign out and return to the login screen. */
function LogoutButton({ compact, className }: { compact?: boolean; className?: string }) {
  const { actions } = useApp()
  return (
    <button
      type="button"
      onClick={actions.logout}
      aria-label="Log out"
      title="Log out"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white font-extrabold text-slate-500 transition-colors hover:border-brand-400 hover:text-brand-800',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        compact ? 'h-9 w-9' : 'px-3 py-2 text-xs',
        className,
      )}
    >
      <LogOut className="h-4 w-4" />
      {!compact && 'Log out'}
    </button>
  )
}

/** Icon + label row for the desktop sidebar. */
function SideLink({ item }: { item: NavItem }) {
  const Icon = getIcon(item.icon)
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-2xl border-2 px-4 py-2.5 text-[15px] font-extrabold transition-colors',
          isActive
            ? 'border-brand-300 bg-brand-50 text-brand-800'
            : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700',
        )
      }
    >
      <Icon className="h-6 w-6 shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  )
}

/** Icon + tiny label tab for the mobile bottom bar. */
function TabLink({ item }: { item: NavItem }) {
  const Icon = getIcon(item.icon)
  return (
    <NavLink
      to={item.to}
      end={item.end}
      aria-label={item.label}
      className={({ isActive }) =>
        cn(
          'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 transition-colors',
          isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-400 hover:text-slate-600',
        )
      }
    >
      <Icon className="h-6 w-6" />
      <span className="truncate text-[10px] font-extrabold">{item.label}</span>
    </NavLink>
  )
}

export function AppShell() {
  const { state } = useApp()
  const { level } = useDerived()
  const isStaff = state.role === 'staff'
  const TierIcon = getIcon(level.icon)
  // Staff get their console only; patients get their app. No mixing.
  const navItems = isStaff ? STAFF_NAV : PATIENT_NAV

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop left sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r-2 border-slate-200 bg-white px-3 py-5 lg:flex">
        <NavLink to="/" aria-label="Helixona home" className="px-2">
          <Logo />
        </NavLink>
        {isStaff && (
          <p className="mt-6 px-4 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Clinic console
          </p>
        )}
        <nav className={cn('flex flex-col gap-1.5', isStaff ? 'mt-0' : 'mt-6')}>
          {navItems.map((item) => (
            <SideLink key={item.to} item={item} />
          ))}
        </nav>
        <div className="mt-auto space-y-3 px-1">
          {/* Tier progress is the patient's — staff don't have one. */}
          {!isStaff && (
            <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-brand-800">
                <TierIcon className="h-4 w-4" />
                <span className="text-xs font-extrabold">{level.tier} tier</span>
              </div>
              <p className="mt-1 text-[11px] font-bold text-slate-500">
                {level.nextTier ? `${num(level.toNext)} pts to ${level.nextTier}` : 'Top tier reached'}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white p-2">
            <Avatar
              firstName={isStaff ? 'Clinic' : state.patient.firstName}
              lastName={isStaff ? 'Staff' : state.patient.lastName}
              size="h-9 w-9"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-extrabold text-slate-700">
                {isStaff ? 'Clinic staff' : state.patient.firstName}
              </p>
              <p className="text-[10px] font-bold text-slate-400">
                {isStaff ? 'Staff account' : 'Patient'}
              </p>
            </div>
            <LogoutButton compact />
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-col lg:pl-60">
        <header className="sticky top-0 z-20 border-b-2 border-slate-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-4 py-2.5">
            <NavLink to="/" aria-label="Helixona home" className="lg:hidden">
              <Logo />
            </NavLink>
            <div className="ml-auto flex items-center gap-2">
              {!isStaff && (
                <>
                  <StreakChip />
                  <PointsChip />
                </>
              )}
              <Avatar
                firstName={isStaff ? 'Clinic' : state.patient.firstName}
                lastName={isStaff ? 'Staff' : state.patient.lastName}
                size="h-9 w-9"
                className="hidden sm:inline-flex"
              />
              <LogoutButton compact className="lg:hidden" />
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 pb-safe-nav lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Main navigation"
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t-2 border-slate-200 bg-white lg:hidden"
      >
        <div className="mx-auto flex w-full max-w-md items-stretch gap-1 px-2 py-1.5">
          {navItems.map((item) => (
            <TabLink key={item.to} item={item} />
          ))}
        </div>
      </nav>
    </div>
  )
}
