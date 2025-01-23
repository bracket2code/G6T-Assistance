import { useState, useEffect } from 'react'
import { ArrowLeft, Building2, Calendar, CalendarDays, CalendarRange, BarChart2, ListPlus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { type Business } from '../../types/attendance'
import { type ReportData } from '../../types/reports'
import { type ReportTemplate } from '../admin/reports/types'
import { useReportFilters } from '../../hooks/useReportFilters'
import { generateReport } from '../../lib/reports/generateReport'
import { exportToXLSX, exportToPDF } from '../../lib/reports/exportReports'
import ReportFilters from './ReportFilters'
import ReportResults from './ReportResults'
import ReportActions from './ReportActions'
import ReportOptions from './ReportOptions'
import NotesSearch from './NotesSearch'

type TabType = 'hours' | 'notes'
type ReportType = {
  id: string
  name: string
  description: string
  icon: string
}

const ICONS = {
  Building2,
  Calendar,
  CalendarDays,
  CalendarRange,
  BarChart2,
  ListPlus
}

export default function Reports({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<TabType>('hours')
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [reportTypes, setReportTypes] = useState<ReportType[]>([])
  const [selectedReportType, setSelectedReportType] = useState<string | null>(null)
  const [reportOptions, setReportOptions] = useState<{
    showShiftNotes: boolean
    showDailyNotes: boolean
    showTimes: boolean
  }>({
    showShiftNotes: true,
    showDailyNotes: true,
    showTimes: true
  })

  // Función para manejar el cambio de tipo de informe
  const handleReportTypeChange = (typeId: string) => {
    const reportType = reportTypes.find(t => t.id === typeId)
    if (!reportType) return

    setSelectedReportType(typeId)

    // Configurar filtros según el tipo de informe
    switch (reportType.name) {
      case 'Comparativa':
        setComparisonType('custom')
        break
      case 'Horas por Día':
        setViewType('daily')
        setComparisonType('none')
        break
      case 'Horas por Empresa':
        setViewType('monthly')
        setComparisonType('none')
        break
      case 'Horas por Semana':
        setViewType('weekly')
        setComparisonType('none')
        break
      case 'Resumen Mensual':
        setViewType('monthly')
        setComparisonType('none')
        break
      default:
        break
    }
  }

  const {
    filters,
    setViewType,
    setDateRange,
    setComparisonRange,
    setComparisonType,
    selectedBusinesses,
    setSelectedBusinesses
  } = useReportFilters()

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar empresas
        const { data: businessesData } = await supabase
          .from('businesses')
          .select('id, name')
          .eq('active', true)
          .order('name')
        
        setBusinesses(businessesData || [])

        // Cargar tipos de informes
        const { data: typesData } = await supabase
          .from('report_types')
          .select('*')
          .order('name')

        setReportTypes(typesData || [])
        if (typesData?.length > 0) {
          setSelectedReportType(typesData[0].id)
        }

        // Cargar plantillas
        const { data: templatesData } = await supabase
          .from('report_templates')
          .select('*')
          .order('created_at')

        setTemplates(templatesData || [])
        if (templatesData?.length > 0) {
          setSelectedTemplate(templatesData[0].id)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    
    loadData()
  }, [])

  // Función para generar el informe
  const handleGenerateReport = async () => {
    if (selectedBusinesses.length === 0) return

    setLoading(true)
    try {
      const data = await generateReport({ 
        filters: {
          ...filters,
          selectedReportType,
          reportOptions
        },
        businesses
      })
      setReportData(data)
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setLoading(false)
    }
  }

  // Función para exportar
  const handleExport = async (type: 'pdf' | 'xlsx') => {
    const template = templates.find(t => t.id === selectedTemplate)
    if (!template) return
    
    try {
      if (type === 'pdf') {
        await exportToPDF(reportData, filters.dateRange, filters.comparisonType, template)
      } else {
        await exportToXLSX(reportData, filters.dateRange, filters.comparisonType, template)
      }
    } catch (error) {
      console.error(`Error exporting to ${type}:`, error)
    }
  }


  return (
    <div className="max-w-6xl mx-auto p-6 dark:bg-gray-900 dark:text-white">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          title="Volver"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold dark:text-white">Informes</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('hours')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'hours'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Informes de Horas
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'notes'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Búsqueda de Notas
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 dark:bg-gray-800">
        {activeTab === 'hours' ? (
          <>
            {/* Tipos de informe */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
              {reportTypes.map(type => {
                const Icon = ICONS[type.icon as keyof typeof ICONS]
                return (
                  <button
                    key={type.id}
                    onClick={() => handleReportTypeChange(type.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      selectedReportType === type.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                  >
                    {Icon && <Icon className="w-6 h-6 text-blue-500" />}
                    <span className="text-sm font-medium text-center dark:text-white">
                      {type.name}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Selector de plantilla */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Plantilla de informe
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Opciones de informe detallado */}
            {reportTypes.find(t => t.id === selectedReportType)?.name === 'Informe Detallado' && (
              <ReportOptions
                templateId={selectedTemplate || ''}
                onChange={setReportOptions}
              />
            )}

            <ReportFilters
              viewType={filters.viewType}
              dateRange={filters.dateRange}
              comparisonType={filters.comparisonType}
              comparisonRange={filters.comparisonRange}
              businesses={businesses}
              selectedBusinesses={selectedBusinesses}
              onViewTypeChange={setViewType}
              onDateRangeChange={setDateRange}
              onComparisonTypeChange={setComparisonType}
              onComparisonRangeChange={setComparisonRange}
              onSelectAllBusinesses={() => setSelectedBusinesses(businesses.map(b => b.id))}
              onDeselectAllBusinesses={() => setSelectedBusinesses([])}
              onBusinessSelectionChange={(businessId, selected) => {
                if (selected) {
                  setSelectedBusinesses(prev => [...prev, businessId])
                } else {
                  setSelectedBusinesses(prev => prev.filter(id => id !== businessId))
                }
              }}
            />

            <ReportActions
              loading={loading}
              hasData={reportData.length > 0}
              hasSelectedBusinesses={selectedBusinesses.length > 0}
              onGenerateReport={handleGenerateReport}
              onExportXLSX={() => handleExport('xlsx')}
              onExportPDF={() => handleExport('pdf')}
            />

            <ReportResults
              reportData={reportData}
              comparisonType={filters.comparisonType}
            />
          </>
        ) : (
          <NotesSearch />
        )}
      </div>
    </div>
  )
}