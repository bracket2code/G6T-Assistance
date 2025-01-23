import { type ComparisonType, type DateRange } from '../../types/reports'
import { type Business } from '../../types/attendance'

interface ReportFiltersProps {
  dateRange: DateRange
  comparisonType: ComparisonType
  comparisonRange: DateRange
  businesses: Business[]
  selectedBusinesses: string[]
  onDateRangeChange: (range: DateRange) => void
  onComparisonTypeChange: (type: ComparisonType) => void
  onComparisonRangeChange: (range: DateRange) => void
  onSelectAllBusinesses: () => void
  onDeselectAllBusinesses: () => void
  onBusinessSelectionChange: (businessId: string, selected: boolean) => void
}

export default function ReportFilters({
  dateRange,
  comparisonType,
  comparisonRange,
  businesses,
  selectedBusinesses,
  onDateRangeChange,
  onComparisonTypeChange,
  onComparisonRangeChange,
  onSelectAllBusinesses,
  onDeselectAllBusinesses,
  onBusinessSelectionChange
}: ReportFiltersProps) {
  return (
    <div className="space-y-6 mb-8">
      {/* Rango de fechas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fecha Inicio
          </label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fecha Fin
          </label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      {/* Tipo de comparación */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Comparar con
        </label>
        <select
          value={comparisonType}
          onChange={(e) => onComparisonTypeChange(e.target.value as ComparisonType)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="none">Sin comparación</option>
          <option value="custom">Período personalizado</option>
        </select>
      </div>

      {/* Rango de fechas para comparación */}
      {comparisonType === 'custom' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-blue-500">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha Inicio (Comparación)
            </label>
            <input
              type="date"
              value={comparisonRange.start}
              onChange={(e) => onComparisonRangeChange({ ...comparisonRange, start: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha Fin (Comparación)
            </label>
            <input
              type="date"
              value={comparisonRange.end}
              onChange={(e) => onComparisonRangeChange({ ...comparisonRange, end: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Selección de empresas */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Empresas
          </label>
          <div className="flex gap-2">
            <button
              onClick={onSelectAllBusinesses}
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Seleccionar todas
            </button>
            <span className="text-gray-400">|</span>
            <button
              onClick={onDeselectAllBusinesses}
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Deseleccionar todas
            </button>
          </div>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2 dark:border-gray-700">
          {businesses.map(business => (
            <label key={business.id} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedBusinesses.includes(business.id)}
                onChange={(e) => onBusinessSelectionChange(business.id, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">{business.name}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}