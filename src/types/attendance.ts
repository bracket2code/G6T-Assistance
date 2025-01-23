export type Priority = 'low' | 'medium' | 'high' | 'vacation' | null

export interface MonthlyComparisonData {
  currentMonth: string
  previousMonth: string
  currentMonthToDate: string
  previousMonthToDate: string
  currentMonthToToday: string
  previousMonthToToday: string
  selectedDate: string
  timestamp: number
}

export interface Note {
  id: string
  text: string
  priority: Priority
  created_at: string
}

export interface Shift {
  id: number
  checkInTime: string
  checkOutTime: string
  note: string
  date: string
}

export interface Business {
  id: string
  name: string
}

export interface Signature {
  id: string
  user_id: string
  business_id: string
  date: string
  signature_url: string
  created_at: string
  updated_at: string
}