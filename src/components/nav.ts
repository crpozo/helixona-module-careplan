export interface NavItem {
  to: string
  label: string
  icon: string
  /** Exact-match the route (for the index "/" route). */
  end?: boolean
  subtitle?: string
}

export const PATIENT_NAV: NavItem[] = [
  { to: '/', label: 'Today', icon: 'Sun', end: true, subtitle: 'Your day at a glance' },
  { to: '/plan', label: 'My Plan', icon: 'HeartPulse', subtitle: 'Your full plan of care' },
  {
    to: '/week',
    label: 'Schedule',
    icon: 'CalendarDays',
    subtitle: 'By day, week, month or treatment',
  },
  {
    to: '/calendar',
    label: 'Calendar',
    icon: 'CalendarCheck',
    subtitle: 'All your booked visits',
  },
  {
    to: '/progress',
    label: 'Progress',
    icon: 'Activity',
    subtitle: 'How far you have come',
  },
  { to: '/rewards', label: 'Rewards', icon: 'Gift', subtitle: 'Points, badges & perks' },
]

export const STAFF_NAV: NavItem[] = [
  {
    to: '/patients',
    label: 'Patients',
    icon: 'Users',
    subtitle: 'Add & manage patients',
  },
  {
    to: '/staff',
    label: 'Staff Entry',
    icon: 'Stethoscope',
    subtitle: 'Manage the plan & log visits',
  },
]

export const ALL_NAV = [...PATIENT_NAV, ...STAFF_NAV]
