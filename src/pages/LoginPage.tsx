import { useState, type FormEvent } from 'react'
import { HeartPulse, LogIn, Stethoscope } from 'lucide-react'
import { useApp } from '@/store/store'
import type { UserRole } from '@/types'
import { cn } from '@/lib/cn'
import { Button } from '@/components/Button'

const TABS: { role: UserRole; label: string; icon: typeof HeartPulse }[] = [
  { role: 'patient', label: "I'm a patient", icon: HeartPulse },
  { role: 'staff', label: 'Clinic staff', icon: Stethoscope },
]

const DEMO_EMAIL: Record<UserRole, string> = {
  patient: 'maya.alvarez@example.com',
  staff: 'frontdesk@helixona.com',
}

const FIELD =
  'w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none'

/**
 * Entry gate: pick who you are (two tabs), then one big sign-in button.
 * Demo auth — any password works; the tab decides the role.
 */
export function LoginPage() {
  const { actions } = useApp()
  const [tab, setTab] = useState<UserRole>('patient')
  const [email, setEmail] = useState(DEMO_EMAIL.patient)
  const [password, setPassword] = useState('')

  function pickTab(role: UserRole) {
    setTab(role)
    setEmail(DEMO_EMAIL[role])
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    // Land staff in their console; patients start their day at home.
    window.location.hash = tab === 'staff' ? '#/patients' : '#/'
    actions.login(tab)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-10">
      <main className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-100 ring-2 ring-brand-200">
            <svg viewBox="0 0 64 64" className="h-9 w-9" aria-hidden>
              <path
                d="M20 14c10 6 14 12 14 18s-4 12-14 18M44 14c-10 6-14 12-14 18s4 12 14 18"
                fill="none"
                stroke="#9c7e44"
                strokeWidth="5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <h1 className="mt-5 text-2xl font-extrabold tracking-[0.14em] text-slate-800">
            HELIXONA
          </h1>
          <p className="mt-1 text-base font-semibold text-slate-500">
            Your care plan, one step at a time.
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 rounded-3xl border-2 border-slate-200 bg-white p-6">
          {/* Who are you? — two big tabs */}
          <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Account type">
            {TABS.map(({ role, label, icon: Icon }) => (
              <button
                key={role}
                type="button"
                role="tab"
                aria-selected={tab === role}
                onClick={() => pickTab(role)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-2xl border-2 px-3 py-4 text-sm font-extrabold transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  tab === role
                    ? 'border-brand-400 bg-brand-50 text-brand-800'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700',
                )}
              >
                <Icon className="h-7 w-7" />
                {label}
              </button>
            ))}
          </div>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-500"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={FIELD}
              />
            </div>
            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-500"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={FIELD}
              />
            </div>

            <Button type="submit" variant="primary" size="xl" className="w-full">
              <LogIn className="h-5 w-5" />
              {tab === 'staff' ? 'Sign in — staff' : 'Sign in'}
            </Button>

            <p className="text-center text-xs font-semibold text-slate-400">
              Demo — any password works.
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
