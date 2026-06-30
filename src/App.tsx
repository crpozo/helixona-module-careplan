import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppProvider } from '@/store/store'
import { AppShell } from '@/components/AppShell'
import { TodayPage } from '@/pages/TodayPage'
import { PlanPage } from '@/pages/PlanPage'
import { WeekPage } from '@/pages/WeekPage'
import { ProgressPage } from '@/pages/ProgressPage'
import { RewardsPage } from '@/pages/RewardsPage'
import { StaffPage } from '@/pages/StaffPage'

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<TodayPage />} />
            <Route path="plan" element={<PlanPage />} />
            <Route path="week" element={<WeekPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="rewards" element={<RewardsPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="*" element={<TodayPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
