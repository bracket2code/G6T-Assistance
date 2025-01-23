export function isValidTime(time: string): boolean {
  if (!time) return false
  const [hours, minutes] = time.split(':').map(Number)
  return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60
}

export function isValidDate(date: string): boolean {
  const d = new Date(date)
  return d instanceof Date && !isNaN(d.getTime())
}

export function isValidDateRange(start: string, end: string): boolean {
  if (!isValidDate(start) || !isValidDate(end)) return false
  return new Date(start) <= new Date(end)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6
}