export interface User {
  id: string
  email: string
  role: string
}

export interface AttendanceAppProps {
  user: User
  darkMode: boolean
  onShowAdmin: () => void
  onShowProfile: () => void
  onShowSettings: () => void
  onShowReports: () => void
  onToggleDarkMode: () => void
}

export interface Business {
  id: string
  name: string
}

export interface Shift {
  id: number
  checkInTime: string
  checkOutTime: string
  note: string
  date: string
}

export interface DailyNote {
  id: string
  text: string
  priority: 'low' | 'medium' | 'high' | 'vacation' | null
  created_at: string
}