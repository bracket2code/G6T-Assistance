export function formatDateLocale(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }
  return new Date(date).toLocaleDateString('es-ES', options || defaultOptions)
}

export function formatMonth(date: string | Date): string {
  return formatDateLocale(date, {
    month: 'long',
    year: 'numeric'
  })
}

export function formatTime(time: string | undefined): string {
  if (!time) return ''
  return time.slice(0, 5) // Format HH:mm
}

export function formatHours(hours: number): string {
  return hours.toFixed(1) + 'h'
}

export function formatPercentage(value: number): string {
  return value.toFixed(1) + '%'
}