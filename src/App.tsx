import { lazy, Suspense, type ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider, useApp } from '@/store/store'
import { AppShell } from '@/components/AppShell'
import { TodayPage } from '@/pages/TodayPage'
import { CheckinPage } from '@/pages/CheckinPage'
import { BookingPage } from '@/pages/BookingPage'
import { LoginPage } from '@/pages/LoginPage'

// Today loads eagerly (it's the landing route); the rest are split into their
// own chunks so a phone only downloads the page it opens (keeps recharts and
// the heavy staff forms out of the initial bundle).
const PlanPage = lazy(() =>
  import('@/pages/PlanPage').then((m) => ({ default: m.PlanPage })),
)
const WeekPage = lazy(() =>
  import('@/pages/WeekPage').then((m) => ({ default: m.WeekPage })),
)
const ProgressPage = lazy(() =>
  import('@/pages/ProgressPage').then((m) => ({ default: m.ProgressPage })),
)
const RewardsPage = lazy(() =>
  import('@/pages/RewardsPage').then((m) => ({ default: m.RewardsPage })),
)
const StaffPage = lazy(() =>
  import('@/pages/StaffPage').then((m) => ({ default: m.StaffPage })),
)
const PatientsPage = lazy(() =>
  import('@/pages/PatientsPage').then((m) => ({ default: m.PatientsPage })),
)

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-24" aria-busy="true">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
    </div>
  )
}

/** Only clinic staff may edit the plan; patients are redirected home. */
function RequireStaff({ children }: { children: ReactNode }) {
  const { state } = useApp()
  if (state.role !== 'staff') return <Navigate to="/" replace />
  return <>{children}</>
}

/** Staff live in their console — patient-facing pages bounce them there. */
function RequirePatient({ children }: { children: ReactNode }) {
  const { state } = useApp()
  if (state.role === 'staff') return <Navigate to="/patients" replace />
  return <>{children}</>
}

/** Everything behind the login gate: the router + app chrome. */
function AuthenticatedApp() {
  const { state } = useApp()
  if (!state.authenticated) return <LoginPage />
  return (
    <HashRouter>
      <Routes>
        {/* Full-screen guided flows — no app chrome, pure focus. */}
        <Route
          path="checkin"
          element={
            <RequirePatient>
              <CheckinPage />
            </RequirePatient>
          }
        />
        <Route
          path="book"
          element={
            <RequirePatient>
              <BookingPage />
            </RequirePatient>
          }
        />
          <Route element={<AppShell />}>
            <Route
              index
              element={
                <RequirePatient>
                  <TodayPage />
                </RequirePatient>
              }
            />
            <Route
              path="plan"
              element={
                <RequirePatient>
                  <Suspense fallback={<RouteFallback />}>
                    <PlanPage />
                  </Suspense>
                </RequirePatient>
              }
            />
            <Route
              path="week"
              element={
                <RequirePatient>
                  <Suspense fallback={<RouteFallback />}>
                    <WeekPage />
                  </Suspense>
                </RequirePatient>
              }
            />
            <Route
              path="progress"
              element={
                <RequirePatient>
                  <Suspense fallback={<RouteFallback />}>
                    <ProgressPage />
                  </Suspense>
                </RequirePatient>
              }
            />
            <Route
              path="rewards"
              element={
                <RequirePatient>
                  <Suspense fallback={<RouteFallback />}>
                    <RewardsPage />
                  </Suspense>
                </RequirePatient>
              }
            />
            <Route
              path="staff"
              element={
                <RequireStaff>
                  <Suspense fallback={<RouteFallback />}>
                    <StaffPage />
                  </Suspense>
                </RequireStaff>
              }
            />
            <Route
              path="patients"
              element={
                <RequireStaff>
                  <Suspense fallback={<RouteFallback />}>
                    <PatientsPage />
                  </Suspense>
                </RequireStaff>
              }
            />
            <Route
              path="*"
              element={
                <RequirePatient>
                  <TodayPage />
                </RequirePatient>
              }
            />
          </Route>
      </Routes>
    </HashRouter>
  )
}

export function App() {
  return (
    <AppProvider>
      <AuthenticatedApp />
    </AppProvider>
  )
}
