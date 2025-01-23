import { Calendar, FileText } from 'lucide-react'

interface ReportActionsProps {
  loading: boolean
  hasData: boolean
  hasSelectedBusinesses: boolean
  onGenerateReport: () => void
  onExportXLSX: () => void
  onExportPDF: () => void
}

export default function ReportActions({
  loading,
  hasData,
  hasSelectedBusinesses,
  onGenerateReport,
  onExportXLSX,
  onExportPDF
}: ReportActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <button
        onClick={onGenerateReport}
        disabled={loading || !hasSelectedBusinesses}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-600"
      >
        <Calendar className="w-4 h-4" />
        {loading ? 'Generando...' : 'Generar Informe'}
      </button>
      
      {hasData && (
        <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
          <button
            onClick={onExportXLSX}
            type="button"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 dark:bg-green-700 dark:hover:bg-green-600"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span> XLSX
          </button>
          <button
            onClick={onExportPDF}
            type="button"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 dark:bg-red-700 dark:hover:bg-red-600"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span> PDF
          </button>
        </div>
      )}
    </div>
  )
}