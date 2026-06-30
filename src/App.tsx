import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppProvider } from '@/store/store'
import { AppShell } from '@/components/AppShell'
import { TodayPage } from '@/pages/TodayPage'

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

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-24" aria-busy="true">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
    </div>
  )
}

export function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<TodayPage />} />
            <Route
              path="plan"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <PlanPage />
                </Suspense>
              }
            />
            <Route
              path="week"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <WeekPage />
                </Suspense>
              }
            />
            <Route
              path="progress"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <ProgressPage />
                </Suspense>
              }
            />
            <Route
              path="rewards"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <RewardsPage />
                </Suspense>
              }
            />
            <Route
              path="staff"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <StaffPage />
                </Suspense>
              }
            />
            <Route path="*" element={<TodayPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  )
}
