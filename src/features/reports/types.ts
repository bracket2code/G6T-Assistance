export interface ReportStyles {
  colors: {
    primary: string
    secondary: string
    text: string
    background: string
  }
  fonts: {
    title: string
    body: string
  }
  header: {
    show: boolean
    height: number
    alignment: 'left' | 'center' | 'right'
  }
  footer: {
    show: boolean
    height: number
    text: string
  }
  texts?: {
    title?: string
    period?: string
  }
}

export interface ReportField {
  id: string
  name: string
  type: 'text' | 'number' | 'date' | 'hours' | 'business' | 'total'
  width?: number
  format?: string
}

export interface ReportTemplate {
  id: string
  name: string
  type: 'pdf' | 'xlsx'
  report_type_id: string
  fields: ReportField[]
  styles: ReportStyles
  svg_logo?: string | null
  created_at: string
  updated_at: string
}

export interface ReportType {
  id: string
  name: string
  description: string
  icon: string
  created_at: string
}

export type ViewType = 'daily' | 'weekly' | 'monthly' | 'yearly'
export type ComparisonType = 'none' | 'custom'

export interface DateRange {
  start: string
  end: string
}

export interface ReportData {
  businessId: string
  businessName: string
  hours: number
  comparisonHours?: number
  difference?: number
  percentageChange?: number
  details?: {
    type: 'notes' | 'shifts'
    notes?: Array<{
      text: string
      priority: string
      created_at: string
    }>
    shifts?: Array<{
      checkIn?: string
      checkOut?: string
      hours: number
      notes?: string
    }>
  }
}

export interface ReportFilters {
  viewType: ViewType
  dateRange: DateRange
  comparisonType: ComparisonType
  comparisonRange: DateRange
  selectedBusinesses: string[]
  selectedReportType: string | null
  reportOptions?: {
    showShiftNotes: boolean
    showDailyNotes: boolean
    showTimes: boolean
  }
}

export interface ReportGenerationProps {
  filters: ReportFilters
  businesses: Business[]
}