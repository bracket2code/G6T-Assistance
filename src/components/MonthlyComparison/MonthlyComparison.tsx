import { type MonthlyComparisonData } from '../../types/attendance'
import { useEffect } from 'react'

interface MonthlyComparisonProps {
  data: MonthlyComparisonData
  onClose: () => void
}

export default function MonthlyComparison({ data, onClose }: MonthlyComparisonProps) {
  const isSelectedDateToday = new Date(data.selectedDate).getDate() === new Date().getDate()

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 10000) // 10 seconds

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 min-h-screen flex items-start justify-center pt-32" onClick={onClose}>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm -z-10"
        aria-hidden="true"
      />
      <div className="relative z-50 p-4 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-lg w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Comparativa Mensual
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total mes completo
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {parseFloat(data.currentMonth)}h
                </span>
                <span className="text-gray-500 dark:text-gray-400">vs</span>
                <span className="text-lg text-gray-700 dark:text-gray-300">
                  {parseFloat(data.previousMonth)}h
                </span>
                <span className={`ml-2 text-lg font-semibold ${
                  parseFloat(data.currentMonth) > parseFloat(data.previousMonth)
                    ? 'text-green-500'
                    : parseFloat(data.currentMonth) < parseFloat(data.previousMonth)
                    ? 'text-red-500'
                    : 'text-gray-500'
                }`}>
                  ({(parseFloat(data.currentMonth) - parseFloat(data.previousMonth)).toFixed(1)}h)
                </span>
              </div>
            </div>

            {!isSelectedDateToday && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Hasta día {new Date(data.selectedDate).getDate()} <span className="text-gray-500">(día seleccionado)</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {parseFloat(data.currentMonthToDate)}h
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">vs</span>
                  <span className="text-lg text-gray-700 dark:text-gray-300">
                    {parseFloat(data.previousMonthToDate)}h
                  </span>
                  <span className={`ml-2 text-lg font-semibold ${
                    parseFloat(data.currentMonthToDate) > parseFloat(data.previousMonthToDate)
                      ? 'text-green-500'
                      : parseFloat(data.currentMonthToDate) < parseFloat(data.previousMonthToDate)
                      ? 'text-red-500'
                      : 'text-gray-500'
                  }`}>
                    ({(parseFloat(data.currentMonthToDate) - parseFloat(data.previousMonthToDate)).toFixed(1)}h)
                  </span>
                </div>
              </div>
            )}

            {!isSelectedDateToday && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Hasta día {new Date().getDate()} (<span className="font-bold dark:text-white">Hoy</span>)
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {parseFloat(data.currentMonthToToday)}h
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">vs</span>
                  <span className="text-lg text-gray-700 dark:text-gray-300">
                    {parseFloat(data.previousMonthToToday)}h
                  </span>
                  <span className={`ml-2 text-lg font-semibold ${
                    parseFloat(data.currentMonthToToday) > parseFloat(data.previousMonthToToday)
                      ? 'text-green-500'
                      : parseFloat(data.currentMonthToToday) < parseFloat(data.previousMonthToToday)
                      ? 'text-red-500'
                      : 'text-gray-500'
                  }`}>
                    ({(parseFloat(data.currentMonthToToday) - parseFloat(data.previousMonthToToday)).toFixed(1)}h)
                  </span>
                </div>
              </div>
            )}

            {isSelectedDateToday && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Hasta hoy (día {new Date().getDate()})
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {parseFloat(data.currentMonthToToday)}h
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">vs</span>
                  <span className="text-lg text-gray-700 dark:text-gray-300">
                    {parseFloat(data.previousMonthToToday)}h
                  </span>
                  <span className={`ml-2 text-lg font-semibold ${
                    parseFloat(data.currentMonthToToday) > parseFloat(data.previousMonthToToday)
                      ? 'text-green-500'
                      : parseFloat(data.currentMonthToToday) < parseFloat(data.previousMonthToToday)
                      ? 'text-red-500'
                      : 'text-gray-500'
                  }`}>
                    ({(parseFloat(data.currentMonthToToday) - parseFloat(data.previousMonthToToday)).toFixed(1)}h)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}