import { supabase } from '../supabase'
import { calculateHours } from '../utils/dateUtils'
import { type ReportGenerationProps, type ReportData } from '../../types/reports'
import { generateDetailedReport } from './types/detailedReport'

export async function generateReport({ filters, businesses }: ReportGenerationProps): Promise<ReportData[]> {
  const data: ReportData[] = []
  const reportType = await getReportType(filters.selectedReportType)

  switch (reportType?.name) {
    case 'Informe Detallado':
      return await generateDetailedReport(filters, businesses)
    case 'Horas por Semana y Empresa':
      return await generateWeeklyBusinessReport(filters, businesses)
    case 'Horas por Empresa':
      return await generateBusinessReport(filters, businesses)
    case 'Horas por Día':
      return await generateDailyReport(filters, businesses)
    case 'Horas por Semana':
      return await generateWeeklyReport(filters, businesses)
    case 'Resumen Mensual':
      return await generateMonthlyReport(filters, businesses)
    case 'Comparativa':
      return await generateComparisonReport(filters, businesses)
    default:
      return await generateBusinessReport(filters, businesses)
  }
}

async function getReportType(reportTypeId: string) {
  const { data } = await supabase
    .from('report_types')
    .select('*')
    .eq('id', reportTypeId)
    .single()
  return data
}

async function generateBusinessReport(filters: any, businesses: any[]): Promise<ReportData[]> {
  const data: ReportData[] = []

  for (const businessId of filters.selectedBusinesses) {
    // Get hours for main period
    const { data: shifts } = await supabase
      .from('shifts')
      .select('*')
      .eq('business_id', businessId)
      .gte('date', filters.dateRange.start)
      .lte('date', filters.dateRange.end)

    let totalHours = 0
    shifts?.forEach(shift => {
      if (shift.check_in && shift.check_out) {
        totalHours += calculateHours(shift.check_in, shift.check_out)
      }
    })

    // Get comparison hours if needed
    let comparisonHours = undefined
    let difference = undefined
    let percentageChange = undefined

    if (filters.comparisonType === 'custom') {
      const { data: comparisonShifts } = await supabase
        .from('shifts')
        .select('*')
        .eq('business_id', businessId)
        .gte('date', filters.comparisonRange.start)
        .lte('date', filters.comparisonRange.end)

      const totalComparisonHours = comparisonShifts?.reduce((sum, shift) => {
        if (shift.check_in && shift.check_out) {
          return sum + calculateHours(shift.check_in, shift.check_out)
        }
        return sum
      }, 0) || 0

      comparisonHours = totalComparisonHours
      difference = totalHours - totalComparisonHours
      percentageChange = totalComparisonHours > 0 
        ? ((totalHours - totalComparisonHours) / totalComparisonHours) * 100 
        : 0
    }

    const business = businesses.find(b => b.id === businessId)
    if (business) {
      data.push({
        businessId,
        businessName: business.name,
        hours: totalHours,
        comparisonHours,
        difference,
        percentageChange
      })
    }
  }

  return data.sort((a, b) => b.hours - a.hours) // Sort by hours descending
}

async function generateWeeklyBusinessReport(filters: any, businesses: any[]): Promise<ReportData[]> {
  const data: ReportData[] = []
  const weeks = getWeeksInRange(filters.dateRange.start, filters.dateRange.end)

  for (const week of weeks) {
    for (const businessId of filters.selectedBusinesses) {
      // Get hours for current week and business
      const { data: shifts } = await supabase
        .from('shifts')
        .select('*')
        .eq('business_id', businessId)
        .gte('date', week.start)
        .lte('date', week.end)

      let totalHours = 0
      shifts?.forEach(shift => {
        if (shift.check_in && shift.check_out) {
          totalHours += calculateHours(shift.check_in, shift.check_out)
        }
      })

      // Get comparison data if needed
      let comparisonHours = undefined
      let difference = undefined
      let percentageChange = undefined

      if (filters.comparisonType === 'custom') {
        const comparisonWeek = getComparisonWeek(week, filters.dateRange, filters.comparisonRange)
        const { data: comparisonShifts } = await supabase
          .from('shifts')
          .select('*')
          .eq('business_id', businessId)
          .gte('date', comparisonWeek.start)
          .lte('date', comparisonWeek.end)

        const totalComparisonHours = comparisonShifts?.reduce((sum, shift) => {
          if (shift.check_in && shift.check_out) {
            return sum + calculateHours(shift.check_in, shift.check_out)
          }
          return sum
        }, 0) || 0

        comparisonHours = totalComparisonHours
        difference = totalHours - totalComparisonHours
        percentageChange = totalComparisonHours > 0 
          ? ((totalHours - totalComparisonHours) / totalComparisonHours) * 100 
          : 0
      }

      const business = businesses.find(b => b.id === businessId)
      if (business && totalHours > 0) {
        data.push({
          businessId: `${week.start}-${businessId}`,
          businessName: `${formatDate(week.start)} - ${formatDate(week.end)} | ${business.name}`,
          hours: totalHours,
          comparisonHours,
          difference,
          percentageChange
        })
      }
    }
  }

  return data.sort((a, b) => {
    // Sort by week first, then by hours
    const [weekA] = a.businessId.split('-')
    const [weekB] = b.businessId.split('-')
    if (weekA === weekB) {
      return b.hours - a.hours
    }
    return weekA.localeCompare(weekB)
  })
}

async function generateDailyReport(filters: any, businesses: any[]): Promise<ReportData[]> {
  const data: ReportData[] = []
  const days = getDaysInRange(filters.dateRange.start, filters.dateRange.end)

  for (const day of days) {
    let totalHours = 0
    let comparisonHours = undefined
    let difference = undefined
    let percentageChange = undefined

    // Get hours for current day
    const { data: shifts } = await supabase
      .from('shifts')
      .select('*')
      .in('business_id', filters.selectedBusinesses)
      .eq('date', day)

    shifts?.forEach(shift => {
      if (shift.check_in && shift.check_out) {
        totalHours += calculateHours(shift.check_in, shift.check_out)
      }
    })

    // Get comparison data if needed
    if (filters.comparisonType === 'custom') {
      const comparisonDate = getComparisonDate(day, filters.dateRange, filters.comparisonRange)
      const { data: comparisonShifts } = await supabase
        .from('shifts')
        .select('*')
        .in('business_id', filters.selectedBusinesses)
        .eq('date', comparisonDate)

      const totalComparisonHours = comparisonShifts?.reduce((sum, shift) => {
        if (shift.check_in && shift.check_out) {
          return sum + calculateHours(shift.check_in, shift.check_out)
        }
        return sum
      }, 0) || 0

      comparisonHours = totalComparisonHours
      difference = totalHours - totalComparisonHours
      percentageChange = totalComparisonHours > 0 
        ? ((totalHours - totalComparisonHours) / totalComparisonHours) * 100 
        : 0
    }

    data.push({
      businessId: day,
      businessName: formatDate(day),
      hours: totalHours,
      comparisonHours,
      difference,
      percentageChange
    })
  }

  return data
}

async function generateWeeklyReport(filters: any, businesses: any[]): Promise<ReportData[]> {
  const data: ReportData[] = []
  const weeks = getWeeksInRange(filters.dateRange.start, filters.dateRange.end)

  for (const week of weeks) {
    let totalHours = 0
    let comparisonHours = undefined
    let difference = undefined
    let percentageChange = undefined

    // Get hours for current week
    const { data: shifts } = await supabase
      .from('shifts')
      .select('*')
      .in('business_id', filters.selectedBusinesses)
      .gte('date', week.start)
      .lte('date', week.end)

    shifts?.forEach(shift => {
      if (shift.check_in && shift.check_out) {
        totalHours += calculateHours(shift.check_in, shift.check_out)
      }
    })

    // Get comparison data if needed
    if (filters.comparisonType === 'custom') {
      const comparisonWeek = getComparisonWeek(week, filters.dateRange, filters.comparisonRange)
      const { data: comparisonShifts } = await supabase
        .from('shifts')
        .select('*')
        .in('business_id', filters.selectedBusinesses)
        .gte('date', comparisonWeek.start)
        .lte('date', comparisonWeek.end)

      const totalComparisonHours = comparisonShifts?.reduce((sum, shift) => {
        if (shift.check_in && shift.check_out) {
          return sum + calculateHours(shift.check_in, shift.check_out)
        }
        return sum
      }, 0) || 0

      comparisonHours = totalComparisonHours
      difference = totalHours - totalComparisonHours
      percentageChange = totalComparisonHours > 0 
        ? ((totalHours - totalComparisonHours) / totalComparisonHours) * 100 
        : 0
    }

    data.push({
      businessId: week.start,
      businessName: `Semana ${formatDate(week.start)} - ${formatDate(week.end)}`,
      hours: totalHours,
      comparisonHours,
      difference,
      percentageChange
    })
  }

  return data
}

async function generateMonthlyReport(filters: any, businesses: any[]): Promise<ReportData[]> {
  const data: ReportData[] = []
  const months = getMonthsInRange(filters.dateRange.start, filters.dateRange.end)

  for (const month of months) {
    let totalHours = 0
    let comparisonHours = undefined
    let difference = undefined
    let percentageChange = undefined

    // Get hours for current month
    const { data: shifts } = await supabase
      .from('shifts')
      .select('*')
      .in('business_id', filters.selectedBusinesses)
      .gte('date', month.start)
      .lte('date', month.end)

    shifts?.forEach(shift => {
      if (shift.check_in && shift.check_out) {
        totalHours += calculateHours(shift.check_in, shift.check_out)
      }
    })

    // Get comparison data if needed
    if (filters.comparisonType === 'custom') {
      const comparisonMonth = getComparisonMonth(month, filters.dateRange, filters.comparisonRange)
      const { data: comparisonShifts } = await supabase
        .from('shifts')
        .select('*')
        .in('business_id', filters.selectedBusinesses)
        .gte('date', comparisonMonth.start)
        .lte('date', comparisonMonth.end)

      const totalComparisonHours = comparisonShifts?.reduce((sum, shift) => {
        if (shift.check_in && shift.check_out) {
          return sum + calculateHours(shift.check_in, shift.check_out)
        }
        return sum
      }, 0) || 0

      comparisonHours = totalComparisonHours
      difference = totalHours - totalComparisonHours
      percentageChange = totalComparisonHours > 0 
        ? ((totalHours - totalComparisonHours) / totalComparisonHours) * 100 
        : 0
    }

    data.push({
      businessId: month.start,
      businessName: formatMonth(month.start),
      hours: totalHours,
      comparisonHours,
      difference,
      percentageChange
    })
  }

  return data
}

async function generateComparisonReport(filters: any, businesses: any[]): Promise<ReportData[]> {
  // Force comparison type to custom for comparison report
  filters.comparisonType = 'custom'
  return await generateBusinessReport(filters, businesses)
}

// Helper functions
function getDaysInRange(start: string, end: string): string[] {
  const days: string[] = []
  let current = new Date(start)
  const endDate = new Date(end)

  while (current <= endDate) {
    days.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }

  return days
}

function getWeeksInRange(start: string, end: string): { start: string, end: string }[] {
  const weeks: { start: string, end: string }[] = []
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

function getMonthsInRange(start: string, end: string): { start: string, end: string }[] {
  const months: { start: string, end: string }[] = []
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

function getComparisonDate(date: string, mainRange: any, comparisonRange: any): string {
  const mainStart = new Date(mainRange.start)
  const comparisonStart = new Date(comparisonRange.start)
  const current = new Date(date)
  const diff = current.getTime() - mainStart.getTime()
  const comparisonDate = new Date(comparisonStart.getTime() + diff)
  return comparisonDate.toISOString().split('T')[0]
}

function getComparisonWeek(week: any, mainRange: any, comparisonRange: any): any {
  const mainStart = new Date(mainRange.start)
  const comparisonStart = new Date(comparisonRange.start)
  const weekStart = new Date(week.start)
  const weekEnd = new Date(week.end)
  const diff = weekStart.getTime() - mainStart.getTime()
  const comparisonWeekStart = new Date(comparisonStart.getTime() + diff)
  const comparisonWeekEnd = new Date(comparisonWeekStart)
  comparisonWeekEnd.setDate(comparisonWeekEnd.getDate() + (weekEnd.getDate() - weekStart.getDate()))
  
  return {
    start: comparisonWeekStart.toISOString().split('T')[0],
    end: comparisonWeekEnd.toISOString().split('T')[0]
  }
}

function getComparisonMonth(month: any, mainRange: any, comparisonRange: any): any {
  const mainStart = new Date(mainRange.start)
  const comparisonStart = new Date(comparisonRange.start)
  const monthStart = new Date(month.start)
  const monthEnd = new Date(month.end)
  const diff = monthStart.getTime() - mainStart.getTime()
  const comparisonMonthStart = new Date(comparisonStart.getTime() + diff)
  const comparisonMonthEnd = new Date(comparisonMonthStart)
  comparisonMonthEnd.setDate(comparisonMonthEnd.getDate() + (monthEnd.getDate() - monthStart.getDate()))
  
  return {
    start: comparisonMonthStart.toISOString().split('T')[0],
    end: comparisonMonthEnd.toISOString().split('T')[0]
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function formatMonth(date: string): string {
  return new Date(date).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric'
  })
}