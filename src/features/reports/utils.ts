import { type DateRange } from './types'

export function getDaysInRange(start: string, end: string): string[] {
  const days: string[] = []
  let current = new Date(start)
  const endDate = new Date(end)

  while (current <= endDate) {
    days.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }

  return days.sort()
}

export function getWeeksInRange(start: string, end: string): DateRange[] {
  const weeks: DateRange[] = []
  let current = new Date(start)
  const endDate = new Date(end)

  while (current <= endDate) {
    const weekStart = new Date(current)
    const weekEnd = new Date(current)
    weekEnd.setDate(weekEnd.getDate() + 6)

    if (weekEnd > endDate) {
      weeks.push({
        start: weekStart.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      })
    } else {
      weeks.push({
        start: weekStart.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0]
      })
    }

    current.setDate(current.getDate() + 7)
  }

  return weeks
}

export function getMonthsInRange(start: string, end: string): DateRange[] {
  const months: DateRange[] = []
  let current = new Date(start)
  const endDate = new Date(end)

  while (current <= endDate) {
    const monthStart = new Date(current.getFullYear(), current.getMonth(), 1)
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0)

    if (monthEnd > endDate) {
      months.push({
        start: monthStart.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      })
    } else {
      months.push({
        start: monthStart.toISOString().split('T')[0],
        end: monthEnd.toISOString().split('T')[0]
      })
    }

    current.setMonth(current.getMonth() + 1)
  }

  return months
}

export function formatDate(date: string, options?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString('es-ES', options || {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export function formatMonth(date: string): string {
  return formatDate(date, {
    month: 'long',
    year: 'numeric'
  })
}