import { supabase } from '../../supabase'
import { calculateHours } from '../../utils/dateUtils'
import { type ReportData } from '../../../types/reports'

export async function generateDetailedReport(
  filters: any,
  businesses: any[]
): Promise<ReportData[]> {
  const data: ReportData[] = []
  const days = getDaysInRange(filters.dateRange.start, filters.dateRange.end)
  const options = filters.reportOptions || {
    showShiftNotes: false,
    showDailyNotes: false,
    showTimes: false
  }

  for (const day of days) {
    // Get daily notes first if enabled
    if (options.showDailyNotes) {
      const { data: notes } = await supabase
        .from('daily_notes')
        .select('*')
        .eq('date', day)
        .order('created_at')
      
      if (notes && notes.length > 0) {
        data.push({
          businessId: `${day}-notes`,
          businessName: formatDate(day),
          hours: 0,
          details: {
            type: 'notes',
            notes: notes.map(note => ({
              text: note.text,
              priority: note.priority,
              created_at: note.created_at
            }))
          }
        })
      }
    }

    // Then get shifts for each business
    for (const businessId of filters.selectedBusinesses) {
      const { data: shifts } = await supabase
        .from('shifts')
        .select('*')
        .eq('business_id', businessId)
        .eq('date', day)
        .order('check_in')

      if (shifts && shifts.length > 0) {
        let totalHours = 0
        const shiftDetails = shifts.map(shift => {
          const hours = shift.check_in && shift.check_out ? 
            calculateHours(shift.check_in, shift.check_out) : 0
          totalHours += hours

          return {
            checkIn: options.showTimes ? shift.check_in : undefined,
            checkOut: options.showTimes ? shift.check_out : undefined,
            hours,
            notes: options.showShiftNotes ? shift.notes : undefined
          }
        })

        const business = businesses.find(b => b.id === businessId)
        if (business) {
          data.push({
            businessId: `${day}-${businessId}`,
            businessName: business.name,
            hours: totalHours,
            details: {
              type: 'shifts',
              shifts: shiftDetails
            }
          })
        }
      }
    }
  }

  return data.sort((a, b) => {
    // Sort by date first (extract date from businessId)
    const dateA = a.businessId.split('-')[0]
    const dateB = b.businessId.split('-')[0]
    const dateCompare = dateA.localeCompare(dateB)
    if (dateCompare !== 0) return dateCompare

    // For same date, show notes first
    if (a.businessId.endsWith('-notes')) return -1
    if (b.businessId.endsWith('-notes')) return 1

    // For shifts on same date, sort by business name
    return a.businessName.localeCompare(b.businessName)
  })
}

function getDaysInRange(start: string, end: string): string[] {
  const days: string[] = []
  let current = new Date(start)
  const endDate = new Date(end)

  while (current <= endDate) {
    days.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }

  return days.sort() // Sort dates from oldest to newest
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}