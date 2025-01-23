import { useState } from 'react'
import { type ViewType, type ComparisonType, type DateRange, type ReportFilters } from '../types/reports'

export function useReportFilters() {
  const [viewType, setViewType] = useState<ViewType>('monthly')
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10)
    }
  })
  const [comparisonRange, setComparisonRange] = useState<DateRange>(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0)
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10)
    }
  })
  const [comparisonType, setComparisonType] = useState<ComparisonType>('previous')
  const [selectedBusinesses, setSelectedBusinesses] = useState<string[]>([])

  const filters: ReportFilters = {
    viewType,
    dateRange,
    comparisonType,
    comparisonRange,
    selectedBusinesses
  }

  return {
    filters,
    setViewType,
    setDateRange,
    setComparisonRange,
    setComparisonType,
    selectedBusinesses,
    setSelectedBusinesses
  }
}