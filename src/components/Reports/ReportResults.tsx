import { type ReportData } from '../../types/reports'

function formatTime(time: string | undefined) {
  if (!time) return ''
  return time.slice(0, 5) // Format HH:mm
}

interface ReportResultsProps {
  reportData: ReportData[]
  comparisonType: string
}

export default function ReportResults({ reportData, comparisonType }: ReportResultsProps) {
  if (reportData.length === 0) return null

  // Check if it's a detailed report
  const isDetailedReport = reportData.some(data => data.details)
  if (isDetailedReport) {
    return (
      <div className="mt-6 space-y-8">
        {reportData.map((data) => (
          <div key={data.businessId} className="border rounded-lg p-4 dark:border-gray-700">
            {data.details?.type === 'notes' ? (
              <>
                <h3 className="text-lg font-medium mb-4 dark:text-white">
                  {data.businessName}
                </h3>
                <div className="space-y-2">
                  {data.details.notes.map((note, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded dark:bg-gray-700">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${
                          note.priority === 'high' ? 'bg-red-500' :
                          note.priority === 'medium' ? 'bg-yellow-500' :
                          note.priority === 'low' ? 'bg-blue-500' :
                          note.priority === 'vacation' ? 'bg-purple-500' :
                          'bg-gray-500'
                        }`} />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(note.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200">{note.text}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium dark:text-white">
                    {data.businessName}
                  </h3>
                  <span className="text-blue-600 font-medium dark:text-blue-400">
                    {data.hours.toFixed(1)}h
                  </span>
                </div>
                <div className="space-y-2">
                  {data.details?.shifts.map((shift, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded dark:bg-gray-700">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {formatTime(shift.checkIn)} - {formatTime(shift.checkOut)}
                        </div>
                        <span className="text-blue-600 font-medium dark:text-blue-400">
                          {shift.hours.toFixed(1)}h
                        </span>
                      </div>
                      {shift.notes && (
                        <p className="text-gray-800 dark:text-gray-200 text-sm">
                          {shift.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Calculate totals
  const totalHours = reportData.reduce((sum, data) => sum + data.hours, 0)
  const totalComparisonHours = reportData.reduce((sum, data) => sum + (data.comparisonHours || 0), 0)
  const totalDifference = comparisonType === 'custom' ? totalHours - totalComparisonHours : undefined
  const totalPercentageChange = comparisonType === 'custom' && totalComparisonHours > 0
    ? ((totalHours - totalComparisonHours) / totalComparisonHours) * 100
    : undefined

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700 text-left">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
              Empresa
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
              Horas
            </th>
            {comparisonType === 'custom' && (
              <>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Período Anterior
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Diferencia
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Cambio %
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
          {reportData.map((data) => (
            <tr key={data.businessId}>
              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {data.businessName}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {data.hours.toFixed(1)}h
              </td>
              {comparisonType === 'custom' && (
                <>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {data.comparisonHours?.toFixed(1)}h
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {data.difference?.toFixed(1)}h
                  </td>
                  <td className={`px-4 py-2 whitespace-nowrap text-sm ${
                    data.percentageChange && data.percentageChange > 0
                      ? 'text-green-600 dark:text-green-400'
                      : data.percentageChange && data.percentageChange < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-500 dark:text-gray-300'
                  }`}>
                    {data.percentageChange?.toFixed(1)}%
                  </td>
                </>
              )}
            </tr>
          ))}
          {/* Total row */}
          <tr className="bg-gray-50 dark:bg-gray-700 font-medium">
            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              TOTAL
            </td>
            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              {totalHours.toFixed(1)}h
            </td>
            {comparisonType === 'custom' && (
              <>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {totalComparisonHours.toFixed(1)}h
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {totalDifference?.toFixed(1)}h
                </td>
                <td className={`px-4 py-2 whitespace-nowrap text-sm font-medium ${
                  totalPercentageChange && totalPercentageChange > 0
                    ? 'text-green-600 dark:text-green-400'
                    : totalPercentageChange && totalPercentageChange < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {totalPercentageChange?.toFixed(1)}%
                </td>
              </>
            )}
          </tr>
        </tbody>
      </table>
    </div>
  )
}