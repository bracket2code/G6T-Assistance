export function calculateHours(checkIn: string, checkOut: string) {
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

export function getTotalHoursForDate(
  date: string,
  records: Record<string, Record<string, Array<{
    checkInTime: string
    checkOutTime: string
  }>>>
) {
  let total = 0
  const dayRecords = records[date] || {}
  Object.values(dayRecords).forEach(shifts => {
    shifts?.forEach(shift => {
      total += calculateHours(shift.checkInTime, shift.checkOutTime)
    })
  })
  return total.toFixed(1)
}

export function getTotalHoursForMonth(
  selectedDate: string,
  records: Record<string, Record<string, Array<{
    checkInTime: string
    checkOutTime: string
  }>>>
) {
  const date = new Date(selectedDate)
  const month = date.getMonth()
  const year = date.getFullYear()
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getDate()
  let total = 0

  for (let i = 1; i <= lastDay; i++) {
    const currentDate = new Date(Date.UTC(year, month, i)).toISOString().slice(0, 10)
    total += parseFloat(getTotalHoursForDate(currentDate, records))
  }
  
  return total.toFixed(1)
}