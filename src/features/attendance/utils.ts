import { type Shift } from './types'

export function calculateHours(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0
  const [inHours, inMinutes] = checkIn.split(':').map(Number)
  const [outHours, outMinutes] = checkOut.split(':').map(Number)
  let minutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes)
  
  // Handle overnight shifts
  if (minutes < 0) {
    minutes += 24 * 60 // Add 24 hours worth of minutes
  }
  
  return minutes / 60
}

export function getTotalHoursForDate(date: string, shifts: Shift[]): number {
  let total = 0
  shifts.forEach(shift => {
    if (shift.checkInTime && shift.checkOutTime) {
      total += calculateHours(shift.checkInTime, shift.checkOutTime)
    }
  })
  return total
}

export function getTotalHoursForDateRange(startDate: string, endDate: string, shifts: Shift[]): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  let total = 0

  for (const shift of shifts) {
    const shiftDate = new Date(shift.date)
    if (shiftDate >= start && shiftDate <= end && shift.checkInTime && shift.checkOutTime) {
      total += calculateHours(shift.checkInTime, shift.checkOutTime)
    }
  }

  return total
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function getDateRange(viewType: string, date: Date): { start: string, end: string } {
  const start = new Date(date)
  const end = new Date(date)

  switch (viewType) {
    case 'daily':
      return {
        start: formatDate(start),
        end: formatDate(end)
      }
    case 'weekly':
      // Adjust to Monday of current week
      start.setDate(date.getDate() - date.getDay() + 1)
      // Adjust to Sunday of current week
      end.setDate(date.getDate() - date.getDay() + 7)
      return {
        start: formatDate(start),
        end: formatDate(end)
      }
    case 'monthly':
      start.setDate(1)
      end.setMonth(end.getMonth() + 1)
      end.setDate(0)
      return {
        start: formatDate(start),
        end: formatDate(end)
      }
    case 'yearly':
      start.setMonth(0, 1)
      end.setMonth(11, 31)
      return {
        start: formatDate(start),
        end: formatDate(end)
      }
    default:
      return {
        start: formatDate(start),
        end: formatDate(end)
      }
  }
}