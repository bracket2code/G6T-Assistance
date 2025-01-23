import { useState } from 'react'
import Calendar from './components/Calendar/Calendar'
import MonthNavigation from './components/Calendar/MonthNavigation'
import DailyNotes from './components/DailyNotes/DailyNotes'
import BusinessShifts from './components/BusinessShifts/BusinessShifts'
import Header from './components/Header/Header'
import MonthlyComparison from './components/MonthlyComparison/MonthlyComparison'
import { useBusinesses } from './hooks/useBusinesses'
import { useRecords } from './hooks/useRecords'
import { useDailyNotes } from './hooks/useDailyNotes'
import { useMonthlyComparison } from './hooks/useMonthlyComparison'
import { getTotalHoursForDate, getTotalHoursForMonth } from './utils/dateUtils'

type User = {
  id: string
  email: string
  role: string
}

interface AttendanceAppProps {
  user: User
  darkMode: boolean
  onShowAdmin: () => void
  onShowProfile: () => void
  onShowSettings: () => void
  onShowReports: () => void
  onToggleDarkMode: () => void
}

export default function AttendanceApp({
  user,
  darkMode,
  onShowAdmin,
  onShowProfile,
  onShowSettings,
  onShowReports,
  onToggleDarkMode
}: AttendanceAppProps) {
  const businesses = useBusinesses()
  const [expandedBusinesses, setExpandedBusinesses] = useState<Record<string, boolean>>({})
  const [notesExpanded, setNotesExpanded] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date()
    const madridDate = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }))
    madridDate.setHours(12) // Set to noon to avoid DST issues
    return madridDate.toISOString().slice(0, 10)
  })
  const { records, handleAddShift, updateShift, deleteShift } = useRecords(user.id, selectedDate)
  const { dailyNotes, handleAddNote, updateNote, deleteNote, updateNotePriority } = useDailyNotes(user.id, selectedDate)

  const {
    monthComparison,
    setMonthComparison,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  } = useMonthlyComparison(selectedDate, (date) => getTotalHoursForDate(date, records))

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 dark:bg-gray-900 dark:text-white">
      <div className="flex flex-col gap-4 mb-8">
        <Header
          user={user}
          darkMode={darkMode}
          onShowAdmin={onShowAdmin}
          onShowProfile={onShowProfile}
          onShowSettings={onShowSettings}
          onShowReports={onShowReports}
          onToggleDarkMode={onToggleDarkMode}
        />
        <MonthNavigation
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </div>

      <Calendar
        selectedDate={selectedDate}
        dailyNotes={dailyNotes}
        records={records}
        onDateSelect={setSelectedDate}
      />

      <DailyNotes
        selectedDate={selectedDate}
        dailyNotes={dailyNotes}
        notesExpanded={notesExpanded}
        onToggleExpand={() => setNotesExpanded(!notesExpanded)}
        onAddNote={() => handleAddNote(selectedDate)}
        onUpdateNote={(noteId, text) => updateNote(noteId, text, selectedDate)}
        onDeleteNote={(noteId) => deleteNote(noteId, selectedDate)}
        onUpdateNotePriority={(noteId, priority) => updateNotePriority(noteId, priority, selectedDate)}
      />

      <div className="border rounded-lg p-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-medium dark:text-white">
            {new Date(selectedDate).getDate()} de {
              new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(selectedDate))
                .charAt(0).toUpperCase() + 
              new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(selectedDate))
                .slice(1)
            } de {new Date(selectedDate).getFullYear()}
          </h2>
          <div className="bg-blue-100 px-3 py-1 rounded-lg text-blue-600 font-bold dark:bg-blue-900 dark:text-blue-300">
            {getTotalHoursForDate(selectedDate, records)}h
          </div>
        </div>
        
        <BusinessShifts
          businesses={businesses}
          selectedDate={selectedDate}
          records={records}
          expandedBusinesses={expandedBusinesses}
          onToggleExpand={(businessId) => 
            setExpandedBusinesses(prev => ({...prev, [businessId]: !prev[businessId]}))
          }
          onAddShift={(businessId) => handleAddShift(businessId, selectedDate)}
          onUpdateShift={(businessId, shiftId, field, value) => 
            updateShift(businessId, shiftId, field, value, selectedDate)
          }
          onDeleteShift={(businessId, shiftId) => deleteShift(businessId, shiftId, selectedDate)}
        />
      </div>

      <div className="border-t mt-8 pt-4 flex justify-end dark:border-gray-700">
        <div 
          className="bg-blue-100 px-4 py-2 rounded-lg dark:bg-blue-900 relative cursor-pointer"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={() => {
            const currentDate = new Date(selectedDate)
            const previousMonth = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
            const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }))
            
            // Get total hours for current and previous month
            const currentMonthTotal = (() => {
              const date = currentDate
              const month = date.getMonth()
              const year = date.getFullYear()
              const lastDay = new Date(Date.UTC(year, month + 1, 0)).getDate()
              let total = 0
              
              for (let i = 1; i <= lastDay; i++) {
                const currentDate = new Date(Date.UTC(year, month, i)).toISOString().slice(0, 10)
                total += parseFloat(getTotalHoursForDate(currentDate, records))
              }
              
              return total.toFixed(1)
            })()

            const previousMonthTotal = (() => {
              const prevDate = previousMonth.toISOString().slice(0, 10)
              const prevMonth = previousMonth.getMonth()
              const prevYear = previousMonth.getFullYear()
              const lastDay = new Date(Date.UTC(prevYear, prevMonth + 1, 0)).getDate()
              let total = 0
              
              for (let i = 1; i <= lastDay; i++) {
                const date = new Date(Date.UTC(prevYear, prevMonth, i)).toISOString().slice(0, 10)
                total += parseFloat(getTotalHoursForDate(date, records))
              }
              
              return total.toFixed(1)
            })()

            // Get total hours up to selected date for current and previous month
            const currentMonthToDate = (() => {
              const date = currentDate
              const month = date.getMonth()
              const year = date.getFullYear()
              const selectedDay = currentDate.getDate()
              let total = 0
              
              for (let i = 1; i <= selectedDay; i++) {
                const currentDate = new Date(Date.UTC(year, month, i)).toISOString().slice(0, 10)
                total += parseFloat(getTotalHoursForDate(currentDate, records))
              }
              
              return total.toFixed(1)
            })()

            const previousMonthToDate = (() => {
              const prevMonth = previousMonth.getMonth()
              const prevYear = previousMonth.getFullYear()
              const selectedDay = currentDate.getDate()
              let total = 0
              
              for (let i = 1; i <= selectedDay; i++) {
                const date = new Date(Date.UTC(prevYear, prevMonth, i)).toISOString().slice(0, 10)
                total += parseFloat(getTotalHoursForDate(date, records))
              }
              
              return total.toFixed(1)
            })()

            setMonthComparison({
              currentMonth: currentMonthTotal,
              previousMonth: previousMonthTotal,
              currentMonthToDate,
              previousMonthToDate,
              currentMonthToToday: (() => {
                const todayDate = today.toISOString().slice(0, 10)
                let total = 0
                for (let i = 1; i <= today.getDate(); i++) {
                  const date = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), i)).toISOString().slice(0, 10)
                  total += parseFloat(getTotalHoursForDate(date, records))
                }
                return total.toFixed(1)
              })(),
              previousMonthToToday: (() => {
                const prevMonth = previousMonth.getMonth()
                const prevYear = previousMonth.getFullYear()
                let total = 0
                for (let i = 1; i <= today.getDate(); i++) {
                  const date = new Date(Date.UTC(prevYear, prevMonth, i)).toISOString().slice(0, 10)
                  total += parseFloat(getTotalHoursForDate(date, records))
                }
                return total.toFixed(1)
              })(),
              selectedDate,
              timestamp: Date.now()
            })
          }}
        >
          <span className="text-gray-600 dark:text-gray-400">Total mes: </span>
          <span className="text-blue-600 font-bold text-xl dark:text-blue-300">
            {getTotalHoursForMonth(selectedDate, records)}h
          </span>
        </div>
      </div>

      {monthComparison && (
        <MonthlyComparison
          data={monthComparison}
          onClose={() => setMonthComparison(null)}
        />
      )}
    </div>
  )
}